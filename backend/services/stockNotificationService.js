import StockNotification from '../models/StockNotification.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

// Create out of stock notification.
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

// Handle resolve out of stock notification.
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
