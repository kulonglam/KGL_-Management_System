import mongoose from 'mongoose';

const glJournalLineSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    branch: { type: String, default: '' },
    account: { type: String, required: true },
    debitUgx: { type: Number, default: 0, min: 0 },
    creditUgx: { type: Number, default: 0, min: 0 },
    eventType: { type: String, required: true },
    refType: { type: String, default: '' },
    refId: { type: String, default: '' },
    memo: { type: String, default: '' },
    lineKey: { type: String, required: true },
    currency: { type: String, default: 'UGX', maxlength: 3 },
    foreignAmount: { type: Number, default: 0, min: 0 },
    fxRateToUgx: { type: Number, default: 1, min: 0 }
  },
  { timestamps: true }
);

glJournalLineSchema.index({ lineKey: 1 }, { unique: true });
glJournalLineSchema.index({ date: 1, account: 1 });
glJournalLineSchema.index({ branch: 1, date: 1 });

export default mongoose.model('GlJournalLine', glJournalLineSchema);
