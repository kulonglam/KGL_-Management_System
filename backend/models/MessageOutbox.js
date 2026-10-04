import mongoose from 'mongoose';

const messageOutboxSchema = new mongoose.Schema(
  {
    channel: { type: String, required: true, enum: ['email', 'sms', 'in_app'] },
    to: { type: String, required: true },
    subject: { type: String, default: '' },
    body: { type: String, required: true },
    relatedType: { type: String, default: '' },
    relatedId: { type: String, default: '' },
    branch: { type: String, default: '' },
    status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued' },
    errorMessage: { type: String, default: '' },
    sentAt: { type: Date, default: null }
  },
  { timestamps: true }
);

messageOutboxSchema.index({ branch: 1, createdAt: -1 });
messageOutboxSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('MessageOutbox', messageOutboxSchema);
