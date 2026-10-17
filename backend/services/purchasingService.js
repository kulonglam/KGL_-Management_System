import PurchaseOrder from '../models/PurchaseOrder.js';
import GoodsReceipt from '../models/GoodsReceipt.js';
import Procurement from '../models/Procurement.js';
import Supplier from '../models/Supplier.js';
import { isDirectorAccount } from './authService.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';
import { roundUgx } from '../utils/money.js';

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

const receiveGoods = async ({ actorUser, id, lines, note }) => {
  const order = await PurchaseOrder.findById(id);
  if (!order) throw createServiceError(404, 'Purchase order not found');
  assertBranch(actorUser, order.branch);
  if (!['approved', 'partial'].includes(order.status)) {
    throw createServiceError(409, 'Receive goods against an approved order');
  }
  const incoming = (Array.isArray(lines) ? lines : []).map((line) => ({
    produceName: normalizeProduceName(line.produceName),
    produceType: normalizeProduceType(line.produceType),
    receivedKg: Number(line.receivedKg)
  }));
  if (incoming.length === 0 || incoming.some((line) => !(line.receivedKg > 0))) {
    throw createServiceError(400, 'Each receipt line needs a positive receivedKg');
  }
  for (const line of incoming) {
    const target = order.lines.find(
      (row) => row.produceName === line.produceName && row.produceType === line.produceType
    );
    if (!target) throw createServiceError(400, `Order has no line for ${line.produceName}`);
    target.receivedKg = Number(target.receivedKg) + Number(line.receivedKg);
  }
  const fullyReceived = order.lines.every((row) => row.receivedKg >= row.orderedKg);
  order.status = fullyReceived ? 'received' : 'partial';
  await order.save();
  const receipt = await GoodsReceipt.create({
    branch: order.branch,
    purchaseOrder: order._id,
    lines: incoming,
    receivedBy: actorUser._id,
    note: String(note || '').slice(0, 500)
  });
  return { order: order.toObject(), receipt: receipt.toObject() };
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
