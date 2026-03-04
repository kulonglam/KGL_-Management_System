import express from 'express';
import {
  login,
  register,
  getMe,
  updateMe,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
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
  mongoIdParamValidation
} from '../validators/requestValidators.js';

// Configure router.
const router = express.Router();
const noStore = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  next();
};

router.use(noStore);

router.post('/login', authLimiter, loginValidation, validateRequest, login);
router.post(
  '/register',
  protect,
  authorize('manager'),
  writeLimiter,
  registerValidation,
  validateRequest,
  register
);
router
  .route('/me')
  .get(protect, getMe)
  .put(protect, writeLimiter, profileUpdateValidation, validateRequest, updateMe);
router.get(
  '/users',
  protect,
  authorize('manager'),
  paginationValidation,
  validateRequest,
  getUsers
);
router
  .route('/users/:id')
  .get(protect, authorize('manager'), mongoIdParamValidation, validateRequest, getUserById)
  .put(
    protect,
    authorize('manager'),
    writeLimiter,
    userUpdateValidation,
    validateRequest,
    updateUser
  )
  .delete(
    protect,
    authorize('manager'),
    writeLimiter,
    mongoIdParamValidation,
    validateRequest,
    deleteUser
  );

export default router;
