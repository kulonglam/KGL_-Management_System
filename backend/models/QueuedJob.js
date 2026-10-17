import mongoose from 'mongoose';

const queuedJobSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    attempt: { type: Number, default: 1, min: 1 },
    maxAttempts: { type: Number, default: 3, min: 1 },
    backoffMs: { type: Number, default: 2000, min: 0 },
    status: { type: String, enum: ['queued', 'retrying', 'completed', 'failed'], default: 'queued' },
    runAfter: { type: Date, default: () => new Date() },
    lastError: { type: String, default: '' }
  },
  { timestamps: true }
);

queuedJobSchema.index({ status: 1, runAfter: 1 });

export default mongoose.model('QueuedJob', queuedJobSchema);
