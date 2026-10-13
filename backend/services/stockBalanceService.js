import mongoose from 'mongoose';
import StockBalance from '../models/StockBalance.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

const sameBucket = (left, right) =>
  left?.branch === right?.branch &&
  normalizeProduceName(left?.produceName || '') === normalizeProduceName(right?.produceName || '') &&
  normalizeProduceType(left?.produceType || '') === normalizeProduceType(right?.produceType || '');

const adjustOnHand = async ({ branch, produceName, produceType, deltaKg = 0, sellingPrice, session }) => {
  const name = normalizeProduceName(produceName || '');
  const type = normalizeProduceType(produceType || '');
  const delta = Number(deltaKg) || 0;
  if (!branch || !name || !type) return;

  const update = {};
  if (delta !== 0) update.$inc = { onHandKg: delta };
  if (Number.isFinite(Number(sellingPrice)) && Number(sellingPrice) > 0) {
    update.$set = { sellingPrice: Number(sellingPrice) };
  }
  if (!update.$inc && !update.$set) return;

  await StockBalance.updateOne(
    { branch, produceName: name, produceType: type },
    update,
    { upsert: true, setDefaultsOnInsert: true, ...(session ? { session } : {}) }
  );
};

const currentStock = (doc) => ({
  branch: doc.branch,
  produceName: doc.produceName,
  produceType: doc.produceType,
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
      await adjustOnHand({ ...before, deltaKg: -direction * before.tonnageKg, session });
      await adjustOnHand({ ...after, deltaKg: direction * after.tonnageKg, sellingPrice: price, session });
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
const rebuildStockBalances = async () => {
  const [procurements, sales, creditSales] = await Promise.all([
    groupedMovements('Procurement', true),
    groupedMovements('Sale', false),
    groupedMovements('CreditSale', false)
  ]);
  const buckets = new Map();
  const apply = (row, sign, keepPrice) => {
    const id = row?._id || {};
    if (!id.branch || !id.produceName || !id.produceType) return;
    const key = `${id.branch}::${id.produceName}::${id.produceType}`;
    const bucket = buckets.get(key) || {
      branch: id.branch,
      produceName: id.produceName,
      produceType: id.produceType,
      onHandKg: 0,
      sellingPrice: 0
    };
    bucket.onHandKg += sign * Number(row.tonnageKg || 0);
    if (keepPrice && Number(row.sellingPrice) > 0) bucket.sellingPrice = Number(row.sellingPrice);
    buckets.set(key, bucket);
  };

  procurements.forEach((row) => apply(row, 1, true));
  sales.forEach((row) => apply(row, -1, false));
  creditSales.forEach((row) => apply(row, -1, false));

  await StockBalance.deleteMany({});
  const docs = [...buckets.values()];
  if (docs.length > 0) {
    await StockBalance.insertMany(docs);
  }
  return docs.length;
};

export {
  adjustOnHand,
  listStockBalances,
  rebuildStockBalances,
  syncBalancePrices,
  trackStockMovement
};
