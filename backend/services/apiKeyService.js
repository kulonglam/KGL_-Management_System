import crypto from 'node:crypto';
import ApiKey, { API_KEY_SCOPES } from '../models/ApiKey.js';
import { getRegisteredBranches } from '../config/branches.js';
import { businessDayRange } from '../utils/businessTime.js';

const KEY_PATTERN = /^kgl_([A-Za-z0-9]{10})_([A-Za-z0-9_-]{32,})$/;
const LAST_USED_WRITE_INTERVAL_MS = 60 * 1000;

const createServiceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const hashSecret = (secret) => crypto.createHash('sha256').update(secret).digest('hex');

const randomPrefix = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(10);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
};

const publicView = (key) => {
  const row = typeof key.toObject === 'function' ? key.toObject() : { ...key };
  delete row.keyHash;
  return {
    ...row,
    status: row.revokedAt ? 'revoked' : row.expiresAt && new Date(row.expiresAt) <= new Date() ? 'expired' : 'active'
  };
};

const createApiKey = async ({ actorUser, name, scopes, branch = '', expiresAt = null }) => {
  const resolvedScopes = [...new Set(scopes || [])];
  if (resolvedScopes.length === 0 || !resolvedScopes.every((scope) => API_KEY_SCOPES.includes(scope))) {
    throw createServiceError(400, `scopes must be one or more of: ${API_KEY_SCOPES.join(', ')}`);
  }
  const resolvedBranch = String(branch || '').trim();
  if (resolvedBranch && !getRegisteredBranches().includes(resolvedBranch)) {
    throw createServiceError(400, 'branch must be a registered branch or empty for all branches');
  }
  // A date-only expiry keeps the key valid through the end of that business day.
  const expiry = !expiresAt
    ? null
    : /^\d{4}-\d{2}-\d{2}$/.test(String(expiresAt))
      ? businessDayRange(String(expiresAt)).end
      : new Date(expiresAt);
  if (expiry && (Number.isNaN(expiry.getTime()) || expiry <= new Date())) {
    throw createServiceError(400, 'expiresAt must be a future date');
  }

  const prefix = randomPrefix();
  const secret = crypto.randomBytes(24).toString('base64url');
  const key = await ApiKey.create({
    name: String(name || '').trim(),
    prefix,
    keyHash: hashSecret(secret),
    scopes: resolvedScopes,
    branch: resolvedBranch,
    expiresAt: expiry,
    createdBy: actorUser._id
  });
  return { apiKey: publicView(key), plaintextKey: `kgl_${prefix}_${secret}` };
};

const listApiKeys = async () =>
  (await ApiKey.find({}).sort({ createdAt: -1 }).populate('createdBy', 'name').lean()).map(publicView);

const revokeApiKey = async ({ actorUser, id }) => {
  const key = await ApiKey.findById(id);
  if (!key) throw createServiceError(404, 'API key not found');
  if (!key.revokedAt) {
    key.revokedAt = new Date();
    key.revokedBy = actorUser._id;
    await key.save();
  }
  return publicView(key);
};

// Returns the active key for a presented value, or null. Constant-time hash comparison.
const authenticateApiKey = async (presented, { ip = '' } = {}) => {
  const match = KEY_PATTERN.exec(String(presented || '').trim());
  if (!match) return null;
  const [, prefix, secret] = match;
  const key = await ApiKey.findOne({ prefix }).lean();
  if (!key) return null;
  const expected = Buffer.from(key.keyHash, 'hex');
  const actual = Buffer.from(hashSecret(secret), 'hex');
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
  if (key.revokedAt) return null;
  if (key.expiresAt && new Date(key.expiresAt) <= new Date()) return null;

  const now = new Date();
  if (!key.lastUsedAt || now - new Date(key.lastUsedAt) > LAST_USED_WRITE_INTERVAL_MS) {
    await ApiKey.updateOne({ _id: key._id }, { $set: { lastUsedAt: now, lastUsedIp: String(ip).slice(0, 64) } });
  }
  return key;
};

export { API_KEY_SCOPES, authenticateApiKey, createApiKey, listApiKeys, revokeApiKey };
