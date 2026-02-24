import { randomUUID } from 'node:crypto';
import StockLock from '../models/StockLock.js';

const LOCK_TTL_MS = Number(process.env.STOCK_LOCK_TTL_MS || 5000);
const LOCK_WAIT_TIMEOUT_MS = Number(process.env.STOCK_LOCK_WAIT_TIMEOUT_MS || 10000);
const LOCK_RETRY_MS = Number(process.env.STOCK_LOCK_RETRY_MS || 120);

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const lockUnavailableError = () => {
  const error = new Error('Stock is currently being updated. Please retry.');
  error.statusCode = 423;
  return error;
};

const ensureLockDocument = async (key) => {
  await StockLock.updateOne(
    {
      branch: key.branch,
      produceName: key.produceName,
      produceType: key.produceType
    },
    {
      $setOnInsert: {
        owner: null,
        lockUntil: new Date(0)
      }
    },
    { upsert: true }
  );
};

const acquireStockLock = async (key, owner) => {
  const startedAt = Date.now();
  await ensureLockDocument(key);

  while (Date.now() - startedAt <= LOCK_WAIT_TIMEOUT_MS) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + LOCK_TTL_MS);

    const lock = await StockLock.findOneAndUpdate(
      {
        branch: key.branch,
        produceName: key.produceName,
        produceType: key.produceType,
        $or: [{ lockUntil: { $lte: now } }, { owner }]
      },
      {
        $set: {
          owner,
          lockUntil: expiresAt
        }
      },
      { new: true }
    );

    if (lock && lock.owner === owner) {
      return;
    }

    await sleep(LOCK_RETRY_MS);
  }

  throw lockUnavailableError();
};

const releaseStockLock = async (key, owner) => {
  await StockLock.updateOne(
    {
      branch: key.branch,
      produceName: key.produceName,
      produceType: key.produceType,
      owner
    },
    {
      $set: {
        owner: null,
        lockUntil: new Date(0)
      }
    }
  );
};

const withStockLock = async (key, work) => {
  const owner = randomUUID();
  await acquireStockLock(key, owner);
  try {
    return await work();
  } finally {
    await releaseStockLock(key, owner);
  }
};

export { withStockLock };
