import StockTransfer from '../models/StockTransfer.js';
import StockAdjustment, { REASON_CODES } from '../models/StockAdjustment.js';
import StocktakeSession from '../models/StocktakeSession.js';
import StockBalance from '../models/StockBalance.js';
import { appendStockMovement } from './stockMovementService.js';
import { calculateInventoryByFilter, getBucketTonnage } from './inventoryService.js';
import { withStockLocks } from './stockLockService.js';
import { runInTransaction } from '../utils/transaction.js';
import { postSameCompanyTransfer } from './intercompanyService.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';
import { deniesBranchAccess } from '../utils/branchAccess.js';
import { isDirectorAccount } from './authService.js';
import { syncStockLevelNotifications } from './stockNotificationService.js';

const createServiceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const approvalThresholdKg = () => {
  const configured = Number(process.env.ADJUST_APPROVAL_KG);
  return Number.isFinite(configured) && configured > 0 ? configured : 500;
};

const assertManagerBranch = (user, branch) => {
  if (isDirectorAccount(user)) return;
  if (deniesBranchAccess(user, branch)) {
    throw createServiceError(403, 'Access denied to this branch data');
  }
};

const refreshNotifications = async (branch, produceName, produceType) => {
  const snapshot = await calculateInventoryByFilter({ branch });
  await syncStockLevelNotifications({
    branch,
    produceName,
    produceType,
    remainingStock: getBucketTonnage(snapshot, produceName, produceType, branch)
  });
};

const createTransfer = async ({ actorUser, payload }) => {
  const fromBranch = String(payload.fromBranch || actorUser.branch || '').trim();
  const toBranch = String(payload.toBranch || '').trim();
  if (!fromBranch || !toBranch) {
    throw createServiceError(400, 'fromBranch and toBranch are required');
  }
  if (fromBranch === toBranch) {
    throw createServiceError(400, 'Cannot transfer stock to the same branch');
  }
  if (!isDirectorAccount(actorUser) && actorUser.branch !== fromBranch) {
    throw createServiceError(403, 'Managers can only ship from their own branch');
  }

  const lines = (payload.lines || []).map((line) => ({
    produceName: normalizeProduceName(line.produceName),
    produceType: normalizeProduceType(line.produceType),
    tonnageKg: Number(line.tonnageKg)
  }));
  if (lines.length === 0) {
    throw createServiceError(400, 'At least one transfer line is required');
  }
  for (const line of lines) {
    if (!line.produceName || !line.produceType || !(line.tonnageKg > 0)) {
      throw createServiceError(400, 'Each transfer line needs produce and positive tonnage');
    }
  }

  return StockTransfer.create({
    fromBranch,
    toBranch,
    lines,
    note: String(payload.note || '').slice(0, 500),
    createdBy: actorUser._id,
    status: 'draft'
  });
};

const shipTransfer = async ({ actorUser, transferId }) => {
  const transfer = await StockTransfer.findById(transferId);
  if (!transfer) throw createServiceError(404, 'Transfer not found');
  if (transfer.status !== 'draft') {
    throw createServiceError(400, `Cannot ship a transfer in status ${transfer.status}`);
  }
  if (!isDirectorAccount(actorUser) && actorUser.branch !== transfer.fromBranch) {
    throw createServiceError(403, 'Only the source branch manager (or director) can ship');
  }

  const lockInputs = transfer.lines.map((line) => ({
    branch: transfer.fromBranch,
    produceName: line.produceName,
    produceType: line.produceType
  }));

  await withStockLocks(lockInputs, async () => {
    const snapshot = await calculateInventoryByFilter({ branch: transfer.fromBranch });
    for (const line of transfer.lines) {
      const available = getBucketTonnage(
        snapshot,
        line.produceName,
        line.produceType,
        transfer.fromBranch
      );
      if (available < line.tonnageKg) {
        throw createServiceError(
          400,
          `Insufficient stock for ${line.produceName}. Available: ${available} kg`
        );
      }
    }

    await runInTransaction(async (session) => {
      for (const line of transfer.lines) {
        await appendStockMovement(
          {
            type: 'transfer_out',
            branch: transfer.fromBranch,
            produceName: line.produceName,
            produceType: line.produceType,
            qtyKg: -Number(line.tonnageKg),
            refType: 'transfer',
            refId: transfer._id,
            actor: actorUser._id,
            note: `Transfer to ${transfer.toBranch}`
          },
          session
        );
      }
      transfer.status = 'in_transit';
      transfer.shippedBy = actorUser._id;
      transfer.shippedAt = new Date();
      await transfer.save(session ? { session } : undefined);
    });
  });

  for (const line of transfer.lines) {
    await refreshNotifications(transfer.fromBranch, line.produceName, line.produceType);
  }
  return transfer;
};

const receiveTransfer = async ({ actorUser, transferId }) => {
  const transfer = await StockTransfer.findById(transferId);
  if (!transfer) throw createServiceError(404, 'Transfer not found');
  if (transfer.status !== 'in_transit') {
    throw createServiceError(400, `Cannot receive a transfer in status ${transfer.status}`);
  }
  if (!isDirectorAccount(actorUser) && actorUser.branch !== transfer.toBranch) {
    throw createServiceError(403, 'Only the destination branch manager (or director) can receive');
  }

  const lockInputs = transfer.lines.map((line) => ({
    branch: transfer.toBranch,
    produceName: line.produceName,
    produceType: line.produceType
  }));

  await withStockLocks(lockInputs, async () => {
    await runInTransaction(async (session) => {
      for (const line of transfer.lines) {
        await appendStockMovement(
          {
            type: 'transfer_in',
            branch: transfer.toBranch,
            produceName: line.produceName,
            produceType: line.produceType,
            qtyKg: Number(line.tonnageKg),
            refType: 'transfer',
            refId: transfer._id,
            actor: actorUser._id,
            note: `Transfer from ${transfer.fromBranch}`
          },
          session
        );
      }
      transfer.status = 'received';
      transfer.receivedBy = actorUser._id;
      transfer.receivedAt = new Date();
      await transfer.save(session ? { session } : undefined);
    });
  });

  for (const line of transfer.lines) {
    await refreshNotifications(transfer.toBranch, line.produceName, line.produceType);
  }
  await postSameCompanyTransfer(transfer).catch(() => {});
  return transfer;
};

const cancelTransfer = async ({ actorUser, transferId }) => {
  const transfer = await StockTransfer.findById(transferId);
  if (!transfer) throw createServiceError(404, 'Transfer not found');
  if (!['draft', 'in_transit'].includes(transfer.status)) {
    throw createServiceError(400, `Cannot cancel a transfer in status ${transfer.status}`);
  }
  if (
    !isDirectorAccount(actorUser) &&
    actorUser.branch !== transfer.fromBranch &&
    actorUser.branch !== transfer.toBranch
  ) {
    throw createServiceError(403, 'Access denied for this transfer');
  }

  if (transfer.status === 'draft') {
    transfer.status = 'cancelled';
    transfer.cancelledBy = actorUser._id;
    transfer.cancelledAt = new Date();
    await transfer.save();
    return transfer;
  }

  const lockInputs = transfer.lines.map((line) => ({
    branch: transfer.fromBranch,
    produceName: line.produceName,
    produceType: line.produceType
  }));

  await withStockLocks(lockInputs, async () => {
    await runInTransaction(async (session) => {
      for (const line of transfer.lines) {
        await appendStockMovement(
          {
            type: 'transfer_in',
            branch: transfer.fromBranch,
            produceName: line.produceName,
            produceType: line.produceType,
            qtyKg: Number(line.tonnageKg),
            refType: 'transfer',
            refId: transfer._id,
            actor: actorUser._id,
            note: 'Transfer cancelled — stock returned to source',
            reasonCode: 'correction'
          },
          session
        );
      }
      transfer.status = 'cancelled';
      transfer.cancelledBy = actorUser._id;
      transfer.cancelledAt = new Date();
      await transfer.save(session ? { session } : undefined);
    });
  });

  for (const line of transfer.lines) {
    await refreshNotifications(transfer.fromBranch, line.produceName, line.produceType);
  }
  return transfer;
};

const createAdjustment = async ({ actorUser, payload }) => {
  const branch = String(payload.branch || actorUser.branch || '').trim();
  assertManagerBranch(actorUser, branch);

  const produceName = normalizeProduceName(payload.produceName);
  const produceType = normalizeProduceType(payload.produceType);
  const deltaKg = Number(payload.deltaKg);
  const reasonCode = String(payload.reasonCode || '');
  const note = String(payload.note || '').trim();

  if (!produceName || !produceType) {
    throw createServiceError(400, 'produceName and produceType are required');
  }
  if (!Number.isFinite(deltaKg) || deltaKg === 0) {
    throw createServiceError(400, 'deltaKg must be a non-zero number');
  }
  if (!REASON_CODES.includes(reasonCode)) {
    throw createServiceError(400, `reasonCode must be one of: ${REASON_CODES.join(', ')}`);
  }
  if (!note) {
    throw createServiceError(400, 'A note is required for stock adjustments');
  }

  const needsApproval = Math.abs(deltaKg) >= approvalThresholdKg() && !isDirectorAccount(actorUser);

  const adjustment = await StockAdjustment.create({
    branch,
    produceName,
    produceType,
    deltaKg,
    reasonCode,
    note: note.slice(0, 500),
    status: needsApproval ? 'pending' : 'applied',
    requestedBy: actorUser._id,
    approvedBy: needsApproval ? null : actorUser._id,
    appliedAt: needsApproval ? null : new Date()
  });

  if (!needsApproval) {
    await applyAdjustmentMovement(adjustment, actorUser);
  }

  return adjustment;
};

const applyAdjustmentMovement = async (adjustment, actorUser) => {
  await withStockLocks(
    [
      {
        branch: adjustment.branch,
        produceName: adjustment.produceName,
        produceType: adjustment.produceType
      }
    ],
    async () => {
      if (adjustment.deltaKg < 0) {
        const snapshot = await calculateInventoryByFilter({ branch: adjustment.branch });
        const available = getBucketTonnage(
          snapshot,
          adjustment.produceName,
          adjustment.produceType,
          adjustment.branch
        );
        if (available + adjustment.deltaKg < 0) {
          throw createServiceError(
            400,
            `Adjustment would make stock negative. Available: ${available} kg`
          );
        }
      }

      await runInTransaction(async (session) => {
        await appendStockMovement(
          {
            type: 'adjustment',
            branch: adjustment.branch,
            produceName: adjustment.produceName,
            produceType: adjustment.produceType,
            qtyKg: adjustment.deltaKg,
            refType: 'adjustment',
            refId: adjustment._id,
            actor: actorUser._id,
            note: adjustment.note,
            reasonCode: adjustment.reasonCode
          },
          session
        );
      });
    }
  );

  await refreshNotifications(adjustment.branch, adjustment.produceName, adjustment.produceType);
};

const approveAdjustment = async ({ actorUser, adjustmentId }) => {
  const adjustment = await StockAdjustment.findById(adjustmentId);
  if (!adjustment) throw createServiceError(404, 'Adjustment not found');
  if (adjustment.status !== 'pending') {
    throw createServiceError(400, 'Only pending adjustments can be approved');
  }
  if (String(adjustment.requestedBy) === String(actorUser._id) && !isDirectorAccount(actorUser)) {
    throw createServiceError(403, 'A different manager or director must approve this adjustment');
  }
  assertManagerBranch(actorUser, adjustment.branch);

  await applyAdjustmentMovement(adjustment, actorUser);
  adjustment.status = 'applied';
  adjustment.approvedBy = actorUser._id;
  adjustment.appliedAt = new Date();
  await adjustment.save();
  return adjustment;
};

const rejectAdjustment = async ({ actorUser, adjustmentId }) => {
  const adjustment = await StockAdjustment.findById(adjustmentId);
  if (!adjustment) throw createServiceError(404, 'Adjustment not found');
  if (adjustment.status !== 'pending') {
    throw createServiceError(400, 'Only pending adjustments can be rejected');
  }
  assertManagerBranch(actorUser, adjustment.branch);
  adjustment.status = 'rejected';
  adjustment.approvedBy = actorUser._id;
  await adjustment.save();
  return adjustment;
};

const createStocktake = async ({ actorUser, payload }) => {
  const branch = String(payload.branch || actorUser.branch || '').trim();
  assertManagerBranch(actorUser, branch);

  const balances = await StockBalance.find({ branch }).lean();
  const lines = balances.map((row) => ({
    produceName: row.produceName,
    produceType: row.produceType,
    systemKg: Number(row.onHandKg || 0),
    countedKg: null,
    varianceKg: 0
  }));

  return StocktakeSession.create({
    branch,
    lines,
    note: String(payload.note || '').slice(0, 500),
    createdBy: actorUser._id,
    status: 'draft'
  });
};

const updateStocktakeCounts = async ({ actorUser, sessionId, lines }) => {
  const session = await StocktakeSession.findById(sessionId);
  if (!session) throw createServiceError(404, 'Stocktake session not found');
  if (session.status !== 'draft') {
    throw createServiceError(400, 'Only draft stocktakes can be edited');
  }
  assertManagerBranch(actorUser, session.branch);

  const incoming = new Map(
    (lines || []).map((line) => [
      `${normalizeProduceName(line.produceName)}::${normalizeProduceType(line.produceType)}`,
      line.countedKg === null || line.countedKg === undefined || line.countedKg === ''
        ? null
        : Number(line.countedKg)
    ])
  );

  session.lines = session.lines.map((line) => {
    const key = `${line.produceName}::${line.produceType}`;
    if (!incoming.has(key)) return line;
    const counted = incoming.get(key);
    if (counted !== null && (!Number.isFinite(counted) || counted < 0)) {
      throw createServiceError(400, `Invalid counted kg for ${line.produceName}`);
    }
    line.countedKg = counted;
    line.varianceKg = counted === null ? 0 : counted - Number(line.systemKg || 0);
    return line;
  });

  await session.save();
  return session;
};

const postStocktake = async ({ actorUser, sessionId }) => {
  const sessionDoc = await StocktakeSession.findById(sessionId);
  if (!sessionDoc) throw createServiceError(404, 'Stocktake session not found');
  if (sessionDoc.status !== 'draft') {
    throw createServiceError(400, 'Only draft stocktakes can be posted');
  }
  assertManagerBranch(actorUser, sessionDoc.branch);

  const countable = sessionDoc.lines.filter((line) => line.countedKg !== null && line.countedKg !== undefined);
  if (countable.length === 0) {
    throw createServiceError(400, 'Enter at least one counted quantity before posting');
  }

  const lockInputs = countable.map((line) => ({
    branch: sessionDoc.branch,
    produceName: line.produceName,
    produceType: line.produceType
  }));

  await withStockLocks(lockInputs, async () => {
    await runInTransaction(async (session) => {
      for (const line of countable) {
        const variance = Number(line.countedKg) - Number(line.systemKg || 0);
        line.varianceKg = variance;
        if (variance === 0) continue;
        await appendStockMovement(
          {
            type: 'stocktake',
            branch: sessionDoc.branch,
            produceName: line.produceName,
            produceType: line.produceType,
            qtyKg: variance,
            refType: 'stocktake',
            refId: sessionDoc._id,
            actor: actorUser._id,
            note: sessionDoc.note || 'Stocktake variance',
            reasonCode: 'correction'
          },
          session
        );
      }
      sessionDoc.status = 'posted';
      sessionDoc.postedBy = actorUser._id;
      sessionDoc.postedAt = new Date();
      await sessionDoc.save(session ? { session } : undefined);
    });
  });

  for (const line of countable) {
    await refreshNotifications(sessionDoc.branch, line.produceName, line.produceType);
  }
  return sessionDoc;
};

export {
  REASON_CODES,
  approvalThresholdKg,
  createTransfer,
  shipTransfer,
  receiveTransfer,
  cancelTransfer,
  createAdjustment,
  approveAdjustment,
  rejectAdjustment,
  createStocktake,
  updateStocktakeCounts,
  postStocktake
};
