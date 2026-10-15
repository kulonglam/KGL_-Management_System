import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

const REASON_CODES = ['damage', 'shrinkage', 'found', 'correction', 'other'];

const stockAdjustmentSchema = new mongoose.Schema(
  {
    branch: createBranchSchemaField(),
    produceName: { type: String, required: true, set: normalizeProduceName },
    produceType: {
      type: String,
      required: true,
      set: normalizeProduceType,
      enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']
    },
    deltaKg: { type: Number, required: true },
    reasonCode: { type: String, required: true, enum: REASON_CODES },
    note: { type: String, default: '', maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'applied', 'rejected'],
      default: 'applied'
    },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    appliedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

stockAdjustmentSchema.index({ branch: 1, status: 1, createdAt: -1 });

export { REASON_CODES };
export default mongoose.model('StockAdjustment', stockAdjustmentSchema);
