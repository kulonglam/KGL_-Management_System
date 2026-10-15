import { computed, onMounted, reactive, ref } from 'vue';
import { inventoryAPI, salesAPI } from '../services/api';
import { formatCompactCurrency, toNumber } from '../utils/numberFormat';
import { downloadReportFile } from '../utils/downloadFile.js';
import {
  buildManagerCsvContent,
  buildManagerExcelContent,
  buildManagerFileName,
  buildManagerReportHtml
} from '../utils/reports/managerReportExport.js';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';
import { formatDisplayRange } from '../utils/dateFormat.js';
import { businessTodayIso } from '../utils/businessTime.js';
import { buildTonalPalette, dashboardChartColors } from '../utils/charts/dashboardChartTheme.js';

const PERIOD_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

const QUICK_ACTIONS = [
  {
    key: 'record-procurement',
    to: '/dashboard/procurement',
    icon: 'bi bi-bag-plus',
    label: 'Record Procurement',
    meta: 'Capture incoming stock'
  },
  {
    key: 'record-cash-sale',
    to: '/dashboard/sales',
    icon: 'bi bi-cash-stack',
    label: 'Record Cash Sale',
    meta: 'Create immediate payment sale'
  },
  {
    key: 'record-credit-sale',
    to: '/dashboard/credit-sales',
    icon: 'bi bi-journal-plus',
    label: 'Record Credit Sale',
    meta: 'Dispatch with deferred payment'
  },
  {
    key: 'inventory',
    to: '/dashboard/inventory',
    icon: 'bi bi-box-seam',
    label: 'Review Inventory',
    meta: 'Monitor stock and status'
  },
  {
    key: 'buyers',
    to: '/dashboard/trusted-buyers',
    icon: 'bi bi-person-check',
    label: 'Trusted Buyers',
    meta: 'Manage approved credit buyers'
  },
  {
    key: 'prices',
    to: '/dashboard/price-management',
    icon: 'bi bi-tags',
    label: 'Price Management',
    meta: 'Update produce selling prices'
  }
];

const createEmptyRange = () => ({
  from: '',
  to: ''
});

const createEmptyStats = () => ({
  inventoryValue: 0,
  inventoryItems: 0,
  cashSales: 0,
  cashCount: 0,
  creditSales: 0,
  creditCount: 0,
  procurementTotal: 0,
  procurementCount: 0
});

const createEmptyCreditCollection = () => ({
  collected: 0,
  outstanding: 0
});

const getSelectedPeriodLabel = (period, specificDate) => {
  if (specificDate) return 'Specific Date';
  return PERIOD_OPTIONS.find((option) => option.value === period)?.label || 'Weekly';
};

export function useManagerDashboard() {
  const authStore = useAuthStore(pinia);

  const loading = ref(false);
  const loadError = ref('');
  const exportError = ref('');
  const user = ref(authStore.user || {});
  const filters = reactive({
    period: 'weekly',
    specificDate: ''
  });
  const todayIsoDate = businessTodayIso();
  const reportRange = reactive(createEmptyRange());
  const inventory = ref([]);
  const stats = reactive(createEmptyStats());
  const lowStockItems = ref([]);
  const topProducts = ref([]);
  const stockByProduct = ref([]);
  const salesOverTime = ref([]);
  const creditCollection = reactive(createEmptyCreditCollection());
  const agentPerformance = ref([]);
  const dealerPerformance = ref([]);

  const selectedPeriodLabel = computed(() =>
    getSelectedPeriodLabel(filters.period, filters.specificDate)
  );

  const formattedReportRange = computed(() =>
    formatDisplayRange(reportRange.from, reportRange.to)
  );

  const totalTransactions = computed(() => stats.cashCount + stats.creditCount);

  const overviewItems = computed(() => [
    {
      label: 'Selected Period',
      value: selectedPeriodLabel.value,
      meta: 'Current manager report mode'
    },
    {
      label: 'Date Range',
      value: formattedReportRange.value,
      meta: 'Filtered operational window'
    },
    {
      label: 'Sales Records',
      value: stats.cashCount.toLocaleString('en-UG'),
      meta: 'Cash transactions captured'
    },
    {
      label: 'Credit Records',
      value: stats.creditCount.toLocaleString('en-UG'),
      meta: 'Deferred-payment dispatches'
    }
  ]);

  const statusMessage = computed(() => {
    if (loading.value) return 'Loading manager dashboard data.';
    return loadError.value || 'Manager dashboard data loaded.';
  });

  const hasRevenueSplitData = computed(() => stats.cashSales + stats.creditSales > 0);
  const hasCreditCollectionData = computed(
    () => creditCollection.collected + creditCollection.outstanding > 0
  );
  const hasSalesTrendData = computed(() =>
    salesOverTime.value.some((item) => item.amount > 0)
  );

  const metricItems = computed(() => [
    {
      key: 'inventory-value',
      icon: 'bi bi-safe2',
      title: 'Inventory Value',
      value: formatCompactCurrency(stats.inventoryValue),
      meta: `${stats.inventoryItems} items`
    },
    {
      key: 'cash-sales',
      icon: 'bi bi-cash-stack',
      title: 'Cash Sales',
      value: formatCompactCurrency(stats.cashSales),
      meta: `${stats.cashCount} transactions`
    },
    {
      key: 'credit-sales',
      icon: 'bi bi-credit-card',
      title: 'Credit Sales',
      value: formatCompactCurrency(stats.creditSales),
      meta: `${stats.creditCount} transactions`
    },
    {
      key: 'procurement-total',
      icon: 'bi bi-bag-plus',
      title: 'Procurement Cost',
      value: formatCompactCurrency(stats.procurementTotal),
      meta: `${stats.procurementCount} record(s)`
    },
    {
      key: 'total-revenue',
      icon: 'bi bi-graph-up-arrow',
      title: 'Total Revenue',
      value: formatCompactCurrency(stats.cashSales + stats.creditSales),
      meta: `${totalTransactions.value} transaction(s)`
    }
  ]);

  const revenueSplitChartData = computed(() => ({
    labels: ['Cash Sales', 'Credit Sales'],
    datasets: [
      {
        data: [stats.cashSales, stats.creditSales],
        backgroundColor: [dashboardChartColors.forest, dashboardChartColors.grain],
        borderColor: dashboardChartColors.surface,
        borderWidth: 2,
        hoverOffset: 6
      }
    ]
  }));

  const creditCollectionChartData = computed(() => ({
    labels: ['Collected', 'Outstanding'],
    datasets: [
      {
        data: [creditCollection.collected, creditCollection.outstanding],
        backgroundColor: [dashboardChartColors.teal, dashboardChartColors.amber],
        borderColor: dashboardChartColors.surface,
        borderWidth: 2,
        hoverOffset: 6
      }
    ]
  }));

  const salesOverTimeChartData = computed(() => ({
    labels: salesOverTime.value.map((item) => item.label),
    datasets: [
      {
        label: 'Total Sales',
        data: salesOverTime.value.map((item) => item.amount),
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

  const agentPerformanceChartData = computed(() => ({
    labels: agentPerformance.value.map((item) => item.name),
    datasets: [
      {
        label: 'UGX',
        data: agentPerformance.value.map((item) => item.amount),
        backgroundColor: buildTonalPalette(agentPerformance.value.length, 'teal'),
        borderRadius: 10,
        barThickness: 18
      }
    ]
  }));

  const topProductsChartData = computed(() => ({
    labels: topProducts.value.map((item) => item.name),
    datasets: [
      {
        label: 'Kilograms Sold',
        data: topProducts.value.map((item) => item.totalKg),
        backgroundColor: buildTonalPalette(topProducts.value.length, 'forest'),
        borderRadius: 10,
        maxBarThickness: 42
      }
    ]
  }));

  const stockByProductChartData = computed(() => ({
    labels: stockByProduct.value.map((item) => item.name),
    datasets: [
      {
        label: 'Available Stock',
        data: stockByProduct.value.map((item) => item.totalKg),
        backgroundColor: buildTonalPalette(stockByProduct.value.length, 'sky'),
        borderRadius: 10,
        barThickness: 18
      }
    ]
  }));

  const dealerPerformanceChartData = computed(() => ({
    labels: dealerPerformance.value.map((item) => item.name),
    datasets: [
      {
        label: 'UGX',
        data: dealerPerformance.value.map((item) => item.amount),
        backgroundColor: buildTonalPalette(dealerPerformance.value.length, 'grain'),
        borderRadius: 10,
        maxBarThickness: 20
      }
    ]
  }));

  const applyInventoryCharts = () => {
    lowStockItems.value = inventory.value.filter((item) => toNumber(item.totalTonnageKg) < 500);
    stockByProduct.value = inventory.value
      .map((item) => ({ name: item.produceName, totalKg: toNumber(item.totalTonnageKg) }))
      .sort((left, right) => right.totalKg - left.totalKg)
      .slice(0, 5);
  };

  const buildDashboardData = () => {
    applyInventoryCharts();
  };

  const loadData = async () => {
    loading.value = true;
    loadError.value = '';

    try {
      const [inventoryResponse, summaryResponse] = await Promise.all([
        inventoryAPI.get(),
        salesAPI.getDashboard({
          period: filters.period,
          specificDate: filters.specificDate || undefined
        })
      ]);
      const summary = summaryResponse.data || {};

      inventory.value = inventoryResponse.data.inventory || [];
      Object.assign(reportRange, summary.reportRange || createEmptyRange());
      Object.assign(stats, {
        ...(summary.stats || createEmptyStats()),
        inventoryValue: toNumber(inventoryResponse.data.statistics?.totalValue),
        inventoryItems: toNumber(inventoryResponse.data.statistics?.totalItems)
      });
      Object.assign(creditCollection, summary.creditCollection || createEmptyCreditCollection());
      topProducts.value = summary.topProducts || [];
      salesOverTime.value = summary.salesOverTime || [];
      agentPerformance.value = summary.agentPerformance || [];
      dealerPerformance.value = summary.dealerPerformance || [];
      applyInventoryCharts();
    } catch (error) {
      loadError.value = error.response?.data?.message || error.message || 'Unable to load dashboard data. Try again.';
      console.error('Error loading data:', error);
    } finally {
      loading.value = false;
    }
  };

  const clearSpecificDate = async () => {
    if (!filters.specificDate) return;
    filters.specificDate = '';
    await loadData();
  };

  const getReportExportState = () => ({
    selectedPeriodLabel: selectedPeriodLabel.value,
    userBranch: user.value?.branch || '',
    formattedReportRange: formattedReportRange.value,
    totalTransactions: totalTransactions.value,
    stats: { ...stats },
    lowStockItemsLength: lowStockItems.value.length,
    creditCollection: { ...creditCollection },
    salesOverTime: salesOverTime.value,
    topProducts: topProducts.value,
    stockByProduct: stockByProduct.value,
    agentPerformance: agentPerformance.value,
    dealerPerformance: dealerPerformance.value
  });

  const buildFileName = (extension) => buildManagerFileName(getReportExportState(), extension);
  const buildCsvContent = () => buildManagerCsvContent(getReportExportState());
  const buildExcelContent = () => buildManagerExcelContent(getReportExportState());
  const buildReportHtml = () => buildManagerReportHtml(getReportExportState());

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

  onMounted(async () => {
    user.value = authStore.user || {};
    await loadData();
  });

  return {
    agentPerformance,
    agentPerformanceChartData,
    buildDashboardData,
    clearSpecificDate,
    clearExportError,
    creditCollectionChartData,
    dealerPerformance,
    dealerPerformanceChartData,
    exportCsv,
    exportError,
    exportExcel,
    exportPdf,
    filters,
    formattedReportRange,
    hasCreditCollectionData,
    hasRevenueSplitData,
    hasSalesTrendData,
    loadData,
    loadError,
    loading,
    lowStockItems,
    metricItems,
    overviewItems,
    periodOptions: PERIOD_OPTIONS,
    quickActions: QUICK_ACTIONS,
    revenueSplitChartData,
    salesOverTimeChartData,
    selectedPeriodLabel,
    statusMessage,
    stockByProduct,
    stockByProductChartData,
    todayIsoDate,
    topProducts,
    topProductsChartData,
    totalTransactions,
    user
  };
}
