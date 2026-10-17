import mongoose from 'mongoose';

const exchangeRateSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, enum: ['USD', 'KES', 'EUR', 'GBP'] },
    rateToUgx: { type: Number, required: true, min: 0.0001 },
    effectiveOn: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

exchangeRateSchema.index({ code: 1, effectiveOn: -1 });

export default mongoose.model('ExchangeRate', exchangeRateSchema);
