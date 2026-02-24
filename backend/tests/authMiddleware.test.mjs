import test from 'node:test';
import assert from 'node:assert/strict';
import { authorize, authorizeDirectorOrban } from '../middleware/auth.js';

const createRes = () => {
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

test('authorizeDirectorOrban allows director with cross-branch permission', () => {
  const req = {
    user: {
      username: 'orban',
      name: 'Mr. Orban',
      canViewCrossBranchTotals: true
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

test('authorizeDirectorOrban rejects non-Orban users', () => {
  const req = { user: { username: 'director1', name: 'Director One' } };
  const res = createRes();
  let nextCalled = false;

  authorizeDirectorOrban(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /Only Mr\. Orban/i);
});
