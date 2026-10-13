//  Builds director dashboard exports in CSV/Excel/print-friendly HTML formats.
 
import { formatDisplayTimestamp } from '../dateFormat.js';
import { downloadReportFile } from '../downloadFile.js';
import { formatUgx, toNumber } from '../numberFormat.js';
import {
  buildReportBrandingHtml,
  getReportBrandingRows
} from './reportBranding.js';

const formatCurrencyValue = formatUgx;

// Return raw number for machine exports or localized number for HTML views.
const formatNumberValue = (value, formatted) =>
  formatted ? toNumber(value).toLocaleString('en-UG') : toNumber(value);

// Return raw UGX value for CSV/Excel or formatted currency for printable report.
const formatCurrencyForOutput = (value, formatted) =>
  formatted ? formatCurrencyValue(value) : toNumber(value);

// Escape text values for safe CSV cell output.
const escapeCsvValue = (value) => {
  const text = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

// Escape dynamic text injected into generated report HTML.
const escapeHtml = (value) =>
  String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Sanitize labels so generated filenames remain safe across operating systems.
const sanitizeFileSegment = (value) => {
  const cleaned = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || 'all';
};

// Build summary metric rows displayed/exported at the top of the report.
const getDirectorSummaryRows = (state, formatted) => [
  ['Report Period', state.selectedPeriodLabel],
  ['Branch Scope', state.selectedBranchLabel],
  ['Range', state.formattedRange],
  ['Transactions', formatNumberValue(state.totalTransactions, formatted)],
  ['Total Revenue (UGX)', formatCurrencyForOutput(state.totalRevenue, formatted)],
  ['Cash Sales (UGX)', formatCurrencyForOutput(state.grandTotal?.cash, formatted)],
  ['Credit Sales (UGX)', formatCurrencyForOutput(state.grandTotal?.credit, formatted)],
  ['Total Procurement (UGX)', formatCurrencyForOutput(state.procurementTotal, formatted)],
  ['Total Produce Sold (kg)', formatNumberValue(state.grandTotal?.totalKg, formatted)]
];

// Build branch-level totals table, adding procurement column only when present.
const getDirectorBranchSection = (state, formatted) => {
  const includeProcurement = Object.keys(state.procurementTotals || {}).length > 0;
  const headers = [
    'Branch',
    'Cash Sales (UGX)',
    'Credit Sales (UGX)',
    'Total Revenue (UGX)',
    'Total Weight (kg)'
  ];
  if (includeProcurement) {
    headers.push('Procurement Cost (UGX)');
  }

  const rows = (state.branchLabels || []).map((branch) => {
    const totals = state.branchTotals?.[branch] || { cash: 0, credit: 0, totalKg: 0 };
    const procurementCost = state.procurementTotals?.[branch]?.totalCost || 0;
    const row = [
      branch,
      formatCurrencyForOutput(totals.cash, formatted),
      formatCurrencyForOutput(totals.credit, formatted),
      formatCurrencyForOutput(totals.cash + totals.credit, formatted),
      formatNumberValue(totals.totalKg, formatted)
    ];
    if (includeProcurement) {
      row.push(formatCurrencyForOutput(procurementCost, formatted));
    }
    return row;
  });

  return { headers, rows };
};

// Build sales trend rows for period-over-period chart exports.
const getDirectorTrendSection = (state, formatted) => ({
  headers: ['Period', 'Total Sales (UGX)'],
  rows: (state.trendLabels || []).map((label, index) => [
    label,
    formatCurrencyForOutput(state.trendSeries?.[index] || 0, formatted)
  ])
});

// Compose an export filename with period, branch scope, and date stamp.
export const buildDirectorFileName = (state, extension) => {
  const period = sanitizeFileSegment(state.selectedPeriodLabel);
  const branch = sanitizeFileSegment(state.selectedBranchLabel);
  const stamp = new Date().toISOString().slice(0, 10);
  return `director_report_${period}_${branch}_${stamp}.${extension}`;
};

// Build UTF-8 CSV content with sectioned tables for summary, branches, and trend.
export const buildDirectorCsvContent = (state) => {
  const lines = [];
  const addSection = (title, headers, rows) => {
    lines.push([title]);
    if (headers?.length) {
      lines.push(headers);
    }
    rows.forEach((row) => lines.push(row));
    lines.push([]);
  };

  const generatedAt = formatDisplayTimestamp(new Date());
  lines.push(...getReportBrandingRows('Director Report', generatedAt));
  addSection('Summary', ['Metric', 'Value'], getDirectorSummaryRows(state, false));
  const branchSection = getDirectorBranchSection(state, false);
  addSection('Branch Totals', branchSection.headers, branchSection.rows);
  const trendSection = getDirectorTrendSection(state, false);
  addSection('Sales Trend', trendSection.headers, trendSection.rows);

  const content = lines.map((row) => row.map(escapeCsvValue).join(',')).join('\r\n');
  return `\ufeff${content}`;
};

// Build Excel-compatible HTML content for direct spreadsheet opening.
export const buildDirectorExcelContent = (state) => {
  const generatedAt = formatDisplayTimestamp(new Date());
  const buildTable = (title, headers, rows) => {
    const columnCount = Math.max(headers.length || 1, ...rows.map((row) => row.length || 0), 1);
    const headerRow = headers.length
      ? `<tr>${headers.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr>`
      : '';
    const bodyRows = rows
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
      .join('');

    return `
      <table border="1">
        <tr><th colspan="${columnCount}">${escapeHtml(title)}</th></tr>
        ${headerRow}
        ${bodyRows}
      </table>
      <br />
    `;
  };

  const summaryRows = getDirectorSummaryRows(state, false);
  const branchSection = getDirectorBranchSection(state, false);
  const trendSection = getDirectorTrendSection(state, false);

  return `
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: "Segoe UI", Tahoma, sans-serif; color: #0f172a; }
          .report-branding { margin-bottom: 24px; }
          .report-branding-main { display: flex; align-items: center; gap: 16px; }
          .report-brand-logo { width: 68px; height: 68px; object-fit: contain; }
          .report-company-name { font-size: 22px; font-weight: 700; }
          .report-system-name { color: #475569; margin-top: 4px; }
          .report-title { margin-top: 8px; font-size: 16px; font-weight: 600; }
          .report-generated-at { margin: 8px 0 0; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        ${buildReportBrandingHtml({
          reportTitle: 'Director Report',
          generatedAt,
          escapeHtml
        })}
        ${buildTable('Summary', ['Metric', 'Value'], summaryRows)}
        ${buildTable('Branch Totals', branchSection.headers, branchSection.rows)}
        ${buildTable('Sales Trend', trendSection.headers, trendSection.rows)}
      </body>
    </html>
  `;
};

// Build printable dashboard report HTML for browser print or PDF save.
export const buildDirectorReportHtml = (state) => {
  const summaryRows = getDirectorSummaryRows(state, true);
  const branchSection = getDirectorBranchSection(state, true);
  const trendSection = getDirectorTrendSection(state, true);
  const generatedAt = formatDisplayTimestamp(new Date());

  const summaryBody = summaryRows
    .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join('');

  const branchHeader = `<tr>${branchSection.headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join('')}</tr>`;
  const branchBody = branchSection.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');

  const trendHeader = `<tr>${trendSection.headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join('')}</tr>`;
  const trendBody = trendSection.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');

  return `
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Director Report</title>
        <link rel="stylesheet" href="/report-print.css" />
      </head>
      <body>
        ${buildReportBrandingHtml({
          reportTitle: 'Director Report',
          generatedAt,
          escapeHtml
        })}

        <h2>Summary</h2>
        <table class="summary">
          <tbody>
            ${summaryBody}
          </tbody>
        </table>

        <h2>Branch Totals</h2>
        <table>
          <thead>
            ${branchHeader}
          </thead>
          <tbody>
            ${branchBody || '<tr><td colspan="' + branchSection.headers.length + '">No data</td></tr>'}
          </tbody>
        </table>

        <h2>Sales Trend</h2>
        <table>
          <thead>
            ${trendHeader}
          </thead>
          <tbody>
            ${trendBody || '<tr><td colspan="' + trendSection.headers.length + '">No data</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
  `;
};

export { downloadReportFile };
