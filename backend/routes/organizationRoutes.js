import { body } from 'express-validator';
import { protect, authorize } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import { mongoIdParamValidation } from '../validators/requestValidators.js';
import { forwardControllerError } from '../utils/httpError.js';
import {
  assignBranch,
  consolidateEntity,
  createEntity,
  listEntities
} from '../services/organizationService.js';
import express from 'express';

const router = express.Router();

const send = (work) => async (req, res, next) => {
  try {
    const payload = await work(req);
    const status = payload?.statusCode || 200;
    if (payload && typeof payload === 'object') delete payload.statusCode;
    res.status(status).json(payload);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

router.get('/entities', protect, authorize('director'), send(() => listEntities()));

router.post(
  '/entities',
  protect,
  authorize('director'),
  writeLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 120 }).withMessage('name is required'),
    body('tin').optional().trim().isLength({ max: 40 }),
    body('address').optional().trim().isLength({ max: 240 }),
    body('baseCurrency').optional().trim().isLength({ min: 3, max: 3 })
  ],
  validateRequest,
  send(async (req) => {
    const entity = await createEntity(req.body);
    return Object.assign(entity, { statusCode: 201 });
  })
);

router.post(
  '/entities/:id/branches',
  protect,
  authorize('director'),
  writeLimiter,
  ...mongoIdParamValidation,
  body('branchId').trim().notEmpty().withMessage('branchId is required'),
  validateRequest,
  send((req) => assignBranch({ entityId: req.params.id, branchId: req.body.branchId }))
);

router.get(
  '/entities/:id/consolidation',
  protect,
  authorize('director', 'auditor'),
  mongoIdParamValidation,
  validateRequest,
  send((req) => consolidateEntity(req.params.id))
);

export default router;
