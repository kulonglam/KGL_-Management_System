import test from 'node:test';
import assert from 'node:assert/strict';
import { DOCUMENTED_SEED_PASSWORD } from '../config/seedPolicy.js';
import { assertSeedMayRun } from '../seedData.js';

const restoreEnv = (previous) => {
  process.env.NODE_ENV = previous.nodeEnv;
  if (previous.allow === undefined) delete process.env.ALLOW_PRODUCTION_SEED;
  else process.env.ALLOW_PRODUCTION_SEED = previous.allow;
  if (previous.password === undefined) delete process.env.SEED_DEFAULT_PASSWORD;
  else process.env.SEED_DEFAULT_PASSWORD = previous.password;
};

test('production seed is refused unless it is explicit and uses a unique password', () => {
  const previous = {
    nodeEnv: process.env.NODE_ENV,
    allow: process.env.ALLOW_PRODUCTION_SEED,
    password: process.env.SEED_DEFAULT_PASSWORD
  };
  process.env.NODE_ENV = 'production';
  delete process.env.ALLOW_PRODUCTION_SEED;
  delete process.env.SEED_DEFAULT_PASSWORD;

  try {
    assert.throws(() => assertSeedMayRun(), /ALLOW_PRODUCTION_SEED/);
    process.env.ALLOW_PRODUCTION_SEED = 'true';
    assert.throws(() => assertSeedMayRun(), /documented demo password/);
    assert.equal(DOCUMENTED_SEED_PASSWORD, 'Karibu@2026!');
    process.env.SEED_DEFAULT_PASSWORD = 'Unique@Launch2026';
    assert.doesNotThrow(() => assertSeedMayRun());
  } finally {
    restoreEnv(previous);
  }
});
