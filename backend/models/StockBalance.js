import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

const stockBalanceSchema = new mongoose.Schema(
  {
    branch: createBranchSchemaField(),
    produceName: {
      type: String,
      required: true,
      set: normalizeProduceName
    },
    produceType: {
      type: String,
      required: true,
      set: normalizeProduceType,
      enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']
    },
    onHandKg: { type: Number, required: true, default: 0 },
    sellingPrice: { type: Number, default: 0, min: 0 },
    averageCostUgx: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

stockBalanceSchema.index({ branch: 1, produceName: 1, produceType: 1 }, { unique: true });

export default mongoose.model('StockBalance', stockBalanceSchema);
