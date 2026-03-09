// Declares endpoint URLs and wires middleware/validators/controllers for this API surface.

import express from 'express';
import {
  getStockNotifications,
  markStockNotificationRead
} from '../controllers/stockNotificationController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { mongoIdParamValidation, paginationValidation } from '../validators/requestValidators.js';

// Configure router.
const router = express.Router();

// GET /api/notifications: list stock notifications for manager review.
router.get(
  '/',
  protect,
  authorize('manager'),
  paginationValidation,
  validateRequest,
  getStockNotifications
);

// PUT /api/notifications/:id/read: mark one notification as read.
router.put(
  '/:id/read',
  protect,
  authorize('manager'),
  mongoIdParamValidation,
  validateRequest,
  markStockNotificationRead
);

export default router;