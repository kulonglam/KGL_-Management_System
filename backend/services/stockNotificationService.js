/*
 * Handles stock notification lifecycle for out-of-stock and low-stock events.
 */

import StockNotification from '../models/StockNotification.js';
import { LOW_STOCK_THRESHOLD_KG } from './inventoryService.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

const createUnreadNotification = async ({ branch, produceName, produceType, category, message }) => {
  const canonicalName = normalizeProduceName(produceName);
  const canonicalType = normalizeProduceType(produceType);
  const existingUnread = await StockNotification.findOne({
    branch,
    category,
    produceName: canonicalName,
    produceType: canonicalType,
    isRead: false
  });

  if (existingUnread) {
    existingUnread.message = message;
    await existingUnread.save();
    return existingUnread;
  }

  return StockNotification.create({
    branch,
    produceName: canonicalName,
    produceType: canonicalType,
    category,
    message,
    isRead: false
  });
};

const resolveNotifications = async ({ branch, produceName, produceType, category }) => {
  const canonicalName = normalizeProduceName(produceName);
  const canonicalType = normalizeProduceType(produceType);
  await StockNotification.updateMany(
    {
      branch,
      category,
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

const createOutOfStockNotification = async ({ branch, produceName, produceType }) => {
  const canonicalName = normalizeProduceName(produceName);
  const canonicalType = normalizeProduceType(produceType);
  return createUnreadNotification({
    branch,
    produceName: canonicalName,
    produceType: canonicalType,
    category: 'out_of_stock',
    message: `${canonicalName} (${canonicalType}) is out of stock in ${branch}.`
  });
};

const createLowStockNotification = async ({ branch, produceName, produceType, remainingStock }) => {
  const canonicalName = normalizeProduceName(produceName);
  const canonicalType = normalizeProduceType(produceType);
  const remaining = Math.max(0, Number(remainingStock || 0));
  return createUnreadNotification({
    branch,
    produceName: canonicalName,
    produceType: canonicalType,
    category: 'low_stock',
    message: `${canonicalName} (${canonicalType}) is low stock in ${branch}: ${remaining} kg remaining (below ${LOW_STOCK_THRESHOLD_KG} kg).`
  });
};

const resolveOutOfStockNotification = async ({ branch, produceName, produceType }) =>
  resolveNotifications({ branch, produceName, produceType, category: 'out_of_stock' });

const syncStockLevelNotifications = async ({ branch, produceName, produceType, remainingStock }) => {
  const remaining = Number(remainingStock || 0);

  if (remaining <= 0) {
    await createOutOfStockNotification({ branch, produceName, produceType });
    await resolveNotifications({ branch, produceName, produceType, category: 'low_stock' });
    return;
  }

  await resolveOutOfStockNotification({ branch, produceName, produceType });

  if (remaining < LOW_STOCK_THRESHOLD_KG) {
    await createLowStockNotification({ branch, produceName, produceType, remainingStock: remaining });
    return;
  }

  await resolveNotifications({ branch, produceName, produceType, category: 'low_stock' });
};

export {
  createLowStockNotification,
  createOutOfStockNotification,
  resolveOutOfStockNotification,
  syncStockLevelNotifications
};
