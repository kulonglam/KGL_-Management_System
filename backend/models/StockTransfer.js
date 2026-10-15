import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

const transferLineSchema = new mongoose.Schema(
  {
    produceName: { type: String, required: true, set: normalizeProduceName },
    produceType: {
      type: String,
      required: true,
      set: normalizeProduceType,
      enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']
    },
    tonnageKg: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const stockTransferSchema = new mongoose.Schema(
  {
    fromBranch: createBranchSchemaField(),
    toBranch: createBranchSchemaField(),
    status: {
      type: String,
      enum: ['draft', 'in_transit', 'received', 'cancelled'],
      default: 'draft'
    },
    lines: {
      type: [transferLineSchema],
      validate: [(value) => Array.isArray(value) && value.length > 0, 'At least one transfer line is required']
    },
    note: { type: String, default: '', maxlength: 500 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shippedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    shippedAt: { type: Date, default: null },
    receivedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null }
  },
  { timestamps: true }
);

stockTransferSchema.index({ fromBranch: 1, status: 1, createdAt: -1 });
stockTransferSchema.index({ toBranch: 1, status: 1, createdAt: -1 });

export default mongoose.model('StockTransfer', stockTransferSchema);
