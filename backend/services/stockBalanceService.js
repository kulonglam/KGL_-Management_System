import mongoose from 'mongoose';
import StockBalance from '../models/StockBalance.js';
import StockMovement from '../models/StockMovement.js';
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

const writeDocumentLedger = async ({ kind, direction, before, after, documentId, session }) => {
  const refType = kind;
  const entries = [];

  if (!before) {
    if (!after.deletedAt && after.tonnageKg > 0) {
      entries.push({
        type: direction > 0 ? 'procurement_in' : kind === 'credit' ? 'credit_out' : 'sale_out',
        branch: after.branch,
        produceName: after.produceName,
        produceType: after.produceType,
        qtyKg: direction * after.tonnageKg,
        refType,
        refId: documentId
      });
    }
  } else if (!before.deletedAt && after.deletedAt && before.tonnageKg > 0) {
    entries.push({
      type: direction > 0 ? 'procurement_out' : 'void_in',
      branch: before.branch,
      produceName: before.produceName,
      produceType: before.produceType,
      qtyKg: -direction * before.tonnageKg,
      refType,
      refId: documentId
    });
  } else if (before.deletedAt && !after.deletedAt && after.tonnageKg > 0) {
    entries.push({
      type: direction > 0 ? 'procurement_in' : kind === 'credit' ? 'credit_out' : 'sale_out',
      branch: after.branch,
      produceName: after.produceName,
      produceType: after.produceType,
      qtyKg: direction * after.tonnageKg,
      refType,
      refId: documentId
    });
  } else if (!after.deletedAt && sameBucket(before, after)) {
    const delta = direction * (after.tonnageKg - before.tonnageKg);
    if (delta !== 0) {
      entries.push({
        type:
          direction > 0
            ? delta > 0
              ? 'procurement_in'
              : 'procurement_out'
            : kind === 'credit'
              ? 'credit_out'
              : 'sale_out',
        branch: after.branch,
        produceName: after.produceName,
        produceType: after.produceType,
        qtyKg: delta,
        refType,
        refId: documentId,
        note: 'Document tonnage correction'
      });
    }
  } else if (!after.deletedAt) {
    if (before.tonnageKg > 0) {
      entries.push({
        type: direction > 0 ? 'procurement_out' : 'void_in',
        branch: before.branch,
        produceName: before.produceName,
        produceType: before.produceType,
        qtyKg: -direction * before.tonnageKg,
        refType,
        refId: documentId,
        note: 'Bucket move (source)'
      });
    }
    if (after.tonnageKg > 0) {
      entries.push({
        type: direction > 0 ? 'procurement_in' : kind === 'credit' ? 'credit_out' : 'sale_out',
        branch: after.branch,
        produceName: after.produceName,
        produceType: after.produceType,
        qtyKg: direction * after.tonnageKg,
        refType,
        refId: documentId,
        note: 'Bucket move (target)'
      });
    }
  }

  for (const entry of entries) {
    if (!entry.qtyKg) continue;
    if (session) {
      await StockMovement.create([entry], { session });
    } else {
      await StockMovement.create(entry);
    }
  }
};

const adjustOnHand = async ({
  branch,
  produceName,
  produceType,
  deltaKg = 0,
  sellingPrice,
  unitCostUgx,
  session
}) => {
  const { branch: storedBranch, produceName: name, produceType: type } = canonicalBucket({
    branch,
    produceName,
    produceType
  });
  const delta = Number(deltaKg) || 0;
  if (!storedBranch || !name || !type) return;
  markBalancesDirty();

  const update = {};
  if (delta !== 0) update.$inc = { onHandKg: delta };
  if (Number.isFinite(Number(sellingPrice)) && Number(sellingPrice) > 0) {
    update.$set = { sellingPrice: Number(sellingPrice) };
  }
  const unitCost = Number(unitCostUgx);
  if (delta > 0 && unitCost > 0) {
    const filter = { branch: storedBranch, produceName: name, produceType: type };
    let currentQuery = StockBalance.findOne(filter).select('onHandKg averageCostUgx');
    if (session) currentQuery = currentQuery.session(session);
    const current = await currentQuery.lean();
    const oldQty = Math.max(0, Number(current?.onHandKg || 0));
    const oldAvg = Number(current?.averageCostUgx || 0);
    const newQty = oldQty + delta;
    const averageCostUgx = newQty > 0 ? Math.round((oldQty * oldAvg + delta * unitCost) / newQty) : 0;
    update.$set = { ...(update.$set || {}), averageCostUgx };
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
  costUgx: Number(doc.costUgx || 0),
  deletedAt: doc.deletedAt || null
});

// Keep one balance row per produce bucket. Procurement adds weight. Sales remove it.
// kind: 'procurement' | 'sale' | 'credit' — used for the immutable movement ledger.
const trackStockMovement = (schema, direction, kind = 'sale') => {
  schema.post('init', function rememberLoadedStock() {
    this.$locals.stockBefore = currentStock(this);
  });

  schema.post('save', async function applySavedMovement() {
    const before = this.$locals.stockBefore;
    const after = currentStock(this);
    const session = typeof this.$session === 'function' ? this.$session() : null;
    const price = direction > 0 ? after.sellingPrice : undefined;
    const unitCostUgx = direction > 0 && after.costUgx > 0 && after.tonnageKg > 0 ? after.costUgx / after.tonnageKg : undefined;

    if (!before) {
      if (!after.deletedAt) {
        await adjustOnHand({ ...after, deltaKg: direction * after.tonnageKg, sellingPrice: price, unitCostUgx, session });
      }
    } else if (!before.deletedAt && after.deletedAt) {
      await adjustOnHand({ ...before, deltaKg: -direction * before.tonnageKg, session });
    } else if (before.deletedAt && !after.deletedAt) {
      await adjustOnHand({ ...after, deltaKg: direction * after.tonnageKg, sellingPrice: price, unitCostUgx, session });
    } else if (!after.deletedAt && sameBucket(before, after)) {
      await adjustOnHand({
        ...after,
        deltaKg: direction * (after.tonnageKg - before.tonnageKg),
        sellingPrice: price,
        unitCostUgx,
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
          unitCostUgx,
          session
        });
      } else {
        await adjustOnHand({ ...beforeBucket, deltaKg: -direction * before.tonnageKg, session });
        await adjustOnHand({
          ...afterBucket,
          deltaKg: direction * after.tonnageKg,
          sellingPrice: price,
          unitCostUgx,
          session
        });
      }
    }

    try {
      await writeDocumentLedger({
        kind,
        direction,
        before,
        after,
        documentId: this._id,
        session
      });
    } catch (error) {
      // Ledger write must not block stock ops in degraded environments; balances already applied.
      if (process.env.NODE_ENV !== 'test') {
        console.warn('stock.ledger.write_failed', error.message);
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
    try {
      await writeDocumentLedger({
        kind,
        direction,
        before: currentStock(this),
        after: { ...currentStock(this), deletedAt: new Date(), tonnageKg: 0 },
        documentId: this._id,
        session
      });
    } catch {
      /* ignore ledger failure on hard delete path */
    }
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
    const seen = balanceGeneration;
    if (seen === reconciledGeneration) return false;
    const expected = await collectExpectedBalances();
    const stored = await StockBalance.find({}).lean();
    const matched = balancesMatchMovements(stored, expected);
    if (!matched) await writeExpectedBalances(expected);
    if (balanceGeneration === seen) reconciledGeneration = seen;
    return !matched;
  });
  reconcileQueue = run.catch(() => false);
  return run;
};

// Document hooks keep procurement/sale balances; ops ledger types are applied only via StockMovement.
const OPS_LEDGER_TYPES = ['transfer_out', 'transfer_in', 'adjustment', 'stocktake'];

const collectExpectedBalances = async () => {
  const [procurements, sales, creditSales, opsLedger] = await Promise.all([
    groupedMovements('Procurement', true),
    groupedMovements('Sale', false),
    groupedMovements('CreditSale', false),
    StockMovement.aggregate([
      { $match: { type: { $in: OPS_LEDGER_TYPES } } },
      {
        $group: {
          _id: {
            produceName: { $ifNull: ['$produceName', ''] },
            produceType: { $ifNull: ['$produceType', ''] },
            branch: '$branch'
          },
          tonnageKg: { $sum: '$qtyKg' }
        }
      }
    ])
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
  // qtyKg on ops movements is already signed (outbound negative).
  opsLedger.forEach((row) => apply(row, 1, false));
  if (mongoose.models.Procurement) {
    const costs = await mongoose.model('Procurement').aggregate([
      { $match: { deletedAt: null, tonnageKg: { $gt: 0 } } },
      {
        $group: {
          _id: {
            branch: '$branch',
            produceName: { $ifNull: ['$produceName', ''] },
            produceType: { $ifNull: ['$produceType', ''] }
          },
          costUgx: { $sum: '$costUgx' },
          tonnageKg: { $sum: '$tonnageKg' }
        }
      }
    ]);
    for (const row of costs) {
      const identity = canonicalBucket({
        branch: row._id.branch,
        produceName: row._id.produceName,
        produceType: row._id.produceType
      });
      const bucket = buckets.get(bucketKey(identity));
      if (bucket && row.tonnageKg > 0) bucket.averageCostUgx = Math.round(row.costUgx / row.tonnageKg);
    }
  }
  return [...buckets.values()];
};

const writeExpectedBalances = async (expected) => {
  await StockBalance.deleteMany({});
  if (expected.length > 0) {
    await StockBalance.insertMany(expected);
  }
  return expected.length;
};

let balanceGeneration = 0;
let reconciledGeneration = -1;

const markBalancesDirty = () => {
  balanceGeneration += 1;
};

export {
  adjustOnHand,
  canonicalBucket,
  listStockBalances,
  rebuildStockBalances,
  markBalancesDirty,
  reconcileStockBalances,
  syncBalancePrices,
  trackStockMovement
};
