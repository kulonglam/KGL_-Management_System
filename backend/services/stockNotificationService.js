import StockNotification from '../models/StockNotification.js';

// Create out of stock notification.
const createOutOfStockNotification = async ({ branch, produceName, produceType }) => {
  const existingUnread = await StockNotification.findOne({
    branch,
    category: 'out_of_stock',
    produceName,
    produceType,
    isRead: false
  });

  if (existingUnread) {
    return existingUnread;
  }

  return StockNotification.create({
    branch,
    produceName,
    produceType,
    category: 'out_of_stock',
    message: `${produceName} (${produceType}) is out of stock in ${branch}.`,
    isRead: false
  });
};

// Handle resolve out of stock notification.
const resolveOutOfStockNotification = async ({ branch, produceName, produceType }) => {
  await StockNotification.updateMany(
    {
      branch,
      category: 'out_of_stock',
      produceName,
      produceType,
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
