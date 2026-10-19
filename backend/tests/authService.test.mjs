import test from 'node:test';
import assert from 'node:assert/strict';

import User from '../models/User.js';
import { getGenericLoginFailure, resolveUserListRoleFilter, revokeUserTokens } from '../services/authService.js';

test('getGenericLoginFailure returns a generic auth error without account details', () => {
  assert.deepEqual(getGenericLoginFailure(), {
    statusCode: 401,
    message: 'Invalid credentials'
  });
});

test('revokeUserTokens rotates tokenVersion for the specified user', async (t) => {
  const expectedUser = { _id: 'user-123', tokenVersion: 4 };
  let receivedArgs = null;

  t.mock.method(User, 'findByIdAndUpdate', async (...args) => {
    receivedArgs = args;
    return expectedUser;
  });

  const result = await revokeUserTokens('user-123');

  assert.equal(result, expectedUser);
  assert.deepEqual(receivedArgs, [
    'user-123',
    { $inc: { tokenVersion: 1, refreshTokenVersion: 1 } },
    { new: true, runValidators: false }
  ]);
});

test('revokeUserTokens throws a not-found error when the user does not exist', async (t) => {
  t.mock.method(User, 'findByIdAndUpdate', async () => null);

  await assert.rejects(
    () => revokeUserTokens('missing-user'),
    (error) => error.statusCode === 404 && error.message === 'User not found'
  );
});

test('a manager cannot list director accounts through the role filter', () => {
  const allowed = resolveUserListRoleFilter('manager', 'all');
  assert.deepEqual(allowed.roleIn, ['manager', 'sales_agent', 'storekeeper', 'auditor']);

  const rejected = resolveUserListRoleFilter('manager', 'director');
  assert.equal(rejected.statusCode, 400);
  assert.equal(rejected.error, 'Invalid role filter');

  const agent = resolveUserListRoleFilter('manager', 'sales_agent');
  assert.equal(agent.role, 'sales_agent');
});
