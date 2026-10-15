import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';

const tenderBreakdownSchema = new mongoose.Schema(
  {
    cashUgx: { type: Number, default: 0, min: 0 },
    momoUgx: { type: Number, default: 0, min: 0 },
    bankUgx: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const cashUpSessionSchema = new mongoose.Schema(
  {
    branch: createBranchSchemaField(),
    businessDate: { type: String, required: true }, // YYYY-MM-DD
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    systemTotals: { type: tenderBreakdownSchema, default: () => ({}) },
    countedTotals: { type: tenderBreakdownSchema, default: () => ({}) },
    systemSalesCount: { type: Number, default: 0 },
    varianceUgx: { type: Number, default: 0 },
    varianceNote: { type: String, default: '', maxlength: 500 },
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    closedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

cashUpSessionSchema.index({ branch: 1, businessDate: 1 }, { unique: true });
cashUpSessionSchema.index({ branch: 1, status: 1, businessDate: -1 });

export default mongoose.model('CashUpSession', cashUpSessionSchema);
