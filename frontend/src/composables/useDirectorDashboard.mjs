import { computed, onMounted, reactive, ref } from 'vue';
import { salesAPI } from '../services/api';
import { formatCompactCurrency, formatCompactNumber } from '../utils/numberFormat';
import {
  buildDirectorCsvContent,
  buildDirectorExcelContent,
  buildDirectorFileName,
  buildDirectorReportHtml,
  downloadReportFile
} from '../utils/reports/directorReportExport.mjs';
import { formatDisplayRange } from '../utils/dateFormat.mjs';
import {
  buildTonalPalette,
  dashboardChartColors,
  formatCurrencyValue
} from '../utils/charts/dashboardChartTheme.mjs';

const PERIOD_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

const BRANCH_OPTIONS = [
  { value: 'all', label: 'All Branches' },
  { value: 'Maganjo', label: 'Maganjo' },
  { value: 'Matugga', label: 'Matugga' }
];

const createEmptyGrandTotal = () => ({
  cash: 0,
  credit: 0,
  totalKg: 0
});

const createEmptyReport = () => ({
  salesCount: 0,
  creditSalesCount: 0,
  procurementCount: 0,
  procurementTotal: 0
});

const createEmptyRange = () => ({
  from: '',
  to: ''
});

const toNumber = (value) => Number(value || 0);

const getSelectedPeriodLabel = (period, specificDate) => {
  if (specificDate) return 'Specific Date';
  return PERIOD_OPTIONS.find((option) => option.value === period)?.label || 'Weekly';
};

const getSelectedBranchLabel = (branch) =>
  BRANCH_OPTIONS.find((option) => option.value === branch)?.label || 'All Branches';

const createQuickActions = ({ filters, loadData, exportCsv, exportExcel, exportPdf }) => [
  {
    key: 'scope-all',
    icon: 'bi bi-diagram-3',
    label: 'All Branches',
    meta: 'Set view scope to all branches',
    onClick: () => {
      if (filters.branch !== 'all') {
        filters.branch = 'all';
        loadData();
      }
    }
  },
  {
    key: 'scope-maganjo',
    icon: 'bi bi-geo-alt',
    label: 'Maganjo View',
    meta: 'Focus reporting to Maganjo branch',
    onClick: () => {
      if (filters.branch !== 'Maganjo') {
        filters.branch = 'Maganjo';
        loadData();
      }
    }
  },
  {
    key: 'scope-matugga',
    icon: 'bi bi-geo-alt-fill',
    label: 'Matugga View',
    meta: 'Focus reporting to Matugga branch',
    onClick: () => {
      if (filters.branch !== 'Matugga') {
        filters.branch = 'Matugga';
        loadData();
      }
    }
  },
  {
    key: 'export-csv',
    icon: 'bi bi-filetype-csv',
    label: 'Export CSV',
    meta: 'Download current report',
    onClick: () => exportCsv()
  },
  {
    key: 'export-excel',
    icon: 'bi bi-file-earmark-spreadsheet',
    label: 'Export Excel',
    meta: 'Download spreadsheet report',
    onClick: () => exportExcel()
  },
  {
    key: 'export-pdf',
    icon: 'bi bi-file-earmark-pdf',
    label: 'Export PDF',
    meta: 'Print-ready executive report',
    onClick: () => exportPdf()
  }
];

export function useDirectorDashboard() {
  const loading = ref(false);
  const loadError = ref('');
  const exportError = ref('');
  const filters = reactive({
    period: 'weekly',
    branch: 'all',
    specificDate: ''
  });
  const todayIsoDate = new Date().toISOString().split('T')[0];
  const branchTotals = ref({});
  const grandTotal = reactive(createEmptyGrandTotal());
  const trendLabels = ref([]);
  const trendSeries = ref([]);
  const report = reactive(createEmptyReport());
  const procurementTotals = ref({});
  const range = reactive(createEmptyRange());

  const selectedPeriodLabel = computed(() =>
    getSelectedPeriodLabel(filters.period, filters.specificDate)
  );

  const selectedBranchLabel = computed(() => getSelectedBranchLabel(filters.branch));

  const formattedRange = computed(() => formatDisplayRange(range.from, range.to));
  const totalRevenue = computed(() => grandTotal.cash + grandTotal.credit);
  const totalTransactions = computed(
    () => toNumber(report.salesCount) + toNumber(report.creditSalesCount)
  );
  const procurementTotal = computed(() => toNumber(report.procurementTotal));
  const procurementCount = computed(() => toNumber(report.procurementCount));
  const branchLabels = computed(() => Object.keys(branchTotals.value));

  const overviewItems = computed(() => [
    {
      label: 'Report Period',
      value: selectedPeriodLabel.value,
      meta: 'Current reporting window'
    },
    {
      label: 'Branch Scope',
      value: selectedBranchLabel.value,
      meta: 'Cross-branch coverage'
    },
    {
      label: 'Range',
      value: formattedRange.value,
      meta: 'Selected reporting dates'
    },
    {
      label: 'Transactions',
      value: totalTransactions.value.toLocaleString('en-UG'),
      meta: 'Cash and credit activity'
    }
  ]);

  const statusMessage = computed(() => {
    if (loading.value) return 'Loading director dashboard data.';
    return loadError.value || 'Director dashboard data loaded.';
  });

  const hasRevenueData = computed(() => totalRevenue.value > 0);
  const hasTrendData = computed(() => trendSeries.value.some((value) => value > 0));

  const metricItems = computed(() => [
    {
      key: 'total-revenue',
      icon: 'bi bi-graph-up-arrow',
      title: 'Total Revenue',
      value: formatCompactCurrency(totalRevenue.value),
      meta: 'Cash + credit sales'
    },
    {
      key: 'cash-sales',
      icon: 'bi bi-cash-stack',
      title: 'Cash Sales',
      value: formatCompactCurrency(grandTotal.cash),
      meta: 'Collected amount'
    },
    {
      key: 'credit-sales',
      icon: 'bi bi-credit-card-2-front',
      title: 'Credit Sales',
      value: formatCompactCurrency(grandTotal.credit),
      meta: 'Outstanding amount'
    },
    {
      key: 'procurement-total',
      icon: 'bi bi-bag-check',
      title: 'Total Procurement',
      value: formatCompactCurrency(procurementTotal.value),
      meta: `${procurementCount.value.toLocaleString('en-UG')} record(s)`
    },
    {
      key: 'produce-sold',
      icon: 'bi bi-box-seam',
      title: 'Total Produce Sold',
      value: `${formatCompactNumber(grandTotal.totalKg)} kg`,
      meta: `${branchLabels.value.length} branch(es) in scope`
    }
  ]);

  const trendChartData = computed(() => ({
    labels: trendLabels.value,
    datasets: [
      {
        label: 'Total Sales',
        data: trendSeries.value,
        borderColor: dashboardChartColors.forest,
        backgroundColor: dashboardChartColors.fill,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: dashboardChartColors.forest
      }
    ]
  }));

  const revenueCompositionChartData = computed(() => ({
    labels: ['Cash Sales', 'Credit Sales'],
    datasets: [
      {
        data: [grandTotal.cash, grandTotal.credit],
        backgroundColor: [dashboardChartColors.forest, dashboardChartColors.grain],
        borderColor: dashboardChartColors.surface,
        borderWidth: 2,
        hoverOffset: 6
      }
    ]
  }));

  const branchRevenueChartData = computed(() => ({
    labels: branchLabels.value,
    datasets: [
      {
        label: 'Cash Sales',
        data: branchLabels.value.map((branch) => branchTotals.value[branch].cash),
        backgroundColor: dashboardChartColors.forest,
        borderRadius: 10,
        maxBarThickness: 34
      },
      {
        label: 'Credit Sales',
        data: branchLabels.value.map((branch) => branchTotals.value[branch].credit),
        backgroundColor: dashboardChartColors.grain,
        borderRadius: 10,
        maxBarThickness: 34
      }
    ]
  }));

  const branchVolumeChartData = computed(() => ({
    labels: branchLabels.value,
    datasets: [
      {
        label: 'Total Kilograms',
        data: branchLabels.value.map((branch) => branchTotals.value[branch].totalKg),
        backgroundColor: buildTonalPalette(branchLabels.value.length, 'sky'),
        borderRadius: 10,
        barThickness: 18
      }
    ]
  }));

  const resetDashboardState = () => {
    branchTotals.value = {};
    procurementTotals.value = {};
    Object.assign(grandTotal, createEmptyGrandTotal());
    trendLabels.value = [];
    trendSeries.value = [];
    Object.assign(report, createEmptyReport());
    Object.assign(range, createEmptyRange());
  };

  const loadData = async () => {
    loading.value = true;
    loadError.value = '';

    try {
      const response = await salesAPI.getAggregation({
        period: filters.period,
        branch: filters.branch,
        specificDate: filters.specificDate || undefined
      });

      branchTotals.value = response.data.branchTotals || {};
      procurementTotals.value = response.data.procurementTotals || {};
      Object.assign(grandTotal, response.data.grandTotal || createEmptyGrandTotal());
      trendLabels.value = response.data.trends?.labels || [];
      trendSeries.value = response.data.trends?.data || [];
      Object.assign(report, response.data.report || createEmptyReport());
      Object.assign(range, response.data.range || createEmptyRange());
    } catch (error) {
      resetDashboardState();
      loadError.value = error.response?.data?.message || 'Unable to load dashboard data. Try again.';
      console.error('Error loading aggregation:', error);
    } finally {
      loading.value = false;
    }
  };

  const clearSpecificDate = () => {
    if (!filters.specificDate) return;
    filters.specificDate = '';
    loadData();
  };

  const formatCurrency = (amount) => formatCurrencyValue(amount);

  const getReportExportState = () => ({
    selectedPeriodLabel: selectedPeriodLabel.value,
    selectedBranchLabel: selectedBranchLabel.value,
    formattedRange: formattedRange.value,
    totalTransactions: totalTransactions.value,
    totalRevenue: totalRevenue.value,
    grandTotal: { ...grandTotal },
    procurementTotal: procurementTotal.value,
    branchLabels: branchLabels.value,
    branchTotals: branchTotals.value,
    procurementTotals: procurementTotals.value,
    trendLabels: trendLabels.value,
    trendSeries: trendSeries.value
  });

  const buildFileName = (extension) => buildDirectorFileName(getReportExportState(), extension);
  const buildCsvContent = () => buildDirectorCsvContent(getReportExportState());
  const buildExcelContent = () => buildDirectorExcelContent(getReportExportState());
  const buildReportHtml = () => buildDirectorReportHtml(getReportExportState());

  const downloadFile = (filename, content, type) => {
    downloadReportFile({ filename, content, type });
  };

  const exportCsv = () => {
    exportError.value = '';
    downloadFile(buildFileName('csv'), buildCsvContent(), 'text/csv;charset=utf-8');
  };

  const exportExcel = () => {
    exportError.value = '';
    downloadFile(buildFileName('xls'), buildExcelContent(), 'application/vnd.ms-excel');
  };

  const exportPdf = () => {
    exportError.value = '';
    const reportHtml = buildReportHtml();
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      exportError.value = 'Please allow pop-ups to export the PDF report.';
      return;
    }
    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onafterprint = () => printWindow.close();
    setTimeout(() => printWindow.print(), 300);
  };

  const clearExportError = () => {
    exportError.value = '';
  };

  const quickActions = computed(() =>
    createQuickActions({ filters, loadData, exportCsv, exportExcel, exportPdf })
  );

  onMounted(async () => {
    await loadData();
  });

  return {
    branchOptions: BRANCH_OPTIONS,
    branchLabels,
    branchRevenueChartData,
    branchTotals,
    branchVolumeChartData,
    clearSpecificDate,
    clearExportError,
    exportCsv,
    exportError,
    exportExcel,
    exportPdf,
    filters,
    formatCurrency,
    hasRevenueData,
    hasTrendData,
    loadData,
    loadError,
    loading,
    metricItems,
    overviewItems,
    periodOptions: PERIOD_OPTIONS,
    quickActions,
    revenueCompositionChartData,
    selectedPeriodLabel,
    statusMessage,
    todayIsoDate,
    trendChartData
  };
}
