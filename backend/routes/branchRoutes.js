import express from 'express';
import { createBranch, listPublicBranches, updateBranch } from '../controllers/branchController.js';
import { protect, authorize, authorizeDirectorOrban } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import { body } from 'express-validator';
import { mongoIdParamValidation } from '../validators/requestValidators.js';

const router = express.Router();

router.get('/', protect, listPublicBranches);
router.post(
  '/',
  protect,
  authorize('director'),
  authorizeDirectorOrban,
  writeLimiter,
  [
    body('name').trim().isLength({ min: 2 }).withMessage('name is required'),
    body('managerName').trim().isLength({ min: 2 }).withMessage('managerName is required'),
    body('managerUsername').trim().isLength({ min: 2 }).withMessage('managerUsername is required'),
    body('managerPassword').isLength({ min: 10 }).withMessage('managerPassword is required')
  ],
  validateRequest,
  createBranch
);

router.put(
  '/:id',
  protect,
  authorize('director'),
  authorizeDirectorOrban,
  writeLimiter,
  ...mongoIdParamValidation,
  body('isActive').exists().withMessage('isActive is required'),
  validateRequest,
  updateBranch
);

export default router;
