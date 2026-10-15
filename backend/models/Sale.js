// Defines mongoose persistence schema, field constraints, and indexes for this domain entity.

import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';
import { trackStockMovement } from '../services/stockBalanceService.js';
import { excludeRemovedRecords } from '../utils/softDelete.js';
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
      enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']
    },
    tonnageKg: { type: Number, required: true, min: 1 },
    amountPaidUgx: { type: Number, required: true, min: 10000 },
    paymentMethod: {
      type: String,
      enum: ['cash', 'momo', 'bank'],
      default: 'cash',
      required: true
    },
    // Amount tendered by the buyer (must be >= amountPaidUgx). Change = tender - amountPaid.
    tenderAmountUgx: { type: Number, default: null, min: 0 },
    buyerName: { type: String, required: true, minlength: 2, match: /^[A-Za-z0-9\s]+$/ },
    salesAgentName: { type: String, required: true, minlength: 2, match: /^[A-Za-z0-9\s]+$/ },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    branch: createBranchSchemaField(),
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date, default: null },
    voidedAt: { type: Date, default: null },
    voidReason: { type: String, default: '' },
    voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  {
    timestamps: true
  }
);

saleSchema.index({ branch: 1, createdAt: -1 });
saleSchema.index({ branch: 1, date: -1 });
saleSchema.index({ branch: 1, produceName: 1, produceType: 1 });
saleSchema.index({ deletedAt: 1, branch: 1, createdAt: -1 });
excludeRemovedRecords(saleSchema);
trackStockMovement(saleSchema, -1, 'sale');

export default mongoose.model('Sale', saleSchema);