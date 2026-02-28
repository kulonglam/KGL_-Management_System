import Procurement from '../models/Procurement.js';
import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';
import {
  normalizeProduceName,
  normalizeProduceNameKey,
  normalizeProduceType
} from '../utils/produceNormalization.js';

// Handle resolve procurement name.
const resolveProcurementName = (item) => normalizeProduceName(item.produceName || item.name || '');

// Handle resolve procurement type.
const resolveProcurementType = (item) => normalizeProduceType(item.produceType || item.type || '');

// Handle make inventory key.
const makeInventoryKey = (produceName, produceType, branch) =>
  `${normalizeProduceNameKey(produceName)}::${normalizeProduceType(produceType)}::${branch}`;

// Handle find fallback key.
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

// Handle subtract from inventory map.
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

// Handle build inventory map.
const buildInventoryMap = (procurements, sales, creditSales) => {
  const inventoryMap = new Map();

  // Add procurements
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

  // Subtract cash sales
  sales.forEach((sale) => {
    subtractFromInventoryMap(inventoryMap, sale);
  });

  // Subtract credit sales
  creditSales.forEach((cs) => {
    subtractFromInventoryMap(inventoryMap, cs);
  });

  return inventoryMap;
};

// Handle build inventory snapshot.
const buildInventorySnapshot = (procurements, sales, creditSales) => {
  return Array.from(buildInventoryMap(procurements, sales, creditSales).values());
};

// Handle calculate inventory by filter.
const calculateInventoryByFilter = async (filter = {}) => {
  const [procurements, sales, creditSales] = await Promise.all([
    Procurement.find(filter),
    Sale.find(filter),
    CreditSale.find(filter)
  ]);

  return buildInventorySnapshot(procurements, sales, creditSales);
};

// Handle calculate inventory by branch.
const calculateInventoryByBranch = async (branch) => {
  const snapshot = await calculateInventoryByFilter({ branch });
  return snapshot.filter((item) => item.totalTonnageKg > 0);
};

// Retrieve inventory overview.
const getInventoryOverview = async (filter = {}) => {
  const snapshot = await calculateInventoryByFilter(filter);
  const inventory = snapshot.filter((item) => item.totalTonnageKg > 0);
  const outOfStockItems = snapshot.filter((item) => item.totalTonnageKg <= 0);
  const lowStockItems = inventory.filter((item) => item.totalTonnageKg < 500);

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

// Retrieve stock for produce.
const getStockForProduce = async (branch, produceName) => {
  const snapshot = await calculateInventoryByFilter({ branch });
  const requestedNameKey = normalizeProduceNameKey(produceName);
  return snapshot
    .filter((item) => normalizeProduceNameKey(item.produceName) === requestedNameKey)
    .reduce((sum, item) => sum + item.totalTonnageKg, 0);
};

export {
  buildInventorySnapshot,
  calculateInventoryByBranch,
  calculateInventoryByFilter,
  getInventoryOverview,
  getStockForProduce
};
