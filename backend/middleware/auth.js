/**
 * Provides reusable Express middleware for auth, validation, security, logging, and response shaping.
 * File: backend/middleware/auth.js
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getJwtAlgorithms, getJwtClaimOptions } from '../config/security.js';
import { isDirectorOrbanAccount } from '../services/authService.js';
import logger from '../utils/logger.js';

const ALLOWED_JWT_ALGORITHMS = getJwtAlgorithms();

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Get token from header
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ALLOWED_JWT_ALGORITHMS,
      ...getJwtClaimOptions()
    });

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      logger.warn('auth.token.rejected', { reason: 'user_not_found', userId: decoded.id || null });
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    if (
      decoded.tokenVersion !== undefined &&
      Number(decoded.tokenVersion) !== Number(req.user.tokenVersion || 0)
    ) {
      logger.warn('auth.token.rejected', {
        reason: 'token_version_mismatch',
        userId: String(req.user._id)
      });
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    return next();
  } catch (error) {
    logger.warn('auth.token.rejected', { reason: 'token_invalid', message: error.message });
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
      logger.warn('auth.access.denied', {
        reason: 'role_mismatch',
        userId: req.user?._id ? String(req.user._id) : null,
        role: req.user.role,
        requiredRoles: roles
      });
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Company-specific access rule for cross-branch totals
const authorizeDirectorOrban = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (isDirectorOrbanAccount(req.user)) {
    return next();
  }

  logger.warn('auth.access.denied', {
    reason: 'orban_identity_required',
    userId: req.user?._id ? String(req.user._id) : null,
    username: req.user?.username || null,
    role: req.user?.role || null
  });
  return res.status(403).json({
    message: 'Only Mr. Orban can access this route'
  });
};

export { protect, authorize, authorizeDirectorOrban };





