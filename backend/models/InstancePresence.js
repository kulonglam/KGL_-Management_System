import mongoose from 'mongoose';

const instancePresenceSchema = new mongoose.Schema(
  {
    instanceId: { type: String, required: true, unique: true },
    pid: { type: Number, required: true },
    hostname: { type: String, default: '' },
    startedAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true }
  },
  { timestamps: true }
);

instancePresenceSchema.index({ lastSeenAt: -1 });

export default mongoose.model('InstancePresence', instancePresenceSchema);
