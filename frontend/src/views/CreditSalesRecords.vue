<template>
  <div>
    <h2 class="mb-4">Credit Sales Records</h2>

    <div v-if="repayId" class="card mb-4">
      <div class="card-header">
        <h5 class="mb-0">Record Repayment</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleRepay">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Buyer</label>
              <input type="text" class="form-control" :value="selectedCreditSale?.buyerName" disabled />
            </div>
            <div class="col-md-6">
              <label class="form-label">Balance (UGX)</label>
              <input type="text" class="form-control" :value="formatCurrency(balanceForSelected)" disabled />
            </div>
            <div class="col-md-6">
              <label class="form-label">Amount Paid (UGX) *</label>
              <input type="number" class="form-control" v-model="repayForm.amountUgx" min="1" required />
            </div>
            <div class="col-md-6">
              <label class="form-label">Payment Date</label>
              <input type="date" class="form-control" v-model="repayForm.paidAt" />
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
        <button class="btn btn-outline-primary btn-sm" @click="loadCreditSales" :disabled="loadingList">
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
                <th>Produce</th>
                <th class="text-end">Amount Due</th>
                <th class="text-end">Paid</th>
                <th class="text-end">Balance</th>
                <th>Due Date</th>
                <th>Status</th>
                <th v-if="canRepay" class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in creditSales" :key="item._id">
                <td>{{ item.buyerName }}</td>
                <td>{{ item.produceName }} ({{ item.produceType }})</td>
                <td class="text-end">{{ formatCurrency(item.amountDueUgx) }}</td>
                <td class="text-end">{{ formatCurrency(item.amountPaidUgx || 0) }}</td>
                <td class="text-end">{{ formatCurrency(getBalance(item)) }}</td>
                <td>{{ formatDate(item.dueDate) }}</td>
                <td>
                  <span v-if="getBalance(item) === 0" class="badge bg-success">Paid</span>
                  <span v-else class="badge bg-warning text-dark">Pending</span>
                </td>
                <td v-if="canRepay" class="text-end">
                  <button
                    class="btn btn-sm btn-outline-primary"
                    :disabled="getBalance(item) === 0"
                    @click="startRepay(item)"
                  >
                    Record Payment
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { creditSalesAPI } from '../services/api'

export default {
  name: 'CreditSalesRecords',
  data() {
    return {
      user: {},
      creditSales: [],
      loadingList: false,
      repayId: null,
      repayForm: {
        amountUgx: '',
        paidAt: new Date().toISOString().split('T')[0]
      },
      repayLoading: false,
      repayError: '',
      repaySuccess: ''
    }
  },
  async created() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}')
    await this.loadCreditSales()
  },
  computed: {
    canRepay() {
      return this.user.role === 'manager'
    },
    selectedCreditSale() {
      return this.creditSales.find(c => c._id === this.repayId)
    },
    balanceForSelected() {
      if (!this.selectedCreditSale) return 0
      return this.getBalance(this.selectedCreditSale)
    }
  },
  methods: {
    async loadCreditSales() {
      this.loadingList = true
      try {
        const response = await creditSalesAPI.getAll()
        this.creditSales = response.data
      } catch (error) {
        console.error('Error loading credit sales:', error)
      } finally {
        this.loadingList = false
      }
    },
    startRepay(item) {
      this.repayId = item._id
      this.repayForm = {
        amountUgx: '',
        paidAt: new Date().toISOString().split('T')[0]
      }
      this.repayError = ''
      this.repaySuccess = ''
    },
    cancelRepay() {
      this.repayId = null
      this.repayForm = {
        amountUgx: '',
        paidAt: new Date().toISOString().split('T')[0]
      }
      this.repayError = ''
      this.repaySuccess = ''
    },
    async handleRepay() {
      if (!this.repayId) return
      this.repayLoading = true
      this.repayError = ''
      this.repaySuccess = ''

      try {
        await creditSalesAPI.repay(this.repayId, {
          amountUgx: this.repayForm.amountUgx,
          paidAt: this.repayForm.paidAt
        })
        this.repaySuccess = 'Payment recorded successfully!'
        await this.loadCreditSales()
        const updated = this.creditSales.find(c => c._id === this.repayId)
        if (!updated || this.getBalance(updated) === 0) {
          this.repayId = null
        }
        this.repayForm.amountUgx = ''
      } catch (error) {
        this.repayError = error.response?.data?.message || 'Failed to record payment'
      } finally {
        this.repayLoading = false
      }
    },
    getBalance(item) {
      if (item.balanceUgx !== undefined && item.balanceUgx !== null) {
        return item.balanceUgx
      }
      return Math.max((item.amountDueUgx || 0) - (item.amountPaidUgx || 0), 0)
    },
    formatDate(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '-'
      return date.toLocaleDateString()
    },
    formatCurrency(amount) {
      return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0
      }).format(amount || 0)
    }
  }
}
</script>
