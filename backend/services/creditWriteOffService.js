import CreditSale from '../models/CreditSale.js';
import { deniesBranchAccess } from '../utils/branchAccess.js';
import { isDirectorAccount } from './authService.js';
import { roundUgx } from '../utils/money.js';

const createServiceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const loadCreditSale = async (actorUser, id) => {
  const creditSale = await CreditSale.findById(id);
  if (!creditSale) throw createServiceError(404, 'Credit sale not found');
  if (!isDirectorAccount(actorUser) && deniesBranchAccess(actorUser, creditSale.branch)) {
    throw createServiceError(403, 'Access denied to this branch data');
  }
  return creditSale;
};

const requestWriteOff = async ({ actorUser, creditSaleId, reason }) => {
  const creditSale = await loadCreditSale(actorUser, creditSaleId);
  if (creditSale.voidedAt || creditSale.deletedAt) {
    throw createServiceError(400, 'Credit sale is voided or removed');
  }
  if (roundUgx(creditSale.balanceUgx) <= 0) {
    throw createServiceError(400, 'Credit sale has no outstanding balance');
  }
  if (creditSale.writeOff?.status === 'pending') {
    throw createServiceError(409, 'A write-off request is already pending');
  }
  const trimmed = String(reason || '').trim();
  if (trimmed.length < 5) throw createServiceError(400, 'Write-off reason must be at least 5 characters');

  creditSale.writeOff = {
    status: 'pending',
    requestedAmountUgx: roundUgx(creditSale.balanceUgx),
    reason: trimmed,
    requestedBy: actorUser._id,
    requestedAt: new Date(),
    decidedBy: null,
    decidedAt: null,
    decisionNote: ''
  };
  await creditSale.save();
  return creditSale;
};

const loadPending = async (actorUser, creditSaleId) => {
  const creditSale = await loadCreditSale(actorUser, creditSaleId);
  if (creditSale.writeOff?.status !== 'pending') {
    throw createServiceError(400, 'No pending write-off request for this credit sale');
  }
  if (String(creditSale.writeOff.requestedBy) === String(actorUser._id)) {
    throw createServiceError(403, 'The requester cannot decide their own write-off');
  }
  return creditSale;
};

// Writes off whatever is still owed at approval time; repayments made while the request was
// pending reduce the amount rather than being reversed.
const approveWriteOff = async ({ actorUser, creditSaleId, note }) => {
  const creditSale = await loadPending(actorUser, creditSaleId);
  if (creditSale.voidedAt || creditSale.deletedAt) {
    throw createServiceError(400, 'Credit sale is voided or removed');
  }
  const amount = roundUgx(creditSale.balanceUgx);
  if (amount <= 0) throw createServiceError(400, 'Credit sale has no outstanding balance');

  creditSale.writtenOffUgx = roundUgx(Number(creditSale.writtenOffUgx || 0) + amount);
  creditSale.balanceUgx = 0;
  creditSale.writeOff.status = 'approved';
  creditSale.writeOff.decidedBy = actorUser._id;
  creditSale.writeOff.decidedAt = new Date();
  creditSale.writeOff.decisionNote = String(note || '').trim().slice(0, 500);
  await creditSale.save();
  return { creditSale, amountUgx: amount };
};

const rejectWriteOff = async ({ actorUser, creditSaleId, note }) => {
  const creditSale = await loadPending(actorUser, creditSaleId);
  creditSale.writeOff.status = 'rejected';
  creditSale.writeOff.decidedBy = actorUser._id;
  creditSale.writeOff.decidedAt = new Date();
  creditSale.writeOff.decisionNote = String(note || '').trim().slice(0, 500);
  await creditSale.save();
  return creditSale;
};

const listWriteOffs = async ({ actorUser, status = 'pending', branch }) => {
  const filter = { 'writeOff.status': status };
  if (!isDirectorAccount(actorUser)) filter.branch = actorUser.branch;
  else if (branch) filter.branch = branch;
  return CreditSale.find(filter)
    .select(
      'buyerName branch produceName amountDueUgx amountPaidUgx balanceUgx writtenOffUgx dueDate dateOfDispatch writeOff trustedBuyer'
    )
    .populate('writeOff.requestedBy', 'name role')
    .populate('writeOff.decidedBy', 'name role')
    .sort({ 'writeOff.requestedAt': -1 })
    .limit(200)
    .lean();
};

export { approveWriteOff, listWriteOffs, rejectWriteOff, requestWriteOff };
