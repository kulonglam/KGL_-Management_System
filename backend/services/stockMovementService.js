import StockMovement from '../models/StockMovement.js';
import { adjustOnHand } from './stockBalanceService.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';
const appendStockMovement = async (
  {
    type,
    branch,
    produceName,
    produceType,
    qtyKg,
    refType = '',
    refId = null,
    actor = null,
    note = '',
    reasonCode = '',
    applyBalance = true
  },
  session = null
) => {
  const qty = Number(qtyKg);
  if (!Number.isFinite(qty) || qty === 0) {
    const error = new Error('Movement quantity must be a non-zero number');
    error.statusCode = 400;
    throw error;
  }

  const payload = {
    type,
    branch,
    produceName: normalizeProduceName(produceName),
    produceType: normalizeProduceType(produceType),
    qtyKg: qty,
    refType,
    refId,
    actor,
    note: String(note || '').slice(0, 500),
    reasonCode: String(reasonCode || '')
  };

  let movement;
  if (session) {
    [movement] = await StockMovement.create([payload], { session });
  } else {
    movement = await StockMovement.create(payload);
  }

  if (applyBalance) {
    await adjustOnHand({
      branch: payload.branch,
      produceName: payload.produceName,
      produceType: payload.produceType,
      deltaKg: qty,
      session
    });
  }

  return movement;
};

const listStockMovements = async ({ filter = {}, pagination } = {}) => {
  const query = StockMovement.find(filter).sort({ createdAt: -1 }).lean();
  if (pagination?.enabled) {
    query.skip(pagination.skip).limit(pagination.limit);
  } else {
    query.limit(200);
  }
  return query;
};

const sumMovementsByBucket = async (branchFilter = {}) => {
  const match = {};
  if (branchFilter.branch) match.branch = branchFilter.branch;
  return StockMovement.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          branch: '$branch',
          produceName: '$produceName',
          produceType: '$produceType'
        },
        qtyKg: { $sum: '$qtyKg' }
      }
    }
  ]);
};

export { appendStockMovement, listStockMovements, sumMovementsByBucket };
