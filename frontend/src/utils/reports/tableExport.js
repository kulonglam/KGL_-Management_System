import { formatDisplayTimestamp } from '../dateFormat.js';
import { buildReportBrandingHtml, getReportBrandingRows } from './reportBranding.js';

const escapeCsvValue = (value) => {
  const text = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

const escapeHtml = (value) =>
  String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const cellText = (column, row) => {
  const value = typeof column.value === 'function' ? column.value(row) : row?.[column.key];
  return value === undefined || value === null ? '' : String(value);
};

const buildTableCsv = (title, columns, rows) => {
  const generatedAt = formatDisplayTimestamp(new Date());
  const lines = getReportBrandingRows(title, generatedAt).map((line) => line.map(escapeCsvValue).join(','));
  lines.push(columns.map((column) => escapeCsvValue(column.label)).join(','));
  rows.forEach((row) => {
    lines.push(columns.map((column) => escapeCsvValue(cellText(column, row))).join(','));
  });
  return `\uFEFF${lines.join('\n')}`;
};

const buildTableExcel = (title, columns, rows) => {
  const generatedAt = formatDisplayTimestamp(new Date());
  const header = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('');
  const body = rows
    .map(
      (row) =>
        `<tr>${columns.map((column) => `<td>${escapeHtml(cellText(column, row))}</td>`).join('')}</tr>`
    )
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body>
    ${buildReportBrandingHtml({ reportTitle: title, generatedAt, escapeHtml })}
    <table border="1"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>
  </body></html>`;
};

const buildTablePrintHtml = (title, columns, rows) => {
  const table = buildTableExcel(title, columns, rows);
  return table.replace(
    '</head>',
    '<style>body{font-family:Segoe UI,sans-serif;color:#0f172a}table{border-collapse:collapse;width:100%}th,td{padding:6px 8px;text-align:left}</style></head>'
  );
};

export { buildTableCsv, buildTableExcel, buildTablePrintHtml };
