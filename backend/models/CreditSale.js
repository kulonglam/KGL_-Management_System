//  Defines mongoose persistence schema, field constraints, and indexes for this domain entity.
 
import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';
import { trackStockMovement } from '../services/stockBalanceService.js';
import { excludeRemovedRecords } from '../utils/softDelete.js';
import { LOCAL_PHONE_PATTERN, normalizeLocalPhone } from '../utils/phoneNumber.js';
import { encryptedNationalIdPlugin } from '../utils/fieldEncryption.js';

// Define credit sale schema.
const creditSaleSchema = new mongoose.Schema(
  {
    buyerName: { type: String, required: true, minlength: 2, match: /^[A-Za-z0-9\s]+$/ },
    // Encrypted at rest; see encryptedNationalIdPlugin.
    nationalId: { type: String, required: true },
    location: { type: String, required: true, minlength: 2, match: /^[A-Za-z0-9\s]+$/ },
    contact: { type: String, required: true, set: normalizeLocalPhone, match: LOCAL_PHONE_PATTERN },
    amountDueUgx: { type: Number, required: true, min: 10000 },
    amountPaidUgx: { type: Number, default: 0, min: 0 },
    balanceUgx: {
      type: Number,
      default: function () {
        return this.amountDueUgx;
      },
      min: 0
    },
    salesAgentName: { type: String, required: true, minlength: 2, match: /^[A-Za-z0-9\s]+$/ },
    dueDate: { type: Date, required: true },
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
    tonnageKg: { type: Number, required: true, min: 1 },
    dateOfDispatch: { type: Date, required: true },
    branch: createBranchSchemaField(),
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trustedBuyer: { type: mongoose.Schema.Types.ObjectId, ref: 'TrustedBuyer', required: true },
    isPaid: { type: Boolean, default: false },
    lastOverdueNoticeAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    voidedAt: { type: Date, default: null },
    voidReason: { type: String, default: '' },
    voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    payments: [
      {
        amountUgx: { type: Number, required: true, min: 1 },
        paidAt: { type: Date, default: Date.now },
        receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
      }
    ],
    // Bad-debt write-off: requested by a manager, approved by a different director.
    writtenOffUgx: { type: Number, default: 0, min: 0 },
    writeOff: {
      status: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none'
      },
      requestedAmountUgx: { type: Number, default: 0, min: 0 },
      reason: { type: String, default: '', maxlength: 500 },
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      requestedAt: { type: Date, default: null },
      decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      decidedAt: { type: Date, default: null },
      decisionNote: { type: String, default: '', maxlength: 500 }
    }
  },
  {
    timestamps: true
  }
);

creditSaleSchema.index({ branch: 1, createdAt: -1 });
creditSaleSchema.index({ branch: 1, dateOfDispatch: -1 });
creditSaleSchema.index({ branch: 1, dueDate: 1, isPaid: 1 });
creditSaleSchema.index({ trustedBuyer: 1, createdAt: -1 });
creditSaleSchema.index({ balanceUgx: 1, dueDate: 1, isPaid: 1 });
creditSaleSchema.index({ deletedAt: 1, branch: 1, dateOfDispatch: -1 });
creditSaleSchema.index({ 'writeOff.status': 1, branch: 1 });
creditSaleSchema.index({ nationalIdHash: 1 });
creditSaleSchema.plugin(encryptedNationalIdPlugin);
excludeRemovedRecords(creditSaleSchema);
trackStockMovement(creditSaleSchema, -1, 'credit');

export default mongoose.model('CreditSale', creditSaleSchema);