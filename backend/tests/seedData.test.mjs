import test from 'node:test';
import assert from 'node:assert/strict';

import { assertSeedStockIntegrity } from '../seedData.js';

test('seed sales and credit sales all decrement a procurement stock bucket', () => {
  assert.doesNotThrow(() => assertSeedStockIntegrity());
});
