process.env.JWT_SECRET =
  process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
    ? process.env.JWT_SECRET
    : 'security-gap-test-jwt-secret-32chars';

import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import createApp from '../app.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { login } from '../controllers/authController.js';

const app = createApp();

const createRes = () => {
  const cookies = [];
  return {
    cookies,
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
    append(name, value) {
      if (String(name).toLowerCase() === 'set-cookie') cookies.push(String(value));
      return this;
    }
  };
};

test('API responses block inline styles outside Swagger', async () => {
  const health = await request(app).get('/healthz');
  const csp = health.headers['content-security-policy'];
  assert.match(csp, /style-src 'self'/);
  assert.equal(csp.includes('unsafe-inline'), false);

});

test('remembered username is an httpOnly cookie, not a stored password', async () => {
  const passwordHash = await bcrypt.hash('Unique@Launch2026', 4);
  const originalFindOne = User.findOne;
  const originalCreate = AuditLog.create;
  AuditLog.create = async () => ({});
  User.findOne = async () => ({
    _id: '507f1f77bcf86cd799439011',
    username: 'manager-user',
    name: 'Manager One',
    role: 'manager',
    branch: 'Maganjo',
    password: passwordHash,
    loginAttempts: 0,
    lockUntil: null,
    mfaEnabled: false,
    canViewCrossBranchTotals: false,
    tokenVersion: 0,
    refreshTokenVersion: 0,
    save: async () => {}
  });

  try {
    const res = createRes();
    await login(
      { body: { username: 'manager-user', password: 'Unique@Launch2026', rememberMe: true } },
      res
    );
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    const remembered = res.cookies.find((cookie) => cookie.startsWith('kgl_username='));
    assert.ok(remembered, res.cookies.join('\n'));
    assert.match(remembered, /HttpOnly/);
    assert.match(remembered, /manager-user/);
    assert.equal(remembered.includes('Unique@Launch2026'), false);

    const cleared = createRes();
    await login(
      { body: { username: 'manager-user', password: 'Unique@Launch2026', rememberMe: false } },
      cleared
    );
    const clearedCookie = cleared.cookies.find((cookie) => cookie.startsWith('kgl_username='));
    assert.match(clearedCookie, /Max-Age=0/);
  } finally {
    User.findOne = originalFindOne;
    AuditLog.create = originalCreate;
  }
});

test('GET /api/v1/auth/remembered returns only a safe username from the cookie', async () => {
  const saved = await request(app)
    .get('/api/v1/auth/remembered')
    .set('Cookie', 'kgl_username=saved-user');
  assert.equal(saved.status, 200);
  assert.equal(saved.body.data.username, 'saved-user');

  const rejected = await request(app)
    .get('/api/v1/auth/remembered')
    .set('Cookie', 'kgl_username=bad%0Auser');
  assert.equal(rejected.status, 200);
  assert.equal(rejected.body.data.username, '');
  assert.match(String(rejected.headers['set-cookie']), /kgl_username=;/);
});
