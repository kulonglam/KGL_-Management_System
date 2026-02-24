import express from 'express';
import { getStockNotifications, markStockNotificationRead } from '../controllers/stockNotificationController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { mongoIdParamValidation, paginationValidation } from '../validators/requestValidators.js';

const router = express.Router();

router.get('/', protect, authorize('manager'), paginationValidation, validateRequest, getStockNotifications);
router.put('/:id/read', protect, authorize('manager'), mongoIdParamValidation, validateRequest, markStockNotificationRead);

export default router;
