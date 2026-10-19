import PurchaseOrder from '../models/PurchaseOrder.js';
import GoodsReceipt from '../models/GoodsReceipt.js';
import Procurement from '../models/Procurement.js';
import Supplier from '../models/Supplier.js';
import PriceSetting from '../models/PriceSetting.js';
import { isDirectorAccount } from './authService.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';
import { roundUgx } from '../utils/money.js';
import { trustedQuery } from '../utils/listQuery.js';
import { businessToday } from '../utils/businessTime.js';
import { runInTransaction } from '../utils/transaction.js';
import { recordProcurementLot } from './stockLotService.js';
import { postDocumentJournal, rememberJournal } from './journalPostingService.js';

const createServiceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const assertBranch = (actorUser, branch) => {
  if (!isDirectorAccount(actorUser) && actorUser.branch !== branch) {
    throw createServiceError(403, 'Access denied to this branch data');
  }
};

const normalizeLines = (lines) => {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw createServiceError(400, 'At least one produce line is required');
  }
  return lines.map((line) => ({
    produceName: normalizeProduceName(line.produceName),
    produceType: normalizeProduceType(line.produceType),
    orderedKg: Number(line.orderedKg),
    unitCostUgx: roundUgx(line.unitCostUgx),
    receivedKg: 0
  }));
};

const createPurchaseOrder = async ({ actorUser, supplierId, lines, note }) => {
  const supplier = await Supplier.findById(supplierId);
  if (!supplier || supplier.deletedAt) throw createServiceError(404, 'Supplier not found');
  assertBranch(actorUser, supplier.branch);
  const order = await PurchaseOrder.create({
    branch: supplier.branch,
    supplier: supplier._id,
    lines: normalizeLines(lines).map((line) => {
      if (!line.produceName || !line.produceType || !(line.orderedKg > 0)) {
        throw createServiceError(400, 'Each line needs produce, type, and orderedKg');
      }
      return line;
    }),
    note: String(note || '').slice(0, 500),
    createdBy: actorUser._id
  });
  return order.toObject();
};

const listPurchaseOrders = async ({ actorUser, branch }) => {
  const filter = {};
  if (!isDirectorAccount(actorUser)) filter.branch = actorUser.branch;
  else if (branch) filter.branch = branch;
  return PurchaseOrder.find(filter).sort({ createdAt: -1 }).limit(100).populate('supplier', 'name').lean();
};

const approvePurchaseOrder = async ({ actorUser, id }) => {
  const order = await PurchaseOrder.findById(id);
  if (!order) throw createServiceError(404, 'Purchase order not found');
  assertBranch(actorUser, order.branch);
  if (order.status !== 'draft') throw createServiceError(409, 'Only a draft order can be approved');
  if (String(order.createdBy) === String(actorUser._id)) {
    throw createServiceError(403, 'The person who created the order cannot approve it');
  }
  order.status = 'approved';
  order.approvedBy = actorUser._id;
  order.approvedAt = new Date();
  await order.save();
  return order.toObject();
};

const sellingPriceFor = async (branch, produceName, produceType, fallback) => {
  const named = await PriceSetting.findOne({ branch, produceType, produceName }).select('priceUgx').lean();
  if (named?.priceUgx) return named.priceUgx;
  const typeDefault = await PriceSetting.findOne({
    branch,
    produceType,
    produceName: trustedQuery({ $in: [null, ''] })
  })
    .select('priceUgx')
    .lean();
  return Math.max(typeDefault?.priceUgx || fallback || 0, 10000);
};

const receiveGoods = async ({ actorUser, id, lines, note }) => {
  const order = await PurchaseOrder.findById(id);
  if (!order) throw createServiceError(404, 'Purchase order not found');
  assertBranch(actorUser, order.branch);
  if (!['approved', 'partial'].includes(order.status)) {
    throw createServiceError(409, 'Receive goods against an approved order');
  }
  const supplier = await Supplier.findById(order.supplier);
  if (!supplier) throw createServiceError(404, 'Supplier not found');
  const minimumKg = supplier.sourceType === 'individual' ? 1000 : 100;
  const incoming = (Array.isArray(lines) ? lines : []).map((line) => ({
    produceName: normalizeProduceName(line.produceName),
    produceType: normalizeProduceType(line.produceType),
    receivedKg: Number(line.receivedKg),
    expiryDate: line.expiryDate ? new Date(line.expiryDate) : null
  }));
  if (incoming.length === 0 || incoming.some((line) => !(line.receivedKg > 0))) {
    throw createServiceError(400, 'Each receipt line needs a positive receivedKg');
  }
  const priced = [];
  for (const line of incoming) {
    const target = order.lines.find(
      (row) => row.produceName === line.produceName && row.produceType === line.produceType
    );
    if (!target) throw createServiceError(400, `Order has no line for ${line.produceName}`);
    if (line.receivedKg < minimumKg) {
      throw createServiceError(400, `Receive at least ${minimumKg} kg of ${line.produceName} so it can enter stock`);
    }
    const costUgx = roundUgx(line.receivedKg * Number(target.unitCostUgx || 0));
    if (costUgx < 10000) {
      throw createServiceError(400, `The receipt cost for ${line.produceName} must be at least 10000 UGX`);
    }
    target.receivedKg = Number(target.receivedKg) + Number(line.receivedKg);
    priced.push({
      ...line,
      costUgx,
      sellingPrice: await sellingPriceFor(order.branch, line.produceName, line.produceType, target.unitCostUgx)
    });
  }
  const fullyReceived = order.lines.every((row) => row.receivedKg >= row.orderedKg);
  order.status = fullyReceived ? 'received' : 'partial';
  const timeReceived = new Intl.DateTimeFormat('en-GB', {
    timeZone: process.env.BUSINESS_TIMEZONE || 'Africa/Kampala',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(new Date());

  let journalInTransaction = false;
  const result = await runInTransaction(async (session) => {
    await order.save(session ? { session } : undefined);
    const receiptPayload = {
      branch: order.branch,
      purchaseOrder: order._id,
      lines: priced.map((line) => ({
        produceName: line.produceName,
        produceType: line.produceType,
        receivedKg: line.receivedKg
      })),
      receivedBy: actorUser._id,
      note: String(note || '').slice(0, 500)
    };
    const receipt = session
      ? (await GoodsReceipt.create([receiptPayload], { session }))[0]
      : await GoodsReceipt.create(receiptPayload);
    const procurements = [];
    for (const [index, line] of priced.entries()) {
      const payload = {
        produceName: line.produceName,
        produceType: line.produceType,
        sourceType: supplier.sourceType,
        dateReceived: businessToday(),
        timeReceived,
        tonnageKg: line.receivedKg,
        costUgx: line.costUgx,
        dealerName: supplier.name,
        dealerContact: supplier.contact,
        supplier: supplier._id,
        purchaseOrder: order._id,
        lotCode: `PO-${String(order._id).slice(-6)}-${index + 1}`.slice(0, 40),
        expiryDate: line.expiryDate,
        branch: order.branch,
        sellingPrice: line.sellingPrice,
        recordedBy: actorUser._id
      };
      const procurement = session
        ? (await Procurement.create([payload], { session }))[0]
        : await Procurement.create(payload);
      await recordProcurementLot(procurement, session);
      if (session) await postDocumentJournal('procurement', procurement.toObject(), session);
      procurements.push(procurement);
    }
    journalInTransaction = Boolean(session);
    return { receipt, procurements };
  });

  if (!journalInTransaction) {
    for (const procurement of result.procurements) {
      await rememberJournal('procurement', procurement._id);
    }
  }

  return {
    order: order.toObject(),
    receipt: result.receipt.toObject(),
    procurements: result.procurements.map((row) => (typeof row.toObject === 'function' ? row.toObject() : row))
  };
};

const matchPurchaseOrder = async ({ actorUser, id }) => {
  const order = await PurchaseOrder.findById(id).populate('supplier', 'name').lean();
  if (!order) throw createServiceError(404, 'Purchase order not found');
  assertBranch(actorUser, order.branch);
  const procurements = await Procurement.find({ purchaseOrder: order._id, deletedAt: null }).lean();
  const lines = order.lines.map((line) => {
    const invoicedKg = procurements
      .filter((row) => row.produceName === line.produceName && row.produceType === line.produceType)
      .reduce((sum, row) => sum + Number(row.tonnageKg || 0), 0);
    const orderedKg = Number(line.orderedKg);
    const receivedKg = Number(line.receivedKg);
    let status = 'open';
    if (receivedKg >= orderedKg && invoicedKg >= orderedKg) status = 'matched';
    else if (receivedKg !== invoicedKg) status = 'quantity_mismatch';
    else if (receivedKg > 0) status = 'partial';
    return { ...line, invoicedKg, status };
  });
  return {
    purchaseOrderId: String(order._id),
    supplierName: order.supplier?.name || '',
    status: order.status,
    matched: lines.every((line) => line.status === 'matched'),
    lines
  };
};

export { approvePurchaseOrder, createPurchaseOrder, listPurchaseOrders, matchPurchaseOrder, receiveGoods };
