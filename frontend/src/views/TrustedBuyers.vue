<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Trusted Buyers</h2>
      <p class="page-subtitle">Manage approved buyers for credit sales at your branch.</p>
    </div>

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Trusted Buyers List</h5>
        <div class="d-flex gap-2">
          <button class="btn btn-primary btn-sm" @click="toggleForm">
            {{ showForm ? (editingId ? 'Close Edit' : 'Hide Form') : 'Add Buyer' }}
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
        <div v-if="buyers.length === 0" class="text-center py-5 text-muted">
          No trusted buyers found for this branch.
        </div>
        <div v-else class="table-responsive">
          <table class="table align-middle">
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
                <td>{{ item.name }}</td>
                <td>{{ item.nationalId }}</td>
                <td>{{ item.location }}</td>
                <td>{{ item.contact }}</td>
                <td>{{ item.branch }}</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-2" @click="startEdit(item)">
                    Edit
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="openDeleteDialog(item)">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="card mt-4">
      <div class="card-header">
        <h5 class="mb-0">{{ editingId ? 'Update Buyer' : 'Add Trusted Buyer' }}</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label" for="trusted-buyer-name">Buyer Name *</label>
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
              <label class="form-label" for="trusted-buyer-nin">National ID (NIN) *</label>
              <input
                id="trusted-buyer-nin"
                type="text"
                :class="['form-control', { 'is-invalid': fieldErrors.nationalId }]"
                v-model="form.nationalId"
                pattern="[A-Z0-9]{14}"
                maxlength="14"
                placeholder="14 alphanumeric characters"
                @input="clearFieldError('nationalId')"
                required
                :disabled="editingId"
              />
              <div v-if="fieldErrors.nationalId" class="invalid-feedback">
                {{ fieldErrors.nationalId }}
              </div>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="trusted-buyer-location">Location *</label>
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
              <label class="form-label" for="trusted-buyer-contact">Contact *</label>
              <input
                id="trusted-buyer-contact"
                type="text"
                :class="['form-control', { 'is-invalid': fieldErrors.contact }]"
                v-model="form.contact"
                pattern="^(\\+256|0)[0-9]{9}$"
                placeholder="+256700000000"
                @input="clearFieldError('contact')"
                required
              />
              <div v-if="fieldErrors.contact" class="invalid-feedback">{{ fieldErrors.contact }}</div>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="trusted-buyer-branch">Branch</label>
              <input id="trusted-buyer-branch" type="text" class="form-control" :value="user.branch" disabled />
            </div>
          </div>

          <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
          <div v-if="success" class="alert alert-success mt-3">{{ success }}</div>

          <div class="mt-4">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ editingId ? 'Update Buyer' : 'Add Buyer' }}
            </button>
            <button
              v-if="editingId"
              type="button"
              class="btn btn-outline-secondary ms-2"
              @click="cancelEdit"
            >
              Cancel Edit
            </button>
          </div>
        </form>
      </div>
    </div>

    <ConfirmDialog
      :show="deleteDialog.show"
      title="Delete Trusted Buyer"
      :message="`Delete trusted buyer ${deleteDialog.buyerName}? This action cannot be undone.`"
      confirm-text="Delete"
      :busy="deleteDialog.processing"
      @cancel="closeDeleteDialog"
      @confirm="confirmDeleteBuyer"
    />
  </div>
</template>

<script>
import { trustedBuyersAPI } from '../services/api';
import ConfirmDialog from '../components/common/ConfirmDialog.vue';
import { trustedBuyerValidationSchema } from '../utils/formSchemas.mjs';
import { validateValues } from '../utils/formValidation.mjs';

export default {
  name: 'TrustedBuyers',
  components: {
    ConfirmDialog
  },
  data() {
    return {
      user: {},
      buyers: [],
      loadingList: false,
      showForm: false,
      editingId: null,
      form: {
        name: '',
        nationalId: '',
        location: '',
        contact: ''
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
  async created() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    await this.loadBuyers();
  },
  methods: {
    // Handle load buyers.
    async loadBuyers() {
      this.loadingList = true;
      try {
        const response = await trustedBuyersAPI.getAll();
        this.buyers = response.data;
      } catch (error) {
        console.error('Failed to load trusted buyers:', error);
      } finally {
        this.loadingList = false;
      }
    },
    async handleSubmit() {
      this.error = '';
      this.success = '';
      this.fieldErrors = {};

      // Configure payload.
      const payload = {
        name: this.normalizeText(this.form.name),
        nationalId: String(this.form.nationalId || '')
          .trim()
          .toUpperCase(),
        location: this.normalizeText(this.form.location),
        contact: this.normalizeText(this.form.contact)
      };

      const validation = validateValues(payload, trustedBuyerValidationSchema);
      if (!validation.valid) {
        this.fieldErrors = validation.errors;
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
        contact: item.contact
      };
      this.fieldErrors = {};
      this.error = '';
      this.success = '';
    },
    cancelEdit() {
      this.resetForm();
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
        contact: ''
      };
    },
    toggleForm() {
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
    clearFieldError(fieldName) {
      if (this.fieldErrors[fieldName]) {
        delete this.fieldErrors[fieldName];
      }
    }
  }
};
</script>
