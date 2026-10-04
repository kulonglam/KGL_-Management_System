import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTotpCode, generateTotpSecret, verifyTotpCode } from '../utils/totp.js';

test('verifyTotpCode accepts the current period code for a generated secret', () => {
  const secret = generateTotpSecret();
  const counter = Math.floor(Date.now() / 1000 / 30);
  const code = generateTotpCode(secret, counter);
  assert.equal(verifyTotpCode(secret, code), true);
  assert.equal(verifyTotpCode(secret, '000000'), false);
});
