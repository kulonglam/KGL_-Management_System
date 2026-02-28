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
            <Doughnut :data="revenueCompositionChartData" :options="chartOptions.doughnutCurrency" />
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

<script>
import { Bar, Doughnut, Line as LineChart } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
} from 'chart.js';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
);

const toNumber = (value) => Number(value || 0);
const formatCompact = (value) =>
  new Intl.NumberFormat('en-UG', { notation: 'compact', maximumFractionDigits: 1 }).format(
    toNumber(value)
  );
const formatCurrencyValue = (value) =>
  new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(toNumber(value));

const axisTicks = (formatter) => ({
  grid: { color: 'rgba(148, 163, 184, 0.2)' },
  ticks: { callback: formatter }
});

export default {
  name: 'DirectorDashboardCharts',
  components: { Bar, Doughnut, LineChart },
  props: {
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
  },
  data() {
    return {
      chartOptions: {
        doughnutCurrency: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                boxWidth: 10,
                padding: 18,
                font: { weight: 600 }
              }
            },
            tooltip: {
              callbacks: {
                label(context) {
                  return `${context.label}: ${formatCurrencyValue(context.raw)}`;
                }
              }
            }
          }
        },
        lineCurrency: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label(context) {
                  return `Sales: ${formatCurrencyValue(context.raw)}`;
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              ...axisTicks((value) => `UGX ${formatCompact(value)}`),
              beginAtZero: true
            }
          }
        },
        groupedBarCurrency: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                boxWidth: 10,
                padding: 16
              }
            },
            tooltip: {
              callbacks: {
                label(context) {
                  return `${context.dataset.label}: ${formatCurrencyValue(context.raw)}`;
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              ...axisTicks((value) => `UGX ${formatCompact(value)}`),
              beginAtZero: true
            }
          }
        },
        horizontalBarKg: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label(context) {
                  return `Volume: ${toNumber(context.raw).toLocaleString('en-UG')} kg`;
                }
              }
            }
          },
          scales: {
            y: { grid: { display: false } },
            x: {
              ...axisTicks((value) => `${formatCompact(value)} kg`),
              beginAtZero: true
            }
          }
        }
      }
    };
  }
};
</script>

<style scoped>
.chart-card {
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.chart-header {
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
}

.chart-panel {
  position: relative;
  height: 300px;
}

.chart-panel-sm {
  height: 270px;
}

.chart-empty {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-weight: 500;
  text-align: center;
}

.chart-empty-sm {
  min-height: 120px;
}
</style>
