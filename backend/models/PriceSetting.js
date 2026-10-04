// Defines mongoose persistence schema, field constraints, and indexes for this domain entity.

import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

// Define price setting schema.
const priceSettingSchema = new mongoose.Schema(
  {
    branch: createBranchSchemaField(),
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