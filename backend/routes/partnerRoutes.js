import express from 'express';
import { query } from 'express-validator';
import {
  partnerMe,
  partnerPrices,
  partnerProcurements,
  partnerSales,
  partnerStock
} from '../controllers/partnerController.js';
import { requireApiKey } from '../middleware/apiKeyAuth.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

const listQueryValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('branch').optional().trim().notEmpty()
];

router.get('/me', requireApiKey(), partnerMe);
router.get('/stock', requireApiKey('stock:read'), listQueryValidation, validateRequest, partnerStock);
router.get('/sales', requireApiKey('sales:read'), listQueryValidation, validateRequest, partnerSales);
router.get(
  '/procurements',
  requireApiKey('procurement:read'),
  listQueryValidation,
  validateRequest,
  partnerProcurements
);
router.get('/prices', requireApiKey('prices:read'), listQueryValidation, validateRequest, partnerPrices);

export default router;
