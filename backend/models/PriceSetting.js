import mongoose from 'mongoose';

// Define price setting schema.
const priceSettingSchema = new mongoose.Schema(
  {
    branch: { type: String, required: true, enum: ['Maganjo', 'Matugga'] },
    produceType: {
      type: String,
      required: true,
      enum: ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans']
    },
    priceUgx: { type: Number, required: true, min: 10000 }
  },
  {
    timestamps: true
  }
);

priceSettingSchema.index({ branch: 1, produceType: 1 }, { unique: true });

export default mongoose.model('PriceSetting', priceSettingSchema);
