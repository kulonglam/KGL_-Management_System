import express from 'express';
const router = express.Router();
import {
  getAllSales,
  createSale,
  getSalesAggregation,
  deleteSale
} from '../controllers/salesController.js';
import { protect, authorize, authorizeDirectorOrban } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import {
  paginationValidation,
  saleCreateValidation,
  mongoIdParamValidation
} from '../validators/requestValidators.js';

router.route('/')
  .get(protect, authorize('manager', 'sales_agent'), paginationValidation, validateRequest, getAllSales)
  .post(protect, authorize('manager', 'sales_agent'), writeLimiter, saleCreateValidation, validateRequest, createSale);

router.get('/aggregation', protect, authorize('director'), authorizeDirectorOrban, getSalesAggregation);

router.delete('/:id', protect, authorize('manager'), writeLimiter, mongoIdParamValidation, validateRequest, deleteSale);

export default router;
