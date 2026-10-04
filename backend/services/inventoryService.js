/**
 * Builds inventory snapshots from procurement and sales movements, including branch-level
 * totals, low-stock/out-of-stock views, and produce-level stock lookups.
  */

import Procurement from '../models/Procurement.js';
import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';
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

// Query movement collections by filter and return computed inventory snapshot.
const calculateInventoryByFilter = async (filter = {}) => {
  const [procurements, sales, creditSales] = await Promise.all([
    Procurement.find(filter),
    Sale.find(filter),
    CreditSale.find(filter)
  ]);

  return buildInventorySnapshot(procurements, sales, creditSales);
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
    (sum, item) => sum + item.totalTonnageKg * item.sellingPrice,
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

export {
  LOW_STOCK_THRESHOLD_KG,
  assertProcurementKeepsStockNonNegative,
  buildInventorySnapshot,
  calculateInventoryByBranch,
  calculateInventoryByFilter,
  findInventoryBucket,
  getBucketTonnage,
  getInventoryOverview
};