import AuditLog from '../models/AuditLog.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const parseBoolean = (value) => {
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const getAuditLogs = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === 'manager') {
      filter.actorBranch = req.user.branch;
    }

    if (req.query.method) {
      filter.method = String(req.query.method).toUpperCase();
    }

    if (req.query.path) {
      filter.path = { $regex: String(req.query.path), $options: 'i' };
    }

    if (req.query.statusCode) {
      filter.statusCode = Number(req.query.statusCode);
    }

    const success = parseBoolean(req.query.success);
    if (success !== undefined) {
      filter.success = success;
    }

    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) {
        filter.createdAt.$gte = new Date(req.query.from);
      }
      if (req.query.to) {
        filter.createdAt.$lte = new Date(req.query.to);
      }
    }

    const pagination = parsePagination(req.query);
    const logsQuery = AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    if (pagination.enabled) {
      logsQuery.skip(pagination.skip).limit(pagination.limit);
    } else {
      logsQuery.limit(100);
    }

    const items = await logsQuery;
    if (!pagination.enabled) {
      return res.json(items);
    }

    const total = await AuditLog.countDocuments(filter);

    return res.json({
      items,
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total
      })
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export { getAuditLogs };
