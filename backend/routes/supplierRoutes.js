import express from 'express';
import {
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  restoreSupplier
} from '../controllers/supplierController.js';
import { protect, authorize } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import {
  paginationValidation,
  mongoIdParamValidation,
  supplierCreateValidation,
  supplierUpdateValidation
} from '../validators/requestValidators.js';

const router = express.Router();

router.get(
  '/',
  protect,
  authorize('manager', 'director'),
  paginationValidation,
  validateRequest,
  listSuppliers
);

router.post(
  '/',
  protect,
  authorize('manager'),
  writeLimiter,
  supplierCreateValidation,
  validateRequest,
  createSupplier
);

router.put(
  '/:id',
  protect,
  authorize('manager'),
  writeLimiter,
  supplierUpdateValidation,
  validateRequest,
  updateSupplier
);

router.delete(
  '/:id',
  protect,
  authorize('manager'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  deleteSupplier
);

router.post(
  '/:id/restore',
  protect,
  authorize('manager'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  restoreSupplier
);

export default router;
