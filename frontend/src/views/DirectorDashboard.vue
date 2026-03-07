<!-- Director dashboard view for cross-branch analytics, trends, and executive reporting. -->
<template>
  <div class="dashboard-view view-shell" :aria-busy="loading ? 'true' : 'false'">
    <div class="view-header">
      <div class="view-heading">
        <h2 class="page-title mb-1">Director Dashboard</h2>
        <p class="page-subtitle mb-0">
          Cross-branch report for {{ selectedPeriodLabel.toLowerCase() }} performance.
        </p>
      </div>
    </div>

    <div class="page-toolbar-surface">
      <div class="page-toolbar-group">
        <div class="toolbar-field">
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
        <div class="toolbar-field">
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
        <div class="toolbar-field">
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

    <InsightStrip label="Director overview" :items="overviewItems" />

    <QuickActionsPanel
      class="mb-4"
      title="Quick Actions"
      subtitle="Run the most common executive reporting actions without menu navigation."
      :items="quickActions"
    />

    <DashboardMetricGrid :items="metricItems" />

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

<script setup>
import InsightStrip from '../components/common/InsightStrip.vue';
import DashboardMetricGrid from '../components/dashboards/DashboardMetricGrid.vue';
import DirectorDashboardCharts from '../components/dashboards/DirectorDashboardCharts.vue';
import QuickActionsPanel from '../components/common/QuickActionsPanel.vue';
import { useDirectorDashboard } from '../composables/useDirectorDashboard.mjs';

const {
  branchOptions,
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
  periodOptions,
  quickActions,
  revenueCompositionChartData,
  selectedPeriodLabel,
  statusMessage,
  todayIsoDate,
  trendChartData
} = useDirectorDashboard();
</script>

