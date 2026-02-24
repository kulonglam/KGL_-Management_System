import express from 'express';
const router = express.Router();
import {
  getInventory,
  checkStock
} from '../controllers/inventoryController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { stockCheckValidation } from '../validators/requestValidators.js';

router.get('/', protect, authorize('manager', 'sales_agent'), getInventory);
router.post('/check-stock', protect, authorize('manager', 'sales_agent'), stockCheckValidation, validateRequest, checkStock);

export default router;
