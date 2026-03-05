/**
 * Declares endpoint URLs and wires middleware/validators/controllers for this API surface.
 * File: backend/routes/procurementRoutes.js
 */

import express from 'express';
// Configure router.
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

// GET /api/procurement: list branch procurement records with pagination.
router.get('/', protect, authorize('manager'), paginationValidation, validateRequest, getAllProcurement);
// POST /api/procurement: create a new procurement entry.
router.post('/', protect, authorize('manager'),
  writeLimiter,
  procurementCreateValidation,
  validateRequest,
  createProcurement
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