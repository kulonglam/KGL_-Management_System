/**
 * Defines mongoose persistence schema, field constraints, and indexes for this domain entity.
 * File: backend/models/PriceSetting.js
 */

import mongoose from 'mongoose';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

// Define price setting schema.
const priceSettingSchema = new mongoose.Schema(
  {
    branch: { type: String, required: true, enum: ['Maganjo', 'Matugga'] },
    produceName: {
      type: String,
      minlength: 2,
      set: (value) => {
        const normalized = normalizeProduceName(value);
        return normalized || undefined;
      },
      match: /^[A-Za-z0-9\s]+$/
    },
    produceType: {
      type: String,
      required: true,
      set: normalizeProduceType,
      enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']
    },
    priceUgx: { type: Number, required: true, min: 10000 }
  },
  {
    timestamps: true
  }
);

priceSettingSchema.index({ branch: 1, produceType: 1, produceName: 1 }, { unique: true });
priceSettingSchema.index({ branch: 1, produceType: 1, priceUgx: 1 });

export default mongoose.model('PriceSetting', priceSettingSchema);





