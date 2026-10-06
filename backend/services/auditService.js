import logger from '../utils/logger.js';
import AuditLog from '../models/AuditLog.js';
import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';
import Procurement from '../models/Procurement.js';

const TRANSACTION_DETAIL_FIELDS = [
  'produceName',
  'produceType',
  'tonnageKg',
  'buyerName',
  'amountPaidUgx',
  'amountDueUgx',
  'balanceUgx'
];

const ENTITY_SOURCES = {
  sale: Sale,
  creditSale: CreditSale,
  procurement: Procurement
};

const hasAuditDetails = (metadata) =>
  Boolean(metadata && typeof metadata === 'object' && !Array.isArray(metadata) && Object.keys(metadata).length > 0);

const transactionAuditMetadata = (record, extra = {}) => {
  const metadata = {};
  for (const field of TRANSACTION_DETAIL_FIELDS) {
    const value = record?.[field];
    if (value !== undefined && value !== null && value !== '') {
      metadata[field] = value;
    }
  }
  for (const [key, value] of Object.entries(extra)) {
    if (value !== undefined && value !== null && value !== '') {
      metadata[key] = value;
    }
  }
  return metadata;
};

// Fill details for older transaction rows that were stored without metadata.
const enrichAuditItems = async (items) => {
  const missingIds = {
    sale: new Set(),
    creditSale: new Set(),
    procurement: new Set()
  };

  for (const item of items) {
    if (hasAuditDetails(item.metadata) || !ENTITY_SOURCES[item.entityType] || !item.entityId) {
      continue;
    }
    missingIds[item.entityType].add(String(item.entityId));
  }

  const loaded = {};
  await Promise.all(
    Object.entries(missingIds).map(async ([entityType, ids]) => {
      if (ids.size === 0) {
        loaded[entityType] = new Map();
        return;
      }
      const docs = await ENTITY_SOURCES[entityType]
        .find({ _id: { $in: [...ids] } })
        .select(TRANSACTION_DETAIL_FIELDS.join(' '))
        .lean();
      loaded[entityType] = new Map((docs || []).map((doc) => [String(doc._id), doc]));
    })
  );

  return items.map((item) => {
    if (hasAuditDetails(item.metadata)) {
      return item;
    }
    const doc = loaded[item.entityType]?.get(String(item.entityId));
    if (!doc) {
      return item;
    }
    return { ...item, metadata: transactionAuditMetadata(doc) };
  });
};

const recordAudit = async ({ actor, action, entityType, entityId, branch, metadata = {} }) => {
  try {
    await AuditLog.create({
      actorId: actor?._id || null,
      actorName: actor?.name || '',
      actorRole: actor?.role || '',
      action,
      entityType,
      entityId: entityId ? String(entityId) : '',
      branch: branch || actor?.branch || '',
      metadata
    });
  } catch (error) {
    logger.warn('audit.write.failed', { message: error.message, entityType, action });
  }
};

export { enrichAuditItems, recordAudit, transactionAuditMetadata };
