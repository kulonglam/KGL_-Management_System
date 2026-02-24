<template>
  <div>
    <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
      <div>
        <h2 class="mb-1">Director Dashboard</h2>
        <p class="text-muted mb-0">Cross-branch report for {{ selectedPeriodLabel.toLowerCase() }} performance.</p>
      </div>
      <div class="dashboard-actions">
        <div class="dashboard-filters">
          <div class="filter-group">
            <label class="form-label mb-1">Period</label>
            <select v-model="filters.period" class="form-select form-select-sm" @change="loadData">
              <option v-for="option in periodOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label class="form-label mb-1">Branch</label>
            <select v-model="filters.branch" class="form-select form-select-sm" @change="loadData">
              <option v-for="option in branchOptions" :key="option.value" :value="option.value">
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
            <div v-if="branchLabels.length === 0" class="chart-empty chart-empty-sm">No branch totals available</div>
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
                    <td class="text-end">{{ branchTotals[branch].totalKg.toLocaleString('en-UG') }} kg</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { salesAPI } from '../services/api'
import { formatCompactNumber, formatCompactCurrency } from '../utils/numberFormat'
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

const BRANCH_OPTIONS = [
  { value: 'all', label: 'All Branches' },
  { value: 'Maganjo', label: 'Maganjo' },
  { value: 'Matugga', label: 'Matugga' }
]

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

const axisTicks = (formatter) => ({
  grid: { color: 'rgba(148, 163, 184, 0.2)' },
  ticks: { callback: formatter }
})

export default {
  name: 'DirectorDashboard',
  components: { Bar, Doughnut, LineChart },
  data() {
    return {
      loading: false,
      filters: {
        period: 'weekly',
        branch: 'all'
      },
      branchTotals: {},
      grandTotal: { cash: 0, credit: 0, totalKg: 0 },
      trendLabels: [],
      trendSeries: [],
      report: {
        salesCount: 0,
        creditSalesCount: 0,
        procurementCount: 0,
        procurementTotal: 0
      },
      procurementTotals: {},
      range: {
        from: '',
        to: ''
      },
      periodOptions: PERIOD_OPTIONS,
      branchOptions: BRANCH_OPTIONS,
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
                  return `${context.dataset.label}: ${formatCurrencyValue(context.raw)}`
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
                  return `Volume: ${toNumber(context.raw).toLocaleString('en-UG')} kg`
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
    }
  },
  computed: {
    totalRevenue() {
      return this.grandTotal.cash + this.grandTotal.credit
    },
    totalTransactions() {
      return toNumber(this.report.salesCount) + toNumber(this.report.creditSalesCount)
    },
    procurementTotal() {
      return toNumber(this.report.procurementTotal)
    },
    procurementCount() {
      return toNumber(this.report.procurementCount)
    },
    selectedPeriodLabel() {
      return this.periodOptions.find((option) => option.value === this.filters.period)?.label || 'Weekly'
    },
    selectedBranchLabel() {
      return this.branchOptions.find((option) => option.value === this.filters.branch)?.label || 'All Branches'
    },
    formattedRange() {
      if (!this.range.from || !this.range.to) return '-'
      const from = new Date(this.range.from)
      const to = new Date(this.range.to)
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return '-'
      const options = { month: 'short', day: 'numeric', year: 'numeric' }
      return `${from.toLocaleDateString('en-UG', options)} - ${to.toLocaleDateString('en-UG', options)}`
    },
    branchLabels() {
      return Object.keys(this.branchTotals)
    },
    hasRevenueData() {
      return this.totalRevenue > 0
    },
    hasTrendData() {
      return this.trendSeries.some((value) => value > 0)
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
      }
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
      }
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
      }
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
      }
    }
  },
  async created() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const response = await salesAPI.getAggregation({
          period: this.filters.period,
          branch: this.filters.branch
        })
        this.branchTotals = response.data.branchTotals || {}
        this.procurementTotals = response.data.procurementTotals || {}
        this.grandTotal = response.data.grandTotal || { cash: 0, credit: 0, totalKg: 0 }
        this.trendLabels = response.data.trends?.labels || []
        this.trendSeries = response.data.trends?.data || []
        this.report = response.data.report || {
          salesCount: 0,
          creditSalesCount: 0,
          procurementCount: 0,
          procurementTotal: 0
        }
        this.range = response.data.range || { from: '', to: '' }
      } catch (error) {
        this.branchTotals = {}
        this.procurementTotals = {}
        this.grandTotal = { cash: 0, credit: 0, totalKg: 0 }
        this.trendLabels = []
        this.trendSeries = []
        this.report = { salesCount: 0, creditSalesCount: 0, procurementCount: 0, procurementTotal: 0 }
        this.range = { from: '', to: '' }
        console.error('Error loading aggregation:', error)
      } finally {
        this.loading = false
      }
    },
    formatCurrency(amount) {
      return formatCurrencyValue(amount)
    },
    formatStatCurrency(amount) {
      return formatCompactCurrency(amount)
    },
    buildFileName(extension) {
      const period = sanitizeFileSegment(this.selectedPeriodLabel)
      const branch = sanitizeFileSegment(this.selectedBranchLabel)
      const stamp = new Date().toISOString().slice(0, 10)
      return `director_report_${period}_${branch}_${stamp}.${extension}`
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
    getReportSummaryRows(formatted = false) {
      const formatCurrency = (value) => (formatted ? formatCurrencyValue(value) : toNumber(value))
      const formatNumber = (value) =>
        formatted ? toNumber(value).toLocaleString('en-UG') : toNumber(value)

      return [
        ['Report Period', this.selectedPeriodLabel],
        ['Branch Scope', this.selectedBranchLabel],
        ['Range', this.formattedRange],
        ['Transactions', formatNumber(this.totalTransactions)],
        ['Total Revenue (UGX)', formatCurrency(this.totalRevenue)],
        ['Cash Sales (UGX)', formatCurrency(this.grandTotal.cash)],
        ['Credit Sales (UGX)', formatCurrency(this.grandTotal.credit)],
        ['Total Procurement (UGX)', formatCurrency(this.procurementTotal)],
        ['Total Produce Sold (kg)', formatNumber(this.grandTotal.totalKg)]
      ]
    },
    getBranchTotalsRows(formatted = false) {
      const includeProcurement = Object.keys(this.procurementTotals || {}).length > 0
      const formatCurrency = (value) => (formatted ? formatCurrencyValue(value) : toNumber(value))
      const formatNumber = (value) =>
        formatted ? toNumber(value).toLocaleString('en-UG') : toNumber(value)

      const headers = [
        'Branch',
        'Cash Sales (UGX)',
        'Credit Sales (UGX)',
        'Total Revenue (UGX)',
        'Total Weight (kg)'
      ]
      if (includeProcurement) {
        headers.push('Procurement Cost (UGX)')
      }

      const rows = this.branchLabels.map((branch) => {
        const totals = this.branchTotals[branch] || { cash: 0, credit: 0, totalKg: 0 }
        const procurementCost = this.procurementTotals?.[branch]?.totalCost || 0
        const row = [
          branch,
          formatCurrency(totals.cash),
          formatCurrency(totals.credit),
          formatCurrency(totals.cash + totals.credit),
          formatNumber(totals.totalKg)
        ]
        if (includeProcurement) {
          row.push(formatCurrency(procurementCost))
        }
        return row
      })

      return { headers, rows }
    },
    getTrendRows(formatted = false) {
      const formatCurrency = (value) => (formatted ? formatCurrencyValue(value) : toNumber(value))
      const headers = ['Period', 'Total Sales (UGX)']
      const rows = this.trendLabels.map((label, index) => [
        label,
        formatCurrency(this.trendSeries[index] || 0)
      ])
      return { headers, rows }
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

      const summaryRows = this.getReportSummaryRows(false)
      addSection('Summary', ['Metric', 'Value'], summaryRows)

      const branchSection = this.getBranchTotalsRows(false)
      addSection('Branch Totals', branchSection.headers, branchSection.rows)

      const trendSection = this.getTrendRows(false)
      addSection('Sales Trend', trendSection.headers, trendSection.rows)

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

      const summaryRows = this.getReportSummaryRows(false)
      const branchSection = this.getBranchTotalsRows(false)
      const trendSection = this.getTrendRows(false)

      return `
        <html>
          <head>
            <meta charset="UTF-8" />
          </head>
          <body>
            ${buildTable('Summary', ['Metric', 'Value'], summaryRows)}
            ${buildTable('Branch Totals', branchSection.headers, branchSection.rows)}
            ${buildTable('Sales Trend', trendSection.headers, trendSection.rows)}
          </body>
        </html>
      `
    },
    buildReportHtml() {
      const summaryRows = this.getReportSummaryRows(true)
      const branchSection = this.getBranchTotalsRows(true)
      const trendSection = this.getTrendRows(true)
      const generatedAt = new Date().toLocaleString('en-UG')

      const summaryBody = summaryRows
        .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
        .join('')

      const branchHeader = `<tr>${branchSection.headers
        .map((header) => `<th>${escapeHtml(header)}</th>`)
        .join('')}</tr>`
      const branchBody = branchSection.rows
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
        .join('')

      const trendHeader = `<tr>${trendSection.headers
        .map((header) => `<th>${escapeHtml(header)}</th>`)
        .join('')}</tr>`
      const trendBody = trendSection.rows
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
        .join('')

      return `
        <html>
          <head>
            <meta charset="UTF-8" />
            <title>Director Report</title>
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
            <h1>Director Report</h1>
            <p>Generated ${escapeHtml(generatedAt)}</p>

            <h2>Summary</h2>
            <table class="summary">
              <tbody>
                ${summaryBody}
              </tbody>
            </table>

            <h2>Branch Totals</h2>
            <table>
              <thead>
                ${branchHeader}
              </thead>
              <tbody>
                ${branchBody || '<tr><td colspan="' + branchSection.headers.length + '">No data</td></tr>'}
              </tbody>
            </table>

            <h2>Sales Trend</h2>
            <table>
              <thead>
                ${trendHeader}
              </thead>
              <tbody>
                ${trendBody || '<tr><td colspan="' + trendSection.headers.length + '">No data</td></tr>'}
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
    formatCompactNumber
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
  font-size: clamp(1.45rem, 1.8vw, 1.95rem);
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

.chart-empty-sm {
  min-height: 120px;
}

@media (max-width: 992px) {
  .report-grid {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
}
</style>
