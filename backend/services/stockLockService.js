/*
 * Implements short-lived distributed stock locks to prevent concurrent overselling
 * when multiple requests update the same branch/produce stock bucket.
 */

import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import StockLock from '../models/StockLock.js';

// Default lock tuning values for acquire timeout and retry behavior.
const FALLBACK_LOCK_TTL_MS = 8000;
const DEFAULT_LOCK_WAIT_MS = 5000;
const DEFAULT_RETRY_INTERVAL_MS = 75;

const resolveLockTtlMs = (override) => {
  if (Number.isFinite(override) && override >= 1000) return override;
  const configured = Number(process.env.STOCK_LOCK_TTL_MS);
  if (Number.isFinite(configured) && configured >= 1000) return configured;
  return FALLBACK_LOCK_TTL_MS;
};

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
    ttlMs = resolveLockTtlMs(),
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

const renewStockLock = async ({ key, ownerId }, ttlMs) => {
  const expiresAt = new Date(Date.now() + ttlMs);
  await StockLock.updateOne({ key, ownerId }, { $set: { expiresAt } });
};

const startLockRenewal = (locks, ttlMs) => {
  const intervalMs = Math.max(1000, Math.floor(ttlMs / 3));
  const timer = setInterval(() => {
    Promise.all(locks.map((lock) => renewStockLock(lock, ttlMs))).catch(() => {});
  }, intervalMs);
  if (typeof timer.unref === 'function') timer.unref();
  return () => clearInterval(timer);
};

// Hold one or more bucket locks for the duration of task, renewing them so a slow write cannot expire.
const withStockLocks = async (inputs, task, options = {}) => {
  const ttlMs = resolveLockTtlMs(options.ttlMs);
  const lockOptions = { ...options, ttlMs };
  const pending = [];
  const seen = new Set();

  for (const input of inputs) {
    const key = buildStockLockKey(input);
    if (seen.has(key)) continue;
    seen.add(key);
    pending.push(key);
  }

  pending.sort((left, right) => left.localeCompare(right));
  const locks = [];

  try {
    for (const key of pending) {
      locks.push(await acquireStockLock(key, lockOptions));
    }

    const stopRenewal = startLockRenewal(locks, ttlMs);
    try {
      return await task();
    } finally {
      stopRenewal();
    }
  } finally {
    for (const lock of [...locks].reverse()) {
      await releaseStockLock(lock);
    }
  }
};

// Execute callback while one bucket lock is held, guaranteeing release in finally.
const withStockLock = async (input, task, options) => withStockLocks([input], task, options);

export { withStockLock, withStockLocks };