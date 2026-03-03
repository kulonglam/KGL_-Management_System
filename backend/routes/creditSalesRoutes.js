import express from 'express';
// Configure router.
const router = express.Router();
import {
  getAllCreditSales,
  createCreditSale,
  updateCreditSale,
  updatePaymentStatus,
  deleteCreditSale,
  repayCreditSale
} from '../controllers/creditSalesController.js';
import { protect, authorize } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import {
  paginationValidation,
  creditSaleCreateValidation,
  creditSaleUpdateValidation,
  creditPaymentStatusValidation,
  creditRepaymentValidation,
  mongoIdParamValidation
} from '../validators/requestValidators.js';

router
  .route('/')
  .get(
    protect,
    authorize('manager', 'sales_agent'),
    paginationValidation,
    validateRequest,
    getAllCreditSales
  )
  .post(
    protect,
    authorize('manager', 'sales_agent'),
    writeLimiter,
    creditSaleCreateValidation,
    validateRequest,
    createCreditSale
  );

router.put(
  '/:id/payment',
  protect,
  authorize('manager'),
  writeLimiter,
  creditPaymentStatusValidation,
  validateRequest,
  updatePaymentStatus
);
router.post(
  '/:id/repay',
  protect,
  authorize('manager'),
  writeLimiter,
  creditRepaymentValidation,
  validateRequest,
  repayCreditSale
);
router.delete(
  '/:id',
  protect,
  authorize('manager'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  deleteCreditSale
);

router.put(
  '/:id',
  protect,
  authorize('manager'),
  writeLimiter,
  creditSaleUpdateValidation,
  validateRequest,
  updateCreditSale
);

export default router;
