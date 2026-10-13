import AuditLog from '../models/AuditLog.js';
import { enrichAuditItems } from '../services/auditService.js';
import { isDirectorAccount } from '../services/authService.js';
import { forwardControllerError } from '../utils/httpError.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const listAuditLogs = async (req, res, next) => {
  try {
    const filter = {};
    if (!isDirectorAccount(req.user)) {
      filter.branch = req.user.branch;
    }

    const pagination = parsePagination(req.query);
    const query = AuditLog.find(filter).sort({ createdAt: -1 }).lean();
    if (pagination.enabled) {
      query.skip(pagination.skip).limit(pagination.limit);
    } else {
      query.limit(100);
    }

    const items = await enrichAuditItems(await query);
    if (!pagination.enabled) {
      return res.json(items);
    }

    const total = await AuditLog.countDocuments(filter);
    return res.json({
      items,
      pagination: buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total })
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

export { listAuditLogs };
