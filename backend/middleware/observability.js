import { randomUUID } from 'node:crypto';
import { observeRequest } from '../services/metricsService.js';
import logger from '../utils/logger.js';

const requestContext = (req, res, next) => {
  const incomingRequestId = req.headers['x-request-id'];
  req.requestId = typeof incomingRequestId === 'string' && incomingRequestId.trim()
    ? incomingRequestId.trim()
    : randomUUID();

  res.setHeader('X-Request-Id', req.requestId);
  next();
};

const accessLogger = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const roundedDurationMs = Number(durationMs.toFixed(2));

    observeRequest({
      method: req.method,
      statusCode: res.statusCode,
      durationMs: roundedDurationMs
    });

    const userId = req.user?._id ? String(req.user._id) : null;

    logger.info('request.completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: roundedDurationMs,
      ip: req.ip,
      userId,
      userRole: req.user?.role || null
    });
  });

  next();
};

export { requestContext, accessLogger };
