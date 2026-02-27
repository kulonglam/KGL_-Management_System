import StockNotification from '../models/StockNotification.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

// Retrieve stock notifications.
const getStockNotifications = async (req, res) => {
  try {
    // Configure filter.
    const filter = {
      branch: req.user.branch
    };

    if (req.query.unread !== 'false') {
      filter.isRead = false;
    }

    const pagination = parsePagination(req.query);
    const notificationsQuery = StockNotification.find(filter).sort({ createdAt: -1 }).lean();

    if (pagination.enabled) {
      notificationsQuery.skip(pagination.skip).limit(pagination.limit);
    } else {
      notificationsQuery.limit(50);
    }

    const notifications = await notificationsQuery;
    if (!pagination.enabled) {
      return res.json(notifications);
    }

    const total = await StockNotification.countDocuments(filter);
    return res.json({
      items: notifications,
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total
      })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Handle mark stock notification read.
const markStockNotificationRead = async (req, res) => {
  try {
    const notification = await StockNotification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return res.json(notification);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export { getStockNotifications, markStockNotificationRead };
