/**
 * Declares endpoint URLs and wires middleware/validators/controllers for this API surface.
 * File: backend/routes/priceRoutes.js
 */

import express from 'express';
// Configure router.
const router = express.Router();
import {
  getPrices,
  getPriceById,
  createPrice,
  updatePrice,
  deletePrice
} from '../controllers/priceController.js';
import { protect, authorize } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import {
  priceCreateValidation,
  priceUpdateValidation,
  mongoIdParamValidation
} from '../validators/requestValidators.js';

// GET /api/prices: list branch managed prices with inferred/unset rows.
router.get('/', protect, authorize('manager'), getPrices);

// POST /api/prices: create one branch managed price rule.
router.post(
  '/',
  protect,
  authorize('manager'),
  writeLimiter,
  priceCreateValidation,
  validateRequest,
  createPrice
);

// GET /api/prices/:id: return one price rule by id after access checks.
router.get('/:id', protect, authorize('manager'), mongoIdParamValidation, validateRequest, getPriceById);

// PUT /api/prices/:id: update one price rule and propagate the new selling price.
router.put(
  '/:id',
  protect,
  authorize('manager'),
  writeLimiter,
  priceUpdateValidation,
  validateRequest,
  updatePrice
);

// DELETE /api/prices/:id: remove one branch price rule.
router.delete(
  '/:id',
  protect,
  authorize('manager'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  deletePrice
);

export default router;
