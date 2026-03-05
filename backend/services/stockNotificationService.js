/**
 * Handles out-of-stock notification lifecycle: create-once for unread events
 * and resolve/acknowledge when matching stock is replenished.
 * File: backend/services/stockNotificationService.js
 */

import StockNotification from '../models/StockNotification.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

// Create one unread out-of-stock notification if no matching unread notification exists.
const createOutOfStockNotification = async ({ branch, produceName, produceType }) => {
  const canonicalName = normalizeProduceName(produceName);
  const canonicalType = normalizeProduceType(produceType);
  const existingUnread = await StockNotification.findOne({
    branch,
    category: 'out_of_stock',
    produceName: canonicalName,
    produceType: canonicalType,
    isRead: false
  });

  if (existingUnread) {
    return existingUnread;
  }

  return StockNotification.create({
    branch,
    produceName: canonicalName,
    produceType: canonicalType,
    category: 'out_of_stock',
    message: `${canonicalName} (${canonicalType}) is out of stock in ${branch}.`,
    isRead: false
  });
};

// Mark matching unread out-of-stock notifications as read after stock is replenished.
const resolveOutOfStockNotification = async ({ branch, produceName, produceType }) => {
  const canonicalName = normalizeProduceName(produceName);
  const canonicalType = normalizeProduceType(produceType);
  await StockNotification.updateMany(
    {
      branch,
      category: 'out_of_stock',
      produceName: canonicalName,
      produceType: canonicalType,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

export { createOutOfStockNotification, resolveOutOfStockNotification };





