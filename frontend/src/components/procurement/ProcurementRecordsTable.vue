<template>
  <div class="card procurement-card">
    <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
      <h5 class="mb-0">All Procurement</h5>
      <div class="d-flex gap-2">
        <router-link to="/dashboard/procurement" class="btn btn-primary btn-sm">
          Record Procurement
        </router-link>
        <button class="btn btn-outline-primary btn-sm" @click="$emit('refresh')" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          Refresh
        </button>
      </div>
    </div>

    <div class="card-body">
      <div v-if="procurements.length === 0" class="text-center py-5 text-muted">
        No procurement records found.
      </div>

      <div v-else class="table-responsive">
        <table class="table table-hover procurement-table align-middle">
          <thead>
            <tr>
              <th>Produce</th>
              <th>Type</th>
              <th>Source</th>
              <th>Received</th>
              <th class="text-end">Quantity (kg)</th>
              <th class="text-end">Value (UGX)</th>
              <th>Dealer</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in procurements" :key="item._id">
              <td class="produce-cell">
                <div class="fw-semibold text-dark">{{ item.name }}</div>
              </td>
              <td class="type-cell">
                <span class="badge text-bg-light border">{{ item.type }}</span>
              </td>
              <td>
                <span class="badge source-badge" :class="sourceBadgeClass(item.sourceType)">
                  {{ formatSource(item.sourceType) }}
                </span>
              </td>
              <td class="received-cell">
                <div class="fw-semibold">{{ formatDate(item.dateReceived) }}</div>
                <small class="text-muted">{{ formatTime(item.timeReceived) }}</small>
              </td>
              <td class="text-end fw-semibold text-nowrap">{{ formatNumber(item.tonnageKg) }}</td>
              <td class="text-end text-nowrap">
                <div class="fw-semibold">{{ formatNumber(item.costUgx) }}</div>
                <small class="text-muted">Price/kg: {{ formatNumber(item.sellingPrice) }}</small>
              </td>
              <td>
                <div class="fw-semibold">{{ item.dealerName }}</div>
                <small class="text-muted">Recorded by {{ item.recordedBy?.name || '-' }}</small>
              </td>
              <td class="text-end">
                <div class="btn-group btn-group-sm action-group" role="group" aria-label="Row actions">
                  <button class="btn btn-outline-primary" title="Edit" aria-label="Edit" @click="$emit('edit', item)">
                    <i class="bi bi-pencil-square"></i>
                  </button>
                  <button class="btn btn-outline-danger" title="Delete" aria-label="Delete" @click="$emit('delete', item._id)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatSource } from '../../composables/useProcurementForm';

defineProps({
  procurements: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['refresh', 'edit', 'delete']);

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

const formatTime = (value) => {
  if (!value) return '-';
  const trimmed = String(value).trim();
  if (!trimmed) return '-';

  const date = new Date(`1970-01-01T${trimmed}`);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return trimmed;
};

const sourceBadgeClass = (sourceType) => {
  const source = String(sourceType || '').toLowerCase();
  if (source === 'own_farm') return 'source-farm';
  if (source === 'company') return 'source-company';
  return 'source-individual';
};

const formatNumber = (value) => {
  if (value === undefined || value === null) return '-';
  return Number(value).toLocaleString();
};
</script>

<style scoped>
.procurement-card .card-header {
  border-bottom: 1px solid #e5e7eb;
  background-color: #f8fafc;
}

.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.procurement-table {
  width: 100%;
  min-width: 840px;
}

.procurement-table thead th {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  font-weight: 700;
  border-bottom-width: 1px;
}

.procurement-table tbody td {
  padding-top: 0.95rem;
  padding-bottom: 0.95rem;
}

.produce-cell {
  min-width: 150px;
  white-space: normal;
}

.type-cell {
  min-width: 95px;
}

.received-cell {
  min-width: 115px;
  white-space: normal;
}

.source-badge {
  font-weight: 600;
  border: 1px solid transparent;
}

.source-individual {
  background-color: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.source-company {
  background-color: #ecfdf5;
  color: #047857;
  border-color: #a7f3d0;
}

.source-farm {
  background-color: #fefce8;
  color: #a16207;
  border-color: #fde68a;
}

.action-group .btn {
  width: 2rem;
  height: 2rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}
</style>
