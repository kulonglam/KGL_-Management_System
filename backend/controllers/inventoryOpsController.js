import StockTransfer from '../models/StockTransfer.js';
import StockAdjustment from '../models/StockAdjustment.js';
import StocktakeSession from '../models/StocktakeSession.js';
import {
  createTransfer,
  shipTransfer,
  receiveTransfer,
  cancelTransfer,
  createAdjustment,
  approveAdjustment,
  rejectAdjustment,
  createStocktake,
  updateStocktakeCounts,
  postStocktake,
  REASON_CODES,
  approvalThresholdKg
} from '../services/inventoryOpsService.js';
import { listStockMovements } from '../services/stockMovementService.js';
import { recordAudit } from '../services/auditService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { buildDateRangeFilter, resolveSort } from '../utils/listQuery.js';
import { forwardControllerError } from '../utils/httpError.js';
import { isDirectorAccount } from '../services/authService.js';

const listMovements = async (req, res, next) => {
  try {
    const filter = {};
    if (!isDirectorAccount(req.user)) {
      filter.branch = req.user.branch;
    } else if (req.query.branch) {
      filter.branch = req.query.branch;
    }
    if (req.query.type) filter.type = req.query.type;
    if (req.query.produceType) filter.produceType = req.query.produceType;

    const dateRange = buildDateRangeFilter(req.query.from, req.query.to);
    if (dateRange.error) {
      return res.status(400).json({ message: dateRange.error });
    }
    if (dateRange.filter) filter.createdAt = dateRange.filter;

    const pagination = parsePagination(req.query);
    const items = await listStockMovements({ filter, pagination });
    if (!pagination.enabled) {
      return res.json(items);
    }
    const StockMovement = (await import('../models/StockMovement.js')).default;
    const total = await StockMovement.countDocuments(filter);
    return res.json({
      items,
      pagination: buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total })
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const listTransfers = async (req, res, next) => {
  try {
    const filter = {};
    if (!isDirectorAccount(req.user)) {
      filter.$or = [{ fromBranch: req.user.branch }, { toBranch: req.user.branch }];
    }
    if (req.query.status) filter.status = req.query.status;
    const pagination = parsePagination(req.query);
    const sort = resolveSort(req.query.sort, { newest: { createdAt: -1 }, oldest: { createdAt: 1 } }, {
      createdAt: -1
    });
    const query = StockTransfer.find(filter).sort(sort).lean();
    if (pagination.enabled) query.skip(pagination.skip).limit(pagination.limit);
    else query.limit(100);
    const items = await query;
    if (!pagination.enabled) return res.json(items);
    const total = await StockTransfer.countDocuments(filter);
    return res.json({
      items,
      pagination: buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total })
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const createTransferHandler = async (req, res, next) => {
  try {
    const transfer = await createTransfer({ actorUser: req.user, payload: req.body });
    await recordAudit({
      actor: req.user,
      action: 'create',
      entityType: 'stockTransfer',
      entityId: transfer._id,
      branch: transfer.fromBranch,
      metadata: { toBranch: transfer.toBranch, lines: transfer.lines.length }
    });
    res.status(201).json(transfer);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const shipTransferHandler = async (req, res, next) => {
  try {
    const transfer = await shipTransfer({ actorUser: req.user, transferId: req.params.id });
    await recordAudit({
      actor: req.user,
      action: 'update',
      entityType: 'stockTransfer',
      entityId: transfer._id,
      branch: transfer.fromBranch,
      metadata: { status: 'in_transit' }
    });
    res.json(transfer);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const receiveTransferHandler = async (req, res, next) => {
  try {
    const transfer = await receiveTransfer({ actorUser: req.user, transferId: req.params.id });
    await recordAudit({
      actor: req.user,
      action: 'update',
      entityType: 'stockTransfer',
      entityId: transfer._id,
      branch: transfer.toBranch,
      metadata: { status: 'received' }
    });
    res.json(transfer);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const cancelTransferHandler = async (req, res, next) => {
  try {
    const transfer = await cancelTransfer({ actorUser: req.user, transferId: req.params.id });
    await recordAudit({
      actor: req.user,
      action: 'update',
      entityType: 'stockTransfer',
      entityId: transfer._id,
      branch: transfer.fromBranch,
      metadata: { status: 'cancelled' }
    });
    res.json(transfer);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const listAdjustments = async (req, res, next) => {
  try {
    const filter = {};
    if (!isDirectorAccount(req.user)) filter.branch = req.user.branch;
    if (req.query.status) filter.status = req.query.status;
    const pagination = parsePagination(req.query);
    const query = StockAdjustment.find(filter).sort({ createdAt: -1 }).lean();
    if (pagination.enabled) query.skip(pagination.skip).limit(pagination.limit);
    else query.limit(100);
    const items = await query;
    if (!pagination.enabled) {
      return res.json({ items, meta: { reasonCodes: REASON_CODES, approvalThresholdKg: approvalThresholdKg() } });
    }
    const total = await StockAdjustment.countDocuments(filter);
    return res.json({
      items,
      pagination: buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total }),
      meta: { reasonCodes: REASON_CODES, approvalThresholdKg: approvalThresholdKg() }
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const createAdjustmentHandler = async (req, res, next) => {
  try {
    const adjustment = await createAdjustment({ actorUser: req.user, payload: req.body });
    await recordAudit({
      actor: req.user,
      action: 'create',
      entityType: 'stockAdjustment',
      entityId: adjustment._id,
      branch: adjustment.branch,
      metadata: {
        deltaKg: adjustment.deltaKg,
        reasonCode: adjustment.reasonCode,
        status: adjustment.status
      }
    });
    res.status(201).json(adjustment);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const approveAdjustmentHandler = async (req, res, next) => {
  try {
    const adjustment = await approveAdjustment({ actorUser: req.user, adjustmentId: req.params.id });
    await recordAudit({
      actor: req.user,
      action: 'update',
      entityType: 'stockAdjustment',
      entityId: adjustment._id,
      branch: adjustment.branch,
      metadata: { status: 'applied' }
    });
    res.json(adjustment);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const rejectAdjustmentHandler = async (req, res, next) => {
  try {
    const adjustment = await rejectAdjustment({ actorUser: req.user, adjustmentId: req.params.id });
    await recordAudit({
      actor: req.user,
      action: 'update',
      entityType: 'stockAdjustment',
      entityId: adjustment._id,
      branch: adjustment.branch,
      metadata: { status: 'rejected' }
    });
    res.json(adjustment);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const listStocktakes = async (req, res, next) => {
  try {
    const filter = {};
    if (!isDirectorAccount(req.user)) filter.branch = req.user.branch;
    if (req.query.status) filter.status = req.query.status;
    const items = await StocktakeSession.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    res.json(items);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const getStocktake = async (req, res, next) => {
  try {
    const session = await StocktakeSession.findById(req.params.id).lean();
    if (!session) return res.status(404).json({ message: 'Stocktake session not found' });
    if (!isDirectorAccount(req.user) && session.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }
    res.json(session);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const csvCell = (value) => {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// Printable count sheet. System quantities are hidden unless blind=false so counters
// record what they see rather than confirming the book figure.
const getStocktakeCountSheet = async (req, res, next) => {
  try {
    const session = await StocktakeSession.findById(req.params.id).lean();
    if (!session) return res.status(404).json({ message: 'Stocktake session not found' });
    if (!isDirectorAccount(req.user) && session.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }
    const blind = String(req.query.blind ?? 'true') !== 'false';
    const header = ['#', 'produceName', 'produceType', ...(blind ? [] : ['systemKg']), 'countedKg', 'countedBy', 'notes'];
    const rows = [
      `# Stocktake count sheet,${csvCell(session.branch)},${new Date(session.createdAt).toISOString()},${session._id}`,
      header.join(',')
    ];
    session.lines.forEach((line, index) => {
      rows.push(
        [
          index + 1,
          csvCell(line.produceName),
          csvCell(line.produceType),
          ...(blind ? [] : [line.systemKg]),
          '',
          '',
          ''
        ].join(',')
      );
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="stocktake-${session.branch}-${session._id}.csv"`
    );
    return res.send(`${rows.join('\n')}\n`);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const createStocktakeHandler = async (req, res, next) => {
  try {
    const session = await createStocktake({ actorUser: req.user, payload: req.body });
    await recordAudit({
      actor: req.user,
      action: 'create',
      entityType: 'stocktake',
      entityId: session._id,
      branch: session.branch,
      metadata: { lines: session.lines.length }
    });
    res.status(201).json(session);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const updateStocktakeHandler = async (req, res, next) => {
  try {
    const session = await updateStocktakeCounts({
      actorUser: req.user,
      sessionId: req.params.id,
      lines: req.body.lines
    });
    res.json(session);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const postStocktakeHandler = async (req, res, next) => {
  try {
    const session = await postStocktake({ actorUser: req.user, sessionId: req.params.id });
    await recordAudit({
      actor: req.user,
      action: 'update',
      entityType: 'stocktake',
      entityId: session._id,
      branch: session.branch,
      metadata: { status: 'posted' }
    });
    res.json(session);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

export {
  listMovements,
  listTransfers,
  createTransferHandler,
  shipTransferHandler,
  receiveTransferHandler,
  cancelTransferHandler,
  listAdjustments,
  createAdjustmentHandler,
  approveAdjustmentHandler,
  rejectAdjustmentHandler,
  listStocktakes,
  getStocktake,
  getStocktakeCountSheet,
  createStocktakeHandler,
  updateStocktakeHandler,
  postStocktakeHandler
};
