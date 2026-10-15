import express from 'express';
import { query } from 'express-validator';
import {
  listMovements,
  listTransfers,
  createTransferHandler,
  shipTransferHandler,
  receiveTransferHandler,
  cancelTransferHandler,
  listAdjustments,
  createAdjustmentHandler,
  approveAdjustmentHandler,
  rejectAdjustmentHandler,
  listStocktakes,
  getStocktake,
  getStocktakeCountSheet,
  createStocktakeHandler,
  updateStocktakeHandler,
  postStocktakeHandler
} from '../controllers/inventoryOpsController.js';
import { protect, authorize } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import {
  paginationValidation,
  mongoIdParamValidation,
  transferCreateValidation,
  adjustmentCreateValidation,
  stocktakeUpdateValidation
} from '../validators/requestValidators.js';

const router = express.Router();

router.get(
  '/movements',
  protect,
  authorize('manager', 'director', 'sales_agent'),
  paginationValidation,
  validateRequest,
  listMovements
);

router.get(
  '/transfers',
  protect,
  authorize('manager', 'director'),
  paginationValidation,
  validateRequest,
  listTransfers
);
router.post(
  '/transfers',
  protect,
  authorize('manager', 'director'),
  writeLimiter,
  transferCreateValidation,
  validateRequest,
  createTransferHandler
);
router.post(
  '/transfers/:id/ship',
  protect,
  authorize('manager', 'director'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  shipTransferHandler
);
router.post(
  '/transfers/:id/receive',
  protect,
  authorize('manager', 'director'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  receiveTransferHandler
);
router.post(
  '/transfers/:id/cancel',
  protect,
  authorize('manager', 'director'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  cancelTransferHandler
);

router.get(
  '/adjustments',
  protect,
  authorize('manager', 'director'),
  paginationValidation,
  validateRequest,
  listAdjustments
);
router.post(
  '/adjustments',
  protect,
  authorize('manager', 'director'),
  writeLimiter,
  adjustmentCreateValidation,
  validateRequest,
  createAdjustmentHandler
);
router.post(
  '/adjustments/:id/approve',
  protect,
  authorize('manager', 'director'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  approveAdjustmentHandler
);
router.post(
  '/adjustments/:id/reject',
  protect,
  authorize('manager', 'director'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  rejectAdjustmentHandler
);

router.get('/stocktakes', protect, authorize('manager', 'director'), listStocktakes);
router.post('/stocktakes', protect, authorize('manager', 'director'), writeLimiter, createStocktakeHandler);
router.get(
  '/stocktakes/:id',
  protect,
  authorize('manager', 'director'),
  mongoIdParamValidation,
  validateRequest,
  getStocktake
);
router.get(
  '/stocktakes/:id/count-sheet',
  protect,
  authorize('manager', 'director'),
  mongoIdParamValidation,
  query('blind').optional().isIn(['true', 'false']),
  validateRequest,
  getStocktakeCountSheet
);
router.put(
  '/stocktakes/:id',
  protect,
  authorize('manager', 'director'),
  writeLimiter,
  stocktakeUpdateValidation,
  validateRequest,
  updateStocktakeHandler
);
router.post(
  '/stocktakes/:id/post',
  protect,
  authorize('manager', 'director'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  postStocktakeHandler
);

export default router;
