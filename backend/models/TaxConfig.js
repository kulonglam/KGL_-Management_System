import mongoose from 'mongoose';

const taxConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    companyName: { type: String, default: 'Karibu Groceries LTD', maxlength: 200 },
    tin: { type: String, default: '', maxlength: 40 },
    vatRatePercent: { type: Number, default: 18, min: 0, max: 100 },
    invoicePreamble: {
      type: String,
      default: 'Tax invoice issued under the laws of Uganda.',
      maxlength: 500
    },
    currency: { type: String, default: 'UGX' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

export default mongoose.model('TaxConfig', taxConfigSchema);
