import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';

const taxInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    documentType: { type: String, enum: ['tax_invoice', 'credit_note'], required: true },
    branch: createBranchSchemaField(),
    buyerName: { type: String, required: true },
    sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', default: null },
    creditSale: { type: mongoose.Schema.Types.ObjectId, ref: 'CreditSale', default: null },
    relatedInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxInvoice', default: null },
    produceName: { type: String, required: true },
    produceType: { type: String, required: true },
    tonnageKg: { type: Number, required: true, min: 0 },
    netUgx: { type: Number, required: true },
    vatUgx: { type: Number, required: true },
    grossUgx: { type: Number, required: true },
    vatRatePercent: { type: Number, required: true },
    tinSnapshot: { type: String, default: '' },
    preambleSnapshot: { type: String, default: '' },
    companyNameSnapshot: { type: String, default: '' },
    paymentMethod: { type: String, enum: ['cash', 'momo', 'bank', 'credit', ''], default: '' },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issuedAt: { type: Date, required: true, default: Date.now },
    voidReason: { type: String, default: '' }
  },
  { timestamps: true }
);

taxInvoiceSchema.index({ branch: 1, issuedAt: -1 });
taxInvoiceSchema.index({ sale: 1 });
taxInvoiceSchema.index({ documentType: 1, issuedAt: -1 });

export default mongoose.model('TaxInvoice', taxInvoiceSchema);
