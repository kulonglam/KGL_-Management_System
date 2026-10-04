import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authorize, authorizeDirectorOrban, protect } from '../middleware/auth.js';
import { getJwtClaimOptions } from '../config/security.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// Create res.
const createRes = () => {
  // Configure response.
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  return response;
};

test('authorize allows user with expected role', () => {
  const middleware = authorize('manager');
  const req = { user: { role: 'manager' } };
  const res = createRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test('authorize rejects user with unexpected role', () => {
  const middleware = authorize('manager');
  const req = { user: { role: 'sales_agent' } };
  const res = createRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /not authorized/i);
});

test('authorize returns 401 when req.user is missing', () => {
  const middleware = authorize('manager');
  const req = {};
  const res = createRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.match(res.body.message, /not authorized/i);
});

test('authorizeDirectorOrban allows only the orban director account', () => {
  // Configure req.
  const req = {
    user: {
      username: 'orban',
      name: 'Mr. Orban',
      role: 'director',
      canViewCrossBranchTotals: false
    }
  };
  const res = createRes();
  let nextCalled = false;

  authorizeDirectorOrban(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test('authorizeDirectorOrban rejects non-Orban directors even with legacy permission flags', () => {
  const req = {
    user: {
      username: 'director1',
      name: 'Director One',
      role: 'director',
      canViewCrossBranchTotals: true
    }
  };
  const res = createRes();
  let nextCalled = false;

  authorizeDirectorOrban(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /Only Mr\. Orban/i);
});

const signToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, getJwtClaimOptions());

test('protect rejects refresh and MFA tokens even when the signature is valid', async () => {
  const originalFindById = User.findById;
  User.findById = () => ({
    select: async () => ({ _id: 'u1', role: 'manager', tokenVersion: 0 })
  });

  try {
    for (const typ of ['refresh', 'mfa']) {
      const req = { headers: { authorization: `Bearer ${signToken({ id: 'u1', typ })}` } };
      const res = createRes();
      let nextCalled = false;
      await protect(req, res, () => {
        nextCalled = true;
      });
      assert.equal(nextCalled, false);
      assert.equal(res.statusCode, 401);
    }
  } finally {
    User.findById = originalFindById;
  }
});

test('protect rejects legacy tokens that omit the typ claim', async () => {
  const originalFindById = User.findById;
  User.findById = () => ({
    select: async () => ({ _id: 'u1', role: 'manager', tokenVersion: 0 })
  });

  try {
    const req = { headers: { authorization: `Bearer ${signToken({ id: 'u1' })}` } };
    const res = createRes();
    let nextCalled = false;
    await protect(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
  } finally {
    User.findById = originalFindById;
  }
});

test('protect allows access tokens with typ access', async () => {
  const originalFindById = User.findById;
  User.findById = () => ({
    select: async () => ({ _id: 'u1', role: 'manager', tokenVersion: 0 })
  });

  try {
    const req = {
      headers: { authorization: `Bearer ${signToken({ id: 'u1', typ: 'access', tokenVersion: 0 })}` }
    };
    const res = createRes();
    let nextCalled = false;
    await protect(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
  } finally {
    User.findById = originalFindById;
  }
});
