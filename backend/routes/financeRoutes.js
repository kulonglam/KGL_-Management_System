import express from 'express';
import { query } from 'express-validator';
import {
  getTaxConfigHandler,
  updateTaxConfigHandler,
  listInvoicesHandler,
  getInvoiceHandler,
  getInvoiceDocumentHandler,
  issueInvoiceForSaleHandler,
  openCashUpHandler,
  listCashUpsHandler,
  closeCashUpHandler,
  glExportHandler,
  listGlMappingsHandler,
  getRetentionHandler,
  updateRetentionHandler,
  runRetentionHandler,
  auditPackHandler
} from '../controllers/financeController.js';
import { protect, authorize } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import {
  paginationValidation,
  mongoIdParamValidation,
  taxConfigUpdateValidation,
  cashUpOpenValidation,
  cashUpCloseValidation,
  retentionUpdateValidation,
  glExportQueryValidation,
  writeOffDecisionValidation,
  periodLockValidation,
  statementQueryValidation,
  statementEmailValidation
} from '../validators/requestValidators.js';
import {
  approveWriteOffHandler,
  emailStatementHandler,
  exportBuyerDataHandler,
  exportUserDataHandler,
  getStatementHandler,
  listPeriodLocksHandler,
  listWriteOffsHandler,
  rejectWriteOffHandler,
  setPeriodLockHandler
} from '../controllers/financeControlsController.js';

const router = express.Router();

router.get('/tax-config', protect, authorize('director', 'manager'), getTaxConfigHandler);
router.put(
  '/tax-config',
  protect,
  authorize('director'),
  writeLimiter,
  taxConfigUpdateValidation,
  validateRequest,
  updateTaxConfigHandler
);

router.get(
  '/invoices',
  protect,
  authorize('director', 'manager', 'sales_agent'),
  paginationValidation,
  validateRequest,
  listInvoicesHandler
);
router.get(
  '/invoices/:id',
  protect,
  authorize('director', 'manager', 'sales_agent'),
  mongoIdParamValidation,
  validateRequest,
  getInvoiceHandler
);
router.get(
  '/invoices/:id/document',
  protect,
  authorize('director', 'manager', 'sales_agent'),
  mongoIdParamValidation,
  query('format').optional().isIn(['html', 'pdf']),
  validateRequest,
  getInvoiceDocumentHandler
);
router.post(
  '/invoices/from-sale/:saleId',
  protect,
  authorize('director', 'manager', 'sales_agent'),
  writeLimiter,
  issueInvoiceForSaleHandler
);

router.get('/cash-up', protect, authorize('director', 'manager'), listCashUpsHandler);
router.post(
  '/cash-up/open',
  protect,
  authorize('director', 'manager'),
  writeLimiter,
  cashUpOpenValidation,
  validateRequest,
  openCashUpHandler
);
router.post(
  '/cash-up/:id/close',
  protect,
  authorize('director', 'manager'),
  writeLimiter,
  cashUpCloseValidation,
  validateRequest,
  closeCashUpHandler
);

router.get(
  '/gl-export',
  protect,
  authorize('director', 'manager'),
  glExportQueryValidation,
  validateRequest,
  glExportHandler
);
router.get('/gl-mappings', protect, authorize('director', 'manager'), listGlMappingsHandler);

router.get('/retention', protect, authorize('director'), getRetentionHandler);
router.put(
  '/retention',
  protect,
  authorize('director'),
  writeLimiter,
  retentionUpdateValidation,
  validateRequest,
  updateRetentionHandler
);
router.post('/retention/run', protect, authorize('director'), writeLimiter, runRetentionHandler);
router.get('/retention/audit-pack', protect, authorize('director', 'manager'), auditPackHandler);

router.get(
  '/write-offs',
  protect,
  authorize('director', 'manager'),
  query('status').optional().isIn(['pending', 'approved', 'rejected']),
  validateRequest,
  listWriteOffsHandler
);
router.post(
  '/write-offs/:id/approve',
  protect,
  authorize('director'),
  writeLimiter,
  writeOffDecisionValidation,
  validateRequest,
  approveWriteOffHandler
);
router.post(
  '/write-offs/:id/reject',
  protect,
  authorize('director'),
  writeLimiter,
  writeOffDecisionValidation,
  validateRequest,
  rejectWriteOffHandler
);

router.get('/period-locks', protect, authorize('director', 'manager'), listPeriodLocksHandler);
router.put(
  '/period-locks',
  protect,
  authorize('director'),
  writeLimiter,
  periodLockValidation,
  validateRequest,
  setPeriodLockHandler
);

router.get(
  '/statements/:id',
  protect,
  authorize('director', 'manager'),
  statementQueryValidation,
  validateRequest,
  getStatementHandler
);
router.post(
  '/statements/:id/email',
  protect,
  authorize('director', 'manager'),
  writeLimiter,
  statementEmailValidation,
  validateRequest,
  emailStatementHandler
);

router.get(
  '/personal-data/trusted-buyers/:id',
  protect,
  authorize('director'),
  mongoIdParamValidation,
  validateRequest,
  exportBuyerDataHandler
);
router.get(
  '/personal-data/users/:id',
  protect,
  authorize('director'),
  mongoIdParamValidation,
  validateRequest,
  exportUserDataHandler
);

export default router;
