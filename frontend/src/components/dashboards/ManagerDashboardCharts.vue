<!-- Manager dashboard chart container for revenue, payments, and branch metric visualizations. -->
<template>
  <div class="row g-4">
    <div class="col-xl-6">
      <div class="card chart-card h-100">
        <div class="card-header chart-header">
          <h5 class="mb-0">Revenue Split</h5>
        </div>
        <div class="card-body">
          <div v-if="!hasRevenueSplitData" class="chart-empty">No sales recorded yet</div>
          <div v-else class="chart-panel chart-panel-sm">
            <Doughnut :data="revenueSplitChartData" :options="chartOptions.doughnutCurrency" />
          </div>
        </div>
      </div>
    </div>

    <div class="col-xl-6">
      <div class="card chart-card h-100">
        <div class="card-header chart-header">
          <h5 class="mb-0">Payments Collected vs Outstanding</h5>
        </div>
        <div class="card-body">
          <div v-if="!hasCreditCollectionData" class="chart-empty">No credit sales recorded yet</div>
          <div v-else class="chart-panel chart-panel-sm">
            <Doughnut :data="creditCollectionChartData" :options="chartOptions.doughnutCurrency" />
          </div>
        </div>
      </div>
    </div>

    <div class="col-xl-6">
      <div class="card chart-card h-100">
        <div class="card-header chart-header">
          <h5 class="mb-0">Sales Trend ({{ selectedPeriodLabel }})</h5>
        </div>
        <div class="card-body">
          <div v-if="!hasSalesTrendData" class="chart-empty">No sales recorded yet</div>
          <div v-else class="chart-panel">
            <LineChart :data="salesOverTimeChartData" :options="chartOptions.lineCurrency" />
          </div>
        </div>
      </div>
    </div>

    <div class="col-xl-6">
      <div class="card chart-card h-100">
        <div class="card-header chart-header">
          <h5 class="mb-0">Sales Agent Performance</h5>
        </div>
        <div class="card-body">
          <div v-if="agentPerformance.length === 0" class="chart-empty">No sales recorded yet</div>
          <div v-else class="chart-panel">
            <Bar :data="agentPerformanceChartData" :options="chartOptions.horizontalBarCurrency" />
          </div>
        </div>
      </div>
    </div>

    <div class="col-xl-6">
      <div class="card chart-card h-100">
        <div class="card-header chart-header">
          <h5 class="mb-0">Top Products by Tonnage Sold</h5>
        </div>
        <div class="card-body">
          <div v-if="topProducts.length === 0" class="chart-empty">No sales recorded yet</div>
          <div v-else class="chart-panel">
            <Bar :data="topProductsChartData" :options="chartOptions.barKg" />
          </div>
        </div>
      </div>
    </div>

    <div class="col-xl-6">
      <div class="card chart-card h-100">
        <div class="card-header chart-header">
          <h5 class="mb-0">Stock by Product</h5>
        </div>
        <div class="card-body">
          <div v-if="stockByProduct.length === 0" class="chart-empty">No inventory available</div>
          <div v-else class="chart-panel">
            <Bar :data="stockByProductChartData" :options="chartOptions.horizontalBarKg" />
          </div>
        </div>
      </div>
    </div>

    <div class="col-xl-6">
      <div class="card chart-card h-100">
        <div class="card-header chart-header">
          <h5 class="mb-0">Top Dealers by Procurement Cost</h5>
        </div>
        <div class="card-body">
          <div v-if="dealerPerformance.length === 0" class="chart-empty">No procurement recorded yet</div>
          <div v-else class="chart-panel">
            <Bar :data="dealerPerformanceChartData" :options="chartOptions.horizontalBarCurrency" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Bar, Doughnut, Line as LineChart } from 'vue-chartjs';
import { dashboardChartOptions } from '../../utils/charts/dashboardChartTheme.js';

defineProps({
  selectedPeriodLabel: { type: String, required: true },
  hasRevenueSplitData: { type: Boolean, required: true },
  revenueSplitChartData: { type: Object, required: true },
  hasCreditCollectionData: { type: Boolean, required: true },
  creditCollectionChartData: { type: Object, required: true },
  hasSalesTrendData: { type: Boolean, required: true },
  salesOverTimeChartData: { type: Object, required: true },
  agentPerformance: { type: Array, required: true },
  agentPerformanceChartData: { type: Object, required: true },
  topProducts: { type: Array, required: true },
  topProductsChartData: { type: Object, required: true },
  stockByProduct: { type: Array, required: true },
  stockByProductChartData: { type: Object, required: true },
  dealerPerformance: { type: Array, required: true },
  dealerPerformanceChartData: { type: Object, required: true }
});

const chartOptions = dashboardChartOptions;
</script>
