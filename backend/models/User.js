import mongoose from 'mongoose';

// Define user schema.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, match: /^[A-Za-z0-9\s.]+$/ },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: '' },
    role: { type: String, enum: ['director', 'manager', 'sales_agent'], required: true },
    branch: {
      type: String,
      enum: ['Maganjo', 'Matugga'],
      required: function () {
        return this.role !== 'director';
      }
    },
    canViewCrossBranchTotals: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

userSchema.index({ branch: 1, role: 1 });

export default mongoose.model('User', userSchema);
