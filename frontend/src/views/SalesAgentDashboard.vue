<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Sales Agent Dashboard</h2>
      <p class="page-subtitle">{{ user.name }} - {{ user.branch }}</p>
    </div>
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
    <div v-if="loading" class="card mb-4" role="status" aria-live="polite">
      <div class="card-body d-flex align-items-center gap-2">
        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        <span>Loading dashboard data...</span>
      </div>
    </div>

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
            <i class="bi bi-cash-coin text-success" style="font-size: 2rem"></i>
            <h6 class="text-muted mt-2">Cash Sales Today</h6>
            <h3 class="stats-value">{{ formatStatCurrency(stats.cashSales) }}</h3>
            <small class="text-muted">{{ stats.cashCount }} transactions</small>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card stats-card">
          <div class="card-body text-center">
            <i class="bi bi-credit-card text-warning" style="font-size: 2rem"></i>
            <h6 class="text-muted mt-2">Credit Sales Today</h6>
            <h3 class="stats-value">{{ formatStatCurrency(stats.creditSales) }}</h3>
            <small class="text-muted">{{ stats.creditCount }} transactions</small>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card stats-card">
          <div class="card-body text-center">
            <i class="bi bi-box text-info" style="font-size: 2rem"></i>
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
import { salesAPI, creditSalesAPI } from '../services/api';
import { formatCompactNumber, formatCompactCurrency } from '../utils/numberFormat';

export default {
  name: 'SalesAgentDashboard',
  data() {
    return {
      user: {},
      todayLabel: '',
      loading: false,
      loadError: '',
      midnightTimeout: null,
      midnightInterval: null,
      stats: {
        cashSales: 0,
        cashCount: 0,
        creditSales: 0,
        creditCount: 0,
        totalKg: 0
      }
    };
  },
  async created() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.setTodayLabel();
    await this.loadData();
    this.scheduleMidnightRefresh();
  },
  beforeUnmount() {
    if (this.midnightTimeout) {
      clearTimeout(this.midnightTimeout);
      this.midnightTimeout = null;
    }
    if (this.midnightInterval) {
      clearInterval(this.midnightInterval);
      this.midnightInterval = null;
    }
  },
  methods: {
    // Handle load data.
    async loadData() {
      this.loading = true;
      this.loadError = '';
      try {
        const [salesRes, creditRes] = await Promise.all([
          salesAPI.getAll(),
          creditSalesAPI.getAll()
        ]);

        const { startOfDay, endOfDay } = this.getTodayRange();

        // Filter by current user and today's date
        const mySales = salesRes.data.filter((s) => {
          if (s.salesAgentName !== this.user.name) return false;
          const saleDate = new Date(s.date);
          return saleDate >= startOfDay && saleDate < endOfDay;
        });

        const myCreditSales = creditRes.data.filter((c) => {
          if (c.salesAgentName !== this.user.name) return false;
          const dispatchDate = new Date(c.dateOfDispatch);
          return dispatchDate >= startOfDay && dispatchDate < endOfDay;
        });

        this.stats.cashSales = mySales.reduce((sum, s) => sum + s.amountPaidUgx, 0);
        this.stats.cashCount = mySales.length;

        this.stats.creditSales = myCreditSales.reduce((sum, c) => sum + c.amountDueUgx, 0);
        this.stats.creditCount = myCreditSales.length;

        this.stats.totalKg =
          mySales.reduce((sum, s) => sum + s.tonnageKg, 0) +
          myCreditSales.reduce((sum, c) => sum + c.tonnageKg, 0);
      } catch (error) {
        this.loadError = error.response?.data?.message || 'Unable to load sales summary.';
      } finally {
        this.loading = false;
      }
    },
    setTodayLabel() {
      this.todayLabel = new Date().toLocaleDateString('en-UG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    scheduleMidnightRefresh() {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const msUntilMidnight = nextMidnight.getTime() - now.getTime();

      this.midnightTimeout = setTimeout(() => {
        this.setTodayLabel();
        this.loadData();
        this.midnightInterval = setInterval(
          () => {
            this.setTodayLabel();
            this.loadData();
          },
          24 * 60 * 60 * 1000
        );
      }, msUntilMidnight);
    },
    getTodayRange() {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      return { startOfDay, endOfDay };
    },
    formatStatCurrency(amount) {
      return formatCompactCurrency(amount);
    },
    formatCompactNumber
  }
};
</script>

<style scoped>
/* Component styles */
.stats-value {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: clamp(1.45rem, 1.9vw, 2rem);
}
</style>
