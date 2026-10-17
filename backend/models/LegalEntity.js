import mongoose from 'mongoose';

const legalEntitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, minlength: 2, maxlength: 120 },
    tin: { type: String, default: '', maxlength: 40 },
    address: { type: String, default: '', maxlength: 240 },
    baseCurrency: { type: String, default: 'UGX', uppercase: true, maxlength: 3 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('LegalEntity', legalEntitySchema);
