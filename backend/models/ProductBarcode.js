import mongoose from 'mongoose';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

const productBarcodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, maxlength: 64 },
    branch: { type: String, required: true },
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
    }
  },
  { timestamps: true }
);

productBarcodeSchema.index({ branch: 1, produceName: 1, produceType: 1 });

export default mongoose.model('ProductBarcode', productBarcodeSchema);
