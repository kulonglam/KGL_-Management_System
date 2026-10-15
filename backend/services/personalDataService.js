import TrustedBuyer from '../models/TrustedBuyer.js';
import CreditSale from '../models/CreditSale.js';
import Sale from '../models/Sale.js';
import Procurement from '../models/Procurement.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import MessageOutbox from '../models/MessageOutbox.js';
import { includeRemoved } from '../utils/softDelete.js';
import { trustedQuery } from '../utils/listQuery.js';

const createServiceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const USER_SECRET_FIELDS =
  '-password -recoveryCodeHashes -mfaSecret -mfaPendingSecret -previousRefreshJti -tokenVersion -refreshTokenVersion';

const messagesTo = (recipients) => {
  const list = recipients.filter(Boolean);
  if (list.length === 0) return [];
  return MessageOutbox.find({ to: trustedQuery({ $in: list }) })
    .select('channel to subject status createdAt sentAt relatedType')
    .sort({ createdAt: -1 })
    .limit(1000)
    .lean();
};

// Everything held about one trusted buyer, including removed and voided records.
const exportTrustedBuyerData = async (buyerId) => {
  const buyer = await TrustedBuyer.findOne({ _id: buyerId, deletedAt: includeRemoved() }).lean();
  if (!buyer) throw createServiceError(404, 'Trusted buyer not found');
  const creditSales = await CreditSale.find({ trustedBuyer: buyer._id, deletedAt: includeRemoved() })
    .select('-__v')
    .sort({ dateOfDispatch: 1 })
    .lean();
  const entityIds = [String(buyer._id), ...creditSales.map((sale) => String(sale._id))];
  const [auditTrail, messages] = await Promise.all([
    AuditLog.find({ entityId: trustedQuery({ $in: entityIds }) })
      .select('action entityType entityId actorName actorRole createdAt')
      .sort({ createdAt: 1 })
      .lean(),
    messagesTo([buyer.email, buyer.contact])
  ]);
  return {
    subjectType: 'trusted_buyer',
    exportedAt: new Date().toISOString(),
    profile: buyer,
    creditSales,
    messages,
    auditTrail
  };
};

// Profile and activity for a staff account, without credentials or MFA secrets.
const exportUserData = async (userId) => {
  const user = await User.findOne({ _id: userId, deletedAt: includeRemoved() }).select(USER_SECRET_FIELDS).lean();
  if (!user) throw createServiceError(404, 'User not found');
  const recordedBy = { recordedBy: user._id, deletedAt: includeRemoved() };
  const [sales, creditSales, procurements, auditTrail, messages] = await Promise.all([
    Sale.find(recordedBy).select('_id branch date amountPaidUgx produceName voidedAt deletedAt').lean(),
    CreditSale.find(recordedBy).select('_id branch dateOfDispatch amountDueUgx produceName voidedAt deletedAt').lean(),
    Procurement.find(recordedBy).select('_id branch dateReceived costUgx produceName deletedAt').lean(),
    AuditLog.find({ actorId: user._id })
      .select('action entityType entityId branch createdAt')
      .sort({ createdAt: 1 })
      .limit(5000)
      .lean(),
    messagesTo([user.username, user.email])
  ]);
  return {
    subjectType: 'user',
    exportedAt: new Date().toISOString(),
    profile: user,
    recordsCreated: { sales, creditSales, procurements },
    auditTrail,
    messages
  };
};

export { exportTrustedBuyerData, exportUserData };
