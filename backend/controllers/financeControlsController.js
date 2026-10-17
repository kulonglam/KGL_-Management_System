import { approveWriteOff, listWriteOffs, rejectWriteOff } from '../services/creditWriteOffService.js';
import { listPeriodLocks, setPeriodLock } from '../services/periodLockService.js';
import {
  buildCustomerStatement,
  emailCustomerStatement,
  renderStatementPdf
} from '../services/customerStatementService.js';
import { exportTrustedBuyerData, exportUserData } from '../services/personalDataService.js';
import { recordAudit } from '../services/auditService.js';
import { rememberJournal } from '../services/journalPostingService.js';
import { forwardControllerError } from '../utils/httpError.js';

const safeFilePart = (value) => String(value || 'export').replace(/[^A-Za-z0-9_-]+/g, '-').slice(0, 60);

const listWriteOffsHandler = async (req, res, next) => {
  try {
    res.json(
      await listWriteOffs({
        actorUser: req.user,
        status: req.query.status || 'pending',
        branch: req.query.branch
      })
    );
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const approveWriteOffHandler = async (req, res, next) => {
  try {
    const { creditSale, amountUgx } = await approveWriteOff({
      actorUser: req.user,
      creditSaleId: req.params.id,
      note: req.body.note
    });
    await recordAudit({
      actor: req.user,
      action: 'write_off',
      entityType: 'creditSale',
      entityId: creditSale._id,
      branch: creditSale.branch,
      metadata: {
        stage: 'approved',
        amountUgx,
        requestedBy: String(creditSale.writeOff.requestedBy),
        note: creditSale.writeOff.decisionNote
      }
    });
    await rememberJournal('creditSale', creditSale._id);
    res.json(creditSale);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const rejectWriteOffHandler = async (req, res, next) => {
  try {
    const creditSale = await rejectWriteOff({
      actorUser: req.user,
      creditSaleId: req.params.id,
      note: req.body.note
    });
    await recordAudit({
      actor: req.user,
      action: 'write_off',
      entityType: 'creditSale',
      entityId: creditSale._id,
      branch: creditSale.branch,
      metadata: { stage: 'rejected', note: creditSale.writeOff.decisionNote }
    });
    res.json(creditSale);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const listPeriodLocksHandler = async (_req, res, next) => {
  try {
    res.json(await listPeriodLocks());
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const setPeriodLockHandler = async (req, res, next) => {
  try {
    const { lock, previousLockedThrough } = await setPeriodLock({
      actorUser: req.user,
      scope: req.body.scope,
      lockedThrough: req.body.lockedThrough ?? null,
      note: req.body.note
    });
    await recordAudit({
      actor: req.user,
      action: 'update',
      entityType: 'periodLock',
      entityId: lock._id,
      branch: lock.scope === 'ALL' ? '' : lock.scope,
      metadata: {
        scope: lock.scope,
        previousLockedThrough,
        lockedThrough: lock.lockedThrough,
        note: lock.note
      }
    });
    res.json(lock);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const getStatementHandler = async (req, res, next) => {
  try {
    const statement = await buildCustomerStatement({
      actorUser: req.user,
      buyerId: req.params.id,
      from: req.query.from,
      to: req.query.to
    });
    if (req.query.format === 'pdf') {
      const filename = `statement-${safeFilePart(statement.buyer.name)}-${statement.period.to}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(renderStatementPdf(statement));
    }
    return res.json(statement);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const emailStatementHandler = async (req, res, next) => {
  try {
    const { statement, message } = await emailCustomerStatement({
      actorUser: req.user,
      buyerId: req.params.id,
      from: req.body.from,
      to: req.body.to
    });
    await recordAudit({
      actor: req.user,
      action: 'export',
      entityType: 'trustedBuyer',
      entityId: statement.buyer.id,
      branch: statement.buyer.branch,
      metadata: { kind: 'statement_email', period: statement.period, messageStatus: message.status }
    });
    res.status(202).json({
      messageId: String(message._id),
      status: message.status,
      to: message.to,
      period: statement.period,
      closingBalanceUgx: statement.closingBalanceUgx
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const sendPersonalDataExport = async (req, res, payload, entityType, entityId) => {
  await recordAudit({
    actor: req.user,
    action: 'export',
    entityType,
    entityId,
    branch: payload.profile.branch || '',
    metadata: { kind: 'personal_data_export' }
  });
  const filename = `personal-data-${entityType}-${entityId}.json`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  return res.json(payload);
};

const exportBuyerDataHandler = async (req, res, next) => {
  try {
    const payload = await exportTrustedBuyerData(req.params.id);
    return sendPersonalDataExport(req, res, payload, 'trustedBuyer', req.params.id);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const exportUserDataHandler = async (req, res, next) => {
  try {
    const payload = await exportUserData(req.params.id);
    return sendPersonalDataExport(req, res, payload, 'user', req.params.id);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

export {
  approveWriteOffHandler,
  emailStatementHandler,
  exportBuyerDataHandler,
  exportUserDataHandler,
  getStatementHandler,
  listPeriodLocksHandler,
  listWriteOffsHandler,
  rejectWriteOffHandler,
  setPeriodLockHandler
};
