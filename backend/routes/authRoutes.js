// Declares endpoint URLs and wires middleware/validators/controllers for this API surface.

import express from 'express';
import {
  login,
  logout,
  register,
  getMe,
  updateMe,
  getUsers,
  updateUser,
  deleteUser,
  refreshSession,
  resetPasswordWithRecoveryCode,
  issueRecoveryCodes,
  issueRecoveryCodesForUser,
  setupMfa,
  enableMfa,
  disableMfa,
  verifyMfaLogin
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';
import { authLimiter, writeLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import {
  loginValidation,
  registerValidation,
  profileUpdateValidation,
  paginationValidation,
  userUpdateValidation,
  mongoIdParamValidation,
  passwordResetValidation,
  mfaCodeValidation,
  mfaDisableValidation,
  mfaLoginValidation
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
router.post('/login/mfa', authLimiter, mfaLoginValidation, validateRequest, verifyMfaLogin);
router.post('/refresh', authLimiter, refreshSession);
router.post(
  '/password-reset',
  authLimiter,
  passwordResetValidation,
  validateRequest,
  resetPasswordWithRecoveryCode
);
router.post('/logout', protect, writeLimiter, logout);
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
router.post('/recovery-codes', protect, writeLimiter, issueRecoveryCodes);
router.post('/mfa/setup', protect, writeLimiter, setupMfa);
router.post('/mfa/enable', protect, writeLimiter, mfaCodeValidation, validateRequest, enableMfa);
router.post('/mfa/disable', protect, writeLimiter, mfaDisableValidation, validateRequest, disableMfa);

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

router.post(
  '/users/:id/recovery-codes',
  protect,
  authorize('manager'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  issueRecoveryCodesForUser
);

export default router;