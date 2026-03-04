<!-- Manager dashboard view for branch-level KPIs, filters, charts, and report export. -->
<template>
  <div class="dashboard-view view-shell" :aria-busy="loading ? 'true' : 'false'">
    <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
      <div>
        <h2 class="page-title mb-1">Manager Dashboard</h2>
        <p class="page-subtitle mb-0">{{ user.branch || 'Branch' }} Overview</p>
      </div>
      <div class="dashboard-actions">
        <div class="dashboard-filters">
        <div class="filter-group">
          <label for="manager-period-filter" class="form-label mb-1">Period</label>
          <select
            id="manager-period-filter"
            v-model="filters.period"
            class="form-select form-select-sm"
            :disabled="loading"
            @change="buildDashboardData"
          >
            <option v-for="option in periodOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label for="manager-date-filter" class="form-label mb-1">Specific Date</label>
          <input
            id="manager-date-filter"
            v-model="filters.specificDate"
            type="date"
            class="form-control form-control-sm"
            :disabled="loading"
            :max="todayIsoDate"
            @change="buildDashboardData"
          />
        </div>
        </div>
        <button
          v-if="filters.specificDate"
          class="btn btn-outline-secondary btn-sm"
          type="button"
          :disabled="loading"
          @click="clearSpecificDate"
        >
          Clear Date
        </button>
        <div class="export-actions btn-group btn-group-sm" role="group" aria-label="Export report">
          <button class="btn btn-outline-primary" type="button" :disabled="loading" @click="exportCsv">
            Export CSV
          </button>
          <button class="btn btn-outline-primary" type="button" :disabled="loading" @click="exportExcel">
            Export Excel
          </button>
          <button class="btn btn-outline-primary" type="button" :disabled="loading" @click="exportPdf">
            Export PDF
          </button>
        </div>
      </div>
    </div>

    <p class="visually-hidden" role="status" aria-live="polite">
      {{ statusMessage }}
    </p>

    <div
      v-if="loadError"
      class="alert alert-danger d-flex align-items-start justify-content-between gap-3"
      role="alert"
    >
      <span>{{ loadError }}</span>
      <button type="button" class="btn btn-sm btn-outline-danger" :disabled="loading" @click="loadData">
        Retry
      </button>
    </div>

    <div v-if="exportError" class="alert alert-warning d-flex align-items-start justify-content-between gap-3" role="alert">
      <span>{{ exportError }}</span>
      <button type="button" class="btn-close" aria-label="Dismiss export warning" @click="exportError = ''"></button>
    </div>

    <div class="card report-card mb-4">
      <div class="card-body py-3">
        <div class="report-grid">
          <div>
            <small class="text-muted d-block">Selected Period</small>
            <strong>{{ selectedPeriodLabel }}</strong>
          </div>
          <div>
            <small class="text-muted d-block">Date Range</small>
            <strong>{{ formattedReportRange }}</strong>
          </div>
          <div>
            <small class="text-muted d-block">Sales Records</small>
            <strong>{{ stats.cashCount.toLocaleString('en-UG') }}</strong>
          </div>
          <div>
            <small class="text-muted d-block">Credit Records</small>
            <strong>{{ stats.creditCount.toLocaleString('en-UG') }}</strong>
          </div>
        </div>
      </div>
    </div>

    <QuickActionsPanel
      class="mb-4"
      title="Quick Actions"
      subtitle="Jump directly to your most frequent branch operations."
      :items="quickActions"
    />

    <div
      v-if="showLowStockAlert && lowStockItems.length > 0"
      class="alert alert-warning d-flex align-items-start justify-content-between gap-2"
      role="alert"
      aria-live="polite"
    >
      <div>
        <i class="bi bi-exclamation-triangle me-2"></i>
        <strong>Low Stock Alert!</strong> {{ lowStockAlertMessage }}
      </div>
      <button
        type="button"
        class="btn-close"
        aria-label="Dismiss low stock alert"
        @click="dismissLowStockAlert"
      ></button>
    </div>

    <div
      v-if="showOutOfStockAlert && outOfStockItems.length > 0"
      class="alert alert-danger d-flex align-items-start justify-content-between gap-2"
      role="alert"
      aria-live="polite"
    >
      <div>
        <i class="bi bi-x-octagon me-2"></i>
        <strong>Out of Stock!</strong> {{ outOfStockItems.length }} item(s) are out of stock.
      </div>
      <button
        type="button"
        class="btn-close"
        aria-label="Dismiss out of stock alert"
        @click="dismissOutOfStockAlert"
      ></button>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-xl-3 col-md-6">
        <div class="card stats-card h-100">
          <div class="card-body">
            <h6 class="text-muted">Inventory Value</h6>
            <h3 class="stats-value">{{ formatStatCurrency(stats.inventoryValue) }}</h3>
            <small class="text-muted">{{ stats.inventoryItems }} items</small>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6">
        <div class="card stats-card h-100">
          <div class="card-body">
            <h6 class="text-muted">Cash Sales</h6>
            <h3 class="stats-value">{{ formatStatCurrency(stats.cashSales) }}</h3>
            <small class="text-muted">{{ stats.cashCount }} transactions</small>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6">
        <div class="card stats-card h-100">
          <div class="card-body">
            <h6 class="text-muted">Credit Sales</h6>
            <h3 class="stats-value">{{ formatStatCurrency(stats.creditSales) }}</h3>
            <small class="text-muted">{{ stats.creditCount }} transactions</small>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6">
        <div class="card stats-card h-100">
          <div class="card-body">
            <h6 class="text-muted">Total Procurement Cost</h6>
            <h3 class="stats-value">{{ formatStatCurrency(stats.procurementTotal) }}</h3>
            <small class="text-muted">{{ stats.procurementCount }} record(s)</small>
          </div>
        </div>
      </div>
      <div class="col-xl-3 col-md-6">
        <div class="card stats-card h-100">
          <div class="card-body">
            <h6 class="text-muted">Total Revenue</h6>
            <h3 class="stats-value">
              {{ formatStatCurrency(stats.cashSales + stats.creditSales) }}
            </h3>
            <small class="text-muted">{{ totalTransactions }} transaction(s)</small>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="card loading-card mb-4" role="status" aria-live="polite">
      <div class="card-body d-flex align-items-center gap-2">
        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        <span>Loading dashboard data...</span>
      </div>
    </div>

    <ManagerDashboardCharts
      v-else
      :selected-period-label="selectedPeriodLabel"
      :has-revenue-split-data="hasRevenueSplitData"
      :revenue-split-chart-data="revenueSplitChartData"
      :has-credit-collection-data="hasCreditCollectionData"
      :credit-collection-chart-data="creditCollectionChartData"
      :has-sales-trend-data="hasSalesTrendData"
      :sales-over-time-chart-data="salesOverTimeChartData"
      :agent-performance="agentPerformance"
      :agent-performance-chart-data="agentPerformanceChartData"
      :top-products="topProducts"
      :top-products-chart-data="topProductsChartData"
      :stock-by-product="stockByProduct"
      :stock-by-product-chart-data="stockByProductChartData"
      :dealer-performance="dealerPerformance"
      :dealer-performance-chart-data="dealerPerformanceChartData"
    />
  </div>
</template>

<script>
import { inventoryAPI, salesAPI, creditSalesAPI, procurementAPI } from '../services/api';
import { formatCompactCurrency } from '../utils/numberFormat';
import {
  buildManagerCsvContent,
  buildManagerExcelContent,
  buildManagerFileName,
  buildManagerReportHtml,
  downloadReportFile
} from '../utils/reports/managerReportExport.mjs';
import ManagerDashboardCharts from '../components/dashboards/ManagerDashboardCharts.vue';
import QuickActionsPanel from '../components/common/QuickActionsPanel.vue';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';

const PERIOD_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

const BASE_CHART_COLORS = ['#1d4ed8', '#0f766e', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];
const buildPalette = (count) =>
  Array.from({ length: count }, (_, index) => BASE_CHART_COLORS[index % BASE_CHART_COLORS.length]);

export default {
  name: 'ManagerDashboard',
  components: {
    ManagerDashboardCharts,
    QuickActionsPanel
  },
  data() {
    return {
      loading: false,
      loadError: '',
      exportError: '',
      user: {},
      filters: {
        period: 'weekly',
        specificDate: ''
      },
      todayIsoDate: new Date().toISOString().split('T')[0],
      periodOptions: PERIOD_OPTIONS,
      reportRange: {
        from: '',
        to: ''
      },
      inventory: [],
      salesRecords: [],
      creditSalesRecords: [],
      procurementRecords: [],
      stats: {
        inventoryValue: 0,
        inventoryItems: 0,
        cashSales: 0,
        cashCount: 0,
        creditSales: 0,
        creditCount: 0,
        procurementTotal: 0,
        procurementCount: 0
      },
      lowStockItems: [],
      showLowStockAlert: true,
      outOfStockItems: [],
      showOutOfStockAlert: true,
      topProducts: [],
      stockByProduct: [],
      salesOverTime: [],
      creditCollection: {
        collected: 0,
        outstanding: 0
      },
      agentPerformance: [],
      dealerPerformance: []
    };
  },
  async created() {
    const authStore = useAuthStore(pinia);
    this.user = authStore.user || {};
    await this.loadData();
  },
  computed: {
    selectedPeriodLabel() {
      if (this.filters.specificDate) return 'Specific Date';
      return (
        this.periodOptions.find((option) => option.value === this.filters.period)?.label || 'Weekly'
      );
    },
    formattedReportRange() {
      if (!this.reportRange.from || !this.reportRange.to) return '-';
      const from = new Date(this.reportRange.from);
      const to = new Date(this.reportRange.to);
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return '-';
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      if (from.toDateString() === to.toDateString()) {
        return from.toLocaleDateString('en-UG', options);
      }
      return `${from.toLocaleDateString('en-UG', options)} - ${to.toLocaleDateString('en-UG', options)}`;
    },
    totalTransactions() {
      return this.stats.cashCount + this.stats.creditCount;
    },
    statusMessage() {
      if (this.loading) return 'Loading manager dashboard data.';
      return this.loadError || 'Manager dashboard data loaded.';
    },
    lowStockAlertMessage() {
      const labels = this.lowStockItems
        .map(
          (item) =>
            `${item.produceName} (${Number(item.totalTonnageKg || 0).toLocaleString('en-UG')} kg)`
        )
        .slice(0, 4);

      if (labels.length === 0) return '';

      const suffix =
        this.lowStockItems.length > 4 ? `, and ${this.lowStockItems.length - 4} more` : '';

      return `${labels.join(', ')}${suffix} running low on stock.`;
    },
    hasRevenueSplitData() {
      return this.stats.cashSales + this.stats.creditSales > 0;
    },
    hasCreditCollectionData() {
      return this.creditCollection.collected + this.creditCollection.outstanding > 0;
    },
    hasSalesTrendData() {
      return this.salesOverTime.some((item) => item.amount > 0);
    },
    quickActions() {
      return [
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
    },
    revenueSplitChartData() {
      return {
        labels: ['Cash Sales', 'Credit Sales'],
        datasets: [
          {
            data: [this.stats.cashSales, this.stats.creditSales],
            backgroundColor: ['#16a34a', '#f59e0b'],
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 8
          }
        ]
      };
    },
    creditCollectionChartData() {
      return {
        labels: ['Collected', 'Outstanding'],
        datasets: [
          {
            data: [this.creditCollection.collected, this.creditCollection.outstanding],
            backgroundColor: ['#0f766e', '#f97316'],
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 8
          }
        ]
      };
    },
    salesOverTimeChartData() {
      return {
        labels: this.salesOverTime.map((item) => item.label),
        datasets: [
          {
            label: 'Total Sales',
            data: this.salesOverTime.map((item) => item.amount),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.15)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 5
          }
        ]
      };
    },
    agentPerformanceChartData() {
      return {
        labels: this.agentPerformance.map((item) => item.name),
        datasets: [
          {
            label: 'UGX',
            data: this.agentPerformance.map((item) => item.amount),
            backgroundColor: buildPalette(this.agentPerformance.length),
            borderRadius: 8,
            barThickness: 18
          }
        ]
      };
    },
    topProductsChartData() {
      return {
        labels: this.topProducts.map((item) => item.name),
        datasets: [
          {
            label: 'Kilograms Sold',
            data: this.topProducts.map((item) => item.totalKg),
            backgroundColor: buildPalette(this.topProducts.length),
            borderRadius: 8,
            maxBarThickness: 44
          }
        ]
      };
    },
    stockByProductChartData() {
      return {
        labels: this.stockByProduct.map((item) => item.name),
        datasets: [
          {
            label: 'Available Stock',
            data: this.stockByProduct.map((item) => item.totalKg),
            backgroundColor: buildPalette(this.stockByProduct.length),
            borderRadius: 8,
            barThickness: 18
          }
        ]
      };
    },
    dealerPerformanceChartData() {
      return {
        labels: this.dealerPerformance.map((item) => item.name),
        datasets: [
          {
            label: 'UGX',
            data: this.dealerPerformance.map((item) => item.amount),
            backgroundColor: buildPalette(this.dealerPerformance.length),
            borderRadius: 8,
            maxBarThickness: 44
          }
        ]
      };
    }
  },
  methods: {
    async loadData() {
      this.loading = true;
      this.loadError = '';
      try {
        const [invRes, salesRes, creditRes, procurementRes] = await Promise.all([
          inventoryAPI.get(),
          salesAPI.getAll(),
          creditSalesAPI.getAll(),
          procurementAPI.getAll()
        ]);

        this.inventory = invRes.data.inventory || [];
        this.salesRecords = salesRes.data || [];
        this.creditSalesRecords = creditRes.data || [];
        this.procurementRecords = procurementRes.data || [];

        this.stats.inventoryValue = invRes.data.statistics?.totalValue || 0;
        this.stats.inventoryItems = invRes.data.statistics?.totalItems || 0;
        this.outOfStockItems = invRes.data.outOfStockItems || [];
        this.lowStockItems = this.inventory.filter((item) => item.totalTonnageKg < 500);
        if (this.lowStockItems.length > 0) {
          this.showLowStockAlert = true;
        }
        if (this.outOfStockItems.length > 0) {
          this.showOutOfStockAlert = true;
        }

        this.buildDashboardData();
      } catch (error) {
        this.loadError = error.response?.data?.message || 'Unable to load dashboard data. Try again.';
        console.error('Error loading data:', error);
      } finally {
        this.loading = false;
      }
    },
    buildDashboardData() {
      const range = this.getDateRangeByFilters(this.filters.period, this.filters.specificDate);
      this.reportRange = range;

      const filteredSales = this.filterRecordsByDate(this.salesRecords, 'date', range);
      const filteredCreditSales = this.filterRecordsByDate(
        this.creditSalesRecords,
        'dateOfDispatch',
        range
      );
      const filteredProcurements = this.filterRecordsByDate(
        this.procurementRecords,
        'dateReceived',
        range
      );

      this.stats.cashSales = filteredSales.reduce((sum, sale) => sum + (sale.amountPaidUgx || 0), 0);
      this.stats.cashCount = filteredSales.length;

      this.stats.creditSales = filteredCreditSales.reduce((sum, sale) => sum + (sale.amountDueUgx || 0), 0);
      this.stats.creditCount = filteredCreditSales.length;
      this.stats.procurementTotal = filteredProcurements.reduce(
        (sum, record) => sum + (record.costUgx || 0),
        0
      );
      this.stats.procurementCount = filteredProcurements.length;

      this.buildCharts(filteredSales, filteredCreditSales, filteredProcurements);
    },
    getDateRangeByFilters(period, specificDate = '') {
      if (specificDate) {
        const start = new Date(`${specificDate}T00:00:00.000Z`);
        if (!Number.isNaN(start.getTime())) {
          const end = new Date(start);
          end.setUTCDate(end.getUTCDate() + 1);
          end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);
          return { from: start.toISOString(), to: end.toISOString() };
        }
      }

      const end = new Date();
      if (period === 'yearly') {
        const start = new Date(end.getFullYear(), end.getMonth() - 11, 1);
        return { from: start.toISOString(), to: end.toISOString() };
      }

      const days = period === 'monthly' ? 30 : 7;
      const start = new Date(end);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (days - 1));
      return { from: start.toISOString(), to: end.toISOString() };
    },
    filterRecordsByDate(records, dateField, range) {
      const start = new Date(range.from);
      const end = new Date(range.to);
      return (records || []).filter((record) => {
        const recordDate = new Date(record?.[dateField]);
        return !Number.isNaN(recordDate.getTime()) && recordDate >= start && recordDate <= end;
      });
    },
    buildTrendBuckets(period, specificDate = '') {
      if (specificDate) {
        const start = new Date(`${specificDate}T00:00:00.000Z`);
        if (!Number.isNaN(start.getTime())) {
          const end = new Date(start);
          end.setUTCDate(end.getUTCDate() + 1);
          return [
            {
              start,
              end,
              label: start.toLocaleDateString('en-UG', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }),
              amount: 0
            }
          ];
        }
      }

      const now = new Date();
      const buckets = [];

      if (period === 'yearly') {
        for (let i = 11; i >= 0; i -= 1) {
          const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
          buckets.push({
            start,
            end,
            label: start.toLocaleDateString('en-UG', { month: 'short', year: '2-digit' }),
            amount: 0
          });
        }
        return buckets;
      }

      const days = period === 'monthly' ? 30 : 7;
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      for (let i = days - 1; i >= 0; i -= 1) {
        const start = new Date(today);
        start.setDate(today.getDate() - i);
        const end = new Date(start);
        end.setDate(start.getDate() + 1);
        buckets.push({
          start,
          end,
          label:
            period === 'weekly'
              ? start.toLocaleDateString('en-UG', { weekday: 'short' })
              : start.toLocaleDateString('en-UG', { month: 'short', day: 'numeric' }),
          amount: 0
        });
      }

      return buckets;
    },
    addAmountToBuckets(buckets, dateValue, amount) {
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return;

      for (let i = 0; i < buckets.length; i += 1) {
        const bucket = buckets[i];
        if (date >= bucket.start && date < bucket.end) {
          bucket.amount += Number(amount || 0);
          return;
        }
      }
    },
    buildCharts(sales, creditSales, procurements) {
      const productMap = {};
      sales.forEach((sale) => {
        productMap[sale.produceName] = (productMap[sale.produceName] || 0) + (sale.tonnageKg || 0);
      });
      creditSales.forEach((sale) => {
        productMap[sale.produceName] = (productMap[sale.produceName] || 0) + (sale.tonnageKg || 0);
      });
      const productList = Object.keys(productMap).map((name) => ({
        name,
        totalKg: productMap[name]
      }));
      productList.sort((a, b) => b.totalKg - a.totalKg);
      this.topProducts = productList.slice(0, 5);

      this.stockByProduct = this.inventory
        .map((item) => ({ name: item.produceName, totalKg: item.totalTonnageKg }))
        .sort((a, b) => b.totalKg - a.totalKg)
        .slice(0, 5);

      const creditCollected = creditSales.reduce((sum, sale) => sum + (sale.amountPaidUgx || 0), 0);
      const creditOutstanding = creditSales.reduce((sum, sale) => {
        const balance =
          sale.balanceUgx !== undefined && sale.balanceUgx !== null
            ? sale.balanceUgx
            : Math.max((sale.amountDueUgx || 0) - (sale.amountPaidUgx || 0), 0);
        return sum + balance;
      }, 0);
      this.creditCollection.collected = creditCollected;
      this.creditCollection.outstanding = creditOutstanding;

      const agentMap = {};
      sales.forEach((sale) => {
        agentMap[sale.salesAgentName] = (agentMap[sale.salesAgentName] || 0) + (sale.amountPaidUgx || 0);
      });
      creditSales.forEach((sale) => {
        agentMap[sale.salesAgentName] = (agentMap[sale.salesAgentName] || 0) + (sale.amountDueUgx || 0);
      });
      this.agentPerformance = Object.keys(agentMap)
        .map((name) => ({ name, amount: agentMap[name] }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const dealerMap = {};
      procurements.forEach((procurement) => {
        dealerMap[procurement.dealerName] = (dealerMap[procurement.dealerName] || 0) + (procurement.costUgx || 0);
      });
      this.dealerPerformance = Object.keys(dealerMap)
        .map((name) => ({ name, amount: dealerMap[name] }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const trendBuckets = this.buildTrendBuckets(this.filters.period, this.filters.specificDate);
      sales.forEach((sale) => {
        this.addAmountToBuckets(trendBuckets, sale.date, sale.amountPaidUgx || 0);
      });
      creditSales.forEach((sale) => {
        this.addAmountToBuckets(trendBuckets, sale.dateOfDispatch, sale.amountDueUgx || 0);
      });
      this.salesOverTime = trendBuckets.map((bucket) => ({
        label: bucket.label,
        amount: bucket.amount
      }));
    },
    clearSpecificDate() {
      if (!this.filters.specificDate) return;
      this.filters.specificDate = '';
      this.buildDashboardData();
    },
    dismissLowStockAlert() {
      this.showLowStockAlert = false;
    },
    dismissOutOfStockAlert() {
      this.showOutOfStockAlert = false;
    },
    getReportExportState() {
      return {
        selectedPeriodLabel: this.selectedPeriodLabel,
        userBranch: this.user?.branch || '',
        formattedReportRange: this.formattedReportRange,
        totalTransactions: this.totalTransactions,
        stats: this.stats,
        lowStockItemsLength: this.lowStockItems.length,
        creditCollection: this.creditCollection,
        salesOverTime: this.salesOverTime,
        topProducts: this.topProducts,
        stockByProduct: this.stockByProduct,
        agentPerformance: this.agentPerformance,
        dealerPerformance: this.dealerPerformance
      };
    },
    buildFileName(extension) {
      return buildManagerFileName(this.getReportExportState(), extension);
    },
    buildCsvContent() {
      return buildManagerCsvContent(this.getReportExportState());
    },
    buildExcelContent() {
      return buildManagerExcelContent(this.getReportExportState());
    },
    buildReportHtml() {
      return buildManagerReportHtml(this.getReportExportState());
    },
    downloadFile(filename, content, type) {
      downloadReportFile({ filename, content, type });
    },
    exportCsv() {
      this.exportError = '';
      const content = this.buildCsvContent();
      this.downloadFile(this.buildFileName('csv'), content, 'text/csv;charset=utf-8');
    },
    exportExcel() {
      this.exportError = '';
      const content = this.buildExcelContent();
      this.downloadFile(this.buildFileName('xls'), content, 'application/vnd.ms-excel');
    },
    exportPdf() {
      this.exportError = '';
      const reportHtml = this.buildReportHtml();
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        this.exportError = 'Please allow pop-ups to export the PDF report.';
        return;
      }
      printWindow.document.open();
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.onafterprint = () => printWindow.close();
      setTimeout(() => printWindow.print(), 300);
    },
    formatStatCurrency(amount) {
      return formatCompactCurrency(amount);
    }
  }
};
</script>

<style scoped>
.dashboard-filters {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.dashboard-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.export-actions .btn {
  white-space: nowrap;
}

.filter-group {
  min-width: 150px;
}

.report-card,
.stats-card {
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.report-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 1rem;
}

.stats-value {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: clamp(1.55rem, 2vw, 2.05rem);
  line-height: 1.2;
  margin-bottom: 0.6rem;
}

.loading-card {
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

@media (max-width: 992px) {
  .report-grid {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
}
</style>


