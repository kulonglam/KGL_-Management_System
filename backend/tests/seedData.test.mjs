import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DOCUMENTED_SEED_PASSWORD,
  assertSeedDataset,
  parseSeedDate,
  resolveSeedPassword
} from '../seedData.js';

test('a missing seed password uses the documented demo password', () => {
  assert.equal(resolveSeedPassword(''), DOCUMENTED_SEED_PASSWORD);
  assert.equal(resolveSeedPassword(undefined), DOCUMENTED_SEED_PASSWORD);
  assert.equal(resolveSeedPassword('   '), DOCUMENTED_SEED_PASSWORD);
  assert.equal(DOCUMENTED_SEED_PASSWORD, 'Karibu@2026!');
});

test('a weak seed password is rejected before any database write', () => {
  assert.throws(() => resolveSeedPassword('short'), /SEED_DEFAULT_PASSWORD is invalid/);
});

test('seed dates stay on the written UTC calendar day', () => {
  assert.equal(parseSeedDate('2026-03-05').toISOString(), '2026-03-05T00:00:00.000Z');
  assert.equal(parseSeedDate('2026-03-07').toISOString(), '2026-03-07T00:00:00.000Z');
  assert.throws(() => parseSeedDate('2026-03-5'), /YYYY-MM-DD/);
  assert.throws(() => parseSeedDate('2026-02-31'), /not a real calendar day/);
});

test('the full seed dataset passes stock, date, and schema checks', () => {
  assert.doesNotThrow(() => assertSeedDataset());
});
