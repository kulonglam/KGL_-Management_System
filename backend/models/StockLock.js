import mongoose from 'mongoose';

const stockLockSchema = new mongoose.Schema(
  {
    branch: { type: String, required: true, enum: ['Maganjo', 'Matugga'] },
    produceName: { type: String, required: true },
    produceType: {
      type: String,
      required: true,
      enum: ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans']
    },
    owner: { type: String, default: null },
    lockUntil: { type: Date, default: new Date(0) }
  },
  {
    timestamps: true
  }
);

stockLockSchema.index({ branch: 1, produceName: 1, produceType: 1 }, { unique: true });

export default mongoose.model('StockLock', stockLockSchema);
