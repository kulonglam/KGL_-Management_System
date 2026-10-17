import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';

const lineSchema = new mongoose.Schema(
  {
    produceName: { type: String, required: true },
    produceType: { type: String, required: true },
    receivedKg: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const goodsReceiptSchema = new mongoose.Schema(
  {
    branch: createBranchSchemaField(),
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
    lines: { type: [lineSchema], required: true },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, default: '', maxlength: 500 }
  },
  { timestamps: true }
);

goodsReceiptSchema.index({ purchaseOrder: 1, createdAt: -1 });

export default mongoose.model('GoodsReceipt', goodsReceiptSchema);
