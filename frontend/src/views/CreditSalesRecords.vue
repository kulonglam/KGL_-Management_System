<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Credit Sales Records</h2>
      <p class="page-subtitle">Track balances, repayment status, and due dates.</p>
    </div>

    <div v-if="canRepay && repayId" class="card mb-4">
      <div class="card-header">
        <h5 class="mb-0">Record Repayment</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleRepay">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label" for="repay-buyer">Buyer</label>
              <input
                id="repay-buyer"
                type="text"
                class="form-control"
                :value="selectedCreditSale?.buyerName"
                disabled
              />
            </div>
            <div class="col-md-6">
              <label class="form-label" for="repay-balance">Balance (UGX)</label>
              <input
                id="repay-balance"
                type="text"
                class="form-control"
                :value="formatCurrency(balanceForSelected)"
                disabled
              />
            </div>
            <div class="col-md-6">
              <label class="form-label" for="repay-amount">Amount Paid (UGX) *</label>
                <input
                  id="repay-amount"
                  type="number"
                  class="form-control"
                  v-model="repayForm.amountUgx"
                  min="1"
                  :max="balanceForSelected || undefined"
                  required
                />
              </div>
            <div class="col-md-6">
              <label class="form-label" for="repay-date">Payment Date</label>
              <input id="repay-date" type="date" class="form-control" v-model="repayForm.paidAt" />
            </div>
          </div>

          <div v-if="repayError" class="alert alert-danger mt-3">{{ repayError }}</div>
          <div v-if="repaySuccess" class="alert alert-success mt-3">{{ repaySuccess }}</div>

          <div class="mt-4">
            <button type="submit" class="btn btn-primary" :disabled="repayLoading">
              <span v-if="repayLoading" class="spinner-border spinner-border-sm me-2"></span>
              Record Payment
            </button>
            <button type="button" class="btn btn-outline-secondary ms-2" @click="cancelRepay">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="loadError"
      class="alert alert-danger d-flex align-items-start justify-content-between gap-3"
      role="alert"
    >
      <span>{{ loadError }}</span>
      <button
        type="button"
        class="btn btn-sm btn-outline-danger"
        :disabled="loadingList"
        @click="loadCreditSales"
      >
        Retry
      </button>
    </div>

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Credit Sales Records</h5>
        <button
          class="btn btn-outline-primary btn-sm"
          @click="loadCreditSales"
          :disabled="loadingList"
        >
          <span v-if="loadingList" class="spinner-border spinner-border-sm me-2"></span>
          Refresh
        </button>
      </div>
      <div class="card-body">
        <div class="data-toolbar">
          <div class="data-toolbar-group">
            <div class="data-toolbar-field">
              <label class="form-label mb-1" for="credit-search">Search</label>
              <input
                id="credit-search"
                v-model.trim="searchQuery"
                type="text"
                class="form-control form-control-sm"
                placeholder="Buyer, NIN, produce, agent..."
              />
            </div>
            <div class="data-toolbar-field">
              <label class="form-label mb-1" for="credit-status-filter">Status</label>
              <select
                id="credit-status-filter"
                v-model="statusFilter"
                class="form-select form-select-sm"
              >
                <option value="all">All statuses</option>
                <option value="outstanding">Outstanding</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div class="data-toolbar-field">
              <label class="form-label mb-1" for="credit-sort">Sort By</label>
              <select id="credit-sort" v-model="sortBy" class="form-select form-select-sm">
                <option value="newest">Newest dispatch</option>
                <option value="oldest">Oldest dispatch</option>
                <option value="balance_desc">Highest balance</option>
                <option value="due_soon">Due soonest</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            :disabled="!searchQuery && statusFilter === 'all' && sortBy === 'newest'"
            @click="resetFilters"
          >
            Reset Filters
          </button>
        </div>

        <div v-if="loadingList" class="text-center py-5 text-muted">Loading credit sales records...</div>
        <div v-else-if="creditSales.length === 0" class="empty-state">No credit sales records found.</div>
        <div v-else-if="filteredCreditSales.length === 0" class="empty-state">
          No credit sales records match your current filters.
        </div>
        <div v-else class="table-responsive">
          <table class="table align-middle table-sticky table-row-hover">
            <thead>
              <tr>
                <th>Buyer</th>
                <th>NIN</th>
                <th>Location</th>
                <th>Contact</th>
                <th class="text-end">Amount Due (UGX)</th>
                <th class="text-end">Balance (UGX)</th>
                <th>Status</th>
                <th>Produce</th>
                <th>Sales Agent</th>
                <th>Due Date</th>
                <th>Dispatch Date</th>
                <th v-if="canRepay" class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in paginatedCreditSales" :key="item._id" :class="{ 'table-active': repayId === item._id }">
                <td>{{ item.buyerName }}</td>
                <td>{{ item.nationalId || '-' }}</td>
                <td>{{ item.location || '-' }}</td>
                <td>{{ item.contact || '-' }}</td>
                <td class="text-end">{{ formatCurrency(item.amountDueUgx) }}</td>
                <td
                  class="text-end fw-semibold"
                  :class="{ 'text-danger': getBalance(item) > 0, 'text-success': getBalance(item) === 0 }"
                >
                  {{ formatCurrency(getBalance(item)) }}
                </td>
                <td>
                  <span
                    class="badge"
                    :class="getBalance(item) > 0 ? 'bg-warning text-dark' : 'bg-success'"
                  >
                    {{ getBalance(item) > 0 ? 'Outstanding' : 'Paid' }}
                  </span>
                </td>
                <td>{{ item.produceName }} ({{ item.produceType }})</td>
                <td>{{ item.salesAgentName || '-' }}</td>
                <td>{{ formatDate(item.dueDate) }}</td>
                <td>{{ formatDate(item.dateOfDispatch) }}</td>
                <td v-if="canRepay" class="text-end">
                  <button
                    v-if="getBalance(item) > 0"
                    type="button"
                    class="btn btn-sm btn-outline-primary"
                    @click="startRepay(item)"
                  >
                    Repay
                  </button>
                  <span v-else class="text-muted small">Settled</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          :current-page="currentPage"
          :total-pages="totalCreditPages"
          :total-items="filteredCreditSales.length"
          :page-size="pageSize"
          :page-size-options="pageSizeOptions"
          id-prefix="credit-sales-records"
          @update:currentPage="goToPage"
          @update:pageSize="handlePageSizeUpdate"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { creditSalesAPI } from '../services/api';
import TablePagination from '../components/common/TablePagination.vue';
import { getCreditSaleBalance, validateRepaymentAmount } from '../utils/creditSalesValidation.mjs';

export default {
  name: 'CreditSalesRecords',
  components: {
    TablePagination
  },
  data() {
    return {
      user: {},
      creditSales: [],
      loadingList: false,
      loadError: '',
      currentPage: 1,
      pageSize: 20,
      pageSizeOptions: [10, 20, 50, 100],
      searchQuery: '',
      statusFilter: 'all',
      sortBy: 'newest',
      repayId: null,
      repayForm: {
        amountUgx: '',
        paidAt: new Date().toISOString().split('T')[0]
      },
      repayLoading: false,
      repayError: '',
      repaySuccess: ''
    };
  },
  async created() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    await this.loadCreditSales();
  },
  computed: {
    // Handle can repay.
    canRepay() {
      return this.user.role === 'manager';
    },
    selectedCreditSale() {
      return this.creditSales.find((c) => c._id === this.repayId);
    },
    filteredCreditSales() {
      const query = this.searchQuery.trim().toLowerCase();

      const searched = this.creditSales.filter((item) => {
        if (!query) return true;
        const haystack = [
          item.buyerName,
          item.nationalId,
          item.produceName,
          item.produceType,
          item.salesAgentName,
          item.contact
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });

      const filteredByStatus =
        this.statusFilter === 'all'
          ? searched
          : searched.filter((item) => {
              const balance = this.getBalance(item);
              return this.statusFilter === 'outstanding' ? balance > 0 : balance === 0;
            });

      const sorted = [...filteredByStatus];
      if (this.sortBy === 'oldest') {
        sorted.sort((a, b) => new Date(a.dateOfDispatch || 0) - new Date(b.dateOfDispatch || 0));
      } else if (this.sortBy === 'balance_desc') {
        sorted.sort((a, b) => this.getBalance(b) - this.getBalance(a));
      } else if (this.sortBy === 'due_soon') {
        sorted.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
      } else {
        sorted.sort((a, b) => new Date(b.dateOfDispatch || 0) - new Date(a.dateOfDispatch || 0));
      }

      return sorted;
    },
    totalCreditPages() {
      return Math.max(1, Math.ceil(this.filteredCreditSales.length / this.pageSize));
    },
    paginatedCreditSales() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredCreditSales.slice(start, start + this.pageSize);
    },
    balanceForSelected() {
      if (!this.selectedCreditSale) return 0;
      return this.getBalance(this.selectedCreditSale);
    }
  },
  watch: {
    pageSize() {
      this.currentPage = 1;
    },
    creditSales() {
      if (this.currentPage > this.totalCreditPages) {
        this.currentPage = this.totalCreditPages;
      }
    },
    searchQuery() {
      this.currentPage = 1;
    },
    statusFilter() {
      this.currentPage = 1;
    },
    sortBy() {
      this.currentPage = 1;
    }
  },
  methods: {
    // Handle load credit sales.
    async loadCreditSales() {
      this.loadingList = true;
      this.loadError = '';
      try {
        const response = await creditSalesAPI.getAll();
        this.creditSales = response.data;
      } catch (error) {
        this.loadError = error.response?.data?.message || 'Failed to load credit sales records.';
      } finally {
        this.loadingList = false;
      }
    },
    goToPage(page) {
      const nextPage = Math.max(1, Math.min(this.totalCreditPages, Number(page || 1)));
      this.currentPage = nextPage;
    },
    handlePageSizeUpdate(size) {
      this.pageSize = Number(size || 20);
    },
    resetFilters() {
      this.searchQuery = '';
      this.statusFilter = 'all';
      this.sortBy = 'newest';
    },
    startRepay(item) {
      this.repayId = item._id;
      this.repayForm = {
        amountUgx: '',
        paidAt: new Date().toISOString().split('T')[0]
      };
      this.repayError = '';
      this.repaySuccess = '';
    },
    cancelRepay() {
      this.repayId = null;
      this.repayForm = {
        amountUgx: '',
        paidAt: new Date().toISOString().split('T')[0]
      };
      this.repayError = '';
      this.repaySuccess = '';
    },
    async handleRepay() {
      if (!this.repayId) return;
      const validation = validateRepaymentAmount(this.repayForm.amountUgx, this.balanceForSelected);
      if (validation.error) {
        this.repayError = validation.error;
        return;
      }
      this.repayLoading = true;
      this.repayError = '';
      this.repaySuccess = '';

      try {
        await creditSalesAPI.repay(this.repayId, {
          amountUgx: validation.amount,
          paidAt: this.repayForm.paidAt
        });
        this.repaySuccess = 'Payment recorded successfully!';
        await this.loadCreditSales();
        const updated = this.creditSales.find((c) => c._id === this.repayId);
        if (!updated || this.getBalance(updated) === 0) {
          this.repayId = null;
        }
        this.repayForm.amountUgx = '';
      } catch (error) {
        this.repayError = error.response?.data?.message || 'Failed to record payment';
      } finally {
        this.repayLoading = false;
      }
    },
    getBalance(item) {
      return getCreditSaleBalance(item);
    },
    formatDate(value) {
      if (!value) return '-';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '-';
      return date.toLocaleDateString();
    },
    formatCurrency(amount) {
      return Number(amount || 0).toLocaleString('en-UG', {
        maximumFractionDigits: 0
      });
    }
  }
};
</script>
