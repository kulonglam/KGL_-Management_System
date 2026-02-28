// Report helpers for the manager dashboard.

const toNumber = (value) => Number(value || 0);

const formatCurrencyValue = (value) =>
  new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(toNumber(value));

const formatNumberValue = (value, formatted) =>
  formatted ? toNumber(value).toLocaleString('en-UG') : toNumber(value);

const formatCurrencyForOutput = (value, formatted) =>
  formatted ? formatCurrencyValue(value) : toNumber(value);

const escapeCsvValue = (value) => {
  const text = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const escapeHtml = (value) =>
  String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sanitizeFileSegment = (value) => {
  const cleaned = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || 'all';
};

const getSummaryRows = (state, formatted) => [
  ['Branch', state.userBranch || '-'],
  ['Report Period', state.selectedPeriodLabel],
  ['Date Range', state.formattedReportRange],
  ['Transactions', formatNumberValue(state.totalTransactions, formatted)],
  ['Cash Sales (UGX)', formatCurrencyForOutput(state.stats?.cashSales, formatted)],
  ['Credit Sales (UGX)', formatCurrencyForOutput(state.stats?.creditSales, formatted)],
  [
    'Total Revenue (UGX)',
    formatCurrencyForOutput(
      toNumber(state.stats?.cashSales) + toNumber(state.stats?.creditSales),
      formatted
    )
  ],
  ['Procurement Total (UGX)', formatCurrencyForOutput(state.stats?.procurementTotal, formatted)],
  ['Procurement Records', formatNumberValue(state.stats?.procurementCount, formatted)],
  ['Inventory Value (UGX)', formatCurrencyForOutput(state.stats?.inventoryValue, formatted)],
  ['Inventory Items', formatNumberValue(state.stats?.inventoryItems, formatted)],
  ['Low Stock Items', formatNumberValue(state.lowStockItemsLength, formatted)],
  ['Credit Collected (UGX)', formatCurrencyForOutput(state.creditCollection?.collected, formatted)],
  [
    'Credit Outstanding (UGX)',
    formatCurrencyForOutput(state.creditCollection?.outstanding, formatted)
  ]
];

const getSalesTrendRows = (state, formatted) =>
  (state.salesOverTime || []).map((item) => [item.label, formatCurrencyForOutput(item.amount, formatted)]);

const getTopProductsRows = (state, formatted) =>
  (state.topProducts || []).map((item) => [item.name, formatNumberValue(item.totalKg, formatted)]);

const getStockRows = (state, formatted) =>
  (state.stockByProduct || []).map((item) => [item.name, formatNumberValue(item.totalKg, formatted)]);

const getAgentRows = (state, formatted) =>
  (state.agentPerformance || []).map((item) => [item.name, formatCurrencyForOutput(item.amount, formatted)]);

const getDealerRows = (state, formatted) =>
  (state.dealerPerformance || []).map((item) => [item.name, formatCurrencyForOutput(item.amount, formatted)]);

export const buildManagerFileName = (state, extension) => {
  const period = sanitizeFileSegment(state.selectedPeriodLabel);
  const branch = sanitizeFileSegment(state.userBranch || 'branch');
  const stamp = new Date().toISOString().slice(0, 10);
  return `manager_report_${branch}_${period}_${stamp}.${extension}`;
};

export const buildManagerCsvContent = (state) => {
  const lines = [];
  const addSection = (title, headers, rows) => {
    lines.push([title]);
    if (headers?.length) {
      lines.push(headers);
    }
    rows.forEach((row) => lines.push(row));
    lines.push([]);
  };

  addSection('Summary', ['Metric', 'Value'], getSummaryRows(state, false));
  addSection('Sales Trend', ['Period', 'Total Sales (UGX)'], getSalesTrendRows(state, false));
  addSection('Top Products', ['Product', 'Kilograms Sold'], getTopProductsRows(state, false));
  addSection('Stock By Product', ['Product', 'Available Stock (kg)'], getStockRows(state, false));
  addSection('Sales Agent Performance', ['Sales Agent', 'Amount (UGX)'], getAgentRows(state, false));
  addSection('Dealer Performance', ['Dealer', 'Procurement Cost (UGX)'], getDealerRows(state, false));

  const content = lines.map((row) => row.map(escapeCsvValue).join(',')).join('\r\n');
  return `\ufeff${content}`;
};

export const buildManagerExcelContent = (state) => {
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

  return `
    <html>
      <head>
        <meta charset="UTF-8" />
      </head>
      <body>
        ${buildTable('Summary', ['Metric', 'Value'], getSummaryRows(state, false))}
        ${buildTable('Sales Trend', ['Period', 'Total Sales (UGX)'], getSalesTrendRows(state, false))}
        ${buildTable('Top Products', ['Product', 'Kilograms Sold'], getTopProductsRows(state, false))}
        ${buildTable('Stock By Product', ['Product', 'Available Stock (kg)'], getStockRows(state, false))}
        ${buildTable('Sales Agent Performance', ['Sales Agent', 'Amount (UGX)'], getAgentRows(state, false))}
        ${buildTable('Dealer Performance', ['Dealer', 'Procurement Cost (UGX)'], getDealerRows(state, false))}
      </body>
    </html>
  `;
};

export const buildManagerReportHtml = (state) => {
  const summaryRows = getSummaryRows(state, true);
  const trendRows = getSalesTrendRows(state, true);
  const productRows = getTopProductsRows(state, true);
  const stockRows = getStockRows(state, true);
  const agentRows = getAgentRows(state, true);
  const dealerRows = getDealerRows(state, true);
  const generatedAt = new Date().toLocaleString('en-UG');

  const summaryBody = summaryRows
    .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join('');

  const buildBodyRows = (rows, columnCount) =>
    rows.length
      ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${columnCount}">No data</td></tr>`;

  const trendBody = buildBodyRows(trendRows, 2);
  const productBody = buildBodyRows(productRows, 2);
  const stockBody = buildBodyRows(stockRows, 2);
  const agentBody = buildBodyRows(agentRows, 2);
  const dealerBody = buildBodyRows(dealerRows, 2);

  return `
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Manager Report</title>
        <style>
          body { font-family: "Segoe UI", Tahoma, sans-serif; color: #0f172a; margin: 24px; }
          h1 { margin: 0 0 6px; font-size: 22px; }
          h2 { margin: 24px 0 10px; font-size: 16px; color: #1e293b; }
          p { margin: 0 0 16px; color: #64748b; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px; font-size: 12px; text-align: left; }
          th { background: #f1f5f9; font-weight: 600; }
          .summary th { width: 32%; }
        </style>
      </head>
      <body>
        <h1>Manager Report</h1>
        <p>Generated ${escapeHtml(generatedAt)}</p>

        <h2>Summary</h2>
        <table class="summary">
          <tbody>
            ${summaryBody}
          </tbody>
        </table>

        <h2>Sales Trend</h2>
        <table>
          <thead>
            <tr><th>Period</th><th>Total Sales (UGX)</th></tr>
          </thead>
          <tbody>
            ${trendBody}
          </tbody>
        </table>

        <h2>Top Products</h2>
        <table>
          <thead>
            <tr><th>Product</th><th>Kilograms Sold</th></tr>
          </thead>
          <tbody>
            ${productBody}
          </tbody>
        </table>

        <h2>Stock By Product</h2>
        <table>
          <thead>
            <tr><th>Product</th><th>Available Stock (kg)</th></tr>
          </thead>
          <tbody>
            ${stockBody}
          </tbody>
        </table>

        <h2>Sales Agent Performance</h2>
        <table>
          <thead>
            <tr><th>Sales Agent</th><th>Amount (UGX)</th></tr>
          </thead>
          <tbody>
            ${agentBody}
          </tbody>
        </table>

        <h2>Dealer Performance</h2>
        <table>
          <thead>
            <tr><th>Dealer</th><th>Procurement Cost (UGX)</th></tr>
          </thead>
          <tbody>
            ${dealerBody}
          </tbody>
        </table>
      </body>
    </html>
  `;
};

export const downloadReportFile = ({ filename, content, type }) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
