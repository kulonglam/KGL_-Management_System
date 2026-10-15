import MessageOutbox from '../models/MessageOutbox.js';
import { parsePagination, buildPaginationMeta, applyListLimit } from '../utils/pagination.js';
import { forwardControllerError } from '../utils/httpError.js';

const inboxFilterForUser = (user, query = {}) => {
  const filter = {
    channel: 'in_app',
    to: user.username
  };
  if (user.role !== 'director' && user.branch) {
    filter.$or = [{ branch: user.branch }, { branch: '' }];
  }
  if (String(query.unread) === 'true') {
    filter.readAt = null;
  }
  return filter;
};

const listInboxMessages = async (req, res, next) => {
  try {
    const filter = inboxFilterForUser(req.user, req.query);
    const pagination = parsePagination(req.query);
    const query = MessageOutbox.find(filter).sort({ createdAt: -1 }).lean();
    applyListLimit(query, pagination);
    const items = await query;

    if (!pagination.enabled) {
      return res.json(items);
    }

    const total = await MessageOutbox.countDocuments(filter);
    const unread = await MessageOutbox.countDocuments({
      ...inboxFilterForUser(req.user, { unread: 'true' })
    });

    return res.json({
      items,
      pagination: buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total }),
      summary: { unread }
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const markMessageRead = async (req, res, next) => {
  try {
    const filter = {
      _id: req.params.id,
      channel: 'in_app',
      to: req.user.username
    };
    if (req.user.role !== 'director' && req.user.branch) {
      filter.$or = [{ branch: req.user.branch }, { branch: '' }];
    }

    const message = await MessageOutbox.findOneAndUpdate(
      filter,
      { $set: { readAt: new Date() } },
      { new: true }
    ).lean();

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    return res.json(message);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const markAllMessagesRead = async (req, res, next) => {
  try {
    const filter = {
      channel: 'in_app',
      to: req.user.username,
      readAt: null
    };
    if (req.user.role !== 'director' && req.user.branch) {
      filter.$or = [{ branch: req.user.branch }, { branch: '' }];
    }

    const result = await MessageOutbox.updateMany(filter, {
      $set: { readAt: new Date() }
    });

    return res.json({
      message: 'All inbox messages acknowledged',
      modifiedCount: result.modifiedCount || 0
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const unread = await MessageOutbox.countDocuments(
      inboxFilterForUser(req.user, { unread: 'true' })
    );
    return res.json({ unread });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

export { listInboxMessages, markMessageRead, markAllMessagesRead, getUnreadCount };
