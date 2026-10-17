import User from '../models/User.js';
import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';
import TaxInvoice from '../models/TaxInvoice.js';
import { queueMessage } from './messageService.js';
import { roundUgx } from '../utils/money.js';
import logger from '../utils/logger.js';
import { includeRemoved } from '../utils/softDelete.js';
import { trustedQuery } from '../utils/listQuery.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const weekWindow = (to = new Date()) => ({
  from: new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000),
  to
});

const formatUgx = (value) => `${roundUgx(value).toLocaleString('en-US')} UGX`;

const buildDirectorWeeklyReport = async ({ to: windowEnd } = {}) => {
  const { from, to } = weekWindow(windowEnd ? new Date(windowEnd) : new Date());
  const inWindow = () => trustedQuery({ $gte: from, $lte: to });
  const [sales, voidedSales, creditSales, outstandingCredit, invoices, directors] = await Promise.all([
    Sale.find({ date: inWindow(), voidedAt: null }).lean(),
    Sale.countDocuments({ voidedAt: inWindow(), deletedAt: includeRemoved() }),
    CreditSale.find({ dateOfDispatch: inWindow(), voidedAt: null }).lean(),
    CreditSale.find({
      voidedAt: null,
      isPaid: trustedQuery({ $ne: true }),
      balanceUgx: trustedQuery({ $gt: 0 })
    })
      .select('branch balanceUgx dueDate')
      .lean(),
    TaxInvoice.countDocuments({ issuedAt: inWindow() }),
    User.find({ role: 'director' }).select('username name email notifyEmail notifyInApp').lean()
  ]);

  const tender = { cash: 0, momo: 0, bank: 0 };
  const branches = new Map();
  const branchRow = (branch) => {
    const key = branch || 'Unassigned';
    if (!branches.has(key)) {
      branches.set(key, { branch: key, cashSales: 0, cashSalesUgx: 0, creditSales: 0, creditSalesUgx: 0 });
    }
    return branches.get(key);
  };
  for (const sale of sales) {
    const method = sale.paymentMethod || 'cash';
    tender[method] = (tender[method] || 0) + Number(sale.amountPaidUgx || 0);
    const row = branchRow(sale.branch);
    row.cashSales += 1;
    row.cashSalesUgx += Number(sale.amountPaidUgx || 0);
  }
  for (const credit of creditSales) {
    const row = branchRow(credit.branch);
    row.creditSales += 1;
    row.creditSalesUgx += Number(credit.amountDueUgx || 0);
  }

  const cashSalesUgx = sales.reduce((sum, row) => sum + Number(row.amountPaidUgx || 0), 0);
  const creditSalesUgx = creditSales.reduce((sum, row) => sum + Number(row.amountDueUgx || 0), 0);
  const outstandingUgx = outstandingCredit.reduce((sum, row) => sum + Number(row.balanceUgx || 0), 0);
  const overdue = outstandingCredit.filter((row) => row.dueDate && new Date(row.dueDate) < to);
  const overdueUgx = overdue.reduce((sum, row) => sum + Number(row.balanceUgx || 0), 0);
  const branchRows = [...branches.values()].sort((a, b) => a.branch.localeCompare(b.branch));

  const subject = `KGL weekly director report (${from.toISOString().slice(0, 10)} to ${to
    .toISOString()
    .slice(0, 10)})`;
  const body = [
    'Karibu Groceries LTD - weekly summary',
    '',
    `Cash sales: ${sales.length} transactions / ${formatUgx(cashSalesUgx)}`,
    `  Cash: ${formatUgx(tender.cash)} | MoMo: ${formatUgx(tender.momo)} | Bank: ${formatUgx(tender.bank)}`,
    `Credit sales: ${creditSales.length} / ${formatUgx(creditSalesUgx)}`,
    `Voided sales: ${voidedSales}`,
    `Outstanding credit: ${outstandingCredit.length} accounts / ${formatUgx(outstandingUgx)}`,
    `  Overdue: ${overdue.length} accounts / ${formatUgx(overdueUgx)}`,
    `Tax documents issued: ${invoices}`,
    '',
    'By branch:',
    ...(branchRows.length
      ? branchRows.map(
          (row) =>
            `  ${row.branch}: ${row.cashSales} cash / ${formatUgx(row.cashSalesUgx)}; ` +
            `${row.creditSales} credit / ${formatUgx(row.creditSalesUgx)}`
        )
      : ['  No sales recorded this week.']),
    '',
    'Open Finance > GL export for journal detail.'
  ].join('\n');

  return {
    subject,
    body,
    directors,
    window: { from, to },
    stats: {
      sales: sales.length,
      cashSalesUgx: roundUgx(cashSalesUgx),
      creditSales: creditSales.length,
      creditSalesUgx: roundUgx(creditSalesUgx),
      voidedSales,
      outstandingUgx: roundUgx(outstandingUgx),
      overdueAccounts: overdue.length,
      overdueUgx: roundUgx(overdueUgx),
      taxDocuments: invoices,
      tender: {
        cash: roundUgx(tender.cash),
        momo: roundUgx(tender.momo),
        bank: roundUgx(tender.bank)
      },
      branches: branchRows
    }
  };
};

const runDirectorWeeklyReport = async () => {
  const report = await buildDirectorWeeklyReport();
  let emailed = 0;
  let inApp = 0;
  const skippedNoEmail = [];
  for (const director of report.directors) {
    const email = String(director.email || '').trim();
    if (EMAIL_PATTERN.test(email)) {
      await queueMessage({
        channel: 'email',
        to: email,
        subject: report.subject,
        body: report.body,
        relatedType: 'report',
        recipientUserId: director._id
      });
      emailed += 1;
    } else {
      skippedNoEmail.push(director.username);
    }
    await queueMessage({
      channel: 'in_app',
      to: director.username,
      subject: report.subject,
      body: report.body,
      relatedType: 'report',
      recipientUserId: director._id
    });
    inApp += 1;
  }
  logger.info('reports.director.weekly.sent', {
    emailed,
    inApp,
    skippedNoEmail: skippedNoEmail.length,
    sales: report.stats.sales
  });
  return {
    subject: report.subject,
    emailed,
    inApp,
    recipients: emailed,
    skippedNoEmail,
    ...report.stats
  };
};

export { buildDirectorWeeklyReport, runDirectorWeeklyReport };
