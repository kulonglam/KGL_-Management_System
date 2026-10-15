import mongoose from 'mongoose';

const EVENT_TYPES = [
  'cash_sale',
  'momo_sale',
  'bank_sale',
  'credit_sale',
  'credit_repayment',
  'credit_writeoff',
  'procurement',
  'sale_void',
  'vat_output'
];

const glAccountMappingSchema = new mongoose.Schema(
  {
    eventType: { type: String, required: true, unique: true, enum: EVENT_TYPES },
    debitAccount: { type: String, required: true, maxlength: 40 },
    creditAccount: { type: String, required: true, maxlength: 40 },
    description: { type: String, default: '', maxlength: 200 }
  },
  { timestamps: true }
);

export { EVENT_TYPES };
export default mongoose.model('GlAccountMapping', glAccountMappingSchema);
