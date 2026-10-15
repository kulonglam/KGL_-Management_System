//  Defines mongoose persistence schema, field constraints, and indexes for this domain entity.
 
import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';
import {
  normalizeProduceName,
  normalizeProduceType,
  normalizeSourceType
} from '../utils/produceNormalization.js';
import { trackStockMovement } from '../services/stockBalanceService.js';
import { excludeRemovedRecords } from '../utils/softDelete.js';
import { LOCAL_PHONE_PATTERN, normalizeLocalPhone } from '../utils/phoneNumber.js';

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
      enum: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans']
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
    dealerContact: {
      type: String,
      required: true,
      set: normalizeLocalPhone,
      match: LOCAL_PHONE_PATTERN
    },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
    branch: createBranchSchemaField(),
    sellingPrice: { type: Number, required: true, min: 10000 },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

procurementSchema.index({ branch: 1, createdAt: -1 });
procurementSchema.index({ branch: 1, dateReceived: -1 });
procurementSchema.index({ branch: 1, produceType: 1, sourceType: 1 });
procurementSchema.index({ supplier: 1, createdAt: -1 });
procurementSchema.index({ deletedAt: 1, branch: 1, createdAt: -1 });
excludeRemovedRecords(procurementSchema);
trackStockMovement(procurementSchema, 1, 'procurement');

export default mongoose.model('Procurement', procurementSchema);