/** Tests CSV export helpers for director and manager report filename/content generation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDirectorCsvContent,
  buildDirectorFileName
} from '../src/utils/reports/directorReportExport.mjs';
import {
  buildManagerCsvContent,
  buildManagerFileName
} from '../src/utils/reports/managerReportExport.mjs';

test('buildDirectorFileName sanitizes labels and formats filename', () => {
  const fileName = buildDirectorFileName(
    {
      selectedPeriodLabel: 'Weekly',
      selectedBranchLabel: 'All Branches'
    },
    'csv'
  );

  assert.match(fileName, /^director_report_weekly_all_branches_\d{4}-\d{2}-\d{2}\.csv$/);
});

test('buildDirectorCsvContent includes report sections and escapes values', () => {
  const csv = buildDirectorCsvContent({
    selectedPeriodLabel: 'Weekly',
    selectedBranchLabel: 'All Branches',
    formattedRange: '01/01/2026 - 07/01/2026',
    totalTransactions: 3,
    totalRevenue: 1200000,
    grandTotal: { cash: 700000, credit: 500000, totalKg: 800 },
    procurementTotal: 400000,
    branchLabels: ['North, Branch'],
    branchTotals: {
      'North, Branch': { cash: 700000, credit: 500000, totalKg: 800 }
    },
    procurementTotals: {},
    trendLabels: ['Mon'],
    trendSeries: [1200000]
  });

  assert.ok(csv.startsWith('\ufeff'));
  assert.match(csv, /Summary/);
  assert.match(csv, /Branch Totals/);
  assert.match(csv, /"North, Branch"/);
});

test('buildManagerFileName sanitizes branch labels and formats filename', () => {
  const fileName = buildManagerFileName(
    {
      selectedPeriodLabel: 'Monthly',
      userBranch: 'Matugga Main'
    },
    'xls'
  );

  assert.match(fileName, /^manager_report_matugga_main_monthly_\d{4}-\d{2}-\d{2}\.xls$/);
});

test('buildManagerCsvContent includes key sections', () => {
  const csv = buildManagerCsvContent({
    selectedPeriodLabel: 'Weekly',
    userBranch: 'Maganjo',
    formattedReportRange: '01/01/2026 - 07/01/2026',
    totalTransactions: 12,
    stats: {
      cashSales: 500000,
      creditSales: 350000,
      procurementTotal: 150000,
      procurementCount: 4,
      inventoryValue: 2000000,
      inventoryItems: 12
    },
    lowStockItemsLength: 2,
    creditCollection: {
      collected: 200000,
      outstanding: 150000
    },
    salesOverTime: [{ label: 'Mon', amount: 850000 }],
    topProducts: [{ name: 'Beans', totalKg: 200 }],
    stockByProduct: [{ name: 'Beans', totalKg: 400 }],
    agentPerformance: [{ name: 'Alex', amount: 300000 }],
    dealerPerformance: [{ name: 'Lam Traders', amount: 150000 }]
  });

  assert.ok(csv.startsWith('\ufeff'));
  assert.match(csv, /Summary/);
  assert.match(csv, /Sales Trend/);
  assert.match(csv, /Dealer Performance/);
});

