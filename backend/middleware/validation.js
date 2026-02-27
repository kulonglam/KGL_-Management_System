import { validationResult } from 'express-validator';

// Validate request.
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    message: 'Validation failed',
    details: errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }))
  });
};

export { validateRequest };
