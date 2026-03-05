/**
 * Declares endpoint URLs and wires middleware/validators/controllers for this API surface.
 * File: backend/routes/salesRoutes.js
 */

import express from 'express';
// Configure router.
const router = express.Router();
import {
  getAllSales,
  createSale,
  getSalesAggregation,
  updateSale,
  deleteSale
} from '../controllers/salesController.js';
import { protect, authorize, authorizeDirectorOrban } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import {
  paginationValidation,
  saleCreateValidation,
  saleUpdateValidation,
  mongoIdParamValidation
} from '../validators/requestValidators.js';

// GET /api/sales: list branch sales visible to manager/sales agent roles.
router.get(
  '/',
  protect,
  authorize('manager', 'sales_agent'),
  paginationValidation,
  validateRequest,
  getAllSales
);
// POST /api/sales: create a new cash-sale transaction.
router.post(
  '/',
  protect,
  authorize('manager', 'sales_agent'),
  writeLimiter,
  saleCreateValidation,
  validateRequest,
  createSale
);

// GET /api/sales/aggregation: return cross-branch sales totals for director reporting.
router.get(
  '/aggregation',
  protect,
  authorize('director'),
  authorizeDirectorOrban,
  getSalesAggregation
);

// DELETE /api/sales/:id: delete one sale record (manager only).
router.delete(
  '/:id',
  protect,
  authorize('manager'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  deleteSale
);

// PUT /api/sales/:id: update one sale record correction (manager only).
router.put(
  '/:id',
  protect,
  authorize('manager'),
  writeLimiter,
  saleUpdateValidation,
  validateRequest,
  updateSale
);

export default router;





