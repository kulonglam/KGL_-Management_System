import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';

const lineSchema = new mongoose.Schema(
  {
    produceName: { type: String, required: true },
    produceType: { type: String, required: true },
    orderedKg: { type: Number, required: true, min: 1 },
    unitCostUgx: { type: Number, required: true, min: 0 },
    receivedKg: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    branch: createBranchSchemaField(),
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    status: {
      type: String,
      enum: ['draft', 'approved', 'partial', 'received', 'closed'],
      default: 'draft'
    },
    lines: {
      type: [lineSchema],
      validate: { validator: (lines) => Array.isArray(lines) && lines.length > 0, message: 'At least one line is required' }
    },
    note: { type: String, default: '', maxlength: 500 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ branch: 1, status: 1, createdAt: -1 });

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);
