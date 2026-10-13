import test from 'node:test';
import assert from 'node:assert/strict';
import spec from '../docs/swagger.js';

const required = [
  ['get', '/healthz'],
  ['get', '/readyz'],
  ['get', '/'],
  ['get', '/auth/remembered'],
  ['post', '/auth/login'],
  ['post', '/auth/login/mfa'],
  ['post', '/auth/refresh'],
  ['post', '/auth/password-reset'],
  ['post', '/auth/logout'],
  ['post', '/auth/register'],
  ['get', '/auth/me'],
  ['put', '/auth/me'],
  ['post', '/auth/recovery-codes'],
  ['post', '/auth/mfa/setup'],
  ['post', '/auth/mfa/enable'],
  ['post', '/auth/mfa/disable'],
  ['get', '/auth/users'],
  ['put', '/auth/users/{id}'],
  ['delete', '/auth/users/{id}'],
  ['post', '/auth/users/{id}/recovery-codes'],
  ['get', '/procurement'],
  ['post', '/procurement'],
  ['get', '/procurement/{id}'],
  ['put', '/procurement/{id}'],
  ['delete', '/procurement/{id}'],
  ['get', '/sales'],
  ['post', '/sales'],
  ['get', '/sales/dashboard'],
  ['get', '/sales/agent-dashboard'],
  ['get', '/sales/aggregation'],
  ['put', '/sales/{id}'],
  ['delete', '/sales/{id}'],
  ['get', '/credit-sales'],
  ['post', '/credit-sales'],
  ['put', '/credit-sales/{id}/payment'],
  ['post', '/credit-sales/{id}/repay'],
  ['put', '/credit-sales/{id}'],
  ['delete', '/credit-sales/{id}'],
  ['get', '/inventory'],
  ['get', '/trusted-buyers'],
  ['post', '/trusted-buyers'],
  ['put', '/trusted-buyers/{id}'],
  ['delete', '/trusted-buyers/{id}'],
  ['get', '/prices'],
  ['post', '/prices'],
  ['get', '/prices/{id}/history'],
  ['get', '/prices/{id}'],
  ['put', '/prices/{id}'],
  ['delete', '/prices/{id}'],
  ['get', '/notifications'],
  ['put', '/notifications/read-all'],
  ['put', '/notifications/{id}/read'],
  ['get', '/branches'],
  ['post', '/branches'],
  ['put', '/branches/{id}'],
  ['get', '/audit-logs']
];

test('the API spec documents every mounted route with a response schema', () => {
  const missing = required.filter(([method, path]) => !spec.paths[path]?.[method]);
  assert.deepEqual(missing, []);

  for (const [method, path] of required) {
    const operation = spec.paths[path][method];
    const response = operation.responses?.['200'] || operation.responses?.['201'];
    assert.ok(response, `${method.toUpperCase()} ${path} has no success response`);
    const encoded = JSON.stringify(response);
    assert.equal(encoded.includes('#/components/schemas') || encoded.includes('oneOf'), true, `${method.toUpperCase()} ${path}`);
  }
});
