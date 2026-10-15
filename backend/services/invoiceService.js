import InvoiceSequence from '../models/InvoiceSequence.js';
import TaxInvoice from '../models/TaxInvoice.js';
import { getTaxConfig, splitVatInclusive } from './taxConfigService.js';
import { runInTransaction } from '../utils/transaction.js';
import { normalizeBranchName } from '../config/branches.js';
import { createPdfDocument } from '../utils/pdfDocument.js';

const createServiceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const branchToken = (branch) =>
  normalizeBranchName(branch)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 12) || 'BRANCH';

const allocateInvoiceNumber = async (branch, session) => {
  const year = new Date().getFullYear();
  const filter = { branch, year };
  let seqQuery = InvoiceSequence.findOne(filter);
  if (session) seqQuery = seqQuery.session(session);
  let seq = await seqQuery;
  if (!seq) {
    if (session) {
      const created = await InvoiceSequence.create([{ branch, year, nextNumber: 1 }], { session });
      seq = created[0];
    } else {
      seq = await InvoiceSequence.create({ branch, year, nextNumber: 1 });
    }
  }
  const number = seq.nextNumber;
  seq.nextNumber = number + 1;
  await seq.save(session ? { session } : undefined);
  const padded = String(number).padStart(5, '0');
  return `INV-${branchToken(branch)}-${year}-${padded}`;
};

const issueTaxInvoiceForSale = async ({ actorUser, sale }) => {
  if (!sale?._id) throw createServiceError(400, 'Sale is required');
  const existing = await TaxInvoice.findOne({ sale: sale._id, documentType: 'tax_invoice' });
  if (existing) return existing;

  const config = await getTaxConfig();
  const amounts = splitVatInclusive(sale.amountPaidUgx, config.vatRatePercent);

  return runInTransaction(async (session) => {
    const invoiceNumber = await allocateInvoiceNumber(sale.branch, session);
    const doc = {
      invoiceNumber,
      documentType: 'tax_invoice',
      branch: sale.branch,
      buyerName: sale.buyerName,
      sale: sale._id,
      produceName: sale.produceName,
      produceType: sale.produceType,
      tonnageKg: sale.tonnageKg,
      ...amounts,
      vatRatePercent: config.vatRatePercent,
      tinSnapshot: config.tin,
      preambleSnapshot: config.invoicePreamble,
      companyNameSnapshot: config.companyName,
      paymentMethod: sale.paymentMethod || 'cash',
      issuedBy: actorUser._id,
      issuedAt: new Date()
    };
    if (session) {
      const [invoice] = await TaxInvoice.create([doc], { session });
      return invoice;
    }
    return TaxInvoice.create(doc);
  });
};

const issueCreditNoteForVoidedSale = async ({ actorUser, sale, voidReason = '' }) => {
  if (!sale?._id) throw createServiceError(400, 'Sale is required');
  const existing = await TaxInvoice.findOne({ sale: sale._id, documentType: 'credit_note' });
  if (existing) return existing;

  const original = await TaxInvoice.findOne({ sale: sale._id, documentType: 'tax_invoice' });
  const config = await getTaxConfig();
  const amounts = splitVatInclusive(sale.amountPaidUgx, original?.vatRatePercent ?? config.vatRatePercent);

  return runInTransaction(async (session) => {
    const invoiceNumber = await allocateInvoiceNumber(sale.branch, session);
    const doc = {
      invoiceNumber,
      documentType: 'credit_note',
      branch: sale.branch,
      buyerName: sale.buyerName,
      sale: sale._id,
      relatedInvoice: original?._id || null,
      produceName: sale.produceName,
      produceType: sale.produceType,
      tonnageKg: sale.tonnageKg,
      netUgx: -Math.abs(amounts.netUgx),
      vatUgx: -Math.abs(amounts.vatUgx),
      grossUgx: -Math.abs(amounts.grossUgx),
      vatRatePercent: original?.vatRatePercent ?? config.vatRatePercent,
      tinSnapshot: original?.tinSnapshot || config.tin,
      preambleSnapshot: original?.preambleSnapshot || config.invoicePreamble,
      companyNameSnapshot: original?.companyNameSnapshot || config.companyName,
      paymentMethod: sale.paymentMethod || 'cash',
      issuedBy: actorUser._id,
      issuedAt: new Date(),
      voidReason
    };
    if (session) {
      const [creditNote] = await TaxInvoice.create([doc], { session });
      return creditNote;
    }
    return TaxInvoice.create(doc);
  });
};

const listInvoices = async ({ filter = {}, pagination } = {}) => {
  const query = TaxInvoice.find(filter).sort({ issuedAt: -1 }).lean();
  if (pagination?.enabled) query.skip(pagination.skip).limit(pagination.limit);
  else query.limit(100);
  return query;
};

const renderInvoiceHtml = (invoice) => {
  const isCredit = invoice.documentType === 'credit_note';
  const title = isCredit ? 'CREDIT NOTE' : 'TAX INVOICE';
  const escape = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escape(title)} ${escape(invoice.invoiceNumber)}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; margin: 2rem; }
    h1 { font-size: 1.6rem; letter-spacing: 0.04em; margin-bottom: 0.25rem; }
    .meta { color: #444; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th, td { border-bottom: 1px solid #ccc; padding: 0.5rem; text-align: left; }
    td.num, th.num { text-align: right; }
    .totals { margin-top: 1rem; width: 16rem; margin-left: auto; }
    .totals div { display: flex; justify-content: space-between; margin: 0.25rem 0; }
    .preamble { margin-top: 2rem; font-size: 0.9rem; color: #555; }
    @media print { body { margin: 0.5in; } }
  </style>
</head>
<body>
  <h1>${escape(title)}</h1>
  <div class="meta">
    <div><strong>${escape(invoice.companyNameSnapshot || 'Karibu Groceries LTD')}</strong></div>
    <div>TIN: ${escape(invoice.tinSnapshot || '—')}</div>
    <div>Invoice No: ${escape(invoice.invoiceNumber)}</div>
    <div>Branch: ${escape(invoice.branch)}</div>
    <div>Issued: ${escape(new Date(invoice.issuedAt).toISOString())}</div>
    <div>Buyer: ${escape(invoice.buyerName)}</div>
    ${
      invoice.relatedInvoice
        ? `<div>Related invoice id: ${escape(String(invoice.relatedInvoice))}</div>`
        : ''
    }
    ${invoice.voidReason ? `<div>Reason: ${escape(invoice.voidReason)}</div>` : ''}
  </div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="num">Qty (kg)</th>
        <th class="num">Net (UGX)</th>
        <th class="num">VAT (UGX)</th>
        <th class="num">Gross (UGX)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${escape(invoice.produceName)} (${escape(invoice.produceType)})</td>
        <td class="num">${escape(invoice.tonnageKg)}</td>
        <td class="num">${escape(invoice.netUgx)}</td>
        <td class="num">${escape(invoice.vatUgx)}</td>
        <td class="num">${escape(invoice.grossUgx)}</td>
      </tr>
    </tbody>
  </table>
  <div class="totals">
    <div><span>VAT rate</span><span>${escape(invoice.vatRatePercent)}%</span></div>
    <div><span>Net</span><span>${escape(invoice.netUgx)} UGX</span></div>
    <div><span>VAT</span><span>${escape(invoice.vatUgx)} UGX</span></div>
    <div><strong>Gross</strong><strong>${escape(invoice.grossUgx)} UGX</strong></div>
    <div><span>Tender</span><span>${escape(invoice.paymentMethod || '—')}</span></div>
  </div>
  <p class="preamble">${escape(invoice.preambleSnapshot)}</p>
  <p class="preamble">Print this page to PDF for archival.</p>
</body>
</html>`;
};

const ugx = (value) => `${Math.round(Number(value || 0)).toLocaleString('en-US')} UGX`;

const renderInvoicePdf = (invoice) => {
  const isCredit = invoice.documentType === 'credit_note';
  const title = isCredit ? 'CREDIT NOTE' : 'TAX INVOICE';
  const doc = createPdfDocument({ title: `${title} ${invoice.invoiceNumber}` });
  if (isCredit) doc.watermark('CREDIT NOTE', { size: 70 });

  doc.heading(invoice.companyNameSnapshot || 'Karibu Groceries LTD', 16);
  doc.text(`TIN: ${invoice.tinSnapshot || '-'}`, { size: 10, gray: 0.3 });
  doc.spacer(8);
  doc.heading(title, 20);
  doc.keyValues([
    ['Document no.', invoice.invoiceNumber],
    ['Branch', invoice.branch],
    ['Issued', new Date(invoice.issuedAt).toISOString().replace('T', ' ').slice(0, 16) + ' UTC'],
    ['Buyer', invoice.buyerName || '-'],
    ['Payment method', invoice.paymentMethod || '-'],
    ...(invoice.voidReason ? [['Reason', invoice.voidReason]] : [])
  ]);
  doc.spacer(12);
  doc.table(
    [
      { label: 'Description', width: 0.36 },
      { label: 'Qty (kg)', width: 0.12, align: 'right' },
      { label: 'Net', width: 0.17, align: 'right' },
      { label: 'VAT', width: 0.17, align: 'right' },
      { label: 'Gross', width: 0.18, align: 'right' }
    ],
    [
      [
        `${invoice.produceName} (${invoice.produceType})`,
        String(invoice.tonnageKg ?? ''),
        ugx(invoice.netUgx),
        ugx(invoice.vatUgx),
        ugx(invoice.grossUgx)
      ]
    ]
  );
  doc.spacer(10);
  const totalsX = doc.margin + doc.contentWidth * 0.55;
  const totalsWidth = doc.contentWidth * 0.45;
  for (const [label, value, bold] of [
    [`VAT rate`, `${invoice.vatRatePercent ?? 0}%`, false],
    ['Net', ugx(invoice.netUgx), false],
    ['VAT', ugx(invoice.vatUgx), false],
    [isCredit ? 'Total credited' : 'Total due', ugx(invoice.grossUgx), true]
  ]) {
    const top = doc.cursorY;
    doc.text(label, { x: totalsX, width: totalsWidth, bold });
    doc.cursorY = top;
    doc.text(value, { x: totalsX, width: totalsWidth, align: 'right', bold });
  }
  if (invoice.preambleSnapshot) {
    doc.spacer(20);
    doc.text(invoice.preambleSnapshot, { size: 9, gray: 0.35 });
  }
  return doc.toBuffer();
};

export {
  allocateInvoiceNumber,
  issueTaxInvoiceForSale,
  issueCreditNoteForVoidedSale,
  listInvoices,
  renderInvoiceHtml,
  renderInvoicePdf
};
