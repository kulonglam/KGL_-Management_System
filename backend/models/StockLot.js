import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';

const stockLotSchema = new mongoose.Schema(
  {
    branch: createBranchSchemaField(),
    produceName: { type: String, required: true },
    produceType: { type: String, required: true },
    lotCode: { type: String, required: true, maxlength: 40 },
    expiryDate: { type: Date, default: null },
    qtyKg: { type: Number, required: true, min: 0 },
    procurement: { type: mongoose.Schema.Types.ObjectId, ref: 'Procurement', default: null }
  },
  { timestamps: true }
);

stockLotSchema.index({ branch: 1, produceName: 1, produceType: 1, expiryDate: 1 });
stockLotSchema.index({ lotCode: 1, branch: 1 });

export default mongoose.model('StockLot', stockLotSchema);
