/**
 * Declares endpoint URLs and wires middleware/validators/controllers for this API surface.
 * File: backend/routes/authRoutes.js
 */

import express from 'express';
import { login, register, getMe, updateMe, getUsers, updateUser, deleteUser } from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';
import { authLimiter, writeLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import {
  loginValidation,
  registerValidation,
  profileUpdateValidation,
  paginationValidation,
  userUpdateValidation,
  mongoIdParamValidation
} from '../validators/requestValidators.js';

// Configure router.
const router = express.Router();
// Disable caching of auth/profile responses so sensitive data is not stored by intermediaries.
const noStore = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  next();
};

router.use(noStore);

// POST /api/auth/login: authenticate credentials and return signed session details.
router.post('/login', authLimiter, loginValidation, validateRequest, login);
// POST /api/auth/register: create a new branch user account (manager only).
router.post('/register', protect, authorize('manager'),
  writeLimiter,
  registerValidation,
  validateRequest,
  register
);

// GET /api/auth/me: return the currently authenticated user profile.
router.get('/me', protect, getMe);
// PUT /api/auth/me: update current user profile fields and optional password.
router.put('/me', protect, writeLimiter, profileUpdateValidation, validateRequest, updateMe);

// GET /api/auth/users: list branch users for manager administration screens.
router.get(
  '/users',
  protect,
  authorize('manager'),
  paginationValidation,
  validateRequest,
  getUsers
);

// PUT /api/auth/users/:id: update one managed user account.
router.put(
  '/users/:id',
  protect,
  authorize('manager'),
  writeLimiter,
  userUpdateValidation,
  validateRequest,
  updateUser
);
// DELETE /api/auth/users/:id: remove one managed user account.
router.delete(
  '/users/:id',
  protect,
  authorize('manager'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  deleteUser
);

export default router;
