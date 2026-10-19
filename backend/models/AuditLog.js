import mongoose from 'mongoose';
import { guardAppendOnlyCollection, protectAppendOnly } from '../utils/appendOnly.js';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorName: { type: String, default: '' },
    actorRole: { type: String, default: '' },
    action: {
      type: String,
      required: true,
      enum: [
        'create',
        'update',
        'delete',
        'login',
        'repay',
        'auth',
        'void',
        'write_off',
        'export',
        'employee.create',
        'attendance.mark',
        'leave.request',
        'leave.decide',
        'payroll.run',
        'supplier_bill.create',
        'supplier_bill.pay',
        'bin.create',
        'bin.putaway',
        'pick_list.create',
        'weigh.record',
        'asset.create',
        'asset.depreciate',
        'asset.dispose',
        'vehicle.create',
        'trip.record',
        'fuel.record',
        'budget.set',
        'restore_drill.record',
        'portal.grant'
      ]
    },
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
