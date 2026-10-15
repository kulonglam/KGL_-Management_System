import mongoose from 'mongoose';

// One row per scope: 'ALL' (every branch) or a branch name. Records dated on or before
// lockedThrough (YYYY-MM-DD business date) can no longer be created, edited, removed or voided.
const periodLockSchema = new mongoose.Schema(
  {
    scope: { type: String, required: true, unique: true, trim: true },
    lockedThrough: { type: String, default: null, match: /^\d{4}-\d{2}-\d{2}$/ },
    note: { type: String, default: '', maxlength: 500 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

export default mongoose.model('PeriodLock', periodLockSchema);
