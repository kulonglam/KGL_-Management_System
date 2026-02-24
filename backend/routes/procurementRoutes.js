import express from 'express';
const router = express.Router();
import {
  getAllProcurement,
  createProcurement,
  getProcurementById,
  updateProcurement,
  deleteProcurement
} from '../controllers/procurementController.js';
import { protect, authorize } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import {
  paginationValidation,
  mongoIdParamValidation,
  procurementCreateValidation,
  procurementUpdateValidation
} from '../validators/requestValidators.js';

router.route('/')
  .get(protect, authorize('manager'), paginationValidation, validateRequest, getAllProcurement)
  .post(protect, authorize('manager'), writeLimiter, procurementCreateValidation, validateRequest, createProcurement);

router.route('/:id')
  .get(protect, authorize('manager'), mongoIdParamValidation, validateRequest, getProcurementById)
  .put(protect, authorize('manager'), writeLimiter, procurementUpdateValidation, validateRequest, updateProcurement)
  .delete(protect, authorize('manager'), writeLimiter, mongoIdParamValidation, validateRequest, deleteProcurement);

export default router;
