/**
 * Defines mongoose persistence schema, field constraints, and indexes for this domain entity.
 * File: backend/models/Sale.js
 */

import mongoose from 'mongoose';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

// Define sale schema.
const saleSchema = new mongoose.Schema(
  {
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
    tonnageKg: { type: Number, required: true, min: 1 },
    amountPaidUgx: { type: Number, required: true, min: 10000 },
    buyerName: { type: String, required: true, minlength: 2, match: /^[A-Za-z0-9\s]+$/ },
    salesAgentName: { type: String, required: true, minlength: 2, match: /^[A-Za-z0-9\s]+$/ },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    branch: { type: String, required: true, enum: ['Maganjo', 'Matugga'] },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  {
    timestamps: true
  }
);

saleSchema.index({ branch: 1, createdAt: -1 });
saleSchema.index({ branch: 1, date: -1 });
saleSchema.index({ branch: 1, produceName: 1, produceType: 1 });

export default mongoose.model('Sale', saleSchema);





