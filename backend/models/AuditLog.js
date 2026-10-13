import mongoose from 'mongoose';
import { guardAppendOnlyCollection, protectAppendOnly } from '../utils/appendOnly.js';

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
protectAppendOnly(auditLogSchema);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
guardAppendOnlyCollection(AuditLog);

export default AuditLog;
