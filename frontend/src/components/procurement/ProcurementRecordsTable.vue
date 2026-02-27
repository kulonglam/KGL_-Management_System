<template>
  <div class="card procurement-card">
    <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
      <h5 class="mb-0">All Procurement</h5>
      <div class="d-flex gap-2">
        <router-link to="/dashboard/procurement" class="btn btn-primary btn-sm">
          Record Procurement
        </router-link>
        <button
          class="btn btn-outline-primary btn-sm"
          @click="$emit('refresh')"
          :disabled="loading"
        >
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
              <th>Produce Name</th>
              <th>Produce Type</th>
              <th class="text-end">Cost (UGX)</th>
              <th class="text-end">Tonnage (kg)</th>
              <th>Branch</th>
              <th>Dealer</th>
              <th class="text-end">Price (UGX)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in procurements" :key="item._id">
              <td class="produce-cell">
                <div class="fw-semibold text-dark">{{ item.produceName }}</div>
              </td>
              <td class="type-cell">
                <span class="badge text-bg-light border">{{ item.produceType }}</span>
              </td>
              <td class="text-end fw-semibold text-nowrap">{{ formatNumber(item.costUgx) }}</td>
              <td class="text-end fw-semibold text-nowrap">{{ formatNumber(item.tonnageKg) }}</td>
              <td>{{ item.branch || '-' }}</td>
              <td>
                <div class="fw-semibold">{{ item.dealerName || '-' }}</div>
              </td>
              <td class="text-end fw-semibold text-nowrap">{{ formatNumber(item.sellingPrice) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
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

defineEmits(['refresh']);

// Format number.
const formatNumber = (value) => {
  if (value === undefined || value === null) return '-';
  return Number(value).toLocaleString();
};
</script>

<style scoped>
/* Component styles */
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

</style>
