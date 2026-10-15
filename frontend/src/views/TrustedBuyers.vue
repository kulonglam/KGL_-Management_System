<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Trusted Buyers</h2>
      <p class="page-subtitle">Manage approved buyers for credit sales at your branch.</p>
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
        @click="loadBuyers"
      >
        Retry
      </button>
    </div>

    <div v-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>
    <div v-if="success" class="alert alert-success" role="status">
      {{ success }}
    </div>

    <InsightStrip label="Trusted buyer overview" :items="overviewItems" />

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Trusted Buyers List</h5>
        <div class="d-flex flex-wrap align-items-center gap-2">
          <label class="form-check mb-0 small">
            <input v-model="showRemoved" class="form-check-input" type="checkbox" />
            Show removed
          </label>
          <RecordExportActions title="Trusted buyers" filename="trusted_buyers" :columns="exportColumns" :rows="buyers" />
          <button class="btn btn-primary btn-sm" @click="toggleForm">
            {{ showForm ? 'Close' : 'Add Buyer' }}
          </button>
          <button
            class="btn btn-outline-primary btn-sm"
            @click="loadBuyers"
            :disabled="loadingList"
          >
            <span v-if="loadingList" class="spinner-border spinner-border-sm me-2"></span>
            Refresh
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="data-toolbar">
          <div class="data-toolbar-group">
            <div class="data-toolbar-field">
              <label class="form-label mb-1" for="buyers-search">Search</label>
              <input
                id="buyers-search"
                v-model.trim="searchQuery"
                type="text"
                class="form-control form-control-sm"
                placeholder="Name, NIN, location, contact..."
              />
            </div>
            <div class="data-toolbar-field">
              <label class="form-label mb-1" for="buyers-sort">Sort By</label>
              <select id="buyers-sort" v-model="sortBy" class="form-select form-select-sm">
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="recent">Recently added</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            :disabled="!searchQuery && sortBy === 'name_asc'"
            @click="resetTableFilters"
          >
            Reset Filters
          </button>
        </div>

        <div v-if="loadingList" class="text-center py-5 text-muted">Loading trusted buyers...</div>
        <div v-else-if="buyers.length === 0" class="empty-state">
          No trusted buyers found for this branch.
        </div>
        <div v-else class="table-responsive">
          <table class="table align-middle table-sticky table-row-hover responsive-stack-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>National ID</th>
                <th>Location</th>
                <th>Contact</th>
                <th>Branch</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in buyers" :key="item._id">
                <td data-label="Name">{{ item.name }}</td>
                <td data-label="National ID">{{ item.nationalId }}</td>
                <td data-label="Location">{{ item.location }}</td>
                <td data-label="Contact">{{ item.contact }}</td>
                <td data-label="Branch">{{ item.branch }}</td>
                <td data-label="Actions" class="text-end">
                  <div class="record-row-actions justify-content-end">
                    <button v-if="!showRemoved" class="btn btn-sm btn-outline-primary" @click="startEdit(item)">
                      Edit
                    </button>
                    <button v-if="showRemoved" class="btn btn-sm btn-outline-success" @click="restoreBuyer(item)">
                      Restore
                    </button>
                    <button v-else class="btn btn-sm btn-outline-danger" @click="openDeleteDialog(item)">
                      Remove
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
          id-prefix="trusted-buyers-table"
          @update:currentPage="goToPage"
          @update:pageSize="handlePageSizeUpdate"
        />
      </div>
    </div>

    <div v-if="showForm" class="modal-mask" @click.self="toggleForm">
      <div class="modal-card buyer-editor-modal" role="dialog" aria-modal="true" aria-labelledby="trusted-buyer-title" v-focus-trap="toggleForm">
        <div class="modal-header">
          <h5 id="trusted-buyer-title" class="mb-0">{{ editingId ? 'Update Buyer' : 'Add Trusted Buyer' }}</h5>
          <button
            type="button"
            class="btn-close"
            aria-label="Close trusted buyer form"
            :disabled="loading"
            @click="toggleForm"
          ></button>
        </div>
        <div class="modal-body">
          <p class="text-muted small mb-3">
            Use trusted buyers for approved credit-sale customers within your branch.
          </p>
        <form @submit.prevent="handleSubmit">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label" for="trusted-buyer-name">Buyer Name</label>
              <input
                id="trusted-buyer-name"
                type="text"
                :class="['form-control', { 'is-invalid': fieldErrors.name }]"
                v-model="form.name"
                minlength="2"
                pattern="^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$"
                title="Use letters/numbers. Spaces between words are allowed."
                @input="clearFieldError('name')"
                required
              />
              <div v-if="fieldErrors.name" class="invalid-feedback">{{ fieldErrors.name }}</div>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="trusted-buyer-nin">National ID (NIN)</label>
              <input
                id="trusted-buyer-nin"
                type="text"
                :class="['form-control', { 'is-invalid': fieldErrors.nationalId }]"
                v-model="form.nationalId"
                data-validation-label="National ID"
                pattern="(CM|CF)[0-9]{12}"
                maxlength="14"
                placeholder="CM123456789012"
                @input="clearFieldError('nationalId')"
                required
                :disabled="editingId"
              />
              <div v-if="fieldErrors.nationalId" class="invalid-feedback">
                {{ fieldErrors.nationalId }}
              </div>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="trusted-buyer-location">Location</label>
              <input
                id="trusted-buyer-location"
                type="text"
                :class="['form-control', { 'is-invalid': fieldErrors.location }]"
                v-model="form.location"
                minlength="2"
                pattern="^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$"
                title="Use letters/numbers. Spaces between words are allowed."
                @input="clearFieldError('location')"
                required
              />
              <div v-if="fieldErrors.location" class="invalid-feedback">{{ fieldErrors.location }}</div>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="trusted-buyer-contact">Contact</label>
              <input
                id="trusted-buyer-contact"
                type="tel"
                :class="['form-control', { 'is-invalid': fieldErrors.contact }]"
                v-model="form.contact"
                inputmode="tel"
                autocomplete="tel"
                maxlength="10"
                pattern="^07[0-9]{8}$"
                placeholder="0700000000"
                @input="sanitizeContactField"
                required
              />
              <div v-if="fieldErrors.contact" class="invalid-feedback">{{ fieldErrors.contact }}</div>
              <small class="field-note">Use the 07XXXXXXXX format only.</small>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="trusted-buyer-email">Email (optional)</label>
              <input
                id="trusted-buyer-email"
                type="email"
                :class="['form-control', { 'is-invalid': fieldErrors.email }]"
                v-model.trim="form.email"
                autocomplete="email"
                maxlength="254"
                placeholder="buyer@example.com"
                @input="clearFieldError('email')"
              />
              <div v-if="fieldErrors.email" class="invalid-feedback">{{ fieldErrors.email }}</div>
              <small class="field-note">Used to email customer statements.</small>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="trusted-buyer-branch">Branch</label>
              <input
                id="trusted-buyer-branch"
                type="text"
                class="form-control readonly-display"
                :value="user.branch"
                disabled
              />
            </div>
            <div class="col-md-6">
              <label class="form-label" for="trusted-buyer-credit-limit">Credit limit (UGX)</label>
              <input
                id="trusted-buyer-credit-limit"
                type="number"
                min="0"
                step="1"
                class="form-control"
                v-model="form.creditLimitUgx"
                placeholder="Leave blank for one-open-credit rule"
              />
              <small class="field-note">
                Set a limit to allow multiple open credits up to that amount. Blank keeps the legacy
                one-open-credit rule.
              </small>
            </div>
          </div>

          <div class="form-action-bar">
            <div class="form-action-copy">
              <strong>Trusted buyers define who can receive produce on credit.</strong>
              <span>Add a new approved buyer or update the selected buyer's saved details.</span>
            </div>
            <div class="form-action-buttons">
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="loading"
                @click="toggleForm"
              >
                Cancel
              </button>
              <button type="submit" class="btn btn-success" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ editingId ? 'Update Buyer' : 'Add Buyer' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
    </div>

    <ConfirmDialog
      :show="deleteDialog.show"
      title="Remove Trusted Buyer"
      :message="`Remove trusted buyer ${deleteDialog.buyerName}? You can restore this buyer later.`"
      confirm-text="Remove"
      :busy="deleteDialog.processing"
      @cancel="closeDeleteDialog"
      @confirm="confirmDeleteBuyer"
    />
  </div>
</template>

<script>
// Trusted-buyer administration page used to manage approved credit-sale customers.
 import { trustedBuyersAPI } from '../services/api';
import ConfirmDialog from '../components/common/ConfirmDialog.vue';
import RecordExportActions from '../components/common/RecordExportActions.vue';
import InsightStrip from '../components/common/InsightStrip.vue';
import TablePagination from '../components/common/TablePagination.vue';
import { trustedBuyerValidationSchema } from '../utils/formSchemas.js';
import { validateValues } from '../utils/formValidation.js';
import { debounce } from '../utils/debounce.js';
import { asListPayload } from '../utils/listPayload.js';
import { normalizeLocalPhone } from '../utils/phoneNumber.js';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  name: 'TrustedBuyers',
  components: {
    ConfirmDialog,
    InsightStrip,
    RecordExportActions,
    TablePagination
  },
  data() {
    return {
      user: {},
      buyers: [],
      listTotal: 0,
      listTotalPages: 1,
      listSummary: {},
      loadingList: false,
      loadError: '',
      searchQuery: '',
      sortBy: 'name_asc',
      showRemoved: false,
      currentPage: 1,
      pageSize: 20,
      pageSizeOptions: [10, 20, 50, 100],
      showForm: false,
      editingId: null,
      form: {
        name: '',
        nationalId: '',
        location: '',
        contact: '',
        email: '',
        creditLimitUgx: ''
      },
      loading: false,
      error: '',
      success: '',
      fieldErrors: {},
      deleteDialog: {
        show: false,
        buyerId: '',
        buyerName: '',
        processing: false
      }
    };
  },
  computed: {
    uniqueLocations() {
      return Number(
        this.listSummary.uniqueLocations ?? new Set(this.buyers.map((item) => item.location).filter(Boolean)).size
      );
    },
    exportColumns() {
      return [
        { label: 'Name', value: (row) => row.name },
        { label: 'National ID', value: (row) => row.nationalId },
        { label: 'Location', value: (row) => row.location },
        { label: 'Contact', value: (row) => row.contact },
        { label: 'Branch', value: (row) => row.branch }
      ];
    },
    overviewItems() {
      const visibleMeta = this.searchQuery ? 'Matching the current filters' : 'No filters applied';

      return [
        {
          label: 'Branch',
          value: this.user.branch || 'Unassigned',
          meta: 'Approved credit-buyer registry'
        },
        {
          label: 'Approved Buyers',
          value: this.listTotal.toLocaleString('en-UG'),
          meta: visibleMeta
        },
        {
          label: 'Locations',
          value: this.uniqueLocations.toLocaleString('en-UG'),
          meta: 'Distinct buyer locations on file'
        },
        {
          label: 'Sort Mode',
          value:
            this.sortBy === 'recent'
              ? 'Recently added'
              : this.sortBy === 'name_desc'
                ? 'Name Z-A'
                : 'Name A-Z',
          meta: this.searchQuery ? 'Search filter active' : 'Full registry view'
        }
      ];
    }
  },
  watch: {
    currentPage() {
      this.loadBuyers();
    },
    pageSize() {
      if (this.currentPage !== 1) {
        this.currentPage = 1;
        return;
      }
      this.loadBuyers();
    },
    searchQuery() {
      this.scheduleBuyerReload();
    },
    sortBy() {
      this.scheduleBuyerReload();
    },
    showRemoved() {
      this.scheduleBuyerReload();
    }
  },
  created() {
    this.scheduleBuyerReload = debounce(() => {
      if (this.currentPage !== 1) {
        this.currentPage = 1;
        return;
      }
      this.loadBuyers();
    }, 300);
    const authStore = useAuthStore(pinia);
    this.user = authStore.user || {};
    this.loadBuyers();
  },
  methods: {
    // Load trusted buyers available for this manager branch.
    async loadBuyers() {
      this.loadingList = true;
      this.loadError = '';
      try {
        const response = await trustedBuyersAPI.getAll({
          page: this.currentPage,
          limit: this.pageSize,
          search: this.searchQuery,
          sort: this.sortBy,
          deleted: this.showRemoved ? 'true' : undefined
        });
        const payload = asListPayload(response.data);
        this.buyers = payload.items.map((item) => ({
          ...item,
          contact: normalizeLocalPhone(item.contact) || item.contact
        }));
        this.listTotal = payload.total;
        this.listTotalPages = payload.totalPages;
        this.listSummary = payload.summary || {};
      } catch (error) {
        this.loadError = error.response?.data?.message || 'Failed to load trusted buyers.';
      } finally {
        this.loadingList = false;
      }
    },
    resetTableFilters() {
      this.searchQuery = '';
      this.sortBy = 'name_asc';
      this.currentPage = 1;
    },
    goToPage(page) {
      const nextPage = Math.max(1, Math.min(this.listTotalPages, Number(page || 1)));
      this.currentPage = nextPage;
    },
    handlePageSizeUpdate(size) {
      this.pageSize = Number(size || 20);
    },
    async handleSubmit() {
      this.error = '';
      this.success = '';
      this.fieldErrors = {};

      // Normalize and uppercase fields before schema validation and API submission.
      const limitRaw = String(this.form.creditLimitUgx ?? '').trim();
      const payload = {
        name: this.normalizeText(this.form.name),
        nationalId: String(this.form.nationalId || '')
          .trim()
          .toUpperCase(),
        location: this.normalizeText(this.form.location),
        contact: normalizeLocalPhone(this.form.contact),
        email: String(this.form.email || '').trim().toLowerCase(),
        creditLimitUgx: limitRaw === '' ? null : Number(limitRaw)
      };

      this.form.contact = payload.contact;

      const validation = validateValues(payload, trustedBuyerValidationSchema);
      const errors = validation.valid ? {} : { ...validation.errors };
      if (payload.email && !EMAIL_PATTERN.test(payload.email)) {
        errors.email = 'Enter a valid email address or leave it blank.';
      }
      if (Object.keys(errors).length > 0) {
        this.fieldErrors = errors;
        this.error = 'Please fix highlighted fields and try again.';
        return;
      }

      this.loading = true;

      try {
        if (this.editingId) {
          await trustedBuyersAPI.update(this.editingId, payload);
          this.success = 'Trusted buyer updated successfully!';
        } else {
          await trustedBuyersAPI.create(payload);
          this.success = 'Trusted buyer added successfully!';
        }

        this.resetForm();
        await this.loadBuyers();
      } catch (error) {
        this.error =
          error.response?.data?.message ||
          (this.editingId ? 'Failed to update trusted buyer' : 'Failed to add trusted buyer');
      } finally {
        this.loading = false;
      }
    },
    startEdit(item) {
      this.editingId = item._id;
      this.showForm = true;
      this.form = {
        name: item.name,
        nationalId: item.nationalId,
        location: item.location,
        contact: normalizeLocalPhone(item.contact) || item.contact,
        email: item.email || '',
        creditLimitUgx:
          item.creditLimitUgx === null || item.creditLimitUgx === undefined
            ? ''
            : String(item.creditLimitUgx)
      };
      this.fieldErrors = {};
      this.error = '';
      this.success = '';
    },
    openDeleteDialog(item) {
      this.deleteDialog = {
        show: true,
        buyerId: item._id,
        buyerName: item.name,
        processing: false
      };
    },
    closeDeleteDialog() {
      if (this.deleteDialog.processing) return;
      this.deleteDialog.show = false;
    },
    async restoreBuyer(item) {
      this.loadError = '';
      try {
        await trustedBuyersAPI.restore(item._id);
        await this.loadBuyers();
      } catch (error) {
        this.loadError = error.response?.data?.message || 'Failed to restore the buyer.';
      }
    },
    async confirmDeleteBuyer() {
      if (!this.deleteDialog.buyerId) return;
      this.deleteDialog.processing = true;
      try {
        await trustedBuyersAPI.delete(this.deleteDialog.buyerId);
        if (this.editingId === this.deleteDialog.buyerId) {
          this.resetForm();
        }
        await this.loadBuyers();
        this.success = 'Trusted buyer deleted successfully!';
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete trusted buyer';
      } finally {
        this.deleteDialog.processing = false;
        this.deleteDialog.show = false;
      }
    },
    resetForm() {
      this.editingId = null;
      this.showForm = false;
      this.fieldErrors = {};
      this.form = {
        name: '',
        nationalId: '',
        location: '',
        contact: '',
        email: '',
        creditLimitUgx: ''
      };
    },
    toggleForm() {
      if (this.loading) return;
      if (this.showForm && this.editingId) {
        this.resetForm();
      } else {
        this.showForm = !this.showForm;
      }
      this.fieldErrors = {};
      this.error = '';
      this.success = '';
    },
    normalizeText(value) {
      return String(value || '')
        .trim()
        .replace(/\s+/g, ' ');
    },
    sanitizeContactField() {
      this.form.contact = normalizeLocalPhone(this.form.contact);
      this.clearFieldError('contact');
    },
    clearFieldError(fieldName) {
      if (this.fieldErrors[fieldName]) {
        delete this.fieldErrors[fieldName];
      }
    }
  }
};
</script>

<style scoped>
.buyer-editor-modal {
  max-width: 760px;
}
</style>
