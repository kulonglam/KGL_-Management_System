<template>
  <div class="card price-card">
    <div class="card-header">
      <h5 class="mb-0 d-flex align-items-center gap-2">
        <i class="bi bi-tags"></i>
        Prices by Produce
      </h5>
    </div>
    <div class="card-body">
      <div class="table-responsive">
        <table class="table align-middle price-table mb-0 responsive-stack-table">
          <thead>
            <tr>
              <th>Produce Name</th>
              <th>Produce Type</th>
              <th>Status</th>
              <th class="text-end">Price per kg</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody v-if="rows.length">
            <tr
              v-for="row in rows"
              :key="row._id || `${row.source}-${row.produceType}-${row.produceName || 'type-default'}`"
            >
              <td data-label="Produce Name">
                <div v-if="normalizeProduceName(row.produceName)" class="price-cell-label">
                  {{ normalizeProduceName(row.produceName) }}
                </div>
                <div v-else class="price-cell-label text-muted">Type default</div>
                <small class="price-cell-note">
                  {{
                    normalizeProduceName(row.produceName)
                      ? 'Specific produce price'
                      : `Fallback for ${row.produceType || 'this type'}`
                  }}
                </small>
              </td>
              <td data-label="Produce Type">
                <span class="type-chip">
                  {{ row.produceType || '-' }}
                </span>
              </td>
              <td data-label="Status">
                <span class="status-pill" :class="`status-${row.source}`">
                  {{ priceStatusLabel(row.source) }}
                </span>
              </td>
              <td data-label="Price per kg" class="text-end price-value">
                UGX {{ formatCurrency(row.priceUgx) }}
              </td>
              <td data-label="Actions" class="text-end">
                <div class="record-row-actions action-wrap justify-content-end">
                  <button
                    type="button"
                    class="btn btn-sm btn-primary"
                    :disabled="row.deleting"
                    @click="$emit('edit', row)"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary"
                    :disabled="!row._id || row.deleting"
                    @click="$emit('history', row)"
                  >
                    History
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    :disabled="!row._id || row.deleting"
                    @click="$emit('delete', row)"
                  >
                    <span v-if="row.deleting" class="spinner-border spinner-border-sm me-2"></span>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="5" class="empty-state">
                No prices yet. Create a produce-specific price or a type default above.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  rows: {
    type: Array,
    default: () => []
  },
  formatCurrency: {
    type: Function,
    required: true
  },
  normalizeProduceName: {
    type: Function,
    required: true
  },
  priceStatusLabel: {
    type: Function,
    required: true
  }
});

defineEmits(['edit', 'history', 'delete']);
</script>

<style scoped>
.price-card .card-header {
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
}

.type-chip {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0.45rem 0.8rem;
  border: 1px solid #d1d5db;
  border-radius: 0.7rem;
  background: #f8fafc;
  color: #334155;
  font-weight: 600;
}

.price-cell-label {
  font-weight: 700;
  color: #0f172a;
}

.price-cell-note {
  display: block;
  margin-top: 0.18rem;
  color: #64748b;
  font-size: 0.78rem;
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

.price-value {
  font-weight: 700;
  color: #0f172a;
}

.action-wrap {
  display: inline-flex;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.empty-state {
  padding: 1rem;
  text-align: center;
  color: #64748b;
}
</style>
