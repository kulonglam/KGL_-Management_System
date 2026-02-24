import mongoose from 'mongoose';

const ALPHANUMERIC_WORDS_PATTERN = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;

const trustedBuyerSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2,
    match: ALPHANUMERIC_WORDS_PATTERN},
  nationalId: { type: String, required: true, match: /^[A-Z0-9]{14}$/},
  location: { type: String, required: true, minlength: 2,
    match: ALPHANUMERIC_WORDS_PATTERN},
  contact: { type: String, required: true, match: /^(\+256|0)[0-9]{9}$/},
  branch: { type: String, required: true, enum: ['Maganjo', 'Matugga']},
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User',
    required: true}
}, {
  timestamps: true
});

trustedBuyerSchema.index({ nationalId: 1, branch: 1 }, { unique: true });
trustedBuyerSchema.index({ branch: 1, createdAt: -1 });

export default mongoose.model('TrustedBuyer', trustedBuyerSchema);
