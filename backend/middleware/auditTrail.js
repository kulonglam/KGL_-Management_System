import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';

const AUDITED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const EXCLUDED_PATHS = new Set(['/healthz', '/readyz', '/metrics']);

const auditTrail = (req, res, next) => {
  if (!AUDITED_METHODS.has(req.method)) {
    return next();
  }

  const path = req.path || req.originalUrl || '';
  if (EXCLUDED_PATHS.has(path)) {
    return next();
  }

  res.on('finish', () => {
    if (!req.originalUrl.startsWith('/api/')) {
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      return;
    }

    const actorId = req.user?._id || null;
    const entry = {
      requestId: req.requestId || 'unknown',
      actorId,
      actorRole: req.user?.role || null,
      actorBranch: req.user?.branch || null,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      statusCode: res.statusCode,
      success: res.statusCode < 400,
      resourceId: req.params?.id || null,
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
      bodyFields: Object.keys(req.body || {}).slice(0, 40),
      queryKeys: Object.keys(req.query || {}).slice(0, 40)
    };

    AuditLog.create(entry).catch((error) => {
      logger.warn('audit.write_failed', {
        requestId: req.requestId || 'unknown',
        message: error.message
      });
    });
  });

  return next();
};

export { auditTrail };
