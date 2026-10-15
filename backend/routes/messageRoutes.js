import express from 'express';
import {
  listInboxMessages,
  markMessageRead,
  markAllMessagesRead,
  getUnreadCount
} from '../controllers/messageController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { mongoIdParamValidation, paginationValidation } from '../validators/requestValidators.js';

const router = express.Router();

router.get(
  '/',
  protect,
  authorize('manager', 'sales_agent', 'director'),
  paginationValidation,
  validateRequest,
  listInboxMessages
);

router.get(
  '/unread-count',
  protect,
  authorize('manager', 'sales_agent', 'director'),
  getUnreadCount
);

router.put(
  '/read-all',
  protect,
  authorize('manager', 'sales_agent', 'director'),
  markAllMessagesRead
);

router.put(
  '/:id/read',
  protect,
  authorize('manager', 'sales_agent', 'director'),
  mongoIdParamValidation,
  validateRequest,
  markMessageRead
);

export default router;
