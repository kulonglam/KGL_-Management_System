import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';

const invoiceSequenceSchema = new mongoose.Schema(
  {
    branch: createBranchSchemaField(),
    year: { type: Number, required: true, min: 2000 },
    nextNumber: { type: Number, required: true, min: 1, default: 1 }
  },
  { timestamps: true }
);

invoiceSequenceSchema.index({ branch: 1, year: 1 }, { unique: true });

export default mongoose.model('InvoiceSequence', invoiceSequenceSchema);
