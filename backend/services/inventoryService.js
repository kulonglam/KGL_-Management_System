/**
 * Builds inventory snapshots from procurement and sales movements, including branch-level
 * totals, low-stock/out-of-stock views, and produce-level stock lookups.
  */

import Procurement from '../models/Procurement.js';
import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';
import { roundUgx } from '../utils/money.js';
import {
  normalizeProduceName,
  normalizeProduceNameKey,
  normalizeProduceType
} from '../utils/produceNormalization.js';

const LOW_STOCK_THRESHOLD_KG = 500;

// Resolve canonical produce name from current or legacy procurement fields.
const resolveProcurementName = (item) => normalizeProduceName(item.produceName || item.name || '');

// Resolve canonical produce type from current or legacy procurement fields.
const resolveProcurementType = (item) => normalizeProduceType(item.produceType || item.type || '');

// Build a stable inventory-map key (produceName + produceType + branch).
const makeInventoryKey = (produceName, produceType, branch) =>
  `${normalizeProduceNameKey(produceName)}::${normalizeProduceType(produceType)}::${branch}`;

// Find best fallback inventory bucket for legacy movements missing explicit produceType.
const findFallbackKey = (inventoryMap, produceName, branch) => {
  let selectedKey = null;
  let highestTonnage = -Infinity;

  for (const [key, item] of inventoryMap.entries()) {
    if (
      normalizeProduceNameKey(item.produceName) === normalizeProduceNameKey(produceName) &&
      item.branch === branch
    ) {
      const tonnage = Number(item.totalTonnageKg || 0);
      if (tonnage > highestTonnage) {
        highestTonnage = tonnage;
        selectedKey = key;
      }
    }
  }

  return selectedKey;
};

// Subtract one movement (sale/credit sale) from its inventory bucket with legacy fallback support.
const subtractFromInventoryMap = (inventoryMap, movement) => {
  const explicitType = movement.produceType;
  const movementName = normalizeProduceName(movement.produceName || '');
  const movementType = normalizeProduceType(explicitType || '');
  if (explicitType) {
    const key = makeInventoryKey(movementName, movementType, movement.branch);
    const item = inventoryMap.get(key);
    if (item) {
      item.totalTonnageKg -= movement.tonnageKg;
      return;
    }
  }

  // Fallback for old sale rows without produceType.
  const fallbackKey = findFallbackKey(inventoryMap, movementName, movement.branch);
  if (!fallbackKey) return;
  inventoryMap.get(fallbackKey).totalTonnageKg -= movement.tonnageKg;
};

// Build mutable inventory map by adding procurements and subtracting all outbound movements.
const buildInventoryMap = (procurements, sales, creditSales) => {
  const inventoryMap = new Map();

  // Add inbound stock from procurements.
  procurements.forEach((item) => {
    const produceName = resolveProcurementName(item);
    const produceType = resolveProcurementType(item);
    if (!produceName || !produceType) return;

    const key = makeInventoryKey(produceName, produceType, item.branch);

    if (inventoryMap.has(key)) {
      inventoryMap.get(key).totalTonnageKg += item.tonnageKg;
    } else {
      inventoryMap.set(key, {
        produceName,
        produceType,
        branch: item.branch,
        totalTonnageKg: item.tonnageKg,
        sellingPrice: item.sellingPrice
      });
    }
  });

  // Subtract outbound stock from cash sales.
  sales.forEach((sale) => {
    subtractFromInventoryMap(inventoryMap, sale);
  });

  // Subtract outbound stock from credit sales.
  creditSales.forEach((cs) => {
    subtractFromInventoryMap(inventoryMap, cs);
  });

  return inventoryMap;
};

// Convert inventory map to snapshot array, preserving zero/negative rows for reporting.
const buildInventorySnapshot = (procurements, sales, creditSales) => {
  return Array.from(buildInventoryMap(procurements, sales, creditSales).values());
};

const toGroupedMovement = (row) => ({
  produceName: row?._id?.produceName || '',
  produceType: row?._id?.produceType || '',
  branch: row?._id?.branch,
  tonnageKg: Number(row?.tonnageKg || 0),
  sellingPrice: row?.sellingPrice
});

const groupPipeline = (filter, { includePrice = false } = {}) => {
  const pipeline = [];
  if (filter && Object.keys(filter).length > 0) {
    pipeline.push({ $match: filter });
  }
  if (includePrice) {
    pipeline.push({ $sort: { createdAt: 1, _id: 1 } });
  }
  const group = {
    _id: {
      produceName: { $ifNull: ['$produceName', { $ifNull: ['$name', ''] }] },
      produceType: { $ifNull: ['$produceType', { $ifNull: ['$type', ''] }] },
      branch: '$branch'
    },
    tonnageKg: { $sum: '$tonnageKg' }
  };
  if (includePrice) {
    group.sellingPrice = { $last: '$sellingPrice' };
  }
  pipeline.push({ $group: group });
  return pipeline;
};

// Aggregate each movement collection down to stock buckets instead of loading every document.
const calculateInventoryByFilter = async (filter = {}) => {
  const [procurements, sales, creditSales] = await Promise.all([
    Procurement.aggregate(groupPipeline(filter, { includePrice: true })),
    Sale.aggregate(groupPipeline(filter)),
    CreditSale.aggregate(groupPipeline(filter))
  ]);

  return buildInventorySnapshot(
    procurements.map(toGroupedMovement),
    sales.map(toGroupedMovement),
    creditSales.map(toGroupedMovement)
  );
};

// Return positive-stock inventory rows for one branch (used for sell/create operations).
const calculateInventoryByBranch = async (branch) => {
  const snapshot = await calculateInventoryByFilter({ branch });
  return snapshot.filter((item) => item.totalTonnageKg > 0);
};

// Build API-ready inventory overview (active stock, out-of-stock list, and summary metrics).
const getInventoryOverview = async (filter = {}) => {
  const snapshot = await calculateInventoryByFilter(filter);
  const inventory = snapshot.filter((item) => item.totalTonnageKg > 0);
  const outOfStockItems = snapshot.filter((item) => item.totalTonnageKg <= 0);
  const lowStockItems = inventory.filter((item) => item.totalTonnageKg < LOW_STOCK_THRESHOLD_KG);

  const totalValue = inventory.reduce(
    (sum, item) => sum + roundUgx(Number(item.totalTonnageKg || 0) * Number(item.sellingPrice || 0)),
    0
  );
  const totalWeight = inventory.reduce((sum, item) => sum + item.totalTonnageKg, 0);

  return {
    inventory,
    outOfStockItems,
    statistics: {
      totalItems: inventory.length,
      totalValue,
      totalWeight,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length
    }
  };
};

const findInventoryBucket = (snapshot, produceName, produceType, branch) =>
  snapshot.find(
    (entry) =>
      normalizeProduceNameKey(entry.produceName) === normalizeProduceNameKey(produceName) &&
      normalizeProduceType(entry.produceType) === normalizeProduceType(produceType) &&
      entry.branch === branch
  ) || null;

const getBucketTonnage = (snapshot, produceName, produceType, branch) =>
  Number(findInventoryBucket(snapshot, produceName, produceType, branch)?.totalTonnageKg || 0);

const createStockIntegrityError = (projectedTonnageKg) => {
  const error = new Error(
    `This procurement change would leave stock at ${projectedTonnageKg} kg. Reduce sales first or keep enough inbound tonnage.`
  );
  error.statusCode = 400;
  return error;
};

const assertProcurementKeepsStockNonNegative = ({
  snapshot,
  branch,
  previousProduceName,
  previousProduceType,
  previousTonnageKg = 0,
  nextProduceName,
  nextProduceType,
  nextTonnageKg = 0
}) => {
  const previousName = previousProduceName || nextProduceName;
  const previousType = previousProduceType || nextProduceType;
  const sameBucket =
    normalizeProduceNameKey(previousName) === normalizeProduceNameKey(nextProduceName || previousName) &&
    normalizeProduceType(previousType) === normalizeProduceType(nextProduceType || previousType);

  if (sameBucket) {
    const current = getBucketTonnage(snapshot, previousName, previousType, branch);
    const projected = current - Number(previousTonnageKg || 0) + Number(nextTonnageKg || 0);
    if (projected < 0) {
      throw createStockIntegrityError(projected);
    }
    return projected;
  }

  const previousProjected =
    getBucketTonnage(snapshot, previousName, previousType, branch) - Number(previousTonnageKg || 0);
  if (previousProjected < 0) {
    throw createStockIntegrityError(previousProjected);
  }

  return (
    getBucketTonnage(snapshot, nextProduceName, nextProduceType, branch) + Number(nextTonnageKg || 0)
  );
};

// Return movements that do not reduce any procurement bucket.
const findUnmatchedStockMovements = (procurements, movements) => {
  const inventoryMap = buildInventoryMap(procurements, [], []);
  const unmatched = [];

  for (const movement of movements) {
    const stockBefore = [...inventoryMap.values()].reduce(
      (sum, item) => sum + Number(item.totalTonnageKg || 0),
      0
    );
    subtractFromInventoryMap(inventoryMap, movement);
    const stockAfter = [...inventoryMap.values()].reduce(
      (sum, item) => sum + Number(item.totalTonnageKg || 0),
      0
    );
    if (stockAfter === stockBefore) {
      unmatched.push(movement);
    }
  }

  return unmatched;
};

export {
  LOW_STOCK_THRESHOLD_KG,
  assertProcurementKeepsStockNonNegative,
  buildInventorySnapshot,
  calculateInventoryByBranch,
  calculateInventoryByFilter,
  findUnmatchedStockMovements,
  getBucketTonnage,
  getInventoryOverview
};