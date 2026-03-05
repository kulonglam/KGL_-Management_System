/**
 * Coordinates request handling: reads HTTP input, invokes domain services, and returns response payloads.
 * File: backend/controllers/inventoryController.js
 */

import { getInventoryOverview, getStockForProduce } from '../services/inventoryService.js';

// GET /api/inventory: return inventory overview (stock buckets, alerts, and summary statistics).
const getInventory = async (req, res) => {
  try {
    const filter = {};

    // Filter by branch for manager and sales agent
    if (req.user.role !== 'director') {
      filter.branch = req.user.branch;
    }

    const overview = await getInventoryOverview(filter);
    res.json(overview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/inventory/check-stock: evaluate availability for a requested produce + tonnage.
const checkStock = async (req, res) => {
  try {
    const { produceName, tonnage } = req.body;
    const branch = req.user.branch;
    const requestedTonnage = Number(tonnage);
    const totalStock = await getStockForProduce(branch, produceName);

    res.json({
      available: totalStock >= requestedTonnage,
      currentStock: totalStock
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getInventory, checkStock };





