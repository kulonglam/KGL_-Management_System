import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import StockLock from '../models/StockLock.js';
import { withStockLock } from '../services/stockLockService.js';

const originalUpdateOne = StockLock.updateOne;
const originalFindOneAndUpdate = StockLock.findOneAndUpdate;
const originalDateNow = Date.now;

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const keyToString = ({ branch, produceName, produceType }) =>
  `${branch}::${produceName}::${produceType}`;

const installInMemoryLockStore = () => {
  const store = new Map();

  StockLock.updateOne = async (filter, update, options = {}) => {
    const key = keyToString(filter);
    let current = store.get(key);

    if (update.$setOnInsert && options.upsert) {
      if (!current) {
        current = {
          branch: filter.branch,
          produceName: filter.produceName,
          produceType: filter.produceType,
          owner: update.$setOnInsert.owner ?? null,
          lockUntil: update.$setOnInsert.lockUntil ?? new Date(0)
        };
        store.set(key, current);
      }
      return { acknowledged: true, modifiedCount: 1 };
    }

    if (!current) {
      return { acknowledged: true, modifiedCount: 0 };
    }

    if (Object.prototype.hasOwnProperty.call(filter, 'owner') && current.owner !== filter.owner) {
      return { acknowledged: true, modifiedCount: 0 };
    }

    if (update.$set) {
      current = { ...current, ...update.$set };
      store.set(key, current);
    }

    return { acknowledged: true, modifiedCount: 1 };
  };

  StockLock.findOneAndUpdate = async (filter, update) => {
    const key = keyToString(filter);
    let current = store.get(key);

    if (!current) {
      current = {
        branch: filter.branch,
        produceName: filter.produceName,
        produceType: filter.produceType,
        owner: null,
        lockUntil: new Date(0)
      };
      store.set(key, current);
    }

    const now = filter.$or?.[0]?.lockUntil?.$lte || new Date();
    const requestedOwner = update?.$set?.owner;
    const canAcquire = current.lockUntil <= now || current.owner === requestedOwner;

    if (!canAcquire) {
      return null;
    }

    current = {
      ...current,
      ...update.$set
    };
    store.set(key, current);
    return current;
  };

  return store;
};

afterEach(() => {
  StockLock.updateOne = originalUpdateOne;
  StockLock.findOneAndUpdate = originalFindOneAndUpdate;
  Date.now = originalDateNow;
});

test('withStockLock serializes concurrent work for the same stock key', async () => {
  installInMemoryLockStore();

  const key = {
    branch: 'Maganjo',
    produceName: 'Red Beans',
    produceType: 'Beans'
  };

  let inCriticalSection = 0;
  let maxConcurrency = 0;

  const run = async (label) =>
    withStockLock(key, async () => {
      inCriticalSection += 1;
      maxConcurrency = Math.max(maxConcurrency, inCriticalSection);
      await sleep(80);
      inCriticalSection -= 1;
      return label;
    });

  const results = await Promise.all([run('A'), run('B'), run('C')]);

  assert.equal(results.length, 3);
  assert.deepEqual(results.sort(), ['A', 'B', 'C']);
  assert.equal(maxConcurrency, 1);
});

test('withStockLock releases lock even when work throws', async () => {
  installInMemoryLockStore();

  const key = {
    branch: 'Maganjo',
    produceName: 'Groundnuts',
    produceType: 'G-nuts'
  };

  await assert.rejects(
    withStockLock(key, async () => {
      throw new Error('boom');
    }),
    /boom/
  );

  const result = await withStockLock(key, async () => 'recovered');
  assert.equal(result, 'recovered');
});

test('withStockLock does not block different stock keys', async () => {
  installInMemoryLockStore();

  const keyA = {
    branch: 'Maganjo',
    produceName: 'Soybeans Batch A',
    produceType: 'Soybeans'
  };
  const keyB = {
    branch: 'Maganjo',
    produceName: 'Soybeans Batch B',
    produceType: 'Soybeans'
  };

  let inCriticalSection = 0;
  let maxConcurrency = 0;

  await Promise.all([
    withStockLock(keyA, async () => {
      inCriticalSection += 1;
      maxConcurrency = Math.max(maxConcurrency, inCriticalSection);
      await sleep(80);
      inCriticalSection -= 1;
    }),
    withStockLock(keyB, async () => {
      inCriticalSection += 1;
      maxConcurrency = Math.max(maxConcurrency, inCriticalSection);
      await sleep(80);
      inCriticalSection -= 1;
    })
  ]);

  assert.ok(maxConcurrency >= 2);
});

test('withStockLock returns lock timeout error with statusCode 423', async () => {
  installInMemoryLockStore();

  // Simulate contention: first loop runs, lock cannot be acquired, then timeout.
  const nowSequence = [0, 0, 20001];
  Date.now = () => nowSequence.shift() ?? 20001;
  StockLock.findOneAndUpdate = async () => null;

  const key = {
    branch: 'Matugga',
    produceName: 'White Maize',
    produceType: 'Grain Maize'
  };

  await assert.rejects(
    withStockLock(key, async () => 'never'),
    (error) => {
      assert.equal(error.statusCode, 423);
      assert.match(error.message, /currently being updated/i);
      return true;
    }
  );
});
