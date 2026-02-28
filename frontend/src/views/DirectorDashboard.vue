<template>
  <div class="dashboard-view view-shell" :aria-busy="loading ? 'true' : 'false'">
    <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
      <div>
        <h2 class="page-title mb-1">Director Dashboard</h2>
        <p class="page-subtitle mb-0">
          Cross-branch report for {{ selectedPeriodLabel.toLowerCase() }} performance.
        </p>
      </div>
      <div class="dashboard-actions">
        <div class="dashboard-filters">
        <div class="filter-group">
          <label for="director-period-filter" class="form-label mb-1">Period</label>
          <select
            id="director-period-filter"
            v-model="filters.period"
            class="form-select form-select-sm"
            :disabled="loading"
            @change="loadData"
          >
            <option v-for="option in periodOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label for="director-branch-filter" class="form-label mb-1">Branch</label>
          <select
            id="director-branch-filter"
            v-model="filters.branch"
            class="form-select form-select-sm"
            :disabled="loading"
            @change="loadData"
          >
            <option v-for="option in branchOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label for="director-date-filter" class="form-label mb-1">Specific Date</label>
          <input
            id="director-date-filter"
            v-model="filters.specificDate"
            type="date"
            class="form-control form-control-sm"
            :disabled="loading"
            :max="todayIsoDate"
            @change="loadData"
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

    <div
      v-if="exportError"
      class="alert alert-warning d-flex align-items-start justify-content-between gap-3"
      role="alert"
    >
      <span>{{ exportError }}</span>
      <button
        type="button"
        class="btn-close"
        aria-label="Dismiss export warning"
        @click="exportError = ''"
      ></button>
    </div>

    <div class="card report-card mb-4">
      <div class="card-body py-3">
        <div class="report-grid">
          <div>
            <small class="text-muted d-block">Report Period</small>
            <strong>{{ selectedPeriodLabel }}</strong>
          </div>
          <div>
            <small class="text-muted d-block">Branch Scope</small>
            <strong>{{ selectedBranchLabel }}</strong>
          </div>
          <div>
            <small class="text-muted d-block">Range</small>
            <strong>{{ formattedRange }}</strong>
          </div>
          <div>
            <small class="text-muted d-block">Transactions</small>
            <strong>{{ totalTransactions.toLocaleString('en-UG') }}</strong>
          </div>
        </div>
      </div>
    </div>

    <QuickActionsPanel
      class="mb-4"
      title="Quick Actions"
      subtitle="Run the most common executive reporting actions without menu navigation."
      :items="quickActions"
    />

    <div class="row g-4 mb-4">
      <div class="col-md-3">
        <div class="card stats-card h-100">
          <div class="card-body">
            <h6 class="text-muted">Total Revenue</h6>
            <h3 class="stats-value">{{ formatStatCurrency(totalRevenue) }}</h3>
            <small class="text-muted">Cash + credit sales</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card stats-card h-100">
          <div class="card-body">
            <h6 class="text-muted">Cash Sales</h6>
            <h3 class="stats-value">{{ formatStatCurrency(grandTotal.cash) }}</h3>
            <small class="text-muted">Collected amount</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card stats-card h-100">
          <div class="card-body">
            <h6 class="text-muted">Credit Sales</h6>
            <h3 class="stats-value">{{ formatStatCurrency(grandTotal.credit) }}</h3>
            <small class="text-muted">Outstanding amount</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card stats-card h-100">
          <div class="card-body">
            <h6 class="text-muted">Total Procurement</h6>
            <h3 class="stats-value">{{ formatStatCurrency(procurementTotal) }}</h3>
            <small class="text-muted">{{ procurementCount.toLocaleString('en-UG') }} record(s)</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card stats-card h-100">
          <div class="card-body">
            <h6 class="text-muted">Total Produce Sold</h6>
            <h3 class="stats-value">{{ formatCompactNumber(grandTotal.totalKg) }} kg</h3>
            <small class="text-muted">{{ branchLabels.length }} branch(es) in scope</small>
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

    <DirectorDashboardCharts
      v-else
      :selected-period-label="selectedPeriodLabel"
      :has-trend-data="hasTrendData"
      :trend-chart-data="trendChartData"
      :has-revenue-data="hasRevenueData"
      :revenue-composition-chart-data="revenueCompositionChartData"
      :branch-labels="branchLabels"
      :branch-revenue-chart-data="branchRevenueChartData"
      :branch-volume-chart-data="branchVolumeChartData"
      :branch-totals="branchTotals"
      :format-currency="formatCurrency"
    />
  </div>
</template>

<script>
import { salesAPI } from '../services/api';
import { formatCompactNumber, formatCompactCurrency } from '../utils/numberFormat';
import {
  buildDirectorCsvContent,
  buildDirectorExcelContent,
  buildDirectorFileName,
  buildDirectorReportHtml,
  downloadReportFile
} from '../utils/reports/directorReportExport.mjs';
import DirectorDashboardCharts from '../components/dashboards/DirectorDashboardCharts.vue';
import QuickActionsPanel from '../components/common/QuickActionsPanel.vue';

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

const toNumber = (value) => Number(value || 0);
const emptyGrandTotal = () => ({ cash: 0, credit: 0, totalKg: 0 });
const emptyReport = () => ({
  salesCount: 0,
  creditSalesCount: 0,
  procurementCount: 0,
  procurementTotal: 0
});
const emptyRange = () => ({ from: '', to: '' });

const formatCurrencyValue = (value) =>
  new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(toNumber(value));

export default {
  name: 'DirectorDashboard',
  components: {
    DirectorDashboardCharts,
    QuickActionsPanel
  },
  data() {
    return {
      loading: false,
      loadError: '',
      exportError: '',
      filters: {
        period: 'weekly',
        branch: 'all',
        specificDate: ''
      },
      todayIsoDate: new Date().toISOString().split('T')[0],
      branchTotals: {},
      grandTotal: emptyGrandTotal(),
      trendLabels: [],
      trendSeries: [],
      report: emptyReport(),
      procurementTotals: {},
      range: emptyRange(),
      periodOptions: PERIOD_OPTIONS,
      branchOptions: BRANCH_OPTIONS
    };
  },
  computed: {
    totalRevenue() {
      return this.grandTotal.cash + this.grandTotal.credit;
    },
    totalTransactions() {
      return toNumber(this.report.salesCount) + toNumber(this.report.creditSalesCount);
    },
    procurementTotal() {
      return toNumber(this.report.procurementTotal);
    },
    procurementCount() {
      return toNumber(this.report.procurementCount);
    },
    selectedPeriodLabel() {
      if (this.filters.specificDate) return 'Specific Date';
      return (
        this.periodOptions.find((option) => option.value === this.filters.period)?.label || 'Weekly'
      );
    },
    selectedBranchLabel() {
      return (
        this.branchOptions.find((option) => option.value === this.filters.branch)?.label ||
        'All Branches'
      );
    },
    formattedRange() {
      if (!this.range.from || !this.range.to) return '-';
      const from = new Date(this.range.from);
      const to = new Date(this.range.to);
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return '-';
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      if (from.toDateString() === to.toDateString()) {
        return from.toLocaleDateString('en-UG', options);
      }
      return `${from.toLocaleDateString('en-UG', options)} - ${to.toLocaleDateString('en-UG', options)}`;
    },
    branchLabels() {
      return Object.keys(this.branchTotals);
    },
    quickActions() {
      return [
        {
          key: 'scope-all',
          icon: 'bi bi-diagram-3',
          label: 'All Branches',
          meta: 'Set view scope to all branches',
          onClick: () => {
            if (this.filters.branch !== 'all') {
              this.filters.branch = 'all';
              this.loadData();
            }
          }
        },
        {
          key: 'scope-maganjo',
          icon: 'bi bi-geo-alt',
          label: 'Maganjo View',
          meta: 'Focus reporting to Maganjo branch',
          onClick: () => {
            if (this.filters.branch !== 'Maganjo') {
              this.filters.branch = 'Maganjo';
              this.loadData();
            }
          }
        },
        {
          key: 'scope-matugga',
          icon: 'bi bi-geo-alt-fill',
          label: 'Matugga View',
          meta: 'Focus reporting to Matugga branch',
          onClick: () => {
            if (this.filters.branch !== 'Matugga') {
              this.filters.branch = 'Matugga';
              this.loadData();
            }
          }
        },
        {
          key: 'export-csv',
          icon: 'bi bi-filetype-csv',
          label: 'Export CSV',
          meta: 'Download current report',
          onClick: () => this.exportCsv()
        },
        {
          key: 'export-excel',
          icon: 'bi bi-file-earmark-spreadsheet',
          label: 'Export Excel',
          meta: 'Download spreadsheet report',
          onClick: () => this.exportExcel()
        },
        {
          key: 'export-pdf',
          icon: 'bi bi-file-earmark-pdf',
          label: 'Export PDF',
          meta: 'Print-ready executive report',
          onClick: () => this.exportPdf()
        }
      ];
    },
    statusMessage() {
      if (this.loading) return 'Loading director dashboard data.';
      return this.loadError || 'Director dashboard data loaded.';
    },
    hasRevenueData() {
      return this.totalRevenue > 0;
    },
    hasTrendData() {
      return this.trendSeries.some((value) => value > 0);
    },
    trendChartData() {
      return {
        labels: this.trendLabels,
        datasets: [
          {
            label: 'Total Sales',
            data: this.trendSeries,
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
    revenueCompositionChartData() {
      return {
        labels: ['Cash Sales', 'Credit Sales'],
        datasets: [
          {
            data: [this.grandTotal.cash, this.grandTotal.credit],
            backgroundColor: ['#16a34a', '#f59e0b'],
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 8
          }
        ]
      };
    },
    branchRevenueChartData() {
      return {
        labels: this.branchLabels,
        datasets: [
          {
            label: 'Cash Sales',
            data: this.branchLabels.map((branch) => this.branchTotals[branch].cash),
            backgroundColor: '#16a34a',
            borderRadius: 8,
            maxBarThickness: 36
          },
          {
            label: 'Credit Sales',
            data: this.branchLabels.map((branch) => this.branchTotals[branch].credit),
            backgroundColor: '#f59e0b',
            borderRadius: 8,
            maxBarThickness: 36
          }
        ]
      };
    },
    branchVolumeChartData() {
      return {
        labels: this.branchLabels,
        datasets: [
          {
            label: 'Total Kilograms',
            data: this.branchLabels.map((branch) => this.branchTotals[branch].totalKg),
            backgroundColor: ['#2563eb', '#0f766e', '#7c3aed', '#dc2626'],
            borderRadius: 8,
            barThickness: 20
          }
        ]
      };
    }
  },
  async created() {
    await this.loadData();
  },
  methods: {
    resetDashboardState() {
      this.branchTotals = {};
      this.procurementTotals = {};
      this.grandTotal = emptyGrandTotal();
      this.trendLabels = [];
      this.trendSeries = [];
      this.report = emptyReport();
      this.range = emptyRange();
    },
    async loadData() {
      this.loading = true;
      this.loadError = '';
      try {
        const response = await salesAPI.getAggregation({
          period: this.filters.period,
          branch: this.filters.branch,
          specificDate: this.filters.specificDate || undefined
        });
        this.branchTotals = response.data.branchTotals || {};
        this.procurementTotals = response.data.procurementTotals || {};
        this.grandTotal = response.data.grandTotal || emptyGrandTotal();
        this.trendLabels = response.data.trends?.labels || [];
        this.trendSeries = response.data.trends?.data || [];
        this.report = response.data.report || emptyReport();
        this.range = response.data.range || emptyRange();
      } catch (error) {
        this.resetDashboardState();
        this.loadError = error.response?.data?.message || 'Unable to load dashboard data. Try again.';
        console.error('Error loading aggregation:', error);
      } finally {
        this.loading = false;
      }
    },
    clearSpecificDate() {
      if (!this.filters.specificDate) return;
      this.filters.specificDate = '';
      this.loadData();
    },
    formatCurrency(amount) {
      return formatCurrencyValue(amount);
    },
    formatStatCurrency(amount) {
      return formatCompactCurrency(amount);
    },
    getReportExportState() {
      return {
        selectedPeriodLabel: this.selectedPeriodLabel,
        selectedBranchLabel: this.selectedBranchLabel,
        formattedRange: this.formattedRange,
        totalTransactions: this.totalTransactions,
        totalRevenue: this.totalRevenue,
        grandTotal: this.grandTotal,
        procurementTotal: this.procurementTotal,
        branchLabels: this.branchLabels,
        branchTotals: this.branchTotals,
        procurementTotals: this.procurementTotals,
        trendLabels: this.trendLabels,
        trendSeries: this.trendSeries
      };
    },
    buildFileName(extension) {
      return buildDirectorFileName(this.getReportExportState(), extension);
    },
    buildCsvContent() {
      return buildDirectorCsvContent(this.getReportExportState());
    },
    buildExcelContent() {
      return buildDirectorExcelContent(this.getReportExportState());
    },
    buildReportHtml() {
      return buildDirectorReportHtml(this.getReportExportState());
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
    formatCompactNumber
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
  font-size: clamp(1.45rem, 1.8vw, 1.95rem);
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
