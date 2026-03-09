/*
 * Implements short-lived distributed stock locks to prevent concurrent overselling
 * when multiple requests update the same branch/produce stock bucket.
 */

import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import StockLock from '../models/StockLock.js';

// Default lock tuning values for acquire timeout and retry behavior.
const DEFAULT_LOCK_TTL_MS = 8000;
const DEFAULT_LOCK_WAIT_MS = 5000;
const DEFAULT_RETRY_INTERVAL_MS = 75;

// Promise-based sleep helper used between lock acquisition retries.
const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// Normalize lock-key parts so key generation is deterministic across equivalent text input.
const normalizeLockPart = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

// Build deterministic lock key for one stock bucket (branch + produceName + produceType).
const buildStockLockKey = ({ branch, produceName, produceType }) => {
  return `${normalizeLockPart(branch)}::${normalizeLockPart(produceName)}::${normalizeLockPart(
    produceType
  )}`;
};

// Acquire lock with retries and stale-lock takeover; throws 409 on timeout.
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

// Release lock only for matching key/owner pair to avoid deleting another request's lock.
const releaseStockLock = async ({ key, ownerId }) => {
  await StockLock.deleteOne({ key, ownerId });
};

// Execute callback while lock is held, guaranteeing release in finally.
const withStockLock = async (input, task, options) => {
  const key = buildStockLockKey(input);
  const lock = await acquireStockLock(key, options);
  try {
    return await task();
  } finally {
    await releaseStockLock(lock);
  }
};

export { withStockLock };