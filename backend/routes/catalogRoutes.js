import express from 'express';
import { body, param } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import { forwardControllerError } from '../utils/httpError.js';
import { listBarcodes, lookupBarcode, registerBarcode } from '../services/catalogService.js';

const router = express.Router();

router.get('/barcodes', protect, authorize('director', 'manager', 'sales_agent'), async (req, res, next) => {
  try {
    res.json(await listBarcodes({ actorUser: req.user, branch: req.query.branch }));
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
});

router.get(
  '/barcodes/:code',
  protect,
  authorize('director', 'manager', 'sales_agent'),
  param('code').trim().isLength({ min: 1, max: 64 }).withMessage('code is required'),
  validateRequest,
  async (req, res, next) => {
    try {
      res.json(await lookupBarcode({ actorUser: req.user, code: req.params.code, branch: req.query.branch }));
    } catch (error) {
      return forwardControllerError(error, res, next);
    }
  }
);

router.post(
  '/barcodes',
  protect,
  authorize('director', 'manager'),
  writeLimiter,
  [
    body('code').trim().isLength({ min: 1, max: 64 }).withMessage('code is required'),
    body('produceName').trim().isLength({ min: 2 }).withMessage('produceName is required'),
    body('produceType').trim().notEmpty().withMessage('produceType is required'),
    body('branch').optional().trim()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const saved = await registerBarcode({ actorUser: req.user, ...req.body });
      res.status(201).json(saved);
    } catch (error) {
      return forwardControllerError(error, res, next);
    }
  }
);

export default router;
