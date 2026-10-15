import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import OidcLoginState from '../models/OidcLoginState.js';
import { getRegisteredBranches } from '../config/branches.js';
import { recordAudit } from './auditService.js';
import logger from '../utils/logger.js';
import { includeRemoved } from '../utils/softDelete.js';

const DISCOVERY_TTL_MS = 60 * 60 * 1000;
const JWKS_TTL_MS = 10 * 60 * 1000;
const CLOCK_SKEW_SECONDS = 120;
const ROLE_PRIORITY = ['director', 'manager', 'sales_agent'];
const SIGNING_ALGORITHMS = {
  RS256: { hash: 'sha256', kty: 'RSA' },
  RS384: { hash: 'sha384', kty: 'RSA' },
  RS512: { hash: 'sha512', kty: 'RSA' },
  PS256: { hash: 'sha256', kty: 'RSA', padding: crypto.constants.RSA_PKCS1_PSS_PADDING },
  ES256: { hash: 'sha256', kty: 'EC', dsaEncoding: 'ieee-p1363' },
  ES384: { hash: 'sha384', kty: 'EC', dsaEncoding: 'ieee-p1363' }
};

const discoveryCache = new Map();
const jwksCache = new Map();

const createOidcError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const oidcEnabled = () => {
  const issuer = String(process.env.OIDC_ISSUER || '').trim();
  const clientId = String(process.env.OIDC_CLIENT_ID || '').trim();
  const clientSecret = String(process.env.OIDC_CLIENT_SECRET || '').trim();
  const redirectUri = String(process.env.OIDC_REDIRECT_URI || '').trim();
  return Boolean(issuer && clientId && clientSecret && redirectUri);
};

const getOidcConfig = () => {
  if (!oidcEnabled()) throw createOidcError(501, 'OIDC is not configured');
  return {
    issuer: String(process.env.OIDC_ISSUER).trim().replace(/\/$/, ''),
    clientId: String(process.env.OIDC_CLIENT_ID).trim(),
    clientSecret: String(process.env.OIDC_CLIENT_SECRET).trim(),
    redirectUri: String(process.env.OIDC_REDIRECT_URI).trim(),
    scopes: String(process.env.OIDC_SCOPES || 'openid profile email').trim(),
    providerName: String(process.env.OIDC_PROVIDER_NAME || 'SSO').trim().slice(0, 40) || 'SSO'
  };
};

const fetchJson = async (url, label) => {
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  } catch (error) {
    throw createOidcError(502, `OIDC ${label} request failed: ${error.message}`);
  }
  if (!response.ok) throw createOidcError(502, `OIDC ${label} failed (${response.status})`);
  return response.json();
};

const discover = async (issuer) => {
  const cached = discoveryCache.get(issuer);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const value = await fetchJson(`${issuer}/.well-known/openid-configuration`, 'discovery');
  if (String(value.issuer || '').replace(/\/$/, '') !== issuer) {
    throw createOidcError(502, 'OIDC discovery issuer does not match OIDC_ISSUER');
  }
  if (!value.authorization_endpoint || !value.token_endpoint || !value.jwks_uri) {
    throw createOidcError(502, 'OIDC discovery document is incomplete');
  }
  discoveryCache.set(issuer, { value, expiresAt: Date.now() + DISCOVERY_TTL_MS });
  return value;
};

const getJwks = async (jwksUri, { forceRefresh = false } = {}) => {
  const cached = jwksCache.get(jwksUri);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) return cached.keys;
  const body = await fetchJson(jwksUri, 'JWKS');
  const keys = Array.isArray(body.keys) ? body.keys : [];
  jwksCache.set(jwksUri, { keys, expiresAt: Date.now() + JWKS_TTL_MS });
  return keys;
};

const base64UrlJson = (segment) => {
  try {
    return JSON.parse(Buffer.from(String(segment), 'base64url').toString('utf8'));
  } catch {
    throw createOidcError(401, 'OIDC id_token is malformed');
  }
};

const selectJwk = (keys, header, spec) =>
  keys.find(
    (key) =>
      key.kty === spec.kty &&
      (!key.use || key.use === 'sig') &&
      (!key.alg || key.alg === header.alg) &&
      (!header.kid || key.kid === header.kid)
  );

const verifyIdToken = async ({ idToken, discovery, config, expectedNonce, now = Date.now() }) => {
  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) throw createOidcError(401, 'OIDC id_token is missing or malformed');
  const header = base64UrlJson(parts[0]);
  const claims = base64UrlJson(parts[1]);
  const spec = SIGNING_ALGORITHMS[header.alg];
  if (!spec) throw createOidcError(401, `OIDC id_token algorithm ${header.alg} is not allowed`);

  let jwk = selectJwk(await getJwks(discovery.jwks_uri), header, spec);
  if (!jwk) jwk = selectJwk(await getJwks(discovery.jwks_uri, { forceRefresh: true }), header, spec);
  if (!jwk) throw createOidcError(401, 'OIDC signing key not found');

  const verifyKey = { key: crypto.createPublicKey({ key: jwk, format: 'jwk' }) };
  if (spec.padding) {
    verifyKey.padding = spec.padding;
    verifyKey.saltLength = crypto.constants.RSA_PSS_SALTLEN_DIGEST;
  }
  if (spec.dsaEncoding) verifyKey.dsaEncoding = spec.dsaEncoding;
  const signatureValid = crypto.verify(
    spec.hash,
    Buffer.from(`${parts[0]}.${parts[1]}`),
    verifyKey,
    Buffer.from(parts[2], 'base64url')
  );
  if (!signatureValid) throw createOidcError(401, 'OIDC id_token signature is invalid');

  const nowSeconds = Math.floor(now / 1000);
  if (String(claims.iss || '').replace(/\/$/, '') !== config.issuer) {
    throw createOidcError(401, 'OIDC id_token issuer mismatch');
  }
  const audiences = [].concat(claims.aud || []);
  if (!audiences.includes(config.clientId)) throw createOidcError(401, 'OIDC id_token audience mismatch');
  if (audiences.length > 1 && claims.azp !== config.clientId) {
    throw createOidcError(401, 'OIDC id_token authorized party mismatch');
  }
  if (!Number.isFinite(Number(claims.exp)) || Number(claims.exp) + CLOCK_SKEW_SECONDS < nowSeconds) {
    throw createOidcError(401, 'OIDC id_token has expired');
  }
  if (Number.isFinite(Number(claims.iat)) && Number(claims.iat) - CLOCK_SKEW_SECONDS > nowSeconds) {
    throw createOidcError(401, 'OIDC id_token was issued in the future');
  }
  if (!expectedNonce || claims.nonce !== expectedNonce) throw createOidcError(401, 'OIDC nonce mismatch');
  return claims;
};

const beginOidcLogin = async () => {
  const config = getOidcConfig();
  const discovery = await discover(config.issuer);
  const state = crypto.randomBytes(24).toString('base64url');
  const nonce = crypto.randomBytes(24).toString('base64url');
  const codeVerifier = crypto.randomBytes(48).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  await OidcLoginState.create({ state, nonce, codeVerifier });

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope: config.scopes,
    redirect_uri: config.redirectUri,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  return {
    authorizationUrl: `${discovery.authorization_endpoint}?${params.toString()}`,
    state
  };
};

const parseRoleMap = () =>
  String(process.env.OIDC_ROLE_MAP || '')
    .split(',')
    .map((entry) => entry.split(':').map((part) => part.trim()))
    .filter(([claimValue, role]) => claimValue && ROLE_PRIORITY.includes(role))
    .reduce((map, [claimValue, role]) => map.set(claimValue.toLowerCase(), role), new Map());

const mapRoleFromClaims = (claims) => {
  const claimName = String(process.env.OIDC_ROLE_CLAIM || 'role').trim();
  const values = []
    .concat(claims[claimName] ?? [])
    .map((value) => String(value).trim().toLowerCase())
    .filter(Boolean);
  const roleMap = parseRoleMap();
  const mapped = values
    .map((value) => roleMap.get(value) || (ROLE_PRIORITY.includes(value) ? value : null))
    .filter(Boolean);
  const best = ROLE_PRIORITY.find((role) => mapped.includes(role));
  if (best) return best;
  const fallback = String(process.env.OIDC_DEFAULT_ROLE || 'sales_agent').trim().toLowerCase();
  return ROLE_PRIORITY.includes(fallback) ? fallback : 'sales_agent';
};

const matchRegisteredBranch = (value) => {
  const wanted = String(value || '').trim().toLowerCase();
  if (!wanted) return null;
  return getRegisteredBranches().find((entry) => entry.toLowerCase() === wanted) || null;
};

const mapBranchFromClaims = (claims, role) => {
  if (role === 'director') return undefined;
  const claimName = String(process.env.OIDC_BRANCH_CLAIM || 'branch').trim();
  const branch =
    matchRegisteredBranch(claims[claimName]) || matchRegisteredBranch(process.env.OIDC_DEFAULT_BRANCH);
  if (!branch) {
    throw createOidcError(403, 'Your SSO account has no KGL branch assigned. Ask a director for access.');
  }
  return branch;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findLinkableLocalUser = async (claims) => {
  if (String(process.env.OIDC_LINK_BY_EMAIL || '').toLowerCase() !== 'true') return null;
  const email = String(claims.email || '').trim().toLowerCase();
  if (!email || claims.email_verified !== true) return null;
  const candidate = await User.findOne({
    email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' },
    deletedAt: includeRemoved()
  });
  if (!candidate) return null;
  if (candidate.deletedAt) throw createOidcError(403, 'This account has been removed');
  if (candidate.oidcSubject) {
    throw createOidcError(409, 'A different SSO identity is already linked to this account');
  }
  return candidate;
};

const buildNameFromClaims = (claims) =>
  String(claims.name || claims.preferred_username || claims.email || 'SSO User')
    .replace(/[^A-Za-z0-9\s.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'SSO User';

const allocateUsername = async (claims, subject) => {
  const base =
    String(claims.preferred_username || claims.email || `oidc_${subject}`)
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '')
      .slice(0, 40) || `oidc_${subject.slice(0, 8)}`;
  let username = base.length >= 2 ? base : `sso_${base}`;
  let suffix = 1;
  while (await User.exists({ username, deletedAt: includeRemoved() })) {
    username = `${base}${suffix}`;
    suffix += 1;
  }
  return username;
};

// Accounts are matched by (issuer, sub) only; email linking is opt-in and needs
// a verified email so an IdP user cannot claim an unrelated local account.
const upsertOidcUser = async (claims, issuer) => {
  const subject = String(claims.sub || '').trim();
  if (!subject) throw createOidcError(400, 'OIDC token missing sub claim');

  let user = await User.findOne({ oidcIssuer: issuer, oidcSubject: subject, deletedAt: includeRemoved() });
  if (user?.deletedAt) throw createOidcError(403, 'This account has been removed');
  let linked = false;
  if (!user) {
    user = await findLinkableLocalUser(claims);
    linked = Boolean(user);
  }

  if (!user) {
    if (String(process.env.OIDC_JIT_PROVISIONING || 'true').toLowerCase() === 'false') {
      throw createOidcError(403, 'No KGL account is linked to this SSO identity');
    }
    const role = mapRoleFromClaims(claims);
    const branch = mapBranchFromClaims(claims, role);
    const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    user = await User.create({
      name: buildNameFromClaims(claims),
      username: await allocateUsername(claims, subject),
      password: randomPassword,
      email: claims.email && claims.email_verified === true ? String(claims.email).toLowerCase() : '',
      role,
      branch,
      canViewCrossBranchTotals: role === 'director',
      authSource: 'oidc',
      oidcIssuer: issuer,
      oidcSubject: subject,
      mustChangePassword: false
    });
    await recordAudit({
      actor: user,
      action: 'create',
      entityType: 'user',
      entityId: user._id,
      branch: user.branch || '',
      metadata: { provisionedVia: 'oidc', issuer, role }
    });
    logger.info('auth.oidc.provisioned', { userId: String(user._id), username: user.username, role });
    return user;
  }

  user.authSource = 'oidc';
  user.oidcIssuer = issuer;
  user.oidcSubject = subject;
  if (claims.email && claims.email_verified === true) user.email = String(claims.email).toLowerCase();
  if (String(process.env.OIDC_SYNC_ROLE || '').toLowerCase() === 'true') {
    const role = mapRoleFromClaims(claims);
    user.role = role;
    user.branch = mapBranchFromClaims(claims, role);
    user.canViewCrossBranchTotals = role === 'director' ? true : user.canViewCrossBranchTotals;
  }
  await user.save();
  if (linked) {
    await recordAudit({
      actor: user,
      action: 'update',
      entityType: 'user',
      entityId: user._id,
      branch: user.branch || '',
      metadata: { linkedVia: 'oidc', issuer }
    });
  }
  return user;
};

const completeOidcLogin = async ({ code, state, browserState }) => {
  const config = getOidcConfig();
  const stateValue = String(state || '');
  if (!stateValue || !browserState || browserState !== stateValue) {
    throw createOidcError(400, 'OIDC state does not match this browser session');
  }
  const pending = await OidcLoginState.findOneAndDelete({ state: stateValue }).lean();
  if (!pending || Date.now() - new Date(pending.createdAt).getTime() > 10 * 60 * 1000) {
    throw createOidcError(400, 'Invalid or expired OIDC state');
  }
  if (!code) throw createOidcError(400, 'OIDC authorization code is missing');

  const discovery = await discover(config.issuer);
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: String(code),
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code_verifier: pending.codeVerifier
  });

  let tokenResponse;
  try {
    tokenResponse = await fetch(discovery.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body,
      signal: AbortSignal.timeout(10000)
    });
  } catch (error) {
    throw createOidcError(502, `OIDC token exchange failed: ${error.message}`);
  }
  if (!tokenResponse.ok) throw createOidcError(502, `OIDC token exchange failed (${tokenResponse.status})`);
  const tokens = await tokenResponse.json();
  const claims = await verifyIdToken({
    idToken: tokens.id_token,
    discovery,
    config,
    expectedNonce: pending.nonce
  });

  const user = await upsertOidcUser(claims, config.issuer);
  return { user, claims };
};

const getOidcStatus = () => {
  if (!oidcEnabled()) return { enabled: false, issuer: null, providerName: null };
  const config = getOidcConfig();
  return { enabled: true, issuer: config.issuer, providerName: config.providerName };
};

const resetOidcCaches = () => {
  discoveryCache.clear();
  jwksCache.clear();
};

export {
  oidcEnabled,
  getOidcStatus,
  beginOidcLogin,
  completeOidcLogin,
  upsertOidcUser,
  mapRoleFromClaims,
  verifyIdToken,
  resetOidcCaches
};
