// Defines mongoose persistence schema, field constraints, and indexes for this domain entity.
 
import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';
import { excludeRemovedRecords } from '../utils/softDelete.js';
import { LOCAL_PHONE_PATTERN, normalizeLocalPhone } from '../utils/phoneNumber.js';
import { encryptedNationalIdPlugin } from '../utils/fieldEncryption.js';

// Configure alphanumeric words pattern.
const ALPHANUMERIC_WORDS_PATTERN = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;

// Define trusted buyer schema.
const trustedBuyerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, match: ALPHANUMERIC_WORDS_PATTERN },
    // Encrypted at rest; see encryptedNationalIdPlugin.
    nationalId: { type: String, required: true },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    location: { type: String, required: true, minlength: 2, match: ALPHANUMERIC_WORDS_PATTERN },
    contact: { type: String, required: true, set: normalizeLocalPhone, match: LOCAL_PHONE_PATTERN },
    branch: createBranchSchemaField(),
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // null = legacy one-open-credit rule; number = max outstanding UGX allowed
    creditLimitUgx: { type: Number, default: null, min: 0 },
    portalPasswordHash: { type: String, default: '', select: false },
    deletedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

trustedBuyerSchema.plugin(encryptedNationalIdPlugin);
trustedBuyerSchema.index(
  { nationalIdHash: 1, branch: 1 },
  { unique: true, partialFilterExpression: { nationalIdHash: { $type: 'string' } } }
);
trustedBuyerSchema.index({ branch: 1, createdAt: -1 });
trustedBuyerSchema.index({ deletedAt: 1, branch: 1 });
excludeRemovedRecords(trustedBuyerSchema);

export default mongoose.model('TrustedBuyer', trustedBuyerSchema);