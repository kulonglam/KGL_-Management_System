import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import AuditLog from '../models/AuditLog.js';
import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';
import Procurement from '../models/Procurement.js';
import { trustedQuery } from '../utils/listQuery.js';

const TRANSACTION_DETAIL_FIELDS = [
  'produceName',
  'produceType',
  'tonnageKg',
  'buyerName',
  'dealerName',
  'amountPaidUgx',
  'amountDueUgx',
  'balanceUgx',
  'costUgx',
  'sellingPrice'
];

const ENTITY_SOURCES = {
  sale: Sale,
  creditSale: CreditSale,
  procurement: Procurement
};

const ENTITY_DETAIL_FIELDS = {
  sale: ['produceName', 'produceType', 'tonnageKg', 'buyerName', 'amountPaidUgx'],
  creditSale: ['produceName', 'produceType', 'tonnageKg', 'buyerName', 'amountDueUgx', 'balanceUgx'],
  procurement: ['produceName', 'produceType', 'tonnageKg', 'dealerName', 'costUgx', 'sellingPrice']
};

const hasAuditDetails = (metadata) =>
  Boolean(metadata && typeof metadata === 'object' && !Array.isArray(metadata) && Object.keys(metadata).length > 0);

const isBlankDetail = (value) => value === undefined || value === null || value === '';

const needsSourceDetails = (entityType, metadata) => {
  const fields = ENTITY_DETAIL_FIELDS[entityType];
  if (!fields) return false;
  return fields.some((field) => isBlankDetail(metadata?.[field]));
};

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

// Fill blank transaction facts from the live record. Stored facts stay when that record is gone.
const enrichAuditItems = async (items) => {
  const missingIds = {
    sale: new Set(),
    creditSale: new Set(),
    procurement: new Set()
  };

  for (const item of items) {
    if (!ENTITY_SOURCES[item.entityType] || !item.entityId || !needsSourceDetails(item.entityType, item.metadata)) {
      continue;
    }
    missingIds[item.entityType].add(String(item.entityId));
  }

  const loaded = {};
  await Promise.all(
    Object.entries(missingIds).map(async ([entityType, ids]) => {
      const validIds = [...ids].filter((id) => mongoose.isValidObjectId(id));
      if (validIds.length === 0) {
        loaded[entityType] = new Map();
        return;
      }
      const docs = await ENTITY_SOURCES[entityType]
        .find({ _id: trustedQuery({ $in: validIds }) })
        .select(TRANSACTION_DETAIL_FIELDS.join(' '))
        .lean();
      loaded[entityType] = new Map((docs || []).map((doc) => [String(doc._id), doc]));
    })
  );

  return items.map((item) => {
    const doc = loaded[item.entityType]?.get(String(item.entityId));
    if (doc) {
      const stored = hasAuditDetails(item.metadata) ? item.metadata : {};
      return { ...item, metadata: { ...transactionAuditMetadata(doc), ...stored } };
    }
    if (!hasAuditDetails(item.metadata) && ENTITY_SOURCES[item.entityType]) {
      return {
        ...item,
        detailsNote: 'The original record is no longer available.'
      };
    }
    return item;
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
