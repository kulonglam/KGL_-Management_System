import CreditSale from '../models/CreditSale.js';
import Sale from '../models/Sale.js';
import Procurement from '../models/Procurement.js';
import GlJournalLine from '../models/GlJournalLine.js';
import GlAccount from '../models/GlAccount.js';
import BankStatementLine from '../models/BankStatementLine.js';
import { AGING_BUCKETS } from './customerStatementService.js';
import { buildGlExport } from './glExportService.js';
import { businessToday } from '../utils/businessTime.js';
import { roundUgx } from '../utils/money.js';
import { isDirectorAccount } from './authService.js';
import { trustedQuery } from '../utils/listQuery.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const createServiceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const scopedBranch = (actorUser, branch) => {
  if (!isDirectorAccount(actorUser)) return actorUser.branch;
  return branch || '';
};

const buildAgingReport = async ({ actorUser, branch }) => {
  const resolvedBranch = scopedBranch(actorUser, branch);
  const filter = { voidedAt: null, balanceUgx: trustedQuery({ $gt: 0 }) };
  if (resolvedBranch) filter.branch = resolvedBranch;
  const sales = await CreditSale.find(filter)
    .select('buyerName trustedBuyer branch balanceUgx dueDate')
    .lean();
  const today = businessToday();
  const buckets = Object.fromEntries(AGING_BUCKETS.map((bucket) => [bucket.key, 0]));
  const buyers = new Map();

  for (const sale of sales) {
    const balance = roundUgx(sale.balanceUgx);
    if (balance <= 0) continue;
    const overdueDays = Math.floor((today.getTime() - new Date(sale.dueDate).getTime()) / DAY_MS);
    const bucket = AGING_BUCKETS.find((entry) => overdueDays <= entry.maxDays);
    buckets[bucket.key] += balance;
    const key = String(sale.trustedBuyer || sale.buyerName);
    const row = buyers.get(key) || {
      buyerName: sale.buyerName,
      trustedBuyerId: sale.trustedBuyer ? String(sale.trustedBuyer) : '',
      branch: sale.branch,
      balanceUgx: 0,
      buckets: Object.fromEntries(AGING_BUCKETS.map((entry) => [entry.key, 0]))
    };
    row.balanceUgx += balance;
    row.buckets[bucket.key] += balance;
    buyers.set(key, row);
  }

  const rows = [...buyers.values()].sort((a, b) => b.balanceUgx - a.balanceUgx);
  return {
    asOf: today.toISOString().slice(0, 10),
    branch: resolvedBranch || null,
    buckets,
    totalUgx: roundUgx(Object.values(buckets).reduce((sum, value) => sum + value, 0)),
    buyers: rows
  };
};

const postGlJournal = async ({ from, to, branch }) => {
  const payload = await buildGlExport({ from, to, branch });
  let posted = 0;
  for (const line of payload.lines) {
    if (!line.lineKey) continue;
    try {
      const result = await GlJournalLine.updateOne(
        { lineKey: line.lineKey },
        { $setOnInsert: { ...line, date: new Date(line.date) } },
        { upsert: true }
      );
      posted += result.upsertedCount || 0;
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }
  }
  return {
    posted,
    examined: payload.lines.length,
    totals: payload.totals,
    from: payload.from,
    to: payload.to
  };
};

const trialBalance = async ({ from, to, branch }) => {
  const match = {};
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);
    match.date = trustedQuery(match.date);
  }
  if (branch) match.branch = branch;
  const rows = await GlJournalLine.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$account',
        debitUgx: { $sum: '$debitUgx' },
        creditUgx: { $sum: '$creditUgx' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  const chart = await GlAccount.find({}).select('code name').lean();
  const names = new Map(chart.map((account) => [account.code, account.name]));
  const accounts = rows.map((row) => ({
    account: row._id,
    name: names.get(row._id) || row._id,
    debitUgx: roundUgx(row.debitUgx),
    creditUgx: roundUgx(row.creditUgx),
    balanceUgx: roundUgx(row.debitUgx - row.creditUgx)
  }));
  const foreignRows = await GlJournalLine.aggregate([
    { $match: { ...match, currency: { $nin: [null, '', 'UGX'] } } },
    { $group: { _id: '$currency', foreignAmount: { $sum: '$foreignAmount' } } },
    { $sort: { _id: 1 } }
  ]);
  const foreignBalances = foreignRows.map((row) => ({
    currency: row._id,
    foreignAmount: Number(row.foreignAmount) || 0
  }));
  const debitUgx = roundUgx(accounts.reduce((sum, row) => sum + row.debitUgx, 0));
  const creditUgx = roundUgx(accounts.reduce((sum, row) => sum + row.creditUgx, 0));
  return { accounts, foreignBalances, totals: { debitUgx, creditUgx, balanced: debitUgx === creditUgx } };
};

const importBankStatement = async ({ actorUser, branch, lines }) => {
  const resolvedBranch = scopedBranch(actorUser, branch) || actorUser.branch;
  if (!resolvedBranch) throw createServiceError(400, 'branch is required');
  if (!Array.isArray(lines) || lines.length === 0) {
    throw createServiceError(400, 'lines must contain at least one statement row');
  }
  const docs = lines.map((line) => {
    const statementDate = String(line.statementDate || line.date || '');
    const direction = line.direction === 'out' ? 'out' : 'in';
    const amountUgx = roundUgx(line.amountUgx);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(statementDate) || amountUgx < 1) {
      throw createServiceError(400, 'Each line needs statementDate YYYY-MM-DD and a positive amountUgx');
    }
    return {
      branch: resolvedBranch,
      statementDate,
      description: String(line.description || '').slice(0, 300),
      amountUgx,
      direction,
      importedBy: actorUser._id
    };
  });
  const created = await BankStatementLine.insertMany(docs);
  for (const line of created) {
    const suggestions = await suggestBankMatches(line);
    if (suggestions.length !== 1) continue;
    line.matchedRefType = suggestions[0].refType;
    line.matchedRefId = suggestions[0].refId;
    line.matchedAt = new Date();
    await line.save();
  }
  return created;
};

const dayBounds = (dateKey) => {
  const start = new Date(`${dateKey}T00:00:00.000Z`);
  const end = new Date(`${dateKey}T23:59:59.999Z`);
  start.setUTCDate(start.getUTCDate() - 2);
  end.setUTCDate(end.getUTCDate() + 2);
  return { start, end };
};

const suggestBankMatches = async (line) => {
  const { start, end } = dayBounds(line.statementDate);
  if (line.direction === 'in') {
    const sales = await Sale.find({
      branch: line.branch,
      voidedAt: null,
      deletedAt: null,
      paymentMethod: 'bank',
      amountPaidUgx: line.amountUgx,
      date: trustedQuery({ $gte: start, $lte: end })
    })
      .select('buyerName amountPaidUgx date')
      .limit(5)
      .lean();
    if (sales.length > 0) {
      return sales.map((sale) => ({ refType: 'sale', refId: String(sale._id), label: sale.buyerName }));
    }
    const credits = await CreditSale.find({
      branch: line.branch,
      voidedAt: null,
      payments: trustedQuery({
        $elemMatch: { amountUgx: line.amountUgx, paidAt: { $gte: start, $lte: end } }
      })
    })
      .select('buyerName')
      .limit(5)
      .lean();
    return credits.map((credit) => ({
      refType: 'credit_payment',
      refId: String(credit._id),
      label: credit.buyerName
    }));
  }
  const procurements = await Procurement.find({
    branch: line.branch,
    deletedAt: null,
    costUgx: line.amountUgx,
    dateReceived: trustedQuery({ $gte: start, $lte: end })
  })
    .select('dealerName costUgx')
    .limit(5)
    .lean();
  return procurements.map((row) => ({
    refType: 'procurement',
    refId: String(row._id),
    label: row.dealerName
  }));
};

const listBankLines = async ({ actorUser, branch }) => {
  const resolvedBranch = scopedBranch(actorUser, branch);
  const filter = resolvedBranch ? { branch: resolvedBranch } : {};
  const lines = await BankStatementLine.find(filter).sort({ statementDate: -1, createdAt: -1 }).limit(200).lean();
  const withSuggestions = [];
  for (const line of lines) {
    withSuggestions.push({
      ...line,
      suggestions: line.matchedRefId ? [] : await suggestBankMatches(line)
    });
  }
  return withSuggestions;
};

const matchBankLine = async ({ actorUser, id, refType, refId }) => {
  const line = await BankStatementLine.findById(id);
  if (!line) throw createServiceError(404, 'Statement line not found');
  if (!isDirectorAccount(actorUser) && line.branch !== actorUser.branch) {
    throw createServiceError(403, 'Access denied to this branch data');
  }
  if (!['sale', 'credit_payment'].includes(refType) || !refId) {
    throw createServiceError(400, 'refType and refId are required');
  }
  line.matchedRefType = refType;
  line.matchedRefId = String(refId);
  line.matchedAt = new Date();
  await line.save();
  return line.toObject();
};

export { buildAgingReport, importBankStatement, listBankLines, matchBankLine, postGlJournal, trialBalance };
