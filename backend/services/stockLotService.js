import StockLot from '../models/StockLot.js';
import StockBalance from '../models/StockBalance.js';
import { canonicalBucket } from './stockBalanceService.js';

const createServiceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const bucketFilter = (bucket) => ({
  branch: bucket.branch,
  produceName: bucket.produceName,
  produceType: bucket.produceType
});

const recordProcurementLot = async (procurement) => {
  const lotCode = String(procurement.lotCode || '').trim();
  if (!lotCode && !procurement.expiryDate) return null;
  const bucket = canonicalBucket(procurement);
  return StockLot.create({
    ...bucket,
    lotCode: lotCode || `LOT-${String(procurement._id).slice(-6)}`,
    expiryDate: procurement.expiryDate || null,
    qtyKg: Number(procurement.tonnageKg),
    procurement: procurement._id
  });
};

// When a bucket has lots, expired quantity cannot be sold. Unlotted weight stays sellable.
const assertLotAvailable = async ({ branch, produceName, produceType, qtyKg }) => {
  const bucket = canonicalBucket({ branch, produceName, produceType });
  const lots = await StockLot.find({ ...bucketFilter(bucket), qtyKg: { $gt: 0 } }).lean();
  if (lots.length === 0) return;
  const now = Date.now();
  const lotQty = lots.reduce((sum, lot) => sum + Number(lot.qtyKg || 0), 0);
  const unexpired = lots
    .filter((lot) => !lot.expiryDate || new Date(lot.expiryDate).getTime() >= now)
    .reduce((sum, lot) => sum + Number(lot.qtyKg || 0), 0);
  const balance = await StockBalance.findOne(bucketFilter(bucket)).lean();
  const onHand = Number(balance?.onHandKg || 0);
  const unlotted = Math.max(onHand - lotQty, 0);
  const sellable = unlotted + unexpired;
  if (Number(qtyKg) > sellable + 0.0001) {
    throw createServiceError(
      409,
      `Only ${sellable} kg of ${bucket.produceName} is sellable. The rest is in an expired lot.`
    );
  }
};

const allocateLots = async ({ branch, produceName, produceType, qtyKg }) => {
  const bucket = canonicalBucket({ branch, produceName, produceType });
  const lots = await StockLot.find({ ...bucketFilter(bucket), qtyKg: { $gt: 0 } }).sort({ expiryDate: 1, createdAt: 1 });
  if (lots.length === 0) return;
  const now = Date.now();
  let remaining = Number(qtyKg);
  const unexpired = lots.filter((lot) => !lot.expiryDate || new Date(lot.expiryDate).getTime() >= now);
  for (const lot of unexpired) {
    if (remaining <= 0) break;
    const take = Math.min(lot.qtyKg, remaining);
    lot.qtyKg = Number(lot.qtyKg) - take;
    remaining -= take;
    await lot.save();
  }
};

export { allocateLots, assertLotAvailable, recordProcurementLot };
