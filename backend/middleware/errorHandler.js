import logger from '../utils/logger.js';

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, _next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const errorPayload = {
    message: err.message || 'Internal Server Error',
    details: err.details || null,
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
