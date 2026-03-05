/**
 * Defines mongoose persistence schema, field constraints, and indexes for this domain entity.
 * File: backend/models/StockNotification.js
 */

import mongoose from 'mongoose';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

// Define stock notification schema.
const stockNotificationSchema = new mongoose.Schema(
  {
    branch: {
      type: String,
      required: true,
      enum: ['Maganjo', 'Matugga']
    },
    produceName: {
      type: String,
      required: true,
      minlength: 2,
      set: normalizeProduceName,
      match: /^[A-Za-z0-9\s]+$/
    },
    produceType: {
      type: String,
      required: true,
      set: normalizeProduceType,
      enum: ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans']
    },
    category: {
      type: String,
      required: true,
      enum: ['out_of_stock'],
      default: 'out_of_stock'
    },
    message: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

stockNotificationSchema.index({
  branch: 1,
  category: 1,
  produceName: 1,
  produceType: 1,
  isRead: 1
});

export default mongoose.model('StockNotification', stockNotificationSchema);





