<template>
  <div class="view-shell">
    <div class="view-header">
      <div class="view-heading">
      <h2 class="page-title">Sales Agent Dashboard</h2>
      <p class="page-subtitle">{{ user.name }} - {{ user.branch }}</p>
      </div>
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

    <InsightStrip label="Sales agent summary" :items="summaryItems" />

    <QuickActionsPanel
      class="mb-4"
      title="Quick Actions"
      subtitle="Open your day-to-day sales workflows in one click."
      :items="quickActions"
    />

    <div class="card metric-card">
      <div class="card-body">
        <span class="metric-badge"><i class="bi bi-stars"></i></span>
        <p class="metric-title">Today's Focus</p>
        <h3 class="metric-value">{{ activityHeadline }}</h3>
        <small class="metric-meta">
          {{ stats.cashCount === 0 && stats.creditCount === 0 ? 'No sales recorded yet. Use quick actions above to start the day.' : focusMessage }}
        </small>
        <div class="d-flex flex-wrap gap-2 mt-2">
          <router-link class="btn btn-sm btn-primary" to="/dashboard/sales">Record Cash Sale</router-link>
          <router-link class="btn btn-sm btn-outline-primary" to="/dashboard/credit-sales">Record Credit Sale</router-link>
          <router-link class="btn btn-sm btn-outline-secondary" to="/dashboard/inventory">Check Inventory</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Sales-agent dashboard showing today's personal cash/credit performance snapshot.
 
import { salesAPI, creditSalesAPI } from '../services/api';
import { formatCompactNumber, formatCompactCurrency } from '../utils/numberFormat';
import InsightStrip from '../components/common/InsightStrip.vue';
import QuickActionsPanel from '../components/common/QuickActionsPanel.vue';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';
import { formatDisplayDate } from '../utils/dateFormat.js';

export default {
  name: 'SalesAgentDashboard',
  components: {
    InsightStrip,
    QuickActionsPanel
  },
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
    const authStore = useAuthStore(pinia);
    this.user = authStore.user || {};
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
  computed: {
    activityHeadline() {
      if (this.stats.cashCount === 0 && this.stats.creditCount === 0) {
        return 'Waiting for today\'s first sale';
      }
      return `${this.stats.cashCount + this.stats.creditCount} sales interactions`;
    },
    focusMessage() {
      if (this.stats.creditCount > this.stats.cashCount) {
        return 'Monitor buyer balances and due dates closely.';
      }
      if (this.stats.totalKg > 0) {
        return 'Keep inventory checks tight before the next dispatch.';
      }
      return 'Use the quick actions to start recording sales.';
    },
    quickActions() {
      return [
        {
          key: 'cash-sale',
          to: '/dashboard/sales',
          icon: 'bi bi-cash-stack',
          label: 'Record Cash Sale',
          meta: 'Fast checkout for immediate payment'
        },
        {
          key: 'credit-sale',
          to: '/dashboard/credit-sales',
          icon: 'bi bi-journal-plus',
          label: 'Record Credit Sale',
          meta: 'Create deferred payment order'
        },
        {
          key: 'inventory',
          to: '/dashboard/inventory',
          icon: 'bi bi-box-seam',
          label: 'View Inventory',
          meta: 'Check stock before creating sale'
        },
        {
          key: 'sales-records',
          to: '/dashboard/sales-records',
          icon: 'bi bi-receipt',
          label: 'Sales Records',
          meta: 'Review cash sale entries'
        },
        {
          key: 'credit-records',
          to: '/dashboard/credit-sales-records',
          icon: 'bi bi-journal-text',
          label: 'Credit Records',
          meta: 'Review all credit dispatches'
        },
        {
          key: 'profile',
          to: '/dashboard/profile',
          icon: 'bi bi-person-circle',
          label: 'My Profile',
          meta: 'Update personal account details'
        }
      ];
    },
    summaryItems() {
      return [
        {
          label: 'Today',
          value: this.todayLabel,
          meta: 'Current sales day'
        },
        {
          label: 'Branch',
          value: this.user.branch || 'Unassigned',
          meta: this.user.name || 'Sales agent workspace'
        },
        {
          label: 'Cash Sales',
          value: this.formatStatCurrency(this.stats.cashSales),
          meta: `${this.stats.cashCount} transaction(s)`
        },
        {
          label: 'Credit Sales',
          value: this.formatStatCurrency(this.stats.creditSales),
          meta: `${this.stats.creditCount} transaction(s)`
        }
      ];
    }
  },
  methods: {
    // Load and aggregate only the current agent's transactions for today.
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
      this.todayLabel = formatDisplayDate(new Date());
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

