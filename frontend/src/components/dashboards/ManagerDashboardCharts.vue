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
          <ChartPanel
            v-else
            small
            :chart="doughnutChart"
            :data="revenueSplitChartData"
            :options="revenueSplitOptions"
          />
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
          <ChartPanel
            v-else
            small
            :chart="doughnutChart"
            :data="creditCollectionChartData"
            :options="creditCollectionOptions"
          />
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
          <ChartPanel
            v-else
            :chart="lineChart"
            :data="salesOverTimeChartData"
            :options="salesTrendOptions"
          />
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
          <ChartPanel
            v-else
            :chart="barChart"
            :data="agentPerformanceChartData"
            :options="agentPerformanceOptions"
          />
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
          <ChartPanel
            v-else
            :chart="barChart"
            :data="topProductsChartData"
            :options="topProductsOptions"
          />
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
          <ChartPanel
            v-else
            :chart="barChart"
            :data="stockByProductChartData"
            :options="stockOptions"
          />
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
          <ChartPanel
            v-else
            :chart="barChart"
            :data="dealerPerformanceChartData"
            :options="dealerOptions"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { markRaw } from 'vue';
import { Bar, Doughnut, Line as LineChart } from 'vue-chartjs';
import ChartPanel from './ChartPanel.vue';
import { createDashboardChartOptions } from '../../utils/charts/dashboardChartTheme.js';

const barChart = markRaw(Bar);
const doughnutChart = markRaw(Doughnut);
const lineChart = markRaw(LineChart);

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

const revenueSplitOptions = createDashboardChartOptions('doughnutCurrency');
const creditCollectionOptions = createDashboardChartOptions('doughnutCurrency');
const salesTrendOptions = createDashboardChartOptions('lineCurrency');
const agentPerformanceOptions = createDashboardChartOptions('horizontalBarCurrency');
const topProductsOptions = createDashboardChartOptions('barKg');
const stockOptions = createDashboardChartOptions('horizontalBarKg');
const dealerOptions = createDashboardChartOptions('horizontalBarCurrency');
</script>
