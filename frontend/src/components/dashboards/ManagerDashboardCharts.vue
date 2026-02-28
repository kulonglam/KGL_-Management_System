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
          <h5 class="mb-0">Sales Over Time ({{ selectedPeriodLabel }})</h5>
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
            <Bar :data="dealerPerformanceChartData" :options="chartOptions.barCurrency" />
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

const baseScaleOptions = (tickCallback) => ({
  grid: { color: 'rgba(148, 163, 184, 0.2)' },
  ticks: { callback: tickCallback }
});

export default {
  name: 'ManagerDashboardCharts',
  components: { Bar, Doughnut, LineChart },
  props: {
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
            x: {
              grid: { display: false }
            },
            y: {
              ...baseScaleOptions((value) => `UGX ${formatCompact(value)}`),
              beginAtZero: true
            }
          }
        },
        barCurrency: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label(context) {
                  return `Amount: ${formatCurrencyValue(context.raw)}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false }
            },
            y: {
              ...baseScaleOptions((value) => `UGX ${formatCompact(value)}`),
              beginAtZero: true
            }
          }
        },
        barKg: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label(context) {
                  return `Tonnage: ${toNumber(context.raw).toLocaleString('en-UG')} kg`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false }
            },
            y: {
              ...baseScaleOptions((value) => `${formatCompact(value)} kg`),
              beginAtZero: true
            }
          }
        },
        horizontalBarCurrency: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label(context) {
                  return `Amount: ${formatCurrencyValue(context.raw)}`;
                }
              }
            }
          },
          scales: {
            y: {
              grid: { display: false }
            },
            x: {
              ...baseScaleOptions((value) => `UGX ${formatCompact(value)}`),
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
                  return `Stock: ${toNumber(context.raw).toLocaleString('en-UG')} kg`;
                }
              }
            }
          },
          scales: {
            y: {
              grid: { display: false }
            },
            x: {
              ...baseScaleOptions((value) => `${formatCompact(value)} kg`),
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
</style>
