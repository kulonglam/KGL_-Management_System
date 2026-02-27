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

router
  .route('/')
  .get(
    protect,
    authorize('manager', 'sales_agent'),
    paginationValidation,
    validateRequest,
    getTrustedBuyers
  )
  .post(
    protect,
    authorize('manager'),
    writeLimiter,
    trustedBuyerCreateValidation,
    validateRequest,
    createTrustedBuyer
  );

router
  .route('/:id')
  .put(
    protect,
    authorize('manager'),
    writeLimiter,
    trustedBuyerUpdateValidation,
    validateRequest,
    updateTrustedBuyer
  )
  .delete(
    protect,
    authorize('manager'),
    writeLimiter,
    mongoIdParamValidation,
    validateRequest,
    deleteTrustedBuyer
  );

export default router;
