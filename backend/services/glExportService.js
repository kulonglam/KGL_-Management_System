import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';
import Procurement from '../models/Procurement.js';
import GlAccountMapping, { EVENT_TYPES } from '../models/GlAccountMapping.js';
import { getTaxConfig, splitVatInclusive } from './taxConfigService.js';
import { roundUgx } from '../utils/money.js';
import { includeRemoved } from '../utils/softDelete.js';
import { trustedQuery } from '../utils/listQuery.js';
import { businessDayRange } from '../utils/businessTime.js';

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const createServiceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const DEFAULT_MAPPINGS = [
  { eventType: 'cash_sale', debitAccount: '1000', creditAccount: '4000', description: 'Cash sales' },
  { eventType: 'momo_sale', debitAccount: '1010', creditAccount: '4000', description: 'MoMo sales' },
  { eventType: 'bank_sale', debitAccount: '1020', creditAccount: '4000', description: 'Bank sales' },
  { eventType: 'credit_sale', debitAccount: '1100', creditAccount: '4000', description: 'Credit sales' },
  {
    eventType: 'credit_repayment',
    debitAccount: '1000',
    creditAccount: '1100',
    description: 'Credit repayments'
  },
  {
    eventType: 'credit_writeoff',
    debitAccount: '6100',
    creditAccount: '1100',
    description: 'Bad debt write-off'
  },
  { eventType: 'procurement', debitAccount: '1200', creditAccount: '2000', description: 'Procurement' },
  { eventType: 'sale_void', debitAccount: '4000', creditAccount: '1000', description: 'Sale void reversal' },
  { eventType: 'vat_output', debitAccount: '4000', creditAccount: '2100', description: 'Output VAT' }
];

// Seeds any event type that has no mapping yet; existing (possibly customised) rows are kept.
const ensureDefaultMappings = async () => {
  const existing = await GlAccountMapping.find({}).lean();
  const known = new Set(existing.map((row) => row.eventType));
  const missing = DEFAULT_MAPPINGS.filter((row) => !known.has(row.eventType));
  if (missing.length > 0) {
    await GlAccountMapping.insertMany(missing, { ordered: false }).catch((error) => {
      if (error?.code !== 11000 && !error?.writeErrors) throw error;
    });
  }
  const rows = missing.length > 0 ? await GlAccountMapping.find({}).lean() : existing;
  return new Map(rows.map((row) => [row.eventType, row]));
};

const journalLineKey = ({ eventType, refType, refId, keySuffix, side, account }) =>
  `${eventType}|${refType}|${String(refId)}|${keySuffix}|${side}|${account}`;

const pushBalanced = (lines, { date, branch, eventType, mapping, amountUgx, refType, refId, memo, keySuffix }) => {
  const amount = roundUgx(amountUgx);
  if (!amount) return;
  if (!mapping) {
    throw createServiceError(400, `Missing GL mapping for ${eventType}`);
  }
  const shared = { date, branch, eventType, refType, refId: String(refId), memo };
  lines.push({
    ...shared,
    account: mapping.debitAccount,
    debitUgx: Math.abs(amount),
    creditUgx: 0,
    lineKey: journalLineKey({ eventType, refType, refId, keySuffix, side: 'debit', account: mapping.debitAccount })
  });
  lines.push({
    ...shared,
    account: mapping.creditAccount,
    debitUgx: 0,
    creditUgx: Math.abs(amount),
    lineKey: journalLineKey({ eventType, refType, refId, keySuffix, side: 'credit', account: mapping.creditAccount })
  });
};

const linesForSale = (sale, mappings, tax) => {
  const lines = [];
  if (sale.deletedAt && !sale.voidedAt) return lines;
  const method = sale.paymentMethod || 'cash';
  const eventType = method === 'momo' ? 'momo_sale' : method === 'bank' ? 'bank_sale' : 'cash_sale';
  const split = splitVatInclusive(sale.amountPaidUgx, tax.vatRatePercent);
  const tenderMap = mappings.get(eventType);
  pushBalanced(lines, {
    date: sale.date,
    branch: sale.branch,
    eventType,
    mapping: tenderMap,
    amountUgx: split.netUgx,
    refType: 'sale',
    refId: sale._id,
    memo: `Sale ${sale.produceName}`,
    keySuffix: 'net'
  });
  if (split.vatUgx > 0 && tenderMap) {
    const vatMap = mappings.get('vat_output');
    lines.push({
      date: sale.date,
      branch: sale.branch,
      account: tenderMap.debitAccount,
      debitUgx: split.vatUgx,
      creditUgx: 0,
      eventType: 'vat_output',
      refType: 'sale',
      refId: String(sale._id),
      memo: 'VAT portion of tender',
      lineKey: journalLineKey({
        eventType: 'vat_output',
        refType: 'sale',
        refId: sale._id,
        keySuffix: 'vat',
        side: 'debit',
        account: tenderMap.debitAccount
      })
    });
    lines.push({
      date: sale.date,
      branch: sale.branch,
      account: vatMap.creditAccount,
      debitUgx: 0,
      creditUgx: split.vatUgx,
      eventType: 'vat_output',
      refType: 'sale',
      refId: String(sale._id),
      memo: 'Output VAT',
      lineKey: journalLineKey({
        eventType: 'vat_output',
        refType: 'sale',
        refId: sale._id,
        keySuffix: 'vat',
        side: 'credit',
        account: vatMap.creditAccount
      })
    });
  }
  if (sale.voidedAt) {
    pushBalanced(lines, {
      date: sale.voidedAt,
      branch: sale.branch,
      eventType: 'sale_void',
      mapping: mappings.get('sale_void'),
      amountUgx: sale.amountPaidUgx,
      refType: 'sale',
      refId: sale._id,
      memo: `Void ${sale.produceName}`,
      keySuffix: 'void'
    });
  }
  return lines;
};

const linesForCredit = (credit, mappings, tax, include = () => true) => {
  const lines = [];
  if (credit.voidedAt) return lines;
  if (include(credit.dateOfDispatch)) {
    const split = splitVatInclusive(credit.amountDueUgx, tax.vatRatePercent);
    pushBalanced(lines, {
      date: credit.dateOfDispatch,
      branch: credit.branch,
      eventType: 'credit_sale',
      mapping: mappings.get('credit_sale'),
      amountUgx: split.netUgx,
      refType: 'creditSale',
      refId: credit._id,
      memo: `Credit sale ${credit.produceName || ''}`.trim(),
      keySuffix: 'dispatch'
    });
  }
  (credit.payments || []).forEach((payment, index) => {
    const paidAt = payment.paidAt || credit.updatedAt || credit.dateOfDispatch;
    if (!include(paidAt)) return;
    pushBalanced(lines, {
      date: paidAt,
      branch: credit.branch,
      eventType: 'credit_repayment',
      mapping: mappings.get('credit_repayment'),
      amountUgx: payment.amountUgx,
      refType: 'creditSale',
      refId: credit._id,
      memo: 'Credit repayment',
      keySuffix: `pay-${index}`
    });
  });
  if (
    credit.writeOff?.status === 'approved' &&
    Number(credit.writtenOffUgx) > 0 &&
    include(credit.writeOff.decidedAt)
  ) {
    pushBalanced(lines, {
      date: credit.writeOff.decidedAt,
      branch: credit.branch,
      eventType: 'credit_writeoff',
      mapping: mappings.get('credit_writeoff'),
      amountUgx: credit.writtenOffUgx,
      refType: 'creditSale',
      refId: credit._id,
      memo: `Write-off ${credit.buyerName || ''}`.trim(),
      keySuffix: 'writeoff'
    });
  }
  return lines;
};

const linesForProcurement = (row, mappings) => {
  const lines = [];
  pushBalanced(lines, {
    date: row.dateReceived,
    branch: row.branch,
    eventType: 'procurement',
    mapping: mappings.get('procurement'),
    amountUgx: row.costUgx,
    refType: 'procurement',
    refId: row._id,
    memo: `Procurement ${row.produceName}`,
    keySuffix: 'cost'
  });
  return lines;
};

const buildGlExport = async ({ from, to, branch }) => {
  if (!from || !to) throw createServiceError(400, 'from and to query params are required (ISO dates)');
  // Date-only bounds cover whole business days, so timestamped repayments on `to` are included.
  const fromDate = ISO_DATE_ONLY.test(String(from)) ? businessDayRange(from).start : new Date(from);
  const toDate = ISO_DATE_ONLY.test(String(to)) ? businessDayRange(to).end : new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw createServiceError(400, 'from and to must be valid dates');
  }
  if (fromDate > toDate) throw createServiceError(400, 'from must be on or before to');

  const mappings = await ensureDefaultMappings();
  const tax = await getTaxConfig();
  const inWindow = trustedQuery({ $gte: fromDate, $lte: toDate });
  const saleFilter = { date: inWindow };
  // Repayments and write-offs are booked when they happen, which can be after dispatch.
  const creditFilter = {
    $or: [
      { dateOfDispatch: inWindow },
      { 'payments.paidAt': inWindow },
      { 'writeOff.decidedAt': inWindow }
    ],
    deletedAt: null,
    voidedAt: null
  };
  const procurementFilter = {
    dateReceived: inWindow,
    deletedAt: null
  };
  if (branch) {
    saleFilter.branch = branch;
    creditFilter.branch = branch;
    procurementFilter.branch = branch;
  }

  const [sales, creditSales, procurements] = await Promise.all([
    // Explicit deletedAt predicate disables the soft-delete default so voids are included.
    Sale.find({ ...saleFilter, deletedAt: includeRemoved() }).lean(),
    CreditSale.find(creditFilter).lean(),
    Procurement.find(procurementFilter).lean()
  ]);

  const isInWindow = (value) => {
    const date = value ? new Date(value) : null;
    return Boolean(date) && date >= fromDate && date <= toDate;
  };
  const lines = [
    ...sales.flatMap((sale) => linesForSale(sale, mappings, tax)),
    ...creditSales.flatMap((credit) => linesForCredit(credit, mappings, tax, isInWindow)),
    ...procurements.flatMap((row) => linesForProcurement(row, mappings))
  ];

  const debitTotal = lines.reduce((sum, line) => sum + Number(line.debitUgx || 0), 0);
  const creditTotal = lines.reduce((sum, line) => sum + Number(line.creditUgx || 0), 0);

  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    branch: branch || null,
    lines,
    totals: {
      debitUgx: roundUgx(debitTotal),
      creditUgx: roundUgx(creditTotal),
      balanced: roundUgx(debitTotal) === roundUgx(creditTotal)
    }
  };
};

const toCsv = (exportPayload) => {
  const header = [
    'date',
    'branch',
    'account',
    'debitUgx',
    'creditUgx',
    'eventType',
    'refType',
    'refId',
    'memo'
  ];
  const rows = [header.join(',')];
  for (const line of exportPayload.lines) {
    rows.push(
      [
        new Date(line.date).toISOString(),
        JSON.stringify(line.branch || ''),
        JSON.stringify(line.account || ''),
        line.debitUgx,
        line.creditUgx,
        JSON.stringify(line.eventType || ''),
        JSON.stringify(line.refType || ''),
        JSON.stringify(line.refId || ''),
        JSON.stringify(line.memo || '')
      ].join(',')
    );
  }
  rows.push(`# totals debit=${exportPayload.totals.debitUgx} credit=${exportPayload.totals.creditUgx} balanced=${exportPayload.totals.balanced}`);
  return `${rows.join('\n')}\n`;
};

const listMappings = async () => {
  await ensureDefaultMappings();
  return GlAccountMapping.find({}).sort({ eventType: 1 }).lean();
};

export {
  buildGlExport,
  toCsv,
  listMappings,
  EVENT_TYPES,
  ensureDefaultMappings,
  linesForSale,
  linesForCredit,
  linesForProcurement,
  journalLineKey
};
