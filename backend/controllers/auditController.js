import AuditLog from '../models/AuditLog.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const listAuditLogs = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'director') {
      filter.branch = req.user.branch;
    }

    const pagination = parsePagination(req.query);
    const query = AuditLog.find(filter).sort({ createdAt: -1 }).lean();
    if (pagination.enabled) {
      query.skip(pagination.skip).limit(pagination.limit);
    } else {
      query.limit(100);
    }

    const items = await query;
    if (!pagination.enabled) {
      return res.json(items);
    }

    const total = await AuditLog.countDocuments(filter);
    return res.json({
      items,
      pagination: buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { listAuditLogs };
