// Declares endpoint URLs and wires middleware/validators/controllers for this API surface.

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

// GET /api/credit-sales: list branch credit sales visible to manager/sales agent roles.
router.get(
  '/',
  protect,
  authorize('manager', 'sales_agent'),
  paginationValidation,
  validateRequest,
  getAllCreditSales
);
// POST /api/credit-sales: create a new credit-sale dispatch record.
router.post(
  '/',
  protect,
  authorize('manager', 'sales_agent'),
  writeLimiter,
  creditSaleCreateValidation,
  validateRequest,
  createCreditSale
);

// PUT /api/credit-sales/:id/payment: set payment status for one credit sale (manager only).
router.put('/:id/payment', protect, authorize('manager'),
  writeLimiter,
  creditPaymentStatusValidation,
  validateRequest,
  updatePaymentStatus
);
// POST /api/credit-sales/:id/repay: record a repayment installment (manager only).
router.post('/:id/repay', protect, authorize('manager'),
  writeLimiter,
  creditRepaymentValidation,
  validateRequest,
  repayCreditSale
);
// DELETE /api/credit-sales/:id: delete one credit sale when business rules allow it.
router.delete('/:id', protect, authorize('manager'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  deleteCreditSale
);

// PUT /api/credit-sales/:id: update editable correction fields on one credit sale.
router.put('/:id', protect, authorize('manager'), writeLimiter,
  creditSaleUpdateValidation,
  validateRequest,
  updateCreditSale
);

export default router;