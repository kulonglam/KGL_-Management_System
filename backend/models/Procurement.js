import mongoose from 'mongoose';
import {
  normalizeProduceName,
  normalizeProduceType,
  normalizeSourceType
} from '../utils/produceNormalization.js';

// Define procurement schema.
const procurementSchema = new mongoose.Schema(
  {
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
      minlength: 2,
      set: normalizeProduceType,
      enum: ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans']
    },
    sourceType: {
      type: String,
      required: true,
      set: normalizeSourceType,
      enum: ['individual', 'company', 'kgl_farm']
    },
    dateReceived: { type: Date, required: true },
    timeReceived: { type: String, required: true },
    tonnageKg: {
      type: Number,
      required: true,
      min: 100,
      validate: {
        // Handle validator.
        validator(value) {
          if (this.sourceType === 'individual') {
            return value >= 1000;
          }
          return value >= 100;
        },
        message: 'Procurement tonnage must be at least 100 kg and at least 1000 kg for individual dealers'
      }
    },
    costUgx: { type: Number, required: true, min: 10000 },
    dealerName: { type: String, required: true, minlength: 2, match: /^[A-Za-z0-9\s]+$/ },
    dealerContact: { type: String, required: true, match: /^(\+256|0)[0-9]{9}$/ },
    branch: { type: String, required: true, enum: ['Maganjo', 'Matugga'] },
    sellingPrice: { type: Number, required: true, min: 10000 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  {
    timestamps: true
  }
);

procurementSchema.index({ branch: 1, createdAt: -1 });
procurementSchema.index({ branch: 1, dateReceived: -1 });
procurementSchema.index({ branch: 1, produceType: 1, sourceType: 1 });

export default mongoose.model('Procurement', procurementSchema);
