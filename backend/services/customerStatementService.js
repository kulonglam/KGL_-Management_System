import TrustedBuyer from '../models/TrustedBuyer.js';
import CreditSale from '../models/CreditSale.js';
import { createPdfDocument } from '../utils/pdfDocument.js';
import { deniesBranchAccess } from '../utils/branchAccess.js';
import { isDirectorAccount } from './authService.js';
import { queueMessage } from './messageService.js';
import { roundUgx } from '../utils/money.js';
import { businessDateKey, businessToday } from '../utils/businessTime.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const AGING_BUCKETS = [
  { key: 'current', label: 'Not yet due', maxDays: 0 },
  { key: 'days1to30', label: '1-30 days', maxDays: 30 },
  { key: 'days31to60', label: '31-60 days', maxDays: 60 },
  { key: 'days61to90', label: '61-90 days', maxDays: 90 },
  { key: 'over90', label: 'Over 90 days', maxDays: Infinity }
];

const createServiceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const ugx = (value) => `UGX ${roundUgx(value).toLocaleString('en-US')}`;
const dayKey = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

const resolvePeriod = ({ from, to }) => {
  const toKey = ISO_DATE.test(String(to || '')) ? to : businessDateKey();
  const defaultFrom = new Date(new Date(`${toKey}T00:00:00.000Z`).getTime() - 89 * DAY_MS);
  const fromKey = ISO_DATE.test(String(from || '')) ? from : dayKey(defaultFrom);
  if (fromKey > toKey) throw createServiceError(400, 'from must be on or before to');
  return {
    from: fromKey,
    to: toKey,
    start: new Date(`${fromKey}T00:00:00.000Z`),
    end: new Date(`${toKey}T23:59:59.999Z`)
  };
};

const loadBuyer = async (actorUser, buyerId) => {
  const buyer = await TrustedBuyer.findById(buyerId).lean();
  if (!buyer) throw createServiceError(404, 'Trusted buyer not found');
  if (!isDirectorAccount(actorUser) && deniesBranchAccess(actorUser, buyer.branch)) {
    throw createServiceError(403, 'Access denied to this branch data');
  }
  return buyer;
};

// Ledger entries per credit sale: dispatch (debit), repayments and approved write-off (credits).
const creditEvents = (sale) => {
  const events = [
    {
      date: sale.dateOfDispatch,
      type: 'dispatch',
      description: `${sale.produceName} (${sale.produceType}) ${sale.tonnageKg} kg - due ${dayKey(sale.dueDate)}`,
      debitUgx: roundUgx(sale.amountDueUgx),
      creditUgx: 0,
      creditSaleId: String(sale._id)
    }
  ];
  for (const payment of sale.payments || []) {
    events.push({
      date: payment.paidAt,
      type: 'payment',
      description: 'Payment received',
      debitUgx: 0,
      creditUgx: roundUgx(payment.amountUgx),
      creditSaleId: String(sale._id)
    });
  }
  if (sale.writeOff?.status === 'approved' && Number(sale.writtenOffUgx) > 0) {
    events.push({
      date: sale.writeOff.decidedAt,
      type: 'write_off',
      description: 'Balance written off',
      debitUgx: 0,
      creditUgx: roundUgx(sale.writtenOffUgx),
      creditSaleId: String(sale._id)
    });
  }
  return events;
};

const agingFor = (sales, today) => {
  const aging = Object.fromEntries(AGING_BUCKETS.map((bucket) => [bucket.key, 0]));
  for (const sale of sales) {
    const balance = roundUgx(sale.balanceUgx);
    if (balance <= 0) continue;
    const overdueDays = Math.floor((today.getTime() - new Date(sale.dueDate).getTime()) / DAY_MS);
    const bucket = AGING_BUCKETS.find((entry) => overdueDays <= entry.maxDays);
    aging[bucket.key] += balance;
  }
  return aging;
};

const buildCustomerStatement = async ({ actorUser, buyerId, from, to }) => {
  const buyer = await loadBuyer(actorUser, buyerId);
  const period = resolvePeriod({ from, to });
  const sales = await CreditSale.find({ trustedBuyer: buyer._id, voidedAt: null })
    .sort({ dateOfDispatch: 1 })
    .lean();

  const events = sales.flatMap(creditEvents).sort((a, b) => new Date(a.date) - new Date(b.date));
  let openingBalanceUgx = 0;
  let running = 0;
  const lines = [];
  for (const event of events) {
    const at = new Date(event.date);
    const delta = event.debitUgx - event.creditUgx;
    if (at < period.start) {
      openingBalanceUgx += delta;
      continue;
    }
    if (at > period.end) continue;
    if (lines.length === 0) running = openingBalanceUgx;
    running += delta;
    lines.push({ ...event, date: at.toISOString(), balanceUgx: roundUgx(running) });
  }
  const closingBalanceUgx = roundUgx(lines.length ? running : openingBalanceUgx);
  const totals = lines.reduce(
    (acc, line) => ({
      debitUgx: acc.debitUgx + line.debitUgx,
      creditUgx: acc.creditUgx + line.creditUgx
    }),
    { debitUgx: 0, creditUgx: 0 }
  );

  return {
    generatedAt: new Date().toISOString(),
    period: { from: period.from, to: period.to },
    buyer: {
      id: String(buyer._id),
      name: buyer.name,
      branch: buyer.branch,
      contact: buyer.contact,
      email: buyer.email || '',
      location: buyer.location,
      creditLimitUgx: buyer.creditLimitUgx ?? null
    },
    openingBalanceUgx: roundUgx(openingBalanceUgx),
    totals: { debitUgx: roundUgx(totals.debitUgx), creditUgx: roundUgx(totals.creditUgx) },
    closingBalanceUgx,
    currentOutstandingUgx: roundUgx(sales.reduce((sum, sale) => sum + Number(sale.balanceUgx || 0), 0)),
    aging: agingFor(sales, businessToday()),
    lines
  };
};

const renderStatementPdf = (statement) => {
  const doc = createPdfDocument({ title: `Statement ${statement.buyer.name}` });
  doc.heading('Karibu Groceries LTD', 16);
  doc.text('Customer statement of account', { size: 11, gray: 0.3 });
  doc.spacer(8);
  doc.keyValues([
    ['Customer', statement.buyer.name],
    ['Branch', statement.buyer.branch],
    ['Contact', statement.buyer.contact || '-'],
    ['Period', `${statement.period.from} to ${statement.period.to}`],
    ['Opening balance', ugx(statement.openingBalanceUgx)],
    ['Closing balance', ugx(statement.closingBalanceUgx)]
  ]);
  doc.spacer(12);
  doc.table(
    [
      { label: 'Date', width: 0.14 },
      { label: 'Description', width: 0.4 },
      { label: 'Charges', width: 0.15, align: 'right' },
      { label: 'Payments', width: 0.15, align: 'right' },
      { label: 'Balance', width: 0.16, align: 'right' }
    ],
    statement.lines.length
      ? statement.lines.map((line) => [
          dayKey(line.date),
          line.description,
          line.debitUgx ? ugx(line.debitUgx) : '',
          line.creditUgx ? ugx(line.creditUgx) : '',
          ugx(line.balanceUgx)
        ])
      : [['', 'No activity in this period', '', '', ugx(statement.openingBalanceUgx)]]
  );
  doc.spacer(14);
  doc.text('Amounts outstanding by age', { bold: true, size: 11 });
  doc.spacer(4);
  doc.table(
    AGING_BUCKETS.map((bucket) => ({ label: bucket.label, width: 1 / AGING_BUCKETS.length, align: 'right' })),
    [AGING_BUCKETS.map((bucket) => ugx(statement.aging[bucket.key]))]
  );
  return doc.toBuffer();
};

const statementEmailBody = (statement) => {
  const rows = statement.lines.map(
    (line) =>
      `${dayKey(line.date)}  ${line.description}  ${line.debitUgx ? `+${ugx(line.debitUgx)}` : `-${ugx(line.creditUgx)}`}  = ${ugx(line.balanceUgx)}`
  );
  return [
    `Dear ${statement.buyer.name},`,
    '',
    `Here is your statement with Karibu Groceries (${statement.buyer.branch}) for ${statement.period.from} to ${statement.period.to}.`,
    '',
    `Opening balance: ${ugx(statement.openingBalanceUgx)}`,
    ...(rows.length ? rows : ['No activity in this period.']),
    `Closing balance: ${ugx(statement.closingBalanceUgx)}`,
    '',
    'Please contact the branch if anything looks wrong.',
    'Karibu Groceries LTD'
  ].join('\n');
};

const emailCustomerStatement = async ({ actorUser, buyerId, from, to }) => {
  const statement = await buildCustomerStatement({ actorUser, buyerId, from, to });
  if (!statement.buyer.email) {
    throw createServiceError(400, 'This buyer has no email address. Add one on the trusted buyer record first.');
  }
  const pdf = renderStatementPdf(statement);
  const message = await queueMessage({
    channel: 'email',
    to: statement.buyer.email,
    subject: `Karibu Groceries statement ${statement.period.from} to ${statement.period.to}`,
    body: statementEmailBody(statement),
    relatedType: 'statement',
    relatedId: statement.buyer.id,
    branch: statement.buyer.branch,
    attachmentName: `statement-${statement.period.from}-to-${statement.period.to}.pdf`,
    attachmentBase64: Buffer.from(pdf).toString('base64')
  });
  return { statement, message };
};

export { AGING_BUCKETS, buildCustomerStatement, emailCustomerStatement, renderStatementPdf };
