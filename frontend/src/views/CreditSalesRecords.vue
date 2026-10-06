<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Credit Sales Records</h2>
      <p class="page-subtitle">Track amount due, repayment status, and due dates.</p>
    </div>

    <InsightStrip label="Credit records overview" :items="overviewItems" />

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
                <option value="overdue">Overdue</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div class="data-toolbar-field">
              <label class="form-label mb-1" for="credit-sort">Sort By</label>
              <select id="credit-sort" v-model="sortBy" class="form-select form-select-sm">
                <option value="newest">Newest dispatch</option>
                <option value="oldest">Oldest dispatch</option>
                <option value="balance_desc">Highest amount due</option>
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
        <div v-else-if="creditSales.length === 0" class="empty-state">
          No credit sales records match your current filters.
        </div>
        <div v-else class="table-responsive">
          <table class="table align-middle table-sticky table-row-hover responsive-stack-table">
            <thead>
              <tr>
                <th>Buyer</th>
                <th>NIN</th>
                <th>Location</th>
                <th>Contact</th>
                <th class="text-end">Amount Due (UGX)</th>
                <th>Status</th>
                <th>Produce</th>
                <th>Sales Agent</th>
                <th>Due Date</th>
                <th>Dispatch Date</th>
                <th v-if="canRepay" class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in creditSales" :key="item._id" :class="{ 'table-active': repayId === item._id }">
                <td data-label="Buyer">{{ item.buyerName }}</td>
                <td data-label="NIN">{{ item.nationalId || '-' }}</td>
                <td data-label="Location">{{ item.location || '-' }}</td>
                <td data-label="Contact">{{ item.contact || '-' }}</td>
                <td
                  data-label="Amount Due (UGX)"
                  class="text-end fw-semibold"
                  :class="{ 'text-danger': getBalance(item) > 0, 'text-success': getBalance(item) === 0 }"
                >
                  {{ formatCurrency(getBalance(item)) }}
                </td>
                <td data-label="Status">
                  <span
                    class="badge"
                    :class="statusBadgeClass(item)"
                  >
                    {{ statusLabel(item) }}
                  </span>
                </td>
                <td data-label="Produce">{{ item.produceName }} ({{ item.produceType }})</td>
                <td data-label="Sales Agent">{{ item.salesAgentName || '-' }}</td>
                <td data-label="Due Date">{{ formatDate(item.dueDate) }}</td>
                <td data-label="Dispatch Date">{{ formatDate(item.dateOfDispatch) }}</td>
                <td v-if="canRepay" data-label="Actions" class="text-end">
                  <div class="record-row-actions justify-content-end">
                    <button
                      v-if="getBalance(item) > 0"
                      type="button"
                      class="btn btn-sm btn-outline-primary"
                      @click="startRepay(item)"
                    >
                      Repay
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-secondary"
                      @click="startEdit(item)"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      :disabled="hasRepayments(item)"
                      :title="hasRepayments(item) ? 'Cannot delete credit sales with repayments' : ''"
                      @click="openDeleteDialog(item)"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          :current-page="currentPage"
          :total-pages="listTotalPages"
          :total-items="listTotal"
          :page-size="pageSize"
          :page-size-options="pageSizeOptions"
          id-prefix="credit-sales-records"
          @update:currentPage="goToPage"
          @update:pageSize="handlePageSizeUpdate"
        />
      </div>
    </div>

    <div
      v-if="canRepay && repayId"
      class="modal-mask"
      @click.self="cancelRepay"
    >
      <div
        class="modal-card repay-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="credit-sale-repay-title"
      >
        <div class="modal-header">
          <h5 id="credit-sale-repay-title" class="mb-0">Record Repayment</h5>
          <button
            type="button"
            class="btn-close"
            aria-label="Close repayment dialog"
            :disabled="repayLoading"
            @click="cancelRepay"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleRepay">
            <p class="text-muted small mb-3">
              Payments reduce this buyer's outstanding balance immediately.
            </p>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label" for="repay-buyer">Buyer</label>
                <input
                  id="repay-buyer"
                  type="text"
                  class="form-control readonly-display"
                  :value="selectedCreditSale?.buyerName"
                  disabled
                />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="repay-balance">Balance (UGX)</label>
                <input
                  id="repay-balance"
                  type="text"
                  class="form-control readonly-display"
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

            <div class="form-action-bar">
              <div class="form-action-copy">
                <strong>Enter the collected amount and payment date.</strong>
                <span>Save to apply the repayment to the selected credit sale.</span>
              </div>
              <div class="form-action-buttons">
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  :disabled="repayLoading"
                  @click="cancelRepay"
                >
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" :disabled="repayLoading">
                  <span v-if="repayLoading" class="spinner-border spinner-border-sm me-2"></span>
                  Record Payment
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div
      v-if="canRepay && editId"
      class="modal-mask"
      @click.self="cancelEdit"
    >
      <div
        class="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="credit-sale-edit-title"
      >
        <div class="modal-header">
          <h5 id="credit-sale-edit-title" class="mb-0">Edit Credit Sale</h5>
          <button
            type="button"
            class="btn-close"
            aria-label="Close edit credit sale dialog"
            :disabled="editLoading"
            @click="cancelEdit"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleEdit">
            <p class="text-muted small mb-3">
              Buyer and produce details are reference-only. You can edit due date and dispatch date.
            </p>
            <div class="row g-3">
              <div class="col-md-8">
                <label class="form-label" for="edit-credit-produce">Produce</label>
                <input
                  id="edit-credit-produce"
                  :value="`${editForm.produceName || '-'} (${editForm.produceType || '-'})`"
                  type="text"
                  class="form-control readonly-display"
                  disabled
                />
              </div>
              <div class="col-md-4">
                <label class="form-label" for="edit-credit-tonnage">Tonnage (kg)</label>
                <input
                  id="edit-credit-tonnage"
                  :value="Number(editForm.tonnageKg || 0).toLocaleString()"
                  type="text"
                  class="form-control readonly-display"
                  disabled
                />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="edit-credit-buyer">Buyer</label>
                <input
                  id="edit-credit-buyer"
                  :value="editForm.buyerName || '-'"
                  type="text"
                  class="form-control readonly-display"
                  disabled
                />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="edit-credit-agent">Sales Agent</label>
                <input
                  id="edit-credit-agent"
                  :value="editForm.salesAgentName || '-'"
                  type="text"
                  class="form-control readonly-display"
                  disabled
                />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="edit-credit-amount-due">Amount Due (UGX)</label>
                <input
                  id="edit-credit-amount-due"
                  :value="formatCurrency(editForm.amountDueUgx)"
                  type="text"
                  class="form-control readonly-display"
                  disabled
                />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="edit-credit-balance">Balance (UGX)</label>
                <input
                  id="edit-credit-balance"
                  :value="formatCurrency(editForm.balanceUgx)"
                  type="text"
                  class="form-control readonly-display"
                  disabled
                />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="edit-credit-due-date">Due Date *</label>
                <input
                  id="edit-credit-due-date"
                  v-model="editForm.dueDate"
                  type="date"
                  class="form-control"
                  required
                />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="edit-credit-dispatch-date">Dispatch Date *</label>
                <input
                  id="edit-credit-dispatch-date"
                  v-model="editForm.dateOfDispatch"
                  type="date"
                  class="form-control"
                  required
                />
              </div>
            </div>

            <div v-if="editError" class="alert alert-danger mt-3">{{ editError }}</div>
            <div v-if="editSuccess" class="alert alert-success mt-3">{{ editSuccess }}</div>

            <div class="form-action-bar">
              <div class="form-action-copy">
                <strong>Buyer and produce details stay read-only in credit-sale updates.</strong>
                <span>Use this editor to correct due date or dispatch date for the selected record.</span>
              </div>
              <div class="form-action-buttons">
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  :disabled="editLoading"
                  @click="cancelEdit"
                >
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" :disabled="editLoading">
                  <span v-if="editLoading" class="spinner-border spinner-border-sm me-2"></span>
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :show="deleteDialog.show"
      title="Delete Credit Sale"
      :message="`Delete credit sale record for ${deleteDialog.buyerName}? This cannot be undone.`"
      confirm-text="Delete"
      :busy="deleteDialog.processing"
      @cancel="closeDeleteDialog"
      @confirm="confirmDeleteCreditSale"
    />
  </div>
</template>

<script>
/**
 * Credit-sales records page with filtering, editing, repayment capture, and deletion controls.
 * File: frontend/src/views/CreditSalesRecords.vue
 */

import { creditSalesAPI } from '../services/api';
import ConfirmDialog from '../components/common/ConfirmDialog.vue';
import InsightStrip from '../components/common/InsightStrip.vue';
import TablePagination from '../components/common/TablePagination.vue';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';
import { debounce } from '../utils/debounce.js';
import { asListPayload } from '../utils/listPayload.js';
import { getCreditSaleBalance, validateRepaymentAmount } from '../utils/creditSalesValidation.js';
import { formatDisplayDate } from '../utils/dateFormat.js';
import { normalizeLocalPhone } from '../utils/phoneNumber.js';

export default {
  name: 'CreditSalesRecords',
  components: {
    ConfirmDialog,
    InsightStrip,
    TablePagination
  },
  data() {
    return {
      user: {},
      creditSales: [],
      listTotal: 0,
      listTotalPages: 1,
      listSummary: {},
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
      repaySuccess: '',
      editId: null,
      editForm: {
        buyerName: '',
        produceName: '',
        produceType: '',
        tonnageKg: '',
        amountDueUgx: '',
        balanceUgx: '',
        salesAgentName: '',
        dueDate: '',
        dateOfDispatch: ''
      },
      editLoading: false,
      editError: '',
      editSuccess: '',
      deleteDialog: {
        show: false,
        creditSaleId: '',
        buyerName: '',
        processing: false
      }
    };
  },
  created() {
    this.scheduleCreditReload = debounce(() => {
      if (this.currentPage !== 1) {
        this.currentPage = 1;
        return;
      }
      this.loadCreditSales();
    }, 300);
    const authStore = useAuthStore(pinia);
    this.user = authStore.user || {};
    this.loadCreditSales();
  },
  computed: {
    // Repayment/edit actions are restricted to managers.
    canRepay() {
      return this.user.role === 'manager';
    },
    selectedCreditSale() {
      return this.creditSales.find((c) => c._id === this.repayId);
    },
    totalCreditPages() {
      return this.listTotalPages;
    },
    balanceForSelected() {
      if (!this.selectedCreditSale) return 0;
      return this.getBalance(this.selectedCreditSale);
    },
    outstandingCount() {
      return Number(this.listSummary.outstandingCount ?? this.creditSales.filter((item) => this.getBalance(item) > 0).length);
    },
    paidCount() {
      return Number(this.listSummary.paidCount ?? this.creditSales.filter((item) => this.getBalance(item) === 0).length);
    },
    outstandingBalance() {
      return Number(
        this.listSummary.outstandingBalance ??
          this.creditSales.reduce((sum, item) => sum + this.getBalance(item), 0)
      );
    },
    activeFilterCount() {
      let count = 0;
      if (this.searchQuery) count += 1;
      if (this.statusFilter !== 'all') count += 1;
      if (this.sortBy !== 'newest') count += 1;
      return count;
    },
    overviewItems() {
      const modeMeta = this.canRepay ? 'Manager credit workspace' : 'Sales agent credit workspace';
      const visibleMeta = this.activeFilterCount
        ? `${this.activeFilterCount} filter(s) applied`
        : 'No filters applied';

      return [
        {
          label: 'Branch',
          value: this.user.branch || 'Unassigned',
          meta: modeMeta
        },
        {
          label: 'Credit Records',
          value: this.listTotal.toLocaleString('en-UG'),
          meta: `${this.creditSales.length.toLocaleString('en-UG')} on this page`
        },
        {
          label: 'Outstanding',
          value: this.outstandingCount.toLocaleString('en-UG'),
          meta: `Paid: ${this.paidCount.toLocaleString('en-UG')}`
        },
        {
          label: 'Open Balance',
          value: this.formatOverviewBalance(this.outstandingBalance),
          meta: visibleMeta
        }
      ];
    }
  },
  watch: {
    currentPage() {
      this.loadCreditSales();
    },
    pageSize() {
      if (this.currentPage !== 1) {
        this.currentPage = 1;
        return;
      }
      this.loadCreditSales();
    },
    searchQuery() {
      this.scheduleCreditReload();
    },
    statusFilter() {
      this.scheduleCreditReload();
    },
    sortBy() {
      this.scheduleCreditReload();
    }
  },
  methods: {
    // Load credit sales list for current branch context.
    async loadCreditSales() {
      this.loadingList = true;
      this.loadError = '';
      try {
        const response = await creditSalesAPI.getAll({
          page: this.currentPage,
          limit: this.pageSize,
          search: this.searchQuery,
          status: this.statusFilter,
          sort: this.sortBy
        });
        const payload = asListPayload(response.data);
        this.creditSales = payload.items.map((item) => ({
          ...item,
          contact: normalizeLocalPhone(item.contact) || item.contact
        }));
        this.listTotal = payload.total;
        this.listTotalPages = payload.totalPages;
        this.listSummary = payload.summary || {};
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
    hasRepayments(item) {
      return Array.isArray(item?.payments) && item.payments.length > 0;
    },
    toDateInput(value) {
      if (!value) return '';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return '';
      return date.toISOString().slice(0, 10);
    },
    startEdit(item) {
      if (this.repayLoading) return;
      this.cancelRepay();
      this.editId = item._id;
      this.editForm = {
        buyerName: item.buyerName || '',
        produceName: item.produceName || '',
        produceType: item.produceType || '',
        tonnageKg: item.tonnageKg || '',
        amountDueUgx: item.amountDueUgx || '',
        balanceUgx: this.getBalance(item),
        salesAgentName: item.salesAgentName || '',
        dueDate: this.toDateInput(item.dueDate),
        dateOfDispatch: this.toDateInput(item.dateOfDispatch)
      };
      this.editError = '';
      this.editSuccess = '';
    },
    cancelEdit() {
      if (this.editLoading) return;
      this.editId = null;
      this.editForm = {
        buyerName: '',
        produceName: '',
        produceType: '',
        tonnageKg: '',
        amountDueUgx: '',
        balanceUgx: '',
        salesAgentName: '',
        dueDate: '',
        dateOfDispatch: ''
      };
      this.editError = '';
      this.editSuccess = '';
    },
    async handleEdit() {
      if (!this.editId) return;
      this.editLoading = true;
      this.editError = '';
      this.editSuccess = '';
      try {
        await creditSalesAPI.update(this.editId, {
          dueDate: this.editForm.dueDate,
          dateOfDispatch: this.editForm.dateOfDispatch
        });
        this.editSuccess = 'Credit sale updated successfully!';
        await this.loadCreditSales();
      } catch (error) {
        this.editError = error.response?.data?.message || 'Failed to update credit sale record.';
      } finally {
        this.editLoading = false;
      }
    },
    openDeleteDialog(item) {
      this.deleteDialog = {
        show: true,
        creditSaleId: item._id,
        buyerName: item.buyerName || 'selected buyer',
        processing: false
      };
    },
    closeDeleteDialog() {
      if (this.deleteDialog.processing) return;
      this.deleteDialog.show = false;
    },
    async confirmDeleteCreditSale() {
      if (!this.deleteDialog.creditSaleId) return;
      this.deleteDialog.processing = true;
      try {
        await creditSalesAPI.delete(this.deleteDialog.creditSaleId);
        // Clear any active edit/repayment UI state that points to the deleted record.
        if (this.editId === this.deleteDialog.creditSaleId) {
          this.cancelEdit();
        }
        if (this.repayId === this.deleteDialog.creditSaleId) {
          this.cancelRepay();
        }
        this.deleteDialog.show = false;
        await this.loadCreditSales();
      } catch (error) {
        this.loadError = error.response?.data?.message || 'Failed to delete credit sale record.';
      } finally {
        this.deleteDialog.processing = false;
      }
    },
    startRepay(item) {
      if (this.editLoading) return;
      this.cancelEdit();
      this.repayId = item._id;
      this.repayForm = {
        amountUgx: '',
        paidAt: new Date().toISOString().split('T')[0]
      };
      this.repayError = '';
      this.repaySuccess = '';
    },
    cancelRepay() {
      if (this.repayLoading) return;
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
      // Validate payment amount client-side before submitting to avoid unnecessary API round-trips.
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
    isOverdue(item) {
      if (!item || this.getBalance(item) <= 0) return false;
      const due = new Date(item.dueDate);
      if (Number.isNaN(due.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return due < today;
    },
    statusLabel(item) {
      if (this.getBalance(item) === 0) return 'Paid';
      return this.isOverdue(item) ? 'Overdue' : 'Outstanding';
    },
    statusBadgeClass(item) {
      if (this.getBalance(item) === 0) return 'bg-success';
      return this.isOverdue(item) ? 'bg-danger' : 'bg-warning text-dark';
    },
    formatDate(value) {
      return formatDisplayDate(value);
    },
    formatCurrency(amount) {
      return Number(amount || 0).toLocaleString('en-UG', {
        maximumFractionDigits: 0
      });
    },
    formatOverviewBalance(amount) {
      const numericAmount = Number(amount || 0);
      const absoluteAmount = Math.abs(numericAmount);
      const sign = numericAmount < 0 ? '-' : '';
      const compactValue = (value, divisor, suffix) => {
        const formatted = (value / divisor)
          .toFixed(2)
          .replace(/\.00$/, '')
          .replace(/(\.\d)0$/, '$1');

        return `UGX ${sign}${formatted}${suffix}`;
      };

      if (absoluteAmount >= 1_000_000_000) {
        return compactValue(absoluteAmount, 1_000_000_000, 'B');
      }

      if (absoluteAmount >= 1_000_000) {
        return compactValue(absoluteAmount, 1_000_000, 'M');
      }

      return `UGX ${this.formatCurrency(numericAmount)}`;
    }
  }
};
</script>

<style scoped>
.repay-modal {
  max-width: 640px;
}
</style>

