import express from 'express';
import { body } from 'express-validator';
import { authLimiter } from '../middleware/rateLimiter.js';
import { portalProtect } from '../middleware/portalAuth.js';
import { validateRequest } from '../middleware/validation.js';
import { portalHomeHandler, portalLoginHandler } from '../controllers/operationsController.js';

const router = express.Router();

router.post(
  '/login',
  authLimiter,
  [body('contact').trim().notEmpty(), body('password').isString().isLength({ min: 10 })],
  validateRequest,
  portalLoginHandler
);
router.get('/home', portalProtect, portalHomeHandler);

export default router;
