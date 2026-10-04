import express from 'express';
import { listAuditLogs } from '../controllers/auditController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { paginationValidation } from '../validators/requestValidators.js';

const router = express.Router();
router.get(
  '/',
  protect,
  authorize('manager', 'director'),
  paginationValidation,
  validateRequest,
  listAuditLogs
);

export default router;
