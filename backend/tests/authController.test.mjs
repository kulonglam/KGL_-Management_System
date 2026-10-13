import test from 'node:test';
import assert from 'node:assert/strict';

import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { login, logout, updateMe } from '../controllers/authController.js';

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
  cookie() {
    return this;
  },
  clearCookie() {
    return this;
  }
});

test('login returns a generic 401 response when an account is locked', async (t) => {
  t.mock.method(User, 'findOne', async () => ({
    lockUntil: new Date(Date.now() + 60_000)
  }));

  const req = {
    body: {
      username: 'locked-user',
      password: 'AnyPassword1!'
    }
  };
  const res = createRes();

  await login(req, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'Invalid credentials' });
});

test('login returns the same generic 401 response for invalid credentials', async (t) => {
  const user = {
    _id: 'user-1',
    password: 'stored-hash',
    loginAttempts: 0,
    lockUntil: null
  };

  t.mock.method(User, 'findOne', async () => user);
  t.mock.method(User, 'findOneAndUpdate', async () => {
    user.loginAttempts += 1;
    return user;
  });
  t.mock.method(bcrypt, 'compare', async () => false);

  const req = {
    body: {
      username: 'manager-user',
      password: 'WrongPassword1!'
    }
  };
  const res = createRes();

  await login(req, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { message: 'Invalid credentials' });
  assert.equal(user.loginAttempts, 1);
});

test('password setup rejects profile fields sent with the new password', async (t) => {
  t.mock.method(User, 'findById', async () => ({
    _id: 'user-1',
    role: 'director',
    save: async () => {
      throw new Error('profile fields must be rejected before save');
    }
  }));

  const res = createRes();
  await updateMe(
    {
      setupPurpose: 'password',
      user: { _id: 'user-1' },
      body: { password: 'Unique@Launch2026', name: 'New Name', username: 'new-name' }
    },
    res
  );

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Password setup only accepts a new password');
});

test('logout revokes the current session and returns a success message', async (t) => {
  t.mock.method(User, 'findByIdAndUpdate', async () => ({
    _id: 'user-123',
    tokenVersion: 2
  }));

  const req = {
    user: {
      _id: 'user-123'
    }
  };
  const res = createRes();

  await logout(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { message: 'Logged out successfully' });
});
