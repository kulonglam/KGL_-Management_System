/**
 * Initializes MongoDB connectivity with mongoose safety options and startup failure handling.
 * File: backend/config/database.js
 */

import mongoose from 'mongoose';
import CreditSale from '../models/CreditSale.js';
import Procurement from '../models/Procurement.js';
import PriceSetting from '../models/PriceSetting.js';
import PriceHistory from '../models/PriceHistory.js';
import Sale from '../models/Sale.js';
import StockNotification from '../models/StockNotification.js';

const LEGACY_GROUNDNUT_TYPES = ['G-nuts', 'g-nuts', 'g nuts', 'Ground nuts', 'ground nuts'];

const normalizeGroundnutProduceTypes = async () => {
  const legacyGroundnutTypeFilter = mongoose.trusted({ $in: LEGACY_GROUNDNUT_TYPES });
  const canonicalGroundnutUpdate = { $set: { produceType: 'Groundnuts' } };

  const [
    procurementResult,
    saleResult,
    creditSaleResult,
    priceSettingResult,
    stockNotificationResult,
    priceHistoryPreviousResult,
    priceHistoryNextResult
  ] = await Promise.all([
    Procurement.updateMany({ produceType: legacyGroundnutTypeFilter }, canonicalGroundnutUpdate),
    Sale.updateMany({ produceType: legacyGroundnutTypeFilter }, canonicalGroundnutUpdate),
    CreditSale.updateMany({ produceType: legacyGroundnutTypeFilter }, canonicalGroundnutUpdate),
    PriceSetting.updateMany({ produceType: legacyGroundnutTypeFilter }, canonicalGroundnutUpdate),
    StockNotification.updateMany({ produceType: legacyGroundnutTypeFilter }, canonicalGroundnutUpdate),
    PriceHistory.updateMany(
      { previousProduceType: legacyGroundnutTypeFilter },
      { $set: { previousProduceType: 'Groundnuts' } }
    ),
    PriceHistory.updateMany(
      { nextProduceType: legacyGroundnutTypeFilter },
      { $set: { nextProduceType: 'Groundnuts' } }
    )
  ]);

  const normalizedFieldCount = [
    procurementResult.modifiedCount,
    saleResult.modifiedCount,
    creditSaleResult.modifiedCount,
    priceSettingResult.modifiedCount,
    stockNotificationResult.modifiedCount,
    priceHistoryPreviousResult.modifiedCount,
    priceHistoryNextResult.modifiedCount
  ].reduce((total, count) => total + count, 0);

  console.log(`Groundnuts produce types normalized: ${normalizedFieldCount || 'no changes'}`);
};

// Bring the live PriceSetting collection indexes in line with the current schema.
const syncPriceIndexes = async () => {
  const syncedPriceSettingIndexes = await PriceSetting.syncIndexes();
  const syncedPriceHistoryIndexes = await PriceHistory.syncIndexes();

  console.log(
    `PriceSetting indexes synchronized: ${Object.keys(syncedPriceSettingIndexes).join(', ') || 'no changes'}`
  );
  console.log(
    `PriceHistory indexes synchronized: ${Object.keys(syncedPriceHistoryIndexes).join(', ') || 'no changes'}`
  );
};

// Handle connect db.
const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    mongoose.set('sanitizeFilter', true);
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    await normalizeGroundnutProduceTypes();
    await syncPriceIndexes();

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;





