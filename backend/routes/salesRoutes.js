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

router
  .route('/')
  .get(
    protect,
    authorize('manager', 'sales_agent'),
    paginationValidation,
    validateRequest,
    getAllSales
  )
  .post(
    protect,
    authorize('manager', 'sales_agent'),
    writeLimiter,
    saleCreateValidation,
    validateRequest,
    createSale
  );

router.get(
  '/aggregation',
  protect,
  authorize('director'),
  authorizeDirectorOrban,
  getSalesAggregation
);

router.delete(
  '/:id',
  protect,
  authorize('manager'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  deleteSale
);

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
