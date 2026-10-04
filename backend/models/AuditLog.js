import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorName: { type: String, default: '' },
    actorRole: { type: String, default: '' },
    action: { type: String, required: true, enum: ['create', 'update', 'delete', 'login', 'repay', 'auth'] },
    entityType: { type: String, required: true },
    entityId: { type: String, default: '' },
    branch: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

auditLogSchema.index({ entityType: 1, createdAt: -1 });
auditLogSchema.index({ branch: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
