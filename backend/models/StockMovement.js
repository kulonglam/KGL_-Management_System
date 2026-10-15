import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';
import { guardAppendOnlyCollection, protectAppendOnly } from '../utils/appendOnly.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

const MOVEMENT_TYPES = [
  'procurement_in',
  'procurement_out',
  'sale_out',
  'credit_out',
  'void_in',
  'transfer_out',
  'transfer_in',
  'adjustment',
  'stocktake'
];

const stockMovementSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: MOVEMENT_TYPES },
    branch: createBranchSchemaField(),
    produceName: { type: String, required: true, set: normalizeProduceName },
    produceType: {
      type: String,
      required: true,
      set: normalizeProduceType,
      enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']
    },
    // Signed kilograms: inbound positive, outbound negative.
    qtyKg: { type: Number, required: true },
    refType: { type: String, default: '' },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: '', maxlength: 500 },
    reasonCode: { type: String, default: '' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

stockMovementSchema.index({ branch: 1, createdAt: -1 });
stockMovementSchema.index({ branch: 1, produceName: 1, produceType: 1, createdAt: -1 });
stockMovementSchema.index({ type: 1, createdAt: -1 });
stockMovementSchema.index({ refType: 1, refId: 1 });
protectAppendOnly(stockMovementSchema);

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
guardAppendOnlyCollection(StockMovement);

export { MOVEMENT_TYPES };
export default StockMovement;
