<!-- Director dashboard chart container for trends, composition, and branch comparison views. -->
<template>
  <div class="row g-4">
    <div class="col-xl-6">
      <div class="card chart-card h-100">
        <div class="card-header chart-header">
          <h5 class="mb-0">Sales Trend ({{ selectedPeriodLabel }})</h5>
        </div>
        <div class="card-body">
          <div v-if="!hasTrendData" class="chart-empty">No sales trend data available</div>
          <div v-else class="chart-panel">
            <LineChart :data="trendChartData" :options="chartOptions.lineCurrency" />
          </div>
        </div>
      </div>
    </div>

    <div class="col-xl-6">
      <div class="card chart-card h-100">
        <div class="card-header chart-header">
          <h5 class="mb-0">Revenue Composition</h5>
        </div>
        <div class="card-body">
          <div v-if="!hasRevenueData" class="chart-empty">No revenue data available</div>
          <div v-else class="chart-panel chart-panel-sm">
            <Doughnut
              :data="revenueCompositionChartData"
              :options="chartOptions.doughnutCurrency"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="col-xl-6">
      <div class="card chart-card h-100">
        <div class="card-header chart-header">
          <h5 class="mb-0">Branch Revenue Comparison</h5>
        </div>
        <div class="card-body">
          <div v-if="branchLabels.length === 0" class="chart-empty">No branch sales recorded yet</div>
          <div v-else class="chart-panel">
            <Bar :data="branchRevenueChartData" :options="chartOptions.groupedBarCurrency" />
          </div>
        </div>
      </div>
    </div>

    <div class="col-xl-6">
      <div class="card chart-card h-100">
        <div class="card-header chart-header">
          <h5 class="mb-0">Branch Volume Sold</h5>
        </div>
        <div class="card-body">
          <div v-if="branchLabels.length === 0" class="chart-empty">No branch volume data available</div>
          <div v-else class="chart-panel">
            <Bar :data="branchVolumeChartData" :options="chartOptions.horizontalBarKg" />
          </div>
        </div>
      </div>
    </div>

    <div class="col-12">
      <div class="card chart-card">
        <div class="card-header chart-header">
          <h5 class="mb-0">Branch Totals Summary</h5>
        </div>
        <div class="card-body">
          <div v-if="branchLabels.length === 0" class="chart-empty chart-empty-sm">
            No branch totals available
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th class="text-end">Cash Sales</th>
                  <th class="text-end">Credit Sales</th>
                  <th class="text-end">Total Revenue</th>
                  <th class="text-end">Total Weight</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="branch in branchLabels" :key="branch">
                  <td class="fw-semibold">{{ branch }}</td>
                  <td class="text-end">{{ formatCurrency(branchTotals[branch].cash) }}</td>
                  <td class="text-end">{{ formatCurrency(branchTotals[branch].credit) }}</td>
                  <td class="text-end fw-semibold">
                    {{ formatCurrency(branchTotals[branch].cash + branchTotals[branch].credit) }}
                  </td>
                  <td class="text-end">
                    {{ branchTotals[branch].totalKg.toLocaleString('en-UG') }} kg
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Bar, Doughnut, Line as LineChart } from 'vue-chartjs';
import { dashboardChartOptions } from '../../utils/charts/dashboardChartTheme.mjs';

defineProps({
  selectedPeriodLabel: { type: String, required: true },
  hasTrendData: { type: Boolean, required: true },
  trendChartData: { type: Object, required: true },
  hasRevenueData: { type: Boolean, required: true },
  revenueCompositionChartData: { type: Object, required: true },
  branchLabels: { type: Array, required: true },
  branchRevenueChartData: { type: Object, required: true },
  branchVolumeChartData: { type: Object, required: true },
  branchTotals: { type: Object, required: true },
  formatCurrency: { type: Function, required: true }
});

const chartOptions = dashboardChartOptions;
</script>
