/**
 * Declares endpoint URLs and wires middleware/validators/controllers for this API surface.
 * File: backend/routes/inventoryRoutes.js
 */

import express from 'express';
// Configure router.
const router = express.Router();
import { getInventory } from '../controllers/inventoryController.js';
import { protect, authorize } from '../middleware/auth.js';

// GET /api/inventory: return stock snapshot and aggregate inventory statistics.
router.get('/', protect, authorize('manager', 'sales_agent'), getInventory);

export default router;
