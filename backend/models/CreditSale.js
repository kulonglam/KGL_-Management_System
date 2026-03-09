//  Defines mongoose persistence schema, field constraints, and indexes for this domain entity.
 
import mongoose from 'mongoose';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';
import { LOCAL_PHONE_PATTERN, normalizeLocalPhone } from '../utils/phoneNumber.js';

// Define credit sale schema.
const creditSaleSchema = new mongoose.Schema(
  {
    buyerName: { type: String, required: true, minlength: 2, match: /^[A-Za-z0-9\s]+$/ },
    nationalId: { type: String, required: true, match: /^(CM|CF)[0-9]{12}$/ },
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
    branch: { type: String, required: true, enum: ['Maganjo', 'Matugga'] },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trustedBuyer: { type: mongoose.Schema.Types.ObjectId, ref: 'TrustedBuyer', required: true },
    isPaid: { type: Boolean, default: false },
    payments: [
      {
        amountUgx: { type: Number, required: true, min: 1 },
        paidAt: { type: Date, default: Date.now },
        receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
      }
    ]
  },
  {
    timestamps: true
  }
);

creditSaleSchema.index({ branch: 1, createdAt: -1 });
creditSaleSchema.index({ branch: 1, dateOfDispatch: -1 });
creditSaleSchema.index({ branch: 1, dueDate: 1, isPaid: 1 });
creditSaleSchema.index({ trustedBuyer: 1, createdAt: -1 });

export default mongoose.model('CreditSale', creditSaleSchema);