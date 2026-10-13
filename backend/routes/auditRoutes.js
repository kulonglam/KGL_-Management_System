import express from 'express';
import { listAuditLogs } from '../controllers/auditController.js';
import { protect, authorize, authorizeDirector } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { paginationValidation } from '../validators/requestValidators.js';

const router = express.Router();
const requireDirectorIdentity = (req, res, next) => {
  if (req.user?.role === 'director') {
    return authorizeDirector(req, res, next);
  }
  return next();
};

router.get(
  '/',
  protect,
  authorize('manager', 'director'),
  requireDirectorIdentity,
  paginationValidation,
  validateRequest,
  listAuditLogs
);

export default router;
