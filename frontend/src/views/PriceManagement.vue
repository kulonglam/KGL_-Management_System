<template>
  <div class="price-page view-shell">
    <div class="price-page-header">
      <div>
        <h2 class="page-title">Price Management</h2>
        <p class="page-subtitle mb-0">
          Manage branch-level prices by produce type (create, update, delete).
        </p>
      </div>
      <button class="btn btn-outline-primary refresh-btn" @click="loadPrices" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
        <i v-else class="bi bi-arrow-clockwise me-2"></i>
        Refresh
      </button>
    </div>

    <div v-if="globalError" class="alert alert-danger">{{ globalError }}</div>
    <div v-if="globalSuccess" class="alert alert-success">{{ globalSuccess }}</div>

    <div class="summary-grid">
      <div class="summary-card">
        <span class="summary-label">Managed</span>
        <strong class="summary-value">{{ managedCount }}</strong>
      </div>
      <div class="summary-card">
        <span class="summary-label">Inferred</span>
        <strong class="summary-value">{{ inferredCount }}</strong>
      </div>
      <div class="summary-card">
        <span class="summary-label">Unset</span>
        <strong class="summary-value">{{ unsetCount }}</strong>
      </div>
    </div>

    <div class="card price-card">
      <div class="card-header">
        <h5 class="mb-0 d-flex align-items-center gap-2">
          <i class="bi bi-tags"></i>
          Prices by Produce Type
        </h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table align-middle price-table mb-0">
            <thead>
              <tr>
                <th>Produce Type</th>
                <th>Status</th>
                <th class="text-end">Price per kg</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.type">
                <td>
                  <div class="produce-cell">
                    <span class="produce-dot"></span>
                    <span class="fw-semibold">{{ row.type }}</span>
                  </div>
                </td>
                <td>
                  <span class="status-pill" :class="`status-${row.source}`">
                    {{ statusLabel(row.source) }}
                  </span>
                </td>
                <td class="text-end">
                  <div class="price-input-wrap ms-auto">
                    <span class="price-prefix">UGX</span>
                    <input
                      type="number"
                      class="form-control text-end price-input"
                      v-model="row.priceUgx"
                      min="10000"
                    />
                  </div>
                  <small v-if="row.error" class="text-danger d-block mt-1">{{ row.error }}</small>
                  <small v-if="row.success" class="text-success d-block mt-1">{{
                    row.success
                  }}</small>
                </td>
                <td class="text-end">
                  <div class="action-wrap">
                    <button
                      class="btn btn-sm"
                      :class="row._id ? 'btn-primary' : 'btn-success'"
                      @click="savePrice(row)"
                      :disabled="row.saving || row.deleting"
                    >
                      <span v-if="row.saving" class="spinner-border spinner-border-sm me-2"></span>
                      {{ row._id ? 'Update' : 'Create' }}
                    </button>
                    <button
                      class="btn btn-sm btn-outline-danger"
                      @click="openDeleteDialog(row)"
                      :disabled="!row._id || row.saving || row.deleting"
                    >
                      <span
                        v-if="row.deleting"
                        class="spinner-border spinner-border-sm me-2"
                      ></span>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :show="deleteDialog.show"
      title="Delete Managed Price"
      :message="`Delete managed price for ${deleteDialog.produceType}?`"
      confirm-text="Delete"
      :busy="deleteDialog.processing"
      @cancel="closeDeleteDialog"
      @confirm="confirmDeletePrice"
    />
  </div>
</template>

<script>
/**
 * Manager price administration page for create/update/delete of produce selling prices.
 * File: frontend/src/views/PriceManagement.vue
 */

import { priceAPI } from '../services/api';
import ConfirmDialog from '../components/common/ConfirmDialog.vue';

// Canonical produce types supported by the business.
const PRODUCE_TYPES = ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans'];

// Build UI row state for one produce type entry.
const createRow = (type) => ({
  _id: null,
  type,
  priceUgx: '',
  source: 'unset',
  saving: false,
  deleting: false,
  error: '',
  success: ''
});

export default {
  name: 'PriceManagement',
  components: {
    ConfirmDialog
  },
  data() {
    return {
      loading: false,
      globalError: '',
      globalSuccess: '',
      rows: PRODUCE_TYPES.map(createRow),
      deleteDialog: {
        show: false,
        priceId: '',
        produceType: '',
        processing: false
      }
    };
  },
  computed: {
    // Summary count for rows currently backed by managed prices.
    managedCount() {
      return this.rows.filter((row) => row.source === 'managed').length;
    },
    inferredCount() {
      return this.rows.filter((row) => row.source === 'inferred').length;
    },
    unsetCount() {
      return this.rows.filter((row) => row.source === 'unset').length;
    }
  },
  async created() {
    await this.loadPrices();
  },
  methods: {
    // Convert row source code into display label.
    statusLabel(source) {
      if (source === 'managed') return 'Managed';
      if (source === 'inferred') return 'Inferred';
      return 'Unset';
    },
    statusBadgeClass(source) {
      if (source === 'managed') return 'bg-success';
      if (source === 'inferred') return 'bg-warning text-dark';
      return 'bg-secondary';
    },
    clearMessages() {
      this.globalError = '';
      this.globalSuccess = '';
    },
    clearRowMessages(row) {
      row.error = '';
      row.success = '';
    },
    async loadPrices() {
      this.loading = true;
      this.clearMessages();
      try {
        const response = await priceAPI.getAll();
        const map = {};
        // Normalize API data into a produceType lookup so we can render a stable fixed row list.
        response.data.forEach((entry) => {
          map[entry.produceType] = entry;
        });

        this.rows = PRODUCE_TYPES.map((type) => {
          const existing = map[type];
          return {
            _id: existing?._id || null,
            type,
            priceUgx: existing?.priceUgx ?? '',
            source: existing?.source || 'unset',
            saving: false,
            deleting: false,
            error: '',
            success: ''
          };
        });
      } catch (error) {
        this.globalError = error.response?.data?.message || 'Failed to load prices';
      } finally {
        this.loading = false;
      }
    },
    validatePrice(row) {
      const price = Number(row.priceUgx);
      // Guard rail: keep managed prices above minimum business threshold.
      if (!price || Number.isNaN(price) || price < 10000) {
        row.error = 'Price must be at least 10000 UGX';
        return null;
      }
      return price;
    },
    async savePrice(row) {
      this.clearMessages();
      this.clearRowMessages(row);
      const price = this.validatePrice(row);
      if (price === null) return;

      row.saving = true;
      try {
        const wasManaged = Boolean(row._id);
        // Payload accepted by price create/update endpoints.
        const payload = {
          produceType: row.type,
          priceUgx: price
        };

        const response = row._id
          ? await priceAPI.update(row._id, payload)
          : await priceAPI.create(payload);

        // API returns canonical setting details after sync; update the row from that source of truth.
        row._id = response.data.setting._id;
        row.priceUgx = response.data.setting.priceUgx;
        row.source = 'managed';
        row.success = `${wasManaged ? 'Updated' : 'Created'} (${response.data.updatedProcurements} records synced)`;
        this.globalSuccess = `Price ${wasManaged ? 'updated' : 'created'} for ${row.type}`;
      } catch (error) {
        row.error = error.response?.data?.message || 'Failed to save price';
      } finally {
        row.saving = false;
      }
    },
    openDeleteDialog(row) {
      this.clearMessages();
      this.clearRowMessages(row);
      if (!row._id) {
        row.error = 'No managed price to delete';
        return;
      }
      this.deleteDialog = {
        show: true,
        priceId: row._id,
        produceType: row.type,
        processing: false
      };
    },
    closeDeleteDialog() {
      if (this.deleteDialog.processing) return;
      this.deleteDialog.show = false;
    },
    async confirmDeletePrice() {
      if (!this.deleteDialog.priceId) return;
      this.clearMessages();
      this.deleteDialog.processing = true;

      try {
        await priceAPI.delete(this.deleteDialog.priceId);
        await this.loadPrices();
        this.globalSuccess = `Deleted managed price for ${this.deleteDialog.produceType}`;
      } catch (error) {
        this.globalError = error.response?.data?.message || 'Failed to delete price';
      } finally {
        this.deleteDialog.processing = false;
        this.deleteDialog.show = false;
      }
    }
  }
};
</script>

<style scoped>
/* Component styles */
.price-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.price-page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
}

.page-subtitle {
  color: #64748b;
}

.refresh-btn {
  min-width: 115px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.summary-card {
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #ffffff, #f8fafc);
  border-radius: 0.7rem;
  padding: 0.7rem 0.85rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.summary-label {
  font-size: 0.86rem;
  color: #64748b;
  font-weight: 600;
}

.summary-value {
  font-size: 1.06rem;
  color: #0f172a;
}

.price-card .card-header {
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
}

.produce-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}

.produce-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #2563eb;
  display: inline-block;
}

.status-pill {
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 999px;
  padding: 0.24rem 0.58rem;
  border: 1px solid transparent;
}

.status-managed {
  background: #e8f8ee;
  border-color: #bbebcd;
  color: #0f766e;
}

.status-inferred {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #b45309;
}

.status-unset {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #475569;
}

.price-input-wrap {
  max-width: 380px;
  display: flex;
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 0.56rem;
  overflow: hidden;
  background: #ffffff;
}

.price-prefix {
  background: #f8fafc;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.46rem 0.62rem;
  border-right: 1px solid #e2e8f0;
}

.price-input {
  border: none;
  border-radius: 0;
}

.price-input:focus {
  box-shadow: none;
}

.action-wrap {
  display: inline-flex;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}

@media (max-width: 991.98px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .price-input-wrap {
    max-width: 100%;
  }
}
</style>
