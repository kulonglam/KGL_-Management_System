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

router
  .route('/')
  .get(protect, authorize('manager'), getPrices)
  .post(
    protect,
    authorize('manager'),
    writeLimiter,
    priceCreateValidation,
    validateRequest,
    createPrice
  );

router
  .route('/:id')
  .get(protect, authorize('manager'), mongoIdParamValidation, validateRequest, getPriceById)
  .put(
    protect,
    authorize('manager'),
    writeLimiter,
    priceUpdateValidation,
    validateRequest,
    updatePrice
  )
  .delete(
    protect,
    authorize('manager'),
    writeLimiter,
    mongoIdParamValidation,
    validateRequest,
    deletePrice
  );

export default router;
