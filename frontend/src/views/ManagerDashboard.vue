<template>
  <div>
    <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
      <div>
        <h2 class="page-title mb-1">Manager Dashboard</h2>
        <p class="page-subtitle mb-0">{{ user.branch }} Overview</p>
      </div>
      <div class="dashboard-actions">
        <div class="dashboard-filters">
          <div class="filter-group">
            <label class="form-label mb-1">Period</label>
            <select v-model="filters.period" class="form-select form-select-sm" @change="buildDashboardData">
              <option v-for="option in periodOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
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

    <div v-if="lowStockItems.length > 0" class="alert alert-warning alert-dismissible fade show" role="alert">
      <i class="bi bi-exclamation-triangle me-2"></i>
      <strong>Low Stock Alert!</strong> {{ lowStockAlertMessage }}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>

    <div v-if="outOfStockItems.length > 0" class="alert alert-danger alert-dismissible fade show" role="alert">
      <i class="bi bi-x-octagon me-2"></i>
      <strong>Out of Stock!</strong> {{ outOfStockItems.length }} item(s) are out of stock.
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
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
            <small class="text-muted">{{ stats.creditCount }} pending</small>
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
            <h3 class="stats-value">{{ formatStatCurrency(stats.cashSales + stats.creditSales) }}</h3>
            <small class="text-muted">{{ totalTransactions }} transaction(s)</small>
          </div>
        </div>
      </div>
    </div>

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
  </div>
</template>

<script>
import { inventoryAPI, salesAPI, creditSalesAPI, procurementAPI } from '../services/api'
import { formatCompactCurrency } from '../utils/numberFormat'
import { Bar, Doughnut, Line as LineChart } from 'vue-chartjs'
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
} from 'chart.js'

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
)

const PERIOD_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
]

const BASE_CHART_COLORS = ['#1d4ed8', '#0f766e', '#d97706', '#7c3aed', '#dc2626', '#0891b2']

const toNumber = (value) => Number(value || 0)
const formatCompact = (value) =>
  new Intl.NumberFormat('en-UG', { notation: 'compact', maximumFractionDigits: 1 }).format(toNumber(value))
const formatCurrencyValue = (value) =>
  new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(toNumber(value))

const escapeCsvValue = (value) => {
  const text = value === undefined || value === null ? '' : String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

const escapeHtml = (value) =>
  String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const sanitizeFileSegment = (value) => {
  const cleaned = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return cleaned || 'all'
}

const buildPalette = (count) => Array.from({ length: count }, (_, index) => BASE_CHART_COLORS[index % BASE_CHART_COLORS.length])

const baseScaleOptions = (tickCallback) => ({
  grid: { color: 'rgba(148, 163, 184, 0.2)' },
  ticks: { callback: tickCallback }
})

export default {
  name: 'ManagerDashboard',
  components: { Bar, Doughnut, LineChart },
  data() {
    return {
      loading: false,
      user: {},
      filters: {
        period: 'weekly'
      },
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
      outOfStockItems: [],
      topProducts: [],
      stockByProduct: [],
      salesOverTime: [],
      creditCollection: {
        collected: 0,
        outstanding: 0
      },
      agentPerformance: [],
      dealerPerformance: [],
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
                  return `${context.label}: ${formatCurrencyValue(context.raw)}`
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
                  return `Sales: ${formatCurrencyValue(context.raw)}`
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
                  return `Amount: ${formatCurrencyValue(context.raw)}`
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
                  return `Tonnage: ${toNumber(context.raw).toLocaleString('en-UG')} kg`
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
                  return `Amount: ${formatCurrencyValue(context.raw)}`
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
                  return `Stock: ${toNumber(context.raw).toLocaleString('en-UG')} kg`
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
    }
  },
  async created() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}')
    await this.loadData()
  },
  computed: {
    selectedPeriodLabel() {
      return this.periodOptions.find((option) => option.value === this.filters.period)?.label || 'Weekly'
    },
    formattedReportRange() {
      if (!this.reportRange.from || !this.reportRange.to) return '-'
      const from = new Date(this.reportRange.from)
      const to = new Date(this.reportRange.to)
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return '-'
      const options = { month: 'short', day: 'numeric', year: 'numeric' }
      return `${from.toLocaleDateString('en-UG', options)} - ${to.toLocaleDateString('en-UG', options)}`
    },
    totalTransactions() {
      return this.stats.cashCount + this.stats.creditCount
    },
    lowStockAlertMessage() {
      const labels = this.lowStockItems
        .map((item) => `${item.produceName} (${Number(item.totalTonnageKg || 0).toLocaleString('en-UG')} kg)`)
        .slice(0, 4)

      if (labels.length === 0) return ''

      const suffix = this.lowStockItems.length > 4
        ? `, and ${this.lowStockItems.length - 4} more`
        : ''

      return `${labels.join(', ')}${suffix} running low on stock.`
    },
    hasRevenueSplitData() {
      return (this.stats.cashSales + this.stats.creditSales) > 0
    },
    hasCreditCollectionData() {
      return (this.creditCollection.collected + this.creditCollection.outstanding) > 0
    },
    hasSalesTrendData() {
      return this.salesOverTime.some((item) => item.amount > 0)
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
    }
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const [invRes, salesRes, creditRes, procurementRes] = await Promise.all([
          inventoryAPI.get(),
          salesAPI.getAll(),
          creditSalesAPI.getAll(),
          procurementAPI.getAll()
        ])

        this.inventory = invRes.data.inventory || []
        this.salesRecords = salesRes.data || []
        this.creditSalesRecords = creditRes.data || []
        this.procurementRecords = procurementRes.data || []

        this.stats.inventoryValue = invRes.data.statistics?.totalValue || 0
        this.stats.inventoryItems = invRes.data.statistics?.totalItems || 0
        this.outOfStockItems = invRes.data.outOfStockItems || []
        this.lowStockItems = this.inventory.filter((item) => item.totalTonnageKg < 500)

        this.buildDashboardData()
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        this.loading = false
      }
    },
    buildDashboardData() {
      const range = this.getDateRangeByPeriod(this.filters.period)
      this.reportRange = range

      const filteredSales = this.filterRecordsByDate(this.salesRecords, 'date', range)
      const filteredCreditSales = this.filterRecordsByDate(this.creditSalesRecords, 'dateOfDispatch', range)
      const filteredProcurements = this.filterRecordsByDate(this.procurementRecords, 'dateReceived', range)

      this.stats.cashSales = filteredSales.reduce((sum, sale) => sum + (sale.amountPaidUgx || 0), 0)
      this.stats.cashCount = filteredSales.length

      this.stats.creditSales = filteredCreditSales.reduce((sum, sale) => sum + (sale.amountDueUgx || 0), 0)
      this.stats.creditCount = filteredCreditSales.length
      this.stats.procurementTotal = filteredProcurements.reduce((sum, record) => sum + (record.costUgx || 0), 0)
      this.stats.procurementCount = filteredProcurements.length

      this.buildCharts(filteredSales, filteredCreditSales, filteredProcurements)
    },
    getDateRangeByPeriod(period) {
      const end = new Date()
      if (period === 'yearly') {
        const start = new Date(end.getFullYear(), end.getMonth() - 11, 1)
        return { from: start.toISOString(), to: end.toISOString() }
      }

      const days = period === 'monthly' ? 30 : 7
      const start = new Date(end)
      start.setHours(0, 0, 0, 0)
      start.setDate(start.getDate() - (days - 1))
      return { from: start.toISOString(), to: end.toISOString() }
    },
    filterRecordsByDate(records, dateField, range) {
      const start = new Date(range.from)
      const end = new Date(range.to)
      return (records || []).filter((record) => {
        const recordDate = new Date(record?.[dateField])
        return !Number.isNaN(recordDate.getTime()) && recordDate >= start && recordDate <= end
      })
    },
    buildTrendBuckets(period) {
      const now = new Date()
      const buckets = []

      if (period === 'yearly') {
        for (let i = 11; i >= 0; i -= 1) {
          const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
          buckets.push({
            start,
            end,
            label: start.toLocaleDateString('en-UG', { month: 'short', year: '2-digit' }),
            amount: 0
          })
        }
        return buckets
      }

      const days = period === 'monthly' ? 30 : 7
      const today = new Date(now)
      today.setHours(0, 0, 0, 0)

      for (let i = days - 1; i >= 0; i -= 1) {
        const start = new Date(today)
        start.setDate(today.getDate() - i)
        const end = new Date(start)
        end.setDate(start.getDate() + 1)
        buckets.push({
          start,
          end,
          label: period === 'weekly'
            ? start.toLocaleDateString('en-UG', { weekday: 'short' })
            : start.toLocaleDateString('en-UG', { month: 'short', day: 'numeric' }),
          amount: 0
        })
      }

      return buckets
    },
    addAmountToBuckets(buckets, dateValue, amount) {
      const date = new Date(dateValue)
      if (Number.isNaN(date.getTime())) return

      for (let i = 0; i < buckets.length; i += 1) {
        const bucket = buckets[i]
        if (date >= bucket.start && date < bucket.end) {
          bucket.amount += Number(amount || 0)
          return
        }
      }
    },
    buildCharts(sales, creditSales, procurements) {
      const productMap = {}
      sales.forEach((sale) => {
        productMap[sale.produceName] = (productMap[sale.produceName] || 0) + (sale.tonnageKg || 0)
      })
      creditSales.forEach((sale) => {
        productMap[sale.produceName] = (productMap[sale.produceName] || 0) + (sale.tonnageKg || 0)
      })
      const productList = Object.keys(productMap).map((name) => ({
        name,
        totalKg: productMap[name]
      }))
      productList.sort((a, b) => b.totalKg - a.totalKg)
      this.topProducts = productList.slice(0, 5)

      const stockList = this.inventory
        .map((item) => ({ name: item.produceName, totalKg: item.totalTonnageKg }))
        .sort((a, b) => b.totalKg - a.totalKg)
        .slice(0, 5)
      this.stockByProduct = stockList

      const creditCollected = creditSales.reduce((sum, sale) => sum + (sale.amountPaidUgx || 0), 0)
      const creditOutstanding = creditSales.reduce((sum, sale) => {
        const balance =
          sale.balanceUgx !== undefined && sale.balanceUgx !== null
            ? sale.balanceUgx
            : Math.max((sale.amountDueUgx || 0) - (sale.amountPaidUgx || 0), 0)
        return sum + balance
      }, 0)
      this.creditCollection.collected = creditCollected
      this.creditCollection.outstanding = creditOutstanding

      const agentMap = {}
      sales.forEach((sale) => {
        agentMap[sale.salesAgentName] = (agentMap[sale.salesAgentName] || 0) + (sale.amountPaidUgx || 0)
      })
      creditSales.forEach((sale) => {
        agentMap[sale.salesAgentName] = (agentMap[sale.salesAgentName] || 0) + (sale.amountDueUgx || 0)
      })
      const agentList = Object.keys(agentMap).map((name) => ({
        name,
        amount: agentMap[name]
      }))
      agentList.sort((a, b) => b.amount - a.amount)
      this.agentPerformance = agentList.slice(0, 5)

      const dealerMap = {}
      procurements.forEach((procurement) => {
        dealerMap[procurement.dealerName] = (dealerMap[procurement.dealerName] || 0) + (procurement.costUgx || 0)
      })
      const dealerList = Object.keys(dealerMap).map((name) => ({
        name,
        amount: dealerMap[name]
      }))
      dealerList.sort((a, b) => b.amount - a.amount)
      this.dealerPerformance = dealerList.slice(0, 5)

      const trendBuckets = this.buildTrendBuckets(this.filters.period)
      sales.forEach((sale) => {
        this.addAmountToBuckets(trendBuckets, sale.date, sale.amountPaidUgx || 0)
      })
      creditSales.forEach((sale) => {
        this.addAmountToBuckets(trendBuckets, sale.dateOfDispatch, sale.amountDueUgx || 0)
      })
      this.salesOverTime = trendBuckets.map((bucket) => ({
        label: bucket.label,
        amount: bucket.amount
      }))
    },
    buildFileName(extension) {
      const period = sanitizeFileSegment(this.selectedPeriodLabel)
      const branch = sanitizeFileSegment(this.user?.branch || 'branch')
      const stamp = new Date().toISOString().slice(0, 10)
      return `manager_report_${branch}_${period}_${stamp}.${extension}`
    },
    downloadFile(filename, content, type) {
      const blob = new Blob([content], { type })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    getSummaryRows(formatted = false) {
      const formatCurrency = (value) => (formatted ? formatCurrencyValue(value) : toNumber(value))
      const formatNumber = (value) =>
        formatted ? toNumber(value).toLocaleString('en-UG') : toNumber(value)

      return [
        ['Branch', this.user?.branch || '-'],
        ['Report Period', this.selectedPeriodLabel],
        ['Date Range', this.formattedReportRange],
        ['Transactions', formatNumber(this.totalTransactions)],
        ['Cash Sales (UGX)', formatCurrency(this.stats.cashSales)],
        ['Credit Sales (UGX)', formatCurrency(this.stats.creditSales)],
        ['Total Revenue (UGX)', formatCurrency(this.stats.cashSales + this.stats.creditSales)],
        ['Procurement Total (UGX)', formatCurrency(this.stats.procurementTotal)],
        ['Procurement Records', formatNumber(this.stats.procurementCount)],
        ['Inventory Value (UGX)', formatCurrency(this.stats.inventoryValue)],
        ['Inventory Items', formatNumber(this.stats.inventoryItems)],
        ['Low Stock Items', formatNumber(this.lowStockItems.length)],
        ['Credit Collected (UGX)', formatCurrency(this.creditCollection.collected)],
        ['Credit Outstanding (UGX)', formatCurrency(this.creditCollection.outstanding)]
      ]
    },
    getSalesTrendRows(formatted = false) {
      const formatCurrency = (value) => (formatted ? formatCurrencyValue(value) : toNumber(value))
      return this.salesOverTime.map((item) => [item.label, formatCurrency(item.amount)])
    },
    getTopProductsRows(formatted = false) {
      const formatNumber = (value) =>
        formatted ? toNumber(value).toLocaleString('en-UG') : toNumber(value)
      return this.topProducts.map((item) => [item.name, formatNumber(item.totalKg)])
    },
    getStockRows(formatted = false) {
      const formatNumber = (value) =>
        formatted ? toNumber(value).toLocaleString('en-UG') : toNumber(value)
      return this.stockByProduct.map((item) => [item.name, formatNumber(item.totalKg)])
    },
    getAgentRows(formatted = false) {
      const formatCurrency = (value) => (formatted ? formatCurrencyValue(value) : toNumber(value))
      return this.agentPerformance.map((item) => [item.name, formatCurrency(item.amount)])
    },
    getDealerRows(formatted = false) {
      const formatCurrency = (value) => (formatted ? formatCurrencyValue(value) : toNumber(value))
      return this.dealerPerformance.map((item) => [item.name, formatCurrency(item.amount)])
    },
    buildCsvContent() {
      const lines = []
      const addSection = (title, headers, rows) => {
        lines.push([title])
        if (headers?.length) {
          lines.push(headers)
        }
        rows.forEach((row) => lines.push(row))
        lines.push([])
      }

      addSection('Summary', ['Metric', 'Value'], this.getSummaryRows(false))
      addSection('Sales Trend', ['Period', 'Total Sales (UGX)'], this.getSalesTrendRows(false))
      addSection('Top Products', ['Product', 'Kilograms Sold'], this.getTopProductsRows(false))
      addSection('Stock By Product', ['Product', 'Available Stock (kg)'], this.getStockRows(false))
      addSection('Sales Agent Performance', ['Sales Agent', 'Amount (UGX)'], this.getAgentRows(false))
      addSection('Dealer Performance', ['Dealer', 'Procurement Cost (UGX)'], this.getDealerRows(false))

      const content = lines.map((row) => row.map(escapeCsvValue).join(',')).join('\r\n')
      return `\ufeff${content}`
    },
    buildExcelContent() {
      const buildTable = (title, headers, rows) => {
        const columnCount = Math.max(headers.length || 1, ...rows.map((row) => row.length || 0), 1)
        const headerRow = headers.length
          ? `<tr>${headers.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr>`
          : ''
        const bodyRows = rows
          .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
          .join('')

        return `
          <table border="1">
            <tr><th colspan="${columnCount}">${escapeHtml(title)}</th></tr>
            ${headerRow}
            ${bodyRows}
          </table>
          <br />
        `
      }

      return `
        <html>
          <head>
            <meta charset="UTF-8" />
          </head>
          <body>
            ${buildTable('Summary', ['Metric', 'Value'], this.getSummaryRows(false))}
            ${buildTable('Sales Trend', ['Period', 'Total Sales (UGX)'], this.getSalesTrendRows(false))}
            ${buildTable('Top Products', ['Product', 'Kilograms Sold'], this.getTopProductsRows(false))}
            ${buildTable('Stock By Product', ['Product', 'Available Stock (kg)'], this.getStockRows(false))}
            ${buildTable('Sales Agent Performance', ['Sales Agent', 'Amount (UGX)'], this.getAgentRows(false))}
            ${buildTable('Dealer Performance', ['Dealer', 'Procurement Cost (UGX)'], this.getDealerRows(false))}
          </body>
        </html>
      `
    },
    buildReportHtml() {
      const summaryRows = this.getSummaryRows(true)
      const trendRows = this.getSalesTrendRows(true)
      const productRows = this.getTopProductsRows(true)
      const stockRows = this.getStockRows(true)
      const agentRows = this.getAgentRows(true)
      const dealerRows = this.getDealerRows(true)
      const generatedAt = new Date().toLocaleString('en-UG')

      const summaryBody = summaryRows
        .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
        .join('')

      const buildBodyRows = (rows, columnCount) =>
        rows.length
          ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')
          : `<tr><td colspan="${columnCount}">No data</td></tr>`

      const trendBody = buildBodyRows(trendRows, 2)
      const productBody = buildBodyRows(productRows, 2)
      const stockBody = buildBodyRows(stockRows, 2)
      const agentBody = buildBodyRows(agentRows, 2)
      const dealerBody = buildBodyRows(dealerRows, 2)

      return `
        <html>
          <head>
            <meta charset="UTF-8" />
            <title>Manager Report</title>
            <style>
              body { font-family: "Segoe UI", Tahoma, sans-serif; color: #0f172a; margin: 24px; }
              h1 { margin: 0 0 6px; font-size: 22px; }
              h2 { margin: 24px 0 10px; font-size: 16px; color: #1e293b; }
              p { margin: 0 0 16px; color: #64748b; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
              th, td { border: 1px solid #e2e8f0; padding: 8px; font-size: 12px; text-align: left; }
              th { background: #f1f5f9; font-weight: 600; }
              .summary th { width: 32%; }
            </style>
          </head>
          <body>
            <h1>Manager Report</h1>
            <p>Generated ${escapeHtml(generatedAt)}</p>

            <h2>Summary</h2>
            <table class="summary">
              <tbody>
                ${summaryBody}
              </tbody>
            </table>

            <h2>Sales Trend</h2>
            <table>
              <thead>
                <tr><th>Period</th><th>Total Sales (UGX)</th></tr>
              </thead>
              <tbody>
                ${trendBody}
              </tbody>
            </table>

            <h2>Top Products</h2>
            <table>
              <thead>
                <tr><th>Product</th><th>Kilograms Sold</th></tr>
              </thead>
              <tbody>
                ${productBody}
              </tbody>
            </table>

            <h2>Stock By Product</h2>
            <table>
              <thead>
                <tr><th>Product</th><th>Available Stock (kg)</th></tr>
              </thead>
              <tbody>
                ${stockBody}
              </tbody>
            </table>

            <h2>Sales Agent Performance</h2>
            <table>
              <thead>
                <tr><th>Sales Agent</th><th>Amount (UGX)</th></tr>
              </thead>
              <tbody>
                ${agentBody}
              </tbody>
            </table>

            <h2>Dealer Performance</h2>
            <table>
              <thead>
                <tr><th>Dealer</th><th>Procurement Cost (UGX)</th></tr>
              </thead>
              <tbody>
                ${dealerBody}
              </tbody>
            </table>
          </body>
        </html>
      `
    },
    exportCsv() {
      const content = this.buildCsvContent()
      this.downloadFile(this.buildFileName('csv'), content, 'text/csv;charset=utf-8')
    },
    exportExcel() {
      const content = this.buildExcelContent()
      this.downloadFile(this.buildFileName('xls'), content, 'application/vnd.ms-excel')
    },
    exportPdf() {
      const reportHtml = this.buildReportHtml()
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('Please allow pop-ups to export the PDF report.')
        return
      }
      printWindow.document.open()
      printWindow.document.write(reportHtml)
      printWindow.document.close()
      printWindow.focus()
      printWindow.onafterprint = () => printWindow.close()
      setTimeout(() => printWindow.print(), 300)
    },
    formatStatCurrency(amount) {
      return formatCompactCurrency(amount)
    }
  }
}
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
.stats-card,
.chart-card {
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
}

@media (max-width: 992px) {
  .report-grid {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
}
</style>
