// Provides reusable Express middleware for auth, validation, security, logging, and response shaping.

import { validationResult } from 'express-validator';

// Validate request.
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const details = errors.array().map((error) => ({
    field: error.path,
    message: error.msg
  }));

  return res.status(400).json({
    // Return the first actionable validation detail for better UX.
    message: details[0]?.message || 'Validation failed',
    details
  });
};

export { validateRequest };