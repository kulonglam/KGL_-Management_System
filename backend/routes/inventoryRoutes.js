/**
 * Declares endpoint URLs and wires middleware/validators/controllers for this API surface.
 * File: backend/routes/inventoryRoutes.js
 */

import express from 'express';
// Configure router.
const router = express.Router();
import { getInventory, checkStock } from '../controllers/inventoryController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { stockCheckValidation } from '../validators/requestValidators.js';

// GET /api/inventory: return stock snapshot and aggregate inventory statistics.
router.get('/', protect, authorize('manager', 'sales_agent'), getInventory);

// POST /api/inventory/check-stock: validate requested produce tonnage against available stock.
router.post('/check-stock', protect, authorize('manager', 'sales_agent'),
  stockCheckValidation,
  validateRequest,
  checkStock
);

export default router;
