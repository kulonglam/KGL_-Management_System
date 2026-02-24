<template>
  <div>
    <h2 class="mb-4">Sales Agent Dashboard</h2>
    <p class="text-muted">{{ user.name }} - {{ user.branch }}</p>

    <div class="d-flex align-items-center justify-content-between mb-3">
      <h5 class="mb-0">Today's Sales Summary</h5>
      <span class="badge bg-light text-muted">{{ todayLabel }}</span>
    </div>

    <div v-if="stats.cashCount === 0 && stats.creditCount === 0" class="alert alert-secondary">
      No sales recorded today.
    </div>

    <div v-else class="row g-4">
      <div class="col-md-4">
        <div class="card stats-card">
          <div class="card-body text-center">
            <i class="bi bi-cash-coin text-success" style="font-size: 2rem;"></i>
            <h6 class="text-muted mt-2">Cash Sales Today</h6>
            <h3 class="stats-value">{{ formatStatCurrency(stats.cashSales) }}</h3>
            <small class="text-muted">{{ stats.cashCount }} transactions</small>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card stats-card">
          <div class="card-body text-center">
            <i class="bi bi-credit-card text-warning" style="font-size: 2rem;"></i>
            <h6 class="text-muted mt-2">Credit Sales Today</h6>
            <h3 class="stats-value">{{ formatStatCurrency(stats.creditSales) }}</h3>
            <small class="text-muted">{{ stats.creditCount }} transactions</small>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card stats-card">
          <div class="card-body text-center">
            <i class="bi bi-box text-info" style="font-size: 2rem;"></i>
            <h6 class="text-muted mt-2">Total Produce Today</h6>
            <h3 class="stats-value">{{ formatCompactNumber(stats.totalKg) }} kg</h3>
            <small class="text-muted">Cash + Credit</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { salesAPI, creditSalesAPI } from '../services/api'
import { formatCompactNumber, formatCompactCurrency } from '../utils/numberFormat'

export default {
  name: 'SalesAgentDashboard',
  data() {
    return {
      user: {},
      todayLabel: '',
      midnightTimeout: null,
      midnightInterval: null,
      stats: {
        cashSales: 0,
        cashCount: 0,
        creditSales: 0,
        creditCount: 0,
        totalKg: 0
      }
    }
  },
  async created() {
    this.user = JSON.parse(localStorage.getItem('user'))
    this.setTodayLabel()
    await this.loadData()
    this.scheduleMidnightRefresh()
  },
  beforeUnmount() {
    if (this.midnightTimeout) {
      clearTimeout(this.midnightTimeout)
      this.midnightTimeout = null
    }
    if (this.midnightInterval) {
      clearInterval(this.midnightInterval)
      this.midnightInterval = null
    }
  },
  methods: {
    async loadData() {
      try {
        const [salesRes, creditRes] = await Promise.all([
          salesAPI.getAll(),
          creditSalesAPI.getAll()
        ])

        const { startOfDay, endOfDay } = this.getTodayRange()

        // Filter by current user and today's date
        const mySales = salesRes.data.filter(s => {
          if (s.salesAgentName !== this.user.name) return false
          const saleDate = new Date(s.date)
          return saleDate >= startOfDay && saleDate < endOfDay
        })

        const myCreditSales = creditRes.data.filter(c => {
          if (c.salesAgentName !== this.user.name) return false
          const dispatchDate = new Date(c.dateOfDispatch)
          return dispatchDate >= startOfDay && dispatchDate < endOfDay
        })

        this.stats.cashSales = mySales.reduce((sum, s) => sum + s.amountPaidUgx, 0)
        this.stats.cashCount = mySales.length
        
        this.stats.creditSales = myCreditSales.reduce((sum, c) => sum + c.amountDueUgx, 0)
        this.stats.creditCount = myCreditSales.length

        this.stats.totalKg = mySales.reduce((sum, s) => sum + s.tonnageKg, 0) +
                            myCreditSales.reduce((sum, c) => sum + c.tonnageKg, 0)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    },
    setTodayLabel() {
      this.todayLabel = new Date().toLocaleDateString('en-UG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },
    scheduleMidnightRefresh() {
      const now = new Date()
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const msUntilMidnight = nextMidnight.getTime() - now.getTime()

      this.midnightTimeout = setTimeout(() => {
        this.setTodayLabel()
        this.loadData()
        this.midnightInterval = setInterval(() => {
          this.setTodayLabel()
          this.loadData()
        }, 24 * 60 * 60 * 1000)
      }, msUntilMidnight)
    },
    getTodayRange() {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      return { startOfDay, endOfDay }
    },
    formatStatCurrency(amount) {
      return formatCompactCurrency(amount)
    },
    formatCompactNumber
  }
}
</script>

<style scoped>
.stats-value {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: clamp(1.45rem, 1.9vw, 2rem);
}
</style>
