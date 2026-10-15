import mongoose from 'mongoose';

const retentionPolicySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    auditLogDays: { type: Number, default: 2555, min: 30 }, // ~7 years
    messageOutboxDays: { type: Number, default: 365, min: 30 },
    stockNotificationDays: { type: Number, default: 180, min: 30 },
    anonymizeBuyerAfterDays: { type: Number, default: 2555, min: 30 },
    lastRunAt: { type: Date, default: null },
    lastRunSummary: { type: mongoose.Schema.Types.Mixed, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

export default mongoose.model('RetentionPolicy', retentionPolicySchema);
