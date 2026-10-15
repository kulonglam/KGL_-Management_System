import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { configureMemoryServerBinary } from './support/mongoBinary.mjs';

configureMemoryServerBinary();

import createApp from '../app.js';
import { getJwtClaimOptions } from '../config/security.js';
import { setBranchCache } from '../config/branches.js';
import Sale from '../models/Sale.js';
import User from '../models/User.js';
import JobSchedule from '../models/JobSchedule.js';
import WebhookDelivery from '../models/WebhookDelivery.js';
import { JOB_NAMES, listJobSchedules, runSchedulerTick } from '../services/jobQueueService.js';
import { isPrivateAddress } from '../services/webhookService.js';
import { mapRoleFromClaims, resetOidcCaches } from '../services/oidcService.js';

let memoryServer;
let app;
let director;
let manager;
let directorToken;
let managerToken;

const receiver = { server: null, url: '', requests: [] };
const idp = {
  server: null,
  issuer: '',
  keys: crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }),
  rogueKeys: crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }),
  challenges: new Map(),
  nextClaims: null,
  signWithRogueKey: false
};

const dataOf = (response) => response.body?.data ?? response.body;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ssoReason = (response) => new URL(response.headers.location).searchParams.get('reason') || '';

const waitFor = async (predicate, { timeoutMs = 8000, intervalMs = 50 } = {}) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await predicate();
    if (value) return value;
    await sleep(intervalMs);
  }
  throw new Error('Timed out waiting for condition');
};

const signAccessToken = (user, jti) =>
  jwt.sign({ id: String(user._id), tokenVersion: 0, typ: 'access', jti }, process.env.JWT_SECRET, {
    expiresIn: '1h',
    ...getJwtClaimOptions()
  });

const readBody = (req) =>
  new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });

const listen = (server) =>
  new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`));
  });

const signIdToken = (claims) => {
  const header = { alg: 'RS256', typ: 'JWT', kid: 'test-key' };
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const signingInput = `${encode(header)}.${encode(claims)}`;
  const key = idp.signWithRogueKey ? idp.rogueKeys.privateKey : idp.keys.privateKey;
  const signature = crypto.sign('sha256', Buffer.from(signingInput), key).toString('base64url');
  return `${signingInput}.${signature}`;
};

const startIdp = async () => {
  idp.server = http.createServer(async (req, res) => {
    const url = new URL(req.url, idp.issuer);
    const json = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    if (url.pathname === '/.well-known/openid-configuration') {
      return json(200, {
        issuer: idp.issuer,
        authorization_endpoint: `${idp.issuer}/authorize`,
        token_endpoint: `${idp.issuer}/token`,
        jwks_uri: `${idp.issuer}/jwks`
      });
    }
    if (url.pathname === '/jwks') {
      const jwk = idp.keys.publicKey.export({ format: 'jwk' });
      return json(200, { keys: [{ ...jwk, kid: 'test-key', alg: 'RS256', use: 'sig' }] });
    }
    if (url.pathname === '/token' && req.method === 'POST') {
      const form = new URLSearchParams(await readBody(req));
      const challenge = idp.challenges.get(form.get('code'));
      const verifierHash = crypto
        .createHash('sha256')
        .update(String(form.get('code_verifier') || ''))
        .digest('base64url');
      if (!challenge || challenge !== verifierHash || form.get('client_id') !== 'kgl-test-client') {
        return json(400, { error: 'invalid_grant' });
      }
      return json(200, { access_token: 'opaque', token_type: 'Bearer', id_token: signIdToken(idp.nextClaims) });
    }
    return json(404, { error: 'not_found' });
  });
  idp.issuer = await listen(idp.server);
};

const startReceiver = async () => {
  receiver.server = http.createServer(async (req, res) => {
    const body = await readBody(req);
    receiver.requests.push({ path: req.url, headers: req.headers, body });
    res.writeHead(req.url.startsWith('/fail') ? 500 : 200, { 'Content-Type': 'text/plain' });
    res.end('ok');
  });
  receiver.url = await listen(receiver.server);
};

const configureOidcEnv = () => {
  Object.assign(process.env, {
    OIDC_ISSUER: idp.issuer,
    OIDC_CLIENT_ID: 'kgl-test-client',
    OIDC_CLIENT_SECRET: 'kgl-test-secret',
    OIDC_REDIRECT_URI: 'http://localhost:5000/api/v1/auth/oidc/callback',
    OIDC_FRONTEND_REDIRECT: 'http://localhost:5173/',
    OIDC_DEFAULT_BRANCH: 'Maganjo',
    OIDC_PROVIDER_NAME: 'Test IdP'
  });
  resetOidcCaches();
};

const beginSsoLogin = async () => {
  const response = await request(app).get('/api/v1/auth/oidc/login');
  assert.equal(response.status, 200);
  const authorizationUrl = new URL(dataOf(response).authorizationUrl);
  const cookies = [].concat(response.headers['set-cookie'] || []);
  const stateCookie = cookies.find((cookie) => cookie.startsWith('kgl_oidc_state='));
  assert.ok(stateCookie, 'login start sets the state cookie');
  assert.match(stateCookie, /HttpOnly/);
  return {
    state: authorizationUrl.searchParams.get('state'),
    nonce: authorizationUrl.searchParams.get('nonce'),
    challenge: authorizationUrl.searchParams.get('code_challenge'),
    cookie: stateCookie.split(';')[0]
  };
};

const idTokenClaims = (overrides) => {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: idp.issuer,
    aud: 'kgl-test-client',
    iat: now,
    exp: now + 300,
    ...overrides
  };
};

const completeSsoLogin = async ({ claims, cookie = true, code = crypto.randomUUID() } = {}) => {
  const started = await beginSsoLogin();
  idp.challenges.set(code, started.challenge);
  idp.nextClaims = idTokenClaims({ nonce: started.nonce, ...claims });
  let call = request(app).get('/api/v1/auth/oidc/callback').query({ code, state: started.state });
  if (cookie) call = call.set('Cookie', started.cookie);
  const response = await call;
  return { response, started, code };
};

before(
  async () => {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      process.env.JWT_SECRET = 'integration-test-jwt-secret-32chars-min';
    }
    process.env.NODE_ENV = 'test';
    process.env.JOB_RETRY_BASE_MS = '20';
    process.env.WEBHOOK_MAX_ATTEMPTS = '3';
    setBranchCache(['Maganjo', 'Matugga']);
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());
    await Promise.all([startReceiver(), startIdp()]);
    configureOidcEnv();
    app = createApp();

    const password = await bcrypt.hash('Karibu@2026!', 10);
    director = await User.create({
      name: 'P3 Director',
      username: 'dir_p3',
      password,
      role: 'director',
      canViewCrossBranchTotals: true
    });
    manager = await User.create({
      name: 'P3 Manager',
      username: 'mgr_p3',
      password,
      role: 'manager',
      branch: 'Maganjo'
    });
    directorToken = signAccessToken(director, 'p3-dir');
    managerToken = signAccessToken(manager, 'p3-mgr');
  },
  { timeout: 120_000 }
);

after(async () => {
  receiver.server?.close();
  idp.server?.close();
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
});

test('webhook secrets are shown once and deliveries are HMAC signed', { timeout: 30_000 }, async () => {
  const created = await request(app)
    .post('/api/v1/platform/webhooks')
    .set('Authorization', `Bearer ${directorToken}`)
    .send({
      name: 'ERP sync',
      targetUrl: `${receiver.url}/hook`,
      events: ['sale.created', 'retention.completed']
    });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const subscription = dataOf(created);
  assert.ok(subscription.secret?.length >= 32, 'secret is returned on create');

  const listed = await request(app)
    .get('/api/v1/platform/webhooks')
    .set('Authorization', `Bearer ${directorToken}`);
  assert.equal(listed.status, 200);
  const row = dataOf(listed).find((item) => item._id === subscription._id);
  assert.equal(row.secret, undefined);
  assert.ok(row.secretPreview);

  const forbidden = await request(app)
    .get('/api/v1/platform/webhooks')
    .set('Authorization', `Bearer ${managerToken}`);
  assert.equal(forbidden.status, 403);

  const emitted = await request(app)
    .post('/api/v1/platform/webhooks/test-emit')
    .set('Authorization', `Bearer ${directorToken}`)
    .send({ event: 'sale.created', payload: { saleId: 'abc' } });
  assert.equal(emitted.status, 200);
  assert.equal(dataOf(emitted).queued, 1);

  const received = await waitFor(() =>
    receiver.requests.find((entry) => entry.path === '/hook' && entry.headers['x-kgl-event'] === 'sale.created')
  );
  const timestamp = received.headers['x-kgl-timestamp'];
  const expected = crypto
    .createHmac('sha256', subscription.secret)
    .update(`${timestamp}.${received.body}`)
    .digest('hex');
  assert.equal(received.headers['x-kgl-signature'], `sha256=${expected}`);
  assert.equal(JSON.parse(received.body).data.saleId, 'abc');

  await waitFor(async () => {
    const delivery = await WebhookDelivery.findOne({ subscription: subscription._id }).lean();
    return delivery?.status === 'delivered';
  });

  const badEvent = await request(app)
    .post('/api/v1/platform/webhooks/test-emit')
    .set('Authorization', `Bearer ${directorToken}`)
    .send({ event: 'nope.event' });
  assert.equal(badEvent.status, 400);
});

test('failed webhook deliveries retry with backoff and can be redelivered', { timeout: 30_000 }, async () => {
  const created = await request(app)
    .post('/api/v1/platform/webhooks')
    .set('Authorization', `Bearer ${directorToken}`)
    .send({ name: 'Broken receiver', targetUrl: `${receiver.url}/fail`, events: ['credit.overdue'] });
  assert.equal(created.status, 201);
  const subscriptionId = dataOf(created)._id;

  await request(app)
    .post('/api/v1/platform/webhooks/test-emit')
    .set('Authorization', `Bearer ${directorToken}`)
    .send({ event: 'credit.overdue' });

  const failed = await waitFor(async () => {
    const delivery = await WebhookDelivery.findOne({ subscription: subscriptionId }).lean();
    return delivery?.status === 'failed' ? delivery : null;
  });
  assert.equal(failed.attemptCount, 3);
  assert.equal(failed.statusCode, 500);

  const listed = await request(app)
    .get('/api/v1/platform/webhook-deliveries')
    .query({ status: 'failed', subscriptionId })
    .set('Authorization', `Bearer ${directorToken}`);
  assert.equal(listed.status, 200);
  assert.equal(dataOf(listed).length, 1);
  assert.equal(dataOf(listed)[0].subscription.name, 'Broken receiver');

  const redelivered = await request(app)
    .post(`/api/v1/platform/webhook-deliveries/${failed._id}/redeliver`)
    .set('Authorization', `Bearer ${directorToken}`);
  assert.equal(redelivered.status, 202);
  assert.notEqual(dataOf(redelivered)._id, String(failed._id));
  assert.equal(await WebhookDelivery.countDocuments({ subscription: subscriptionId }), 2);
});

test('webhook targets on private networks are refused when not allowed', async () => {
  assert.equal(isPrivateAddress('127.0.0.1'), true);
  assert.equal(isPrivateAddress('10.1.2.3'), true);
  assert.equal(isPrivateAddress('169.254.169.254'), true);
  assert.equal(isPrivateAddress('::1'), true);
  assert.equal(isPrivateAddress('::ffff:192.168.1.10'), true);
  assert.equal(isPrivateAddress('fd00::1'), true);
  assert.equal(isPrivateAddress('8.8.8.8'), false);
  assert.equal(isPrivateAddress('2001:4860:4860::8888'), false);

  process.env.WEBHOOK_ALLOW_PRIVATE_TARGETS = 'false';
  try {
    for (const targetUrl of ['http://127.0.0.1:9/hook', 'http://169.254.169.254/latest/meta-data', 'http://localhost/hook']) {
      const response = await request(app)
        .post('/api/v1/platform/webhooks')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ name: 'Internal', targetUrl, events: ['sale.created'] });
      assert.equal(response.status, 400, targetUrl);
    }
  } finally {
    delete process.env.WEBHOOK_ALLOW_PRIVATE_TARGETS;
  }
});

test('scheduler claims each due job once and skips weekly jobs on first boot', { timeout: 30_000 }, async () => {
  await JobSchedule.deleteMany({});
  const boot = new Date('2026-10-14T10:00:00Z');
  assert.deepEqual(await runSchedulerTick(boot), [JOB_NAMES.OVERDUE_SCAN]);
  assert.deepEqual(await runSchedulerTick(boot), []);

  const later = new Date(boot.getTime() + 8 * 24 * 60 * 60 * 1000);
  const [first, second] = await Promise.all([runSchedulerTick(later), runSchedulerTick(later)]);
  const claimed = [...first, ...second].sort();
  assert.deepEqual(claimed, [JOB_NAMES.OVERDUE_SCAN, JOB_NAMES.WEEKLY_REPORT, JOB_NAMES.RETENTION_RUN].sort());

  const schedules = await waitFor(async () => {
    const rows = await listJobSchedules(later);
    return rows.every((row) => row.lastStatus === 'completed') ? rows : null;
  });
  const overdue = schedules.find((row) => row.jobName === JOB_NAMES.OVERDUE_SCAN);
  assert.equal(overdue.runCount, 2);
  const weekly = schedules.find((row) => row.jobName === JOB_NAMES.WEEKLY_REPORT);
  assert.equal(weekly.runCount, 1);
  assert.ok(new Date(weekly.nextRunAt) > later);
  assert.equal(new Date(weekly.nextRunAt).getUTCDay(), 1);
});

test('manual retention run emits retention.completed to subscribers', { timeout: 30_000 }, async () => {
  const retentionEvents = () =>
    receiver.requests.filter((entry) => entry.headers['x-kgl-event'] === 'retention.completed').length;
  const before = retentionEvents();
  const response = await request(app)
    .post('/api/v1/platform/jobs/enqueue')
    .set('Authorization', `Bearer ${directorToken}`)
    .send({ jobName: JOB_NAMES.RETENTION_RUN });
  assert.equal(response.status, 202, JSON.stringify(response.body));
  assert.ok(dataOf(response).result.summary, 'job result is returned');
  await waitFor(() => retentionEvents() > before);

  const webhookJob = await request(app)
    .post('/api/v1/platform/jobs/enqueue')
    .set('Authorization', `Bearer ${directorToken}`)
    .send({ jobName: JOB_NAMES.WEBHOOK_DELIVER });
  assert.equal(webhookJob.status, 400);
});

test('weekly report ignores removed sales and emails only directors with an address', { timeout: 30_000 }, async () => {
  const base = {
    produceName: 'Red Beans',
    produceType: 'Beans',
    tonnageKg: 2,
    amountPaidUgx: 20000,
    buyerName: 'Walk In',
    salesAgentName: 'Agent One',
    date: new Date(),
    time: '10:00',
    branch: 'Maganjo',
    recordedBy: manager._id
  };
  await Sale.create(base);
  await Sale.create({ ...base, buyerName: 'Removed Buyer', deletedAt: new Date() });

  const preview = await request(app)
    .get('/api/v1/platform/reports/weekly/preview')
    .set('Authorization', `Bearer ${directorToken}`);
  assert.equal(preview.status, 200);
  assert.equal(dataOf(preview).stats.sales, 1);
  assert.equal(dataOf(preview).stats.cashSalesUgx, 20000);
  assert.match(dataOf(preview).body, /Maganjo: 1 cash/);

  const withoutEmail = await request(app)
    .post('/api/v1/platform/reports/weekly/run')
    .set('Authorization', `Bearer ${directorToken}`);
  assert.equal(withoutEmail.status, 200);
  assert.equal(dataOf(withoutEmail).emailed, 0);
  assert.equal(dataOf(withoutEmail).inApp, 1);
  assert.deepEqual(dataOf(withoutEmail).skippedNoEmail, ['dir_p3']);

  await User.updateOne({ _id: director._id }, { $set: { email: 'director@kgl.test' } });
  const withEmail = await request(app)
    .post('/api/v1/platform/reports/weekly/run')
    .set('Authorization', `Bearer ${directorToken}`);
  assert.equal(dataOf(withEmail).emailed, 1);
});

test('OIDC login provisions a user without putting tokens in the redirect URL', { timeout: 30_000 }, async () => {
  const status = await request(app).get('/api/v1/auth/oidc/status');
  assert.deepEqual(dataOf(status), { enabled: true, issuer: idp.issuer, providerName: 'Test IdP' });

  const { response, started, code } = await completeSsoLogin({
    claims: {
      sub: 'idp-user-1',
      email: 'jane@kgl.test',
      email_verified: true,
      name: 'Jane Doe',
      preferred_username: 'jane',
      role: 'manager',
      branch: 'Matugga'
    }
  });
  assert.equal(response.status, 302);
  assert.equal(response.headers.location, 'http://localhost:5173/?sso=success');
  const cookies = [].concat(response.headers['set-cookie'] || []);
  const refreshCookie = cookies.find((cookie) => cookie.startsWith('kgl_refresh=') && !cookie.startsWith('kgl_refresh=;'));
  assert.ok(refreshCookie, 'refresh cookie is set');

  const user = await User.findOne({ oidcSubject: 'idp-user-1' }).lean();
  assert.equal(user.role, 'manager');
  assert.equal(user.branch, 'Matugga');
  assert.equal(user.authSource, 'oidc');
  assert.equal(user.username, 'jane');

  const refreshed = await request(app)
    .post('/api/v1/auth/refresh')
    .set('Cookie', refreshCookie.split(';')[0]);
  assert.equal(refreshed.status, 200);
  assert.ok(dataOf(refreshed).token);
  assert.equal(dataOf(refreshed).username, 'jane');

  const replay = await request(app)
    .get('/api/v1/auth/oidc/callback')
    .query({ code, state: started.state })
    .set('Cookie', started.cookie);
  assert.match(replay.headers.location, /sso=error/);
});

test('OIDC rejects missing browser state, bad nonce and forged signatures', { timeout: 30_000 }, async () => {
  const claims = { sub: 'idp-user-2', preferred_username: 'mallory' };

  const noCookie = await completeSsoLogin({ claims, cookie: false });
  assert.match(noCookie.response.headers.location, /sso=error/);
  assert.match(ssoReason(noCookie.response), /state does not match/);

  const badNonce = await completeSsoLogin({ claims: { ...claims, nonce: 'attacker-nonce' } });
  assert.match(ssoReason(badNonce.response), /nonce mismatch/);

  const wrongAudience = await completeSsoLogin({ claims: { ...claims, aud: 'other-client' } });
  assert.match(ssoReason(wrongAudience.response), /audience mismatch/);

  const expired = await completeSsoLogin({ claims: { ...claims, exp: Math.floor(Date.now() / 1000) - 3600 } });
  assert.match(ssoReason(expired.response), /expired/);

  idp.signWithRogueKey = true;
  try {
    const forged = await completeSsoLogin({ claims });
    assert.match(ssoReason(forged.response), /signature is invalid/);
  } finally {
    idp.signWithRogueKey = false;
  }

  assert.equal(await User.countDocuments({ oidcSubject: 'idp-user-2' }), 0);
});

test('OIDC never links by username and refuses removed accounts', { timeout: 30_000 }, async () => {
  const password = await bcrypt.hash('Karibu@2026!', 10);
  await User.create({ name: 'Local Bob', username: 'bob', password, role: 'director' });

  const takeover = await completeSsoLogin({
    claims: { sub: 'idp-bob', preferred_username: 'bob', role: 'sales_agent' }
  });
  assert.equal(takeover.response.headers.location, 'http://localhost:5173/?sso=success');
  const localBob = await User.findOne({ username: 'bob' }).lean();
  assert.equal(localBob.authSource, 'local');
  assert.equal(localBob.oidcSubject, '');
  const ssoBob = await User.findOne({ oidcSubject: 'idp-bob' }).lean();
  assert.equal(ssoBob.username, 'bob1');
  assert.equal(ssoBob.role, 'sales_agent');

  await User.updateOne({ oidcSubject: 'idp-user-1' }, { $set: { deletedAt: new Date() } });
  const removed = await completeSsoLogin({ claims: { sub: 'idp-user-1', preferred_username: 'jane' } });
  assert.match(ssoReason(removed.response), /removed/);
  assert.equal(await User.countDocuments({ oidcSubject: 'idp-user-1', deletedAt: { $exists: true } }), 1);
});

test('OIDC role mapping only grants roles that are explicitly mapped', () => {
  assert.equal(mapRoleFromClaims({ role: 'admin' }), 'sales_agent');
  assert.equal(mapRoleFromClaims({ role: 'Manager' }), 'manager');
  process.env.OIDC_ROLE_MAP = 'kgl-directors:director,kgl-managers:manager';
  try {
    assert.equal(mapRoleFromClaims({ role: ['staff', 'kgl-directors'] }), 'director');
    assert.equal(mapRoleFromClaims({ role: ['kgl-managers'] }), 'manager');
  } finally {
    delete process.env.OIDC_ROLE_MAP;
  }
});
