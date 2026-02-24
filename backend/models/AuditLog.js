import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorRole: { type: String, default: null },
    actorBranch: { type: String, default: null },
    method: { type: String, required: true },
    path: { type: String, required: true },
    statusCode: { type: Number, required: true },
    success: { type: Boolean, required: true },
    resourceId: { type: String, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    bodyFields: { type: [String], default: [] },
    queryKeys: { type: [String], default: [] }
  },
  {
    timestamps: true
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actorBranch: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ method: 1, path: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
