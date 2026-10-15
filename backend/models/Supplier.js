import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';
import { excludeRemovedRecords } from '../utils/softDelete.js';
import { LOCAL_PHONE_PATTERN, normalizeLocalPhone } from '../utils/phoneNumber.js';
import { normalizeSourceType } from '../utils/produceNormalization.js';

const ALPHANUMERIC_WORDS_PATTERN = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, match: ALPHANUMERIC_WORDS_PATTERN },
    contact: { type: String, required: true, set: normalizeLocalPhone, match: LOCAL_PHONE_PATTERN },
    sourceType: {
      type: String,
      required: true,
      set: normalizeSourceType,
      enum: ['individual', 'company', 'kgl_farm'],
      default: 'company'
    },
    branch: createBranchSchemaField(),
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

supplierSchema.index({ branch: 1, name: 1, contact: 1 }, { unique: true });
supplierSchema.index({ branch: 1, createdAt: -1 });
supplierSchema.index({ deletedAt: 1, branch: 1 });
excludeRemovedRecords(supplierSchema);

export default mongoose.model('Supplier', supplierSchema);
