import Procurement from '../models/Procurement.js';
import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';

const makeInventoryKey = (name, type, branch) => `${name}::${type}::${branch}`;

const findFallbackKey = (inventoryMap, produceName, branch) => {
  for (const [key, item] of inventoryMap.entries()) {
    if (item.produceName === produceName && item.branch === branch) {
      return key;
    }
  }
  return null;
};

const subtractFromInventoryMap = (inventoryMap, movement) => {
  const explicitType = movement.produceType;
  if (explicitType) {
    const key = makeInventoryKey(movement.produceName, explicitType, movement.branch);
    const item = inventoryMap.get(key);
    if (item) {
      item.totalTonnageKg -= movement.tonnageKg;
      return;
    }
  }

  // Fallback for old sale rows without produceType.
  const fallbackKey = findFallbackKey(inventoryMap, movement.produceName, movement.branch);
  if (!fallbackKey) return;
  inventoryMap.get(fallbackKey).totalTonnageKg -= movement.tonnageKg;
};

const buildInventoryMap = (procurements, sales, creditSales) => {
  const inventoryMap = new Map();

  // Add procurements
  procurements.forEach(item => {
    const key = makeInventoryKey(item.name, item.type, item.branch);

    if (inventoryMap.has(key)) {
      inventoryMap.get(key).totalTonnageKg += item.tonnageKg;
    } else {
      inventoryMap.set(key, {
        produceName: item.name,
        produceType: item.type,
        branch: item.branch,
        totalTonnageKg: item.tonnageKg,
        sellingPrice: item.sellingPrice
      });
    }
  });

  // Subtract cash sales
  sales.forEach(sale => {
    subtractFromInventoryMap(inventoryMap, sale);
  });

  // Subtract credit sales
  creditSales.forEach(cs => {
    subtractFromInventoryMap(inventoryMap, cs);
  });

  return inventoryMap;
};

const buildInventorySnapshot = (procurements, sales, creditSales) => {
  return Array.from(buildInventoryMap(procurements, sales, creditSales).values());
};

const calculateInventoryByFilter = async (filter = {}) => {
  const [procurements, sales, creditSales] = await Promise.all([
    Procurement.find(filter),
    Sale.find(filter),
    CreditSale.find(filter)
  ]);

  return buildInventorySnapshot(procurements, sales, creditSales);
};

const calculateInventoryByBranch = async (branch) => {
  const snapshot = await calculateInventoryByFilter({ branch });
  return snapshot.filter(item => item.totalTonnageKg > 0);
};

const getInventoryOverview = async (filter = {}) => {
  const snapshot = await calculateInventoryByFilter(filter);
  const inventory = snapshot.filter(item => item.totalTonnageKg > 0);
  const outOfStockItems = snapshot.filter(item => item.totalTonnageKg <= 0);
  const lowStockItems = inventory.filter(item => item.totalTonnageKg < 500);

  const totalValue = inventory.reduce(
    (sum, item) => sum + (item.totalTonnageKg * item.sellingPrice),
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

const getStockForProduce = async (branch, produceName) => {
  const snapshot = await calculateInventoryByFilter({ branch });
  return snapshot
    .filter(item => item.produceName === produceName)
    .reduce((sum, item) => sum + item.totalTonnageKg, 0);
};

export {
  buildInventorySnapshot,
  calculateInventoryByBranch,
  calculateInventoryByFilter,
  getInventoryOverview,
  getStockForProduce
};
