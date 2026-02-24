import express from 'express';
import { getAuditLogs } from '../controllers/auditLogController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { paginationValidation } from '../validators/requestValidators.js';

const router = express.Router();

router.get('/', protect, authorize('director', 'manager'), paginationValidation, validateRequest, getAuditLogs);

export default router;
