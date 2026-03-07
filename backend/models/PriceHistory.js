/**
 * Stores an immutable audit trail of manager price changes.
 * File: backend/models/PriceHistory.js
 */

import mongoose from 'mongoose';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

const priceHistorySchema = new mongoose.Schema(
  {
    branch: { type: String, required: true, enum: ['Maganjo', 'Matugga'] },
    priceSettingId: { type: mongoose.Schema.Types.ObjectId, required: true },
    action: {
      type: String,
      required: true,
      enum: ['create', 'update', 'delete']
    },
    previousProduceName: {
      type: String,
      set: (value) => {
        const normalized = normalizeProduceName(value);
        return normalized || undefined;
      },
      match: /^[A-Za-z0-9\s]+$/
    },
    previousProduceType: {
      type: String,
      set: normalizeProduceType,
      enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']
    },
    previousPriceUgx: { type: Number, min: 10000 },
    nextProduceName: {
      type: String,
      set: (value) => {
        const normalized = normalizeProduceName(value);
        return normalized || undefined;
      },
      match: /^[A-Za-z0-9\s]+$/
    },
    nextProduceType: {
      type: String,
      set: normalizeProduceType,
      enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']
    },
    nextPriceUgx: { type: Number, min: 10000 },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  {
    timestamps: true
  }
);

priceHistorySchema.index({ branch: 1, priceSettingId: 1, createdAt: -1 });
priceHistorySchema.index({ changedBy: 1, createdAt: -1 });

export default mongoose.model('PriceHistory', priceHistorySchema);
