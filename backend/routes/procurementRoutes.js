// Declares endpoint URLs and wires middleware/validators/controllers for this API surface.
 
import express from 'express';
// Configure router.
const router = express.Router();
import {
  getAllProcurement,
  createProcurement,
  getProcurementById,
  updateProcurement,
  deleteProcurement,
  restoreProcurement
} from '../controllers/procurementController.js';
import { protect, authorize } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import {
  approveOrderHandler,
  createOrderHandler,
  listOrdersHandler,
  matchOrderHandler,
  receiveOrderHandler,
  receiveWithoutOrderHandler
} from '../controllers/enterpriseController.js';
import { body } from 'express-validator';
import {
  paginationValidation,
  mongoIdParamValidation,
  procurementCreateValidation,
  procurementUpdateValidation
} from '../validators/requestValidators.js';

router.post(
  '/receipts',
  protect,
  authorize('manager', 'director'),
  writeLimiter,
  [
    body('supplierId').isMongoId(),
    body('produceName').trim().notEmpty(),
    body('produceType').isIn(['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']),
    body('tonnageKg').isFloat({ gt: 0 }),
    body('unitCostUgx').isFloat({ min: 0 })
  ],
  validateRequest,
  receiveWithoutOrderHandler
);
router.get('/orders', protect, authorize('manager', 'director'), listOrdersHandler);
router.post('/orders', protect, authorize('manager', 'director'), writeLimiter, createOrderHandler);
router.post('/orders/:id/approve', protect, authorize('manager', 'director'), writeLimiter, mongoIdParamValidation, validateRequest, approveOrderHandler);
router.post('/orders/:id/receive', protect, authorize('manager', 'director'), writeLimiter, mongoIdParamValidation, validateRequest, receiveOrderHandler);
router.get('/orders/:id/match', protect, authorize('manager', 'director'), mongoIdParamValidation, validateRequest, matchOrderHandler);

// GET /api/procurement: list branch procurement records with pagination.
router.get('/', protect, authorize('manager'), paginationValidation, validateRequest, getAllProcurement);
// POST /api/procurement: create a new procurement entry.
router.post('/', protect, authorize('manager'),
  writeLimiter,
  procurementCreateValidation,
  validateRequest,
  createProcurement
);

router.post(
  '/:id/restore',
  protect,
  authorize('manager'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  restoreProcurement
);

// GET /api/procurement/:id: return one procurement record by id.
router.get('/:id', protect, authorize('manager'), mongoIdParamValidation, validateRequest, getProcurementById);
// PUT /api/procurement/:id: update one procurement record.
router.put('/:id', protect, authorize('manager'), writeLimiter,
  procurementUpdateValidation,
  validateRequest,
  updateProcurement
);
// DELETE /api/procurement/:id: delete one procurement record.
router.delete('/:id', protect, authorize('manager'), writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  deleteProcurement
);

export default router;