import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import StockLock from '../models/StockLock.js';

// Configure stock lock defaults.
const DEFAULT_LOCK_TTL_MS = 8000;
const DEFAULT_LOCK_WAIT_MS = 5000;
const DEFAULT_RETRY_INTERVAL_MS = 75;

// Wait helper for retry loops.
const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// Normalize text fragments used in lock keys.
const normalizeLockPart = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

// Build a deterministic lock key for a stock bucket.
const buildStockLockKey = ({ branch, produceName, produceType }) => {
  return `${normalizeLockPart(branch)}::${normalizeLockPart(produceName)}::${normalizeLockPart(
    produceType
  )}`;
};

// Acquire a lock for a stock bucket with retry and stale-lock takeover.
const acquireStockLock = async (
  key,
  {
    ttlMs = DEFAULT_LOCK_TTL_MS,
    waitMs = DEFAULT_LOCK_WAIT_MS,
    retryIntervalMs = DEFAULT_RETRY_INTERVAL_MS
  } = {}
) => {
  const ownerId = randomUUID();
  const start = Date.now();

  while (Date.now() - start <= waitMs) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);

    try {
      const lock = await StockLock.findOneAndUpdate(
        {
          key,
          $or: [{ expiresAt: mongoose.trusted({ $lte: now }) }, { ownerId }]
        },
        {
          $set: {
            key,
            ownerId,
            expiresAt
          }
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );

      if (lock?.ownerId === ownerId) {
        return { key, ownerId };
      }
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }
    }

    await delay(retryIntervalMs);
  }

  const lockTimeoutError = new Error(
    'Stock is currently being updated by another request. Please retry.'
  );
  lockTimeoutError.statusCode = 409;
  throw lockTimeoutError;
};

// Release a previously acquired stock lock.
const releaseStockLock = async ({ key, ownerId }) => {
  await StockLock.deleteOne({ key, ownerId });
};

// Execute a task while holding a stock lock.
const withStockLock = async (input, task, options) => {
  const key = buildStockLockKey(input);
  const lock = await acquireStockLock(key, options);
  try {
    return await task();
  } finally {
    await releaseStockLock(lock);
  }
};

export { buildStockLockKey, acquireStockLock, releaseStockLock, withStockLock };
