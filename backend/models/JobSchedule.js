import mongoose from 'mongoose';

const jobScheduleSchema = new mongoose.Schema(
  {
    jobName: { type: String, required: true, unique: true, trim: true },
    lastRunAt: { type: Date, default: null },
    lastStatus: { type: String, enum: ['never', 'queued', 'completed', 'failed'], default: 'never' },
    lastError: { type: String, default: '' },
    lastCompletedAt: { type: Date, default: null },
    runCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

export default mongoose.model('JobSchedule', jobScheduleSchema);
