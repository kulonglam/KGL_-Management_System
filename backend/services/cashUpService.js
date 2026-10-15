import Sale from '../models/Sale.js';
import CashUpSession from '../models/CashUpSession.js';
import { deniesBranchAccess } from '../utils/branchAccess.js';
import { isDirectorAccount } from './authService.js';
import { roundUgx } from '../utils/money.js';
import { trustedQuery } from '../utils/listQuery.js';

const createServiceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const assertBranch = (user, branch) => {
  if (isDirectorAccount(user)) return;
  if (deniesBranchAccess(user, branch)) {
    throw createServiceError(403, 'Access denied to this branch data');
  }
};

// Sale.date is a calendar-date field stored at 00:00 UTC, so the business day maps to the UTC day.
const dayRange = (businessDate) => {
  const start = new Date(`${businessDate}T00:00:00.000Z`);
  const end = new Date(`${businessDate}T23:59:59.999Z`);
  return { start, end };
};

const computeSystemTotals = async (branch, businessDate) => {
  const { start, end } = dayRange(businessDate);
  const sales = await Sale.find({
    branch,
    deletedAt: null,
    voidedAt: null,
    date: trustedQuery({ $gte: start, $lte: end })
  }).lean();

  const totals = { cashUgx: 0, momoUgx: 0, bankUgx: 0 };
  for (const sale of sales) {
    const method = sale.paymentMethod || 'cash';
    const amount = roundUgx(sale.amountPaidUgx);
    if (method === 'momo') totals.momoUgx += amount;
    else if (method === 'bank') totals.bankUgx += amount;
    else totals.cashUgx += amount;
  }
  return { totals, salesCount: sales.length };
};

const openOrGetCashUp = async ({ actorUser, branch, businessDate }) => {
  const resolvedBranch = String(branch || actorUser.branch || '').trim();
  if (!resolvedBranch) throw createServiceError(400, 'branch is required');
  if (!ISO_DATE.test(businessDate || '')) {
    throw createServiceError(400, 'businessDate must be YYYY-MM-DD');
  }
  assertBranch(actorUser, resolvedBranch);

  let session = await CashUpSession.findOne({ branch: resolvedBranch, businessDate });
  const { totals, salesCount } = await computeSystemTotals(resolvedBranch, businessDate);

  if (!session) {
    session = await CashUpSession.create({
      branch: resolvedBranch,
      businessDate,
      status: 'open',
      systemTotals: totals,
      systemSalesCount: salesCount,
      openedBy: actorUser._id
    });
  } else if (session.status === 'open') {
    session.systemTotals = totals;
    session.systemSalesCount = salesCount;
    await session.save();
  }

  return session;
};

const sumTender = (totals = {}) =>
  roundUgx(Number(totals.cashUgx || 0) + Number(totals.momoUgx || 0) + Number(totals.bankUgx || 0));

const closeCashUp = async ({ actorUser, sessionId, countedTotals, varianceNote = '' }) => {
  const session = await CashUpSession.findById(sessionId);
  if (!session) throw createServiceError(404, 'Cash-up session not found');
  assertBranch(actorUser, session.branch);
  if (session.status !== 'open') {
    throw createServiceError(400, 'Cash-up session is already closed');
  }

  const { totals, salesCount } = await computeSystemTotals(session.branch, session.businessDate);
  session.systemTotals = totals;
  session.systemSalesCount = salesCount;

  const counted = {
    cashUgx: roundUgx(countedTotals?.cashUgx),
    momoUgx: roundUgx(countedTotals?.momoUgx),
    bankUgx: roundUgx(countedTotals?.bankUgx)
  };
  if (Object.values(counted).some((value) => value < 0 || !Number.isFinite(value))) {
    throw createServiceError(400, 'Counted totals must be non-negative whole UGX amounts');
  }

  session.countedTotals = counted;
  session.varianceUgx = sumTender(counted) - sumTender(totals);

  if (session.varianceUgx !== 0) {
    const note = String(varianceNote || '').trim();
    if (note.length < 5) {
      throw createServiceError(400, 'varianceNote is required when till does not match system totals');
    }
    session.varianceNote = note.slice(0, 500);
  } else {
    session.varianceNote = String(varianceNote || '').trim().slice(0, 500);
  }

  session.status = 'closed';
  session.closedBy = actorUser._id;
  session.closedAt = new Date();
  await session.save();
  return session;
};

const listCashUps = async ({ filter = {}, limit = 50 } = {}) =>
  CashUpSession.find(filter).sort({ businessDate: -1 }).limit(limit).lean();

export { openOrGetCashUp, closeCashUp, listCashUps, computeSystemTotals };
