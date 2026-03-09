import test from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_PHONE_PATTERN, normalizeLocalPhone } from '../src/utils/phoneNumber.js';

test('normalizeLocalPhone converts +256 numbers to 07 format', () => {
  assert.equal(normalizeLocalPhone('+256700000001'), '0700000001');
});

test('normalizeLocalPhone keeps valid local numbers intact', () => {
  assert.equal(normalizeLocalPhone('0700000001'), '0700000001');
});

test('LOCAL_PHONE_PATTERN accepts only 07-formatted numbers', () => {
  assert.equal(LOCAL_PHONE_PATTERN.test(normalizeLocalPhone('+256700000001')), true);
  assert.equal(LOCAL_PHONE_PATTERN.test('0200000000'), false);
});
