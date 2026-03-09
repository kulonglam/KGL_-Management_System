// Coordinates request handling: reads HTTP input, invokes domain services, and returns response payloads.

import { getInventoryOverview } from '../services/inventoryService.js';

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

export { getInventory };





