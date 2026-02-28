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
        <div v-if="creditSales.length === 0" class="text-center py-5 text-muted">
          No credit sales records found.
        </div>
        <div v-else class="table-responsive">
          <table class="table align-middle">
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
              <tr
                v-for="item in paginatedCreditSales"
                :key="item._id"
                :class="{ 'table-active': repayId === item._id }"
              >
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
        <div
          v-if="creditSales.length > 0"
          class="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3"
        >
          <small class="text-muted">
            Showing {{ creditRowsStart }}-{{ creditRowsEnd }} of
            {{ creditSales.length.toLocaleString('en-UG') }} records
          </small>
          <div class="d-flex align-items-center gap-2">
            <label class="small text-muted mb-0" for="credit-page-size">Rows</label>
            <select id="credit-page-size" class="form-select form-select-sm" v-model.number="pageSize">
              <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
            </select>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              :disabled="currentPage <= 1"
              @click="goToPage(currentPage - 1)"
            >
              Prev
            </button>
            <span class="small text-muted">Page {{ currentPage }} / {{ totalCreditPages }}</span>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              :disabled="currentPage >= totalCreditPages"
              @click="goToPage(currentPage + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { creditSalesAPI } from '../services/api';
import { getCreditSaleBalance, validateRepaymentAmount } from '../utils/creditSalesValidation.mjs';

export default {
  name: 'CreditSalesRecords',
  data() {
    return {
      user: {},
      creditSales: [],
      loadingList: false,
      currentPage: 1,
      pageSize: 20,
      pageSizeOptions: [10, 20, 50, 100],
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
    totalCreditPages() {
      return Math.max(1, Math.ceil(this.creditSales.length / this.pageSize));
    },
    paginatedCreditSales() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.creditSales.slice(start, start + this.pageSize);
    },
    creditRowsStart() {
      if (this.creditSales.length === 0) return 0;
      return (this.currentPage - 1) * this.pageSize + 1;
    },
    creditRowsEnd() {
      return Math.min(this.currentPage * this.pageSize, this.creditSales.length);
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
    }
  },
  methods: {
    // Handle load credit sales.
    async loadCreditSales() {
      this.loadingList = true;
      try {
        const response = await creditSalesAPI.getAll();
        this.creditSales = response.data;
      } catch (error) {
        console.error('Error loading credit sales:', error);
      } finally {
        this.loadingList = false;
      }
    },
    goToPage(page) {
      const nextPage = Math.max(1, Math.min(this.totalCreditPages, Number(page || 1)));
      this.currentPage = nextPage;
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
