import express from 'express';
import { body, query } from 'express-validator';
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
import {
  agingHandler,
  importBankHandler,
  listBankHandler,
  matchBankHandler,
  postJournalHandler,
  trialBalanceHandler,
  listRatesHandler,
  quoteRateHandler,
  setRateHandler
} from '../controllers/enterpriseController.js';

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
router.get('/aging', protect, authorize('director', 'manager'), agingHandler);
router.post('/gl-journal', protect, authorize('director'), writeLimiter, postJournalHandler);
router.get('/trial-balance', protect, authorize('director', 'manager'), trialBalanceHandler);
router.get('/bank-lines', protect, authorize('director', 'manager'), listBankHandler);
router.post('/bank-lines', protect, authorize('director', 'manager'), writeLimiter, importBankHandler);
router.post('/bank-lines/:id/match', protect, authorize('director', 'manager'), writeLimiter, mongoIdParamValidation, validateRequest, matchBankHandler);

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

router.get('/exchange-rates', protect, authorize('director', 'manager'), listRatesHandler);
router.get('/exchange-rates/quote', protect, authorize('director', 'manager', 'sales_agent'), quoteRateHandler);
router.post(
  '/exchange-rates',
  protect,
  authorize('director'),
  writeLimiter,
  body('code').trim().isLength({ min: 3, max: 3 }).withMessage('code is required'),
  body('rateToUgx').isFloat({ gt: 0 }).withMessage('rateToUgx must be greater than zero'),
  body('effectiveOn').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  validateRequest,
  setRateHandler
);

export default router;
