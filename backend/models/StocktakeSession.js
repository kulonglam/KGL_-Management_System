import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

const stocktakeLineSchema = new mongoose.Schema(
  {
    produceName: { type: String, required: true, set: normalizeProduceName },
    produceType: {
      type: String,
      required: true,
      set: normalizeProduceType,
      enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']
    },
    systemKg: { type: Number, required: true, min: 0 },
    countedKg: { type: Number, default: null, min: 0 },
    varianceKg: { type: Number, default: 0 }
  },
  { _id: false }
);

const stocktakeSessionSchema = new mongoose.Schema(
  {
    branch: createBranchSchemaField(),
    status: {
      type: String,
      enum: ['draft', 'posted', 'cancelled'],
      default: 'draft'
    },
    lines: { type: [stocktakeLineSchema], default: [] },
    note: { type: String, default: '', maxlength: 500 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    postedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

stocktakeSessionSchema.index({ branch: 1, status: 1, createdAt: -1 });

export default mongoose.model('StocktakeSession', stocktakeSessionSchema);
