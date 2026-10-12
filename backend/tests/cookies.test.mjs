import test from 'node:test';
import assert from 'node:assert/strict';

import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from '../utils/cookies.js';

const cookiePathMatches = (cookiePath, requestPath) => {
  if (cookiePath === requestPath) return true;
  if (!requestPath.startsWith(cookiePath)) return false;
  if (cookiePath.endsWith('/')) return true;
  return requestPath.charAt(cookiePath.length) === '/';
};

const collectSetCookies = (write) => {
  const headers = [];
  const res = {
    append(_name, value) {
      headers.push(value);
    }
  };
  write(res);
  return headers;
};

test('refresh cookie is sent on /api and /api/v1 auth routes', () => {
  const [activeCookie, legacyClear] = collectSetCookies((res) => setRefreshCookie(res, 'refresh-token'));
  const activePath = activeCookie.match(/Path=([^;]+)/)[1];

  assert.equal(activePath, '/api');
  assert.match(activeCookie, /^kgl_refresh=refresh-token/);
  assert.match(activeCookie, /HttpOnly/);
  assert.match(legacyClear, /Path=\/api\/auth/);
  assert.match(legacyClear, /Max-Age=0/);

  assert.equal(cookiePathMatches(activePath, '/api/v1/auth/refresh'), true);
  assert.equal(cookiePathMatches(activePath, '/api/v1/auth/logout'), true);
  assert.equal(cookiePathMatches(activePath, '/api/auth/refresh'), true);
  assert.equal(cookiePathMatches('/api/auth', '/api/v1/auth/refresh'), false);
});

test('clearing the refresh cookie expires both the current and legacy paths', () => {
  const headers = collectSetCookies((res) => clearRefreshCookie(res));
  assert.equal(headers.length, 2);
  assert.ok(headers.every((header) => header.includes('Max-Age=0')));
  assert.match(headers[0], /Path=\/api(;|$)/);
  assert.match(headers[1], /Path=\/api\/auth/);
});

test('readRefreshCookie returns the kgl_refresh value from the request', () => {
  assert.equal(
    readRefreshCookie({ headers: { cookie: 'other=1; kgl_refresh=abc%3D123' } }),
    'abc=123'
  );
  assert.equal(readRefreshCookie({ headers: {} }), '');
});
