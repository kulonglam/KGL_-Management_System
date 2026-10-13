import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { configureMemoryServerBinary } from './support/mongoBinary.mjs';

configureMemoryServerBinary();

import createApp from '../app.js';
import User from '../models/User.js';
import { generateTotpCode, generateTotpSecret } from '../utils/totp.js';

let memoryServer;

const refreshTokenFrom = (response) => {
  const raw = response.headers['set-cookie'] || [];
  const list = Array.isArray(raw) ? raw : [raw];
  const active = list.find((entry) => {
    const value = String(entry);
    return value.startsWith('kgl_refresh=') && !/Max-Age=0/i.test(value);
  });
  const match = String(active || '').match(/^kgl_refresh=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
};

const cookieFor = (token) => `kgl_refresh=${encodeURIComponent(token)}`;

before(
  async () => {
    process.env.NODE_ENV = 'test';
    process.env.COOKIE_SAMESITE = 'lax';
    process.env.COOKIE_SECURE = 'false';
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      process.env.JWT_SECRET = 'refresh-rotation-test-jwt-secret-32';
    }
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());
  },
  { timeout: 120_000 }
);

after(async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
});

test('a used refresh cookie is replaced, and replaying it revokes the session immediately', { timeout: 60_000 }, async () => {
  const app = createApp();
  const password = 'Karibu@2026!';
  await User.create({
    name: 'Amina',
    username: 'amina-refresh',
    password: await bcrypt.hash(password, 4),
    role: 'manager',
    branch: 'Maganjo'
  });

  const loginResponse = await request(app).post('/api/v1/auth/login').send({
    username: 'amina-refresh',
    password
  });
  assert.equal(loginResponse.status, 200, JSON.stringify(loginResponse.body));
  const originalRefresh = refreshTokenFrom(loginResponse);
  assert.equal(jwt.decode(originalRefresh).refreshTokenVersion, 0);

  const firstRefresh = await request(app)
    .post('/api/v1/auth/refresh')
    .set('Cookie', cookieFor(originalRefresh));
  assert.equal(firstRefresh.status, 200, JSON.stringify(firstRefresh.body));
  const rotatedRefresh = refreshTokenFrom(firstRefresh);
  assert.equal(jwt.decode(rotatedRefresh).refreshTokenVersion, 1);
  assert.notEqual(rotatedRefresh, originalRefresh);

  const secondRefresh = await request(app)
    .post('/api/v1/auth/refresh')
    .set('Cookie', cookieFor(rotatedRefresh));
  assert.equal(secondRefresh.status, 200, JSON.stringify(secondRefresh.body));
  const latestRefresh = refreshTokenFrom(secondRefresh);
  assert.equal(jwt.decode(latestRefresh).refreshTokenVersion, 2);

  const replay = await request(app)
    .post('/api/v1/auth/refresh')
    .set('Cookie', cookieFor(originalRefresh));
  assert.equal(replay.status, 401);

  const afterReplay = await request(app)
    .post('/api/v1/auth/refresh')
    .set('Cookie', cookieFor(latestRefresh));
  assert.equal(afterReplay.status, 401);
});

test('changing the password cuts off the previous refresh cookie', { timeout: 60_000 }, async () => {
  const app = createApp();
  const password = 'Karibu@2026!';
  await User.create({
    name: 'Kulong',
    username: 'kulong-refresh',
    password: await bcrypt.hash(password, 4),
    role: 'manager',
    branch: 'Matugga'
  });

  const loginResponse = await request(app).post('/api/v1/auth/login').send({
    username: 'kulong-refresh',
    password
  });
  const originalRefresh = refreshTokenFrom(loginResponse);
  const accessToken = loginResponse.body.data.token;

  const updated = await request(app)
    .put('/api/v1/auth/me')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ password: 'Unique@Launch2026' });
  assert.equal(updated.status, 200, JSON.stringify(updated.body));
  assert.equal(typeof updated.body.data.token, 'string');
  const replacementRefresh = refreshTokenFrom(updated);

  const me = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${updated.body.data.token}`);
  assert.equal(me.status, 200, JSON.stringify(me.body));
  assert.equal(me.body.data.username, 'kulong-refresh');
  assert.equal(me.body.data.mfaSecret, undefined);
  assert.equal(me.body.data.password, undefined);

  const replacement = await request(app)
    .post('/api/v1/auth/refresh')
    .set('Cookie', cookieFor(replacementRefresh));
  assert.equal(replacement.status, 200, JSON.stringify(replacement.body));

  const oldCookie = await request(app)
    .post('/api/v1/auth/refresh')
    .set('Cookie', cookieFor(originalRefresh));
  assert.equal(oldCookie.status, 401);

  const afterReuse = await request(app)
    .post('/api/v1/auth/refresh')
    .set('Cookie', cookieFor(refreshTokenFrom(replacement)));
  assert.equal(afterReuse.status, 401);
});

test('enabling MFA invalidates the access token and refresh cookie from before enrollment', { timeout: 60_000 }, async () => {
  const app = createApp();
  const password = 'Karibu@2026!';
  const secret = generateTotpSecret();
  await User.create({
    name: 'Achieng',
    username: 'achieng-refresh',
    password: await bcrypt.hash(password, 4),
    role: 'manager',
    branch: 'Maganjo',
    mfaPendingSecret: secret
  });

  const loginResponse = await request(app).post('/api/v1/auth/login').send({
    username: 'achieng-refresh',
    password
  });
  const originalRefresh = refreshTokenFrom(loginResponse);
  const accessToken = loginResponse.body.data.token;
  const code = generateTotpCode(secret, Math.floor(Date.now() / 1000 / 30));

  const enabled = await request(app)
    .post('/api/v1/auth/mfa/enable')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ code });
  assert.equal(enabled.status, 200, JSON.stringify(enabled.body));
  assert.equal(enabled.body.data.mfaEnabled, true);
  assert.equal(typeof enabled.body.data.token, 'string');
  assert.equal(enabled.body.data.mfaSecret, undefined);

  const oldAccess = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`);
  assert.equal(oldAccess.status, 401);

  const currentAccess = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${enabled.body.data.token}`);
  assert.equal(currentAccess.status, 200, JSON.stringify(currentAccess.body));
  assert.equal(currentAccess.body.data.mfaSecret, undefined);
  assert.equal(currentAccess.body.data.recoveryCodeHashes, undefined);

  const listed = await request(app)
    .get('/api/v1/auth/users')
    .set('Authorization', `Bearer ${enabled.body.data.token}`);
  assert.equal(listed.status, 200, JSON.stringify(listed.body));
  const rows = Array.isArray(listed.body.data) ? listed.body.data : listed.body.data.items;
  assert.ok(rows.some((row) => row.username === 'achieng-refresh'));
  assert.ok(rows.every((row) => row.mfaSecret === undefined && row.recoveryCodeHashes === undefined));

  const oldRefresh = await request(app)
    .post('/api/v1/auth/refresh')
    .set('Cookie', cookieFor(originalRefresh));
  assert.equal(oldRefresh.status, 401);
});
