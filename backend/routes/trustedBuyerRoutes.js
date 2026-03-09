// Declares endpoint URLs and wires middleware/validators/controllers for this API surface.
 import express from 'express';
// Configure router.
const router = express.Router();
import {
  getTrustedBuyers,
  createTrustedBuyer,
  updateTrustedBuyer,
  deleteTrustedBuyer
} from '../controllers/trustedBuyerController.js';
import { protect, authorize } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import {
  paginationValidation,
  trustedBuyerCreateValidation,
  trustedBuyerUpdateValidation,
  mongoIdParamValidation
} from '../validators/requestValidators.js';

// GET /api/trusted-buyers: list branch trusted buyers for credit-sale flows.
router.get(
  '/',
  protect,
  authorize('manager', 'sales_agent'),
  paginationValidation,
  validateRequest,
  getTrustedBuyers
);
// POST /api/trusted-buyers: create a new trusted buyer profile.
router.post(
  '/',
  protect,
  authorize('manager'),
  writeLimiter,
  trustedBuyerCreateValidation,
  validateRequest,
  createTrustedBuyer
);

// PUT /api/trusted-buyers/:id: update one trusted buyer profile.
router.put(
  '/:id',
  protect,
  authorize('manager'),
  writeLimiter,
  trustedBuyerUpdateValidation,
  validateRequest,
  updateTrustedBuyer
);
// DELETE /api/trusted-buyers/:id: delete one trusted buyer profile.
router.delete(
  '/:id',
  protect,
  authorize('manager'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  deleteTrustedBuyer
);

export default router;