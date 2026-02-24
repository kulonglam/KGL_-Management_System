import mongoose from 'mongoose';

const procurementSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2, match: /^[A-Za-z0-9\s]+$/},
  type: { type: String, required: true, minlength: 2,
    enum: ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans']},
  sourceType: { type: String, required: true,
    enum: ['individual', 'company', 'own_farm']},
  dateReceived: { type: Date, required: true},
  timeReceived: { type: String, required: true},
  tonnageKg: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator(value) {
        if (this.sourceType === 'individual') {
          return value >= 1000;
        }
        return value > 0;
      },
      message: 'Individual dealer procurements must be at least 1000 kg'
    }
  },
  costUgx: { type: Number, required: true, min: 10000},
  dealerName: { type: String, required: true, minlength: 2,
    match: /^[A-Za-z0-9\s]+$/},
  dealerContact: { type: String, required: true,
    match: /^(\+256|0)[0-9]{9}$/ },
  branch: { type: String, required: true,
    enum: ['Maganjo', 'Matugga']},
  sellingPrice: { type: Number, required: true, min: 10000},
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User',
    required: true }
}, {
  timestamps: true
});

procurementSchema.index({ branch: 1, createdAt: -1 });
procurementSchema.index({ branch: 1, dateReceived: -1 });
procurementSchema.index({ branch: 1, type: 1, sourceType: 1 });

export default mongoose.model('Procurement', procurementSchema);
