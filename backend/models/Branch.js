import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, minlength: 2, match: /^[A-Za-z0-9\s]+$/ },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Branch', branchSchema);
