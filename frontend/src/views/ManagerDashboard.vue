<!-- Manager dashboard view for branch-level KPIs, filters, charts, and report export. -->
<template>
  <div class="dashboard-view view-shell" :aria-busy="loading ? 'true' : 'false'">
    <div class="view-header">
      <div class="view-heading">
        <h2 class="page-title mb-1">Manager Dashboard</h2>
        <p class="page-subtitle mb-0">{{ user.branch || 'Branch' }} Overview</p>
      </div>
    </div>

    <div class="page-toolbar-surface">
      <div class="page-toolbar-group">
        <div class="toolbar-field">
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
        <div class="toolbar-field">
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
      <div class="page-toolbar-actions">
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
        @click="clearExportError"
      ></button>
    </div>

    <InsightStrip label="Manager overview" :items="overviewItems" />

    <QuickActionsPanel
      class="mb-4"
      title="Quick Actions"
      subtitle="Jump directly to your most frequent branch operations."
      :items="quickActions"
    />

    <DashboardMetricGrid :items="metricItems" default-column-class="col-xl-3 col-md-6" />

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

<script setup>
import InsightStrip from '../components/common/InsightStrip.vue';
import DashboardMetricGrid from '../components/dashboards/DashboardMetricGrid.vue';
import ManagerDashboardCharts from '../components/dashboards/ManagerDashboardCharts.vue';
import QuickActionsPanel from '../components/common/QuickActionsPanel.vue';
import { useManagerDashboard } from '../composables/useManagerDashboard.mjs';

const {
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
  hasCreditCollectionData,
  hasRevenueSplitData,
  hasSalesTrendData,
  loadData,
  loadError,
  loading,
  metricItems,
  overviewItems,
  periodOptions,
  quickActions,
  revenueSplitChartData,
  salesOverTimeChartData,
  selectedPeriodLabel,
  statusMessage,
  stockByProduct,
  stockByProductChartData,
  todayIsoDate,
  topProducts,
  topProductsChartData,
  user
} = useManagerDashboard();
</script>
