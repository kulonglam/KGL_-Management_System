/**
 * Provides reusable Express middleware for auth, validation, security, logging, and response shaping.
 * File: backend/middleware/errorHandler.js
 */

import logger from '../utils/logger.js';

// Handle not found.
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Handle error handler.
const errorHandler = (err, req, res, _next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const isServerError = statusCode >= 500;
  const exposeDetails = !isServerError || process.env.NODE_ENV !== 'production';
  // Configure error payload.
  const errorPayload = {
    message:
      isServerError && process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message || 'Internal Server Error',
    details: exposeDetails ? err.details || null : null,
    statusCode,
    requestId: req.requestId || null
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    errorPayload.stack = err.stack;
  }

  logger.error('request.failed', {
    requestId: req.requestId || null,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: errorPayload.message
  });

  res.status(statusCode).json({
    success: false,
    data: null,
    error: errorPayload
  });
};

export { notFound, errorHandler };





