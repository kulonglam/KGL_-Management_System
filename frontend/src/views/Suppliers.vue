<template>
  <div class="view-shell">
    <div class="view-heading d-flex flex-wrap justify-content-between align-items-start gap-3">
      <div>
        <h2 class="page-title">Suppliers</h2>
        <p class="page-subtitle">Manage dealers used on procurement records for {{ user.branch }}.</p>
      </div>
      <button type="button" class="btn btn-success btn-sm" @click="toggleForm">
        {{ showForm ? 'Close form' : 'Add supplier' }}
      </button>
    </div>

    <div v-if="loadError" class="alert alert-danger" role="alert">{{ loadError }}</div>
    <div v-if="successMessage" class="alert alert-success" role="alert">{{ successMessage }}</div>

    <div v-if="showForm" class="card mb-4">
      <div class="card-body">
        <form @submit.prevent="submitForm">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label" for="supplier-name">Name</label>
              <input id="supplier-name" v-model.trim="form.name" class="form-control" required minlength="2" />
            </div>
            <div class="col-md-4">
              <label class="form-label" for="supplier-contact">Contact</label>
              <input
                id="supplier-contact"
                v-model.trim="form.contact"
                class="form-control"
                required
                pattern="^07[0-9]{8}$"
                maxlength="10"
              />
            </div>
            <div class="col-md-4">
              <label class="form-label" for="supplier-source">Source type</label>
              <select id="supplier-source" v-model="form.sourceType" class="form-select" required>
                <option value="company">Company</option>
                <option value="individual">Individual</option>
                <option value="kgl_farm">KGL Farm</option>
              </select>
            </div>
          </div>
          <div class="mt-3 d-flex gap-2">
            <button type="submit" class="btn btn-success" :disabled="saving">
              {{ editingId ? 'Update supplier' : 'Save supplier' }}
            </button>
            <button type="button" class="btn btn-outline-secondary" @click="toggleForm">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Supplier list</h5>
        <label class="form-check mb-0 small">
          <input v-model="showRemoved" class="form-check-input" type="checkbox" />
          Show removed
        </label>
      </div>
      <div class="card-body table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Source</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in suppliers" :key="item._id">
              <td>{{ item.name }}</td>
              <td>{{ item.contact }}</td>
              <td>{{ item.sourceType }}</td>
              <td class="text-end">
                <button
                  v-if="showRemoved"
                  type="button"
                  class="btn btn-sm btn-outline-success"
                  @click="restoreSupplier(item)"
                >
                  Restore
                </button>
                <template v-else>
                  <button type="button" class="btn btn-sm btn-outline-primary me-1" @click="startEdit(item)">
                    Edit
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-danger" @click="removeSupplier(item)">
                    Remove
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!loading && suppliers.length === 0" class="text-muted">No suppliers yet.</div>
      </div>
    </div>
  </div>
</template>

<script>
import { suppliersAPI } from '../services/api';
import { asListPayload } from '../utils/listPayload.js';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';

const emptyForm = () => ({
  name: '',
  contact: '',
  sourceType: 'company'
});

export default {
  name: 'Suppliers',
  data() {
    return {
      authStore: useAuthStore(pinia),
      suppliers: [],
      loading: false,
      saving: false,
      loadError: '',
      successMessage: '',
      showForm: false,
      showRemoved: false,
      editingId: '',
      form: emptyForm()
    };
  },
  computed: {
    user() {
      return this.authStore.user || {};
    }
  },
  watch: {
    showRemoved() {
      this.loadSuppliers();
    }
  },
  mounted() {
    this.loadSuppliers();
  },
  methods: {
    toggleForm() {
      this.showForm = !this.showForm;
      if (!this.showForm) {
        this.editingId = '';
        this.form = emptyForm();
      }
    },
    startEdit(item) {
      this.editingId = item._id;
      this.form = {
        name: item.name,
        contact: item.contact,
        sourceType: item.sourceType || 'company'
      };
      this.showForm = true;
    },
    async loadSuppliers() {
      this.loading = true;
      this.loadError = '';
      try {
        const response = await suppliersAPI.getAll({
          deleted: this.showRemoved ? 'true' : undefined,
          page: 1,
          limit: 100
        });
        this.suppliers = asListPayload(response.data).items;
      } catch (error) {
        this.loadError = error.response?.data?.message || 'Failed to load suppliers.';
      } finally {
        this.loading = false;
      }
    },
    async submitForm() {
      this.saving = true;
      this.loadError = '';
      this.successMessage = '';
      try {
        if (this.editingId) {
          await suppliersAPI.update(this.editingId, this.form);
          this.successMessage = 'Supplier updated.';
        } else {
          await suppliersAPI.create(this.form);
          this.successMessage = 'Supplier created.';
        }
        this.showForm = false;
        this.editingId = '';
        this.form = emptyForm();
        await this.loadSuppliers();
      } catch (error) {
        this.loadError = error.response?.data?.message || 'Failed to save supplier.';
      } finally {
        this.saving = false;
      }
    },
    async removeSupplier(item) {
      this.loadError = '';
      try {
        await suppliersAPI.delete(item._id);
        this.successMessage = 'Supplier removed.';
        await this.loadSuppliers();
      } catch (error) {
        this.loadError = error.response?.data?.message || 'Failed to remove supplier.';
      }
    },
    async restoreSupplier(item) {
      this.loadError = '';
      try {
        await suppliersAPI.restore(item._id);
        this.successMessage = 'Supplier restored.';
        await this.loadSuppliers();
      } catch (error) {
        this.loadError = error.response?.data?.message || 'Failed to restore supplier.';
      }
    }
  }
};
</script>
