import AuditLog from '../models/AuditLog.js';
import MessageOutbox from '../models/MessageOutbox.js';
import StockNotification from '../models/StockNotification.js';
import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';
import RetentionPolicy from '../models/RetentionPolicy.js';
import { allowAppendOnlyNativeWrite } from '../utils/appendOnly.js';
import { buildZip } from '../utils/zipStore.js';

const DEFAULT_POLICY = {
  key: 'default',
  auditLogDays: 2555,
  messageOutboxDays: 365,
  stockNotificationDays: 180,
  anonymizeBuyerAfterDays: 2555
};

const getRetentionPolicy = async () => {
  let policy = await RetentionPolicy.findOne({ key: 'default' });
  if (!policy) policy = await RetentionPolicy.create(DEFAULT_POLICY);
  return policy;
};

const updateRetentionPolicy = async ({ actorUser, payload }) => {
  const policy = await getRetentionPolicy();
  for (const field of [
    'auditLogDays',
    'messageOutboxDays',
    'stockNotificationDays',
    'anonymizeBuyerAfterDays'
  ]) {
    if (payload[field] !== undefined) {
      const value = Number(payload[field]);
      if (!Number.isFinite(value) || value < 30) {
        const error = new Error(`${field} must be at least 30 days`);
        error.statusCode = 400;
        throw error;
      }
      policy[field] = Math.floor(value);
    }
  }
  policy.updatedBy = actorUser._id;
  await policy.save();
  return policy;
};

const cutoff = (days) => new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

const runRetentionJob = async ({ actorUser } = {}) => {
  const policy = await getRetentionPolicy();
  const summary = {
    auditLogsDeleted: 0,
    messagesDeleted: 0,
    notificationsDeleted: 0,
    buyersAnonymized: 0,
    ranAt: new Date().toISOString(),
    ranBy: actorUser?._id || null
  };

  const auditCutoff = cutoff(policy.auditLogDays);
  await allowAppendOnlyNativeWrite(async () => {
    const result = await AuditLog.collection.deleteMany({ createdAt: { $lt: auditCutoff } });
    summary.auditLogsDeleted = result.deletedCount || 0;
  });

  const messageResult = await MessageOutbox.deleteMany({
    createdAt: { $lt: cutoff(policy.messageOutboxDays) }
  });
  summary.messagesDeleted = messageResult.deletedCount || 0;

  const noteResult = await StockNotification.deleteMany({
    createdAt: { $lt: cutoff(policy.stockNotificationDays) }
  });
  summary.notificationsDeleted = noteResult.deletedCount || 0;

  const anonCutoff = cutoff(policy.anonymizeBuyerAfterDays);
  // Bypass schema validators so historical NIN/location can be scrubbed.
  const saleAnon = await Sale.collection.updateMany(
    { createdAt: { $lt: anonCutoff }, buyerName: { $ne: 'REDACTED' } },
    { $set: { buyerName: 'REDACTED' } }
  );
  const creditAnon = await CreditSale.collection.updateMany(
    { createdAt: { $lt: anonCutoff }, buyerName: { $ne: 'REDACTED' } },
    {
      $set: {
        buyerName: 'REDACTED',
        nationalId: 'CM000000000000',
        nationalIdHash: null,
        location: 'REDACTED',
        contact: '0700000000'
      }
    }
  );
  summary.buyersAnonymized = (saleAnon.modifiedCount || 0) + (creditAnon.modifiedCount || 0);

  policy.lastRunAt = new Date();
  policy.lastRunSummary = summary;
  if (actorUser?._id) policy.updatedBy = actorUser._id;
  await policy.save();
  const { emitDomainEvent } = await import('./webhookService.js');
  emitDomainEvent('retention.completed', { ...summary, ranAt: policy.lastRunAt }).catch(() => {});
  return { policy, summary };
};

const buildAuditExportPack = async ({ from, to, branch } = {}) => {
  const filter = {};
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  if (branch) filter.branch = branch;

  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(5000).lean();
  const manifest = {
    generatedAt: new Date().toISOString(),
    from: from || null,
    to: to || null,
    branch: branch || null,
    count: logs.length
  };

  const zip = buildZip([
    { name: 'manifest.json', data: JSON.stringify(manifest, null, 2) },
    { name: 'audit-logs.json', data: JSON.stringify(logs, null, 2) }
  ]);

  return { zip, manifest };
};

export { getRetentionPolicy, updateRetentionPolicy, runRetentionJob, buildAuditExportPack };
