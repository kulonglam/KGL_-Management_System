import mongoose from 'mongoose';
import StockBalance from '../models/StockBalance.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

const canonicalBucket = ({ branch, produceName, produceType } = {}) => {
  const name = normalizeProduceName(produceName || '');
  const type = normalizeProduceType(produceType || '');
  return {
    branch: String(branch || '').trim(),
    produceName: typeof name === 'string' ? name.trim() : '',
    produceType: typeof type === 'string' ? type.trim() : ''
  };
};

const bucketKey = (bucket) => `${bucket.branch}::${bucket.produceName}::${bucket.produceType}`;

const sameBucket = (left, right) =>
  Boolean(left?.branch && left?.produceName && left?.produceType) && bucketKey(left) === bucketKey(right);

const adjustOnHand = async ({ branch, produceName, produceType, deltaKg = 0, sellingPrice, session }) => {
  const { branch: storedBranch, produceName: name, produceType: type } = canonicalBucket({
    branch,
    produceName,
    produceType
  });
  const delta = Number(deltaKg) || 0;
  if (!storedBranch || !name || !type) return;

  const update = {};
  if (delta !== 0) update.$inc = { onHandKg: delta };
  if (Number.isFinite(Number(sellingPrice)) && Number(sellingPrice) > 0) {
    update.$set = { sellingPrice: Number(sellingPrice) };
  }
  if (!update.$inc && !update.$set) return;

  await StockBalance.updateOne(
    { branch: storedBranch, produceName: name, produceType: type },
    update,
    { upsert: true, setDefaultsOnInsert: true, ...(session ? { session } : {}) }
  );
};

const currentStock = (doc) => ({
  ...canonicalBucket(doc),
  tonnageKg: Number(doc.tonnageKg || 0),
  sellingPrice: doc.sellingPrice,
  deletedAt: doc.deletedAt || null
});

// Keep one balance row per produce bucket. Procurement adds weight. Sales remove it.
const trackStockMovement = (schema, direction) => {
  schema.post('init', function rememberLoadedStock() {
    this.$locals.stockBefore = currentStock(this);
  });

  schema.post('save', async function applySavedMovement() {
    const before = this.$locals.stockBefore;
    const after = currentStock(this);
    const session = typeof this.$session === 'function' ? this.$session() : null;
    const price = direction > 0 ? after.sellingPrice : undefined;

    if (!before) {
      if (!after.deletedAt) {
        await adjustOnHand({ ...after, deltaKg: direction * after.tonnageKg, sellingPrice: price, session });
      }
    } else if (!before.deletedAt && after.deletedAt) {
      await adjustOnHand({ ...before, deltaKg: -direction * before.tonnageKg, session });
    } else if (before.deletedAt && !after.deletedAt) {
      await adjustOnHand({ ...after, deltaKg: direction * after.tonnageKg, sellingPrice: price, session });
    } else if (!after.deletedAt && sameBucket(before, after)) {
      await adjustOnHand({
        ...after,
        deltaKg: direction * (after.tonnageKg - before.tonnageKg),
        sellingPrice: price,
        session
      });
    } else if (!after.deletedAt) {
      const beforeBucket = canonicalBucket(before);
      const afterBucket = canonicalBucket(after);
      if (sameBucket(beforeBucket, afterBucket)) {
        await adjustOnHand({
          ...afterBucket,
          deltaKg: direction * (after.tonnageKg - before.tonnageKg),
          sellingPrice: price,
          session
        });
      } else {
        await adjustOnHand({ ...beforeBucket, deltaKg: -direction * before.tonnageKg, session });
        await adjustOnHand({
          ...afterBucket,
          deltaKg: direction * after.tonnageKg,
          sellingPrice: price,
          session
        });
      }
    }

    this.$locals.stockBefore = after;
  });

  schema.pre('deleteOne', { document: true, query: false }, async function removeMovement() {
    if (this.deletedAt) return;
    const session = typeof this.$session === 'function' ? this.$session() : null;
    await adjustOnHand({
      branch: this.branch,
      produceName: this.produceName,
      produceType: this.produceType,
      deltaKg: -direction * Number(this.tonnageKg || 0),
      session
    });
  });
};

const listStockBalances = (filter = {}) => StockBalance.find(filter).lean();

const syncBalancePrices = (filter, priceUgx, session) => {
  if (mongoose.connection.readyState !== 1) return;
  return StockBalance.updateMany(
    filter,
    { $set: { sellingPrice: priceUgx } },
    session ? { session } : undefined
  );
};

const groupedMovements = async (modelName, includePrice) => {
  const group = {
    _id: {
      produceName: { $ifNull: ['$produceName', ''] },
      produceType: { $ifNull: ['$produceType', ''] },
      branch: '$branch'
    },
    tonnageKg: { $sum: '$tonnageKg' }
  };
  if (includePrice) group.sellingPrice = { $last: '$sellingPrice' };
  return mongoose.model(modelName).aggregate([
    { $match: { deletedAt: null } },
    { $group: group }
  ]);
};

// Rebuild stored balances after a bulk load that bypasses document hooks.
const rebuildStockBalances = async () => writeExpectedBalances(await collectExpectedBalances());

const weightsMatch = (left, right) => Math.abs(Number(left || 0) - Number(right || 0)) < 0.001;

const balancesMatchMovements = (storedRows, expectedRows) => {
  if (storedRows.length !== expectedRows.length) return false;
  const expectedByKey = new Map(expectedRows.map((row) => [bucketKey(row), row]));
  for (const row of storedRows) {
    const identity = canonicalBucket(row);
    const expected = expectedByKey.get(bucketKey(identity));
    if (!expected) return false;
    if (
      row.branch !== expected.branch ||
      row.produceName !== expected.produceName ||
      row.produceType !== expected.produceType ||
      !weightsMatch(row.onHandKg, expected.onHandKg)
    ) {
      return false;
    }
    expectedByKey.delete(bucketKey(identity));
  }
  return expectedByKey.size === 0;
};

let reconcileQueue = Promise.resolve();

// Rebuild stored balances when they disagree with procurement and sales documents.
const reconcileStockBalances = () => {
  const run = reconcileQueue.then(async () => {
    if (mongoose.connection.readyState !== 1) return false;
    const expected = await collectExpectedBalances();
    const stored = await StockBalance.find({}).lean();
    if (balancesMatchMovements(stored, expected)) return false;
    await writeExpectedBalances(expected);
    return true;
  });
  reconcileQueue = run.catch(() => false);
  return run;
};

const collectExpectedBalances = async () => {
  const [procurements, sales, creditSales] = await Promise.all([
    groupedMovements('Procurement', true),
    groupedMovements('Sale', false),
    groupedMovements('CreditSale', false)
  ]);
  const buckets = new Map();
  const apply = (row, sign, keepPrice) => {
    const id = row?._id || {};
    const identity = canonicalBucket({
      branch: id.branch,
      produceName: id.produceName,
      produceType: id.produceType
    });
    if (!identity.branch || !identity.produceName || !identity.produceType) return;
    const key = bucketKey(identity);
    const bucket = buckets.get(key) || { ...identity, onHandKg: 0, sellingPrice: 0 };
    bucket.onHandKg += sign * Number(row.tonnageKg || 0);
    if (keepPrice && Number(row.sellingPrice) > 0) bucket.sellingPrice = Number(row.sellingPrice);
    buckets.set(key, bucket);
  };
  procurements.forEach((row) => apply(row, 1, true));
  sales.forEach((row) => apply(row, -1, false));
  creditSales.forEach((row) => apply(row, -1, false));
  return [...buckets.values()];
};

const writeExpectedBalances = async (expected) => {
  await StockBalance.deleteMany({});
  if (expected.length > 0) {
    await StockBalance.insertMany(expected);
  }
  return expected.length;
};

export {
  adjustOnHand,
  listStockBalances,
  rebuildStockBalances,
  reconcileStockBalances,
  syncBalancePrices,
  trackStockMovement
};
