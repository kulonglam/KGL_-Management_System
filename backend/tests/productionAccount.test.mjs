process.env.NODE_ENV = 'production';
process.env.JWT_SECRET =
  process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
    ? process.env.JWT_SECRET
    : 'production-login-test-secret-32chars';

import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { disableMfa, login } from '../controllers/authController.js';

const createRes = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
  append() {
    return this;
  }
});

const account = (overrides) => ({
  _id: '507f1f77bcf86cd799439011',
  username: 'orban',
  role: 'director',
  branch: '',
  canViewCrossBranchTotals: true,
  loginAttempts: 0,
  lockUntil: null,
  mfaEnabled: false,
  tokenVersion: 0,
  refreshTokenVersion: 0,
  save: async () => {},
  ...overrides
});

test('production login requires a unique password and MFA before a session', async () => {
  const originalFindOne = User.findOne;
  const originalFindById = User.findById;

  try {
    const demoHash = await bcrypt.hash('Karibu@2026!', 4);
    User.findOne = async () => account({ password: demoHash, mfaEnabled: true });
    const demoResponse = createRes();
    await login({ body: { username: 'orban', password: 'Karibu@2026!' } }, demoResponse);
    assert.equal(demoResponse.statusCode, 200);
    assert.equal(demoResponse.body.passwordChangeRequired, true);
    assert.equal(typeof demoResponse.body.setupToken, 'string');
    assert.equal(demoResponse.body.token, undefined);

    const uniqueHash = await bcrypt.hash('Unique@Launch2026', 4);
    User.findOne = async () =>
      account({
        password: uniqueHash,
        role: 'manager',
        branch: 'Maganjo',
        canViewCrossBranchTotals: false
      });
    const mfaResponse = createRes();
    await login({ body: { username: 'kulong', password: 'Unique@Launch2026' } }, mfaResponse);
    assert.equal(mfaResponse.statusCode, 200);
    assert.equal(mfaResponse.body.mfaEnrollmentRequired, true);
    assert.equal(typeof mfaResponse.body.setupToken, 'string');
    assert.equal(mfaResponse.body.token, undefined);

    User.findById = async () => account({ mfaEnabled: true });
    const disableResponse = createRes();
    await disableMfa({ user: { _id: '507f1f77bcf86cd799439011' }, body: {} }, disableResponse);
    assert.equal(disableResponse.statusCode, 403);
  } finally {
    User.findOne = originalFindOne;
    User.findById = originalFindById;
  }
});
