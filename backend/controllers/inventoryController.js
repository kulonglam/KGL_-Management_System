import { getInventoryOverview, getStockForProduce } from '../services/inventoryService.js';

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

// Check stock availability
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
