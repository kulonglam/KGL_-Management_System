import logger from '../utils/logger.js';
import AuditLog from '../models/AuditLog.js';

const recordAudit = async ({ actor, action, entityType, entityId, branch, metadata = {} }) => {
  try {
    await AuditLog.create({
      actorId: actor?._id || null,
      actorName: actor?.name || '',
      actorRole: actor?.role || '',
      action,
      entityType,
      entityId: entityId ? String(entityId) : '',
      branch: branch || actor?.branch || '',
      metadata
    });
  } catch (error) {
    logger.warn('audit.write.failed', { message: error.message, entityType, action });
  }
};

export { recordAudit };
