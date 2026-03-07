/**
 * Persists and retrieves immutable price change history.
 * File: backend/services/priceHistoryService.js
 */

import PriceHistory from '../models/PriceHistory.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

const normalizeHistorySnapshot = (snapshot) => {
  if (!snapshot) {
    return {
      produceName: undefined,
      produceType: undefined,
      priceUgx: undefined
    };
  }

  return {
    produceName: snapshot.produceName ? normalizeProduceName(snapshot.produceName) : undefined,
    produceType: snapshot.produceType ? normalizeProduceType(snapshot.produceType) : undefined,
    priceUgx: snapshot.priceUgx !== undefined ? Number(snapshot.priceUgx) : undefined
  };
};

// Write one immutable audit entry for a price change.
const recordPriceHistory = async ({
  branch,
  priceSettingId,
  action,
  previousState,
  nextState,
  changedBy
}) => {
  const previous = normalizeHistorySnapshot(previousState);
  const next = normalizeHistorySnapshot(nextState);

  await PriceHistory.create({
    branch,
    priceSettingId,
    action,
    previousProduceName: previous.produceName,
    previousProduceType: previous.produceType,
    previousPriceUgx: previous.priceUgx,
    nextProduceName: next.produceName,
    nextProduceType: next.produceType,
    nextPriceUgx: next.priceUgx,
    changedBy
  });
};

// Read history for one managed price row with actor details attached.
const getPriceHistoryEntries = async ({ branch, priceSettingId }) => {
  return PriceHistory.find({ branch, priceSettingId })
    .populate('changedBy', 'name username role')
    .sort({ createdAt: -1 })
    .lean();
};

export { getPriceHistoryEntries, recordPriceHistory };
