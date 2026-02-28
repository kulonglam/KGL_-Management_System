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

      <div v-else class="table-responsive procurement-table-container">
        <table class="table table-hover procurement-table align-middle">
          <thead>
            <tr>
              <th>Produce Name</th>
              <th>Produce Type</th>
              <th class="text-end">Cost (UGX)</th>
              <th class="text-end">Tonnage (kg)</th>
              <th>Branch</th>
              <th>Dealer</th>
              <th>Date/Time</th>
              <th class="text-end">Price (UGX)</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paginatedProcurements" :key="item._id">
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
              <td class="text-nowrap">{{ formatDateTime(item.dateReceived, item.timeReceived) }}</td>
              <td class="text-end fw-semibold text-nowrap">{{ formatNumber(item.sellingPrice) }}</td>
              <td class="text-end text-nowrap actions-cell">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary me-2"
                  :disabled="loading"
                  @click="$emit('edit', item)"
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  :disabled="loading"
                  @click="$emit('delete', item._id)"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="procurements.length > 0"
        class="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3"
      >
        <small class="text-muted">
          Showing {{ rowsStart }}-{{ rowsEnd }} of
          {{ procurements.length.toLocaleString('en-UG') }} records
        </small>
        <div class="d-flex align-items-center gap-2">
          <label class="small text-muted mb-0" for="procurement-page-size">Rows</label>
          <select
            id="procurement-page-size"
            class="form-select form-select-sm"
            v-model.number="pageSize"
          >
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
          <span class="small text-muted">Page {{ currentPage }} / {{ totalPages }}</span>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            :disabled="currentPage >= totalPages"
            @click="goToPage(currentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
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

const currentPage = ref(1);
const pageSize = ref(20);
const pageSizeOptions = [10, 20, 50, 100];

const totalPages = computed(() => Math.max(1, Math.ceil(props.procurements.length / pageSize.value)));

const paginatedProcurements = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return props.procurements.slice(start, start + pageSize.value);
});

const rowsStart = computed(() => {
  if (props.procurements.length === 0) return 0;
  return (currentPage.value - 1) * pageSize.value + 1;
});

const rowsEnd = computed(() => Math.min(currentPage.value * pageSize.value, props.procurements.length));

const goToPage = (page) => {
  const nextPage = Math.max(1, Math.min(totalPages.value, Number(page || 1)));
  currentPage.value = nextPage;
};

watch(pageSize, () => {
  currentPage.value = 1;
});

watch(
  () => props.procurements,
  () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value;
    }
  }
);

// Format number.
const formatNumber = (value) => {
  if (value === undefined || value === null) return '-';
  return Number(value).toLocaleString();
};

const formatDateTime = (dateValue, timeValue) => {
  if (!dateValue && !timeValue) return '-';

  const date = dateValue ? new Date(dateValue) : null;
  const formattedDate =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString('en-UG', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : String(dateValue || '-');

  return `${formattedDate} ${timeValue || '-'}`;
};
</script>

<style scoped>
/* Component styles */
.procurement-card .card-header {
  border-bottom: 1px solid #e5e7eb;
  background-color: #f8fafc;
}

.procurement-table-container {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable both-edges;
}

.procurement-table {
  width: 100%;
  min-width: 0;
  table-layout: auto;
}

.procurement-table th,
.procurement-table td {
  white-space: normal;
  vertical-align: middle;
}

.procurement-table th.text-end,
.procurement-table td.text-end,
.actions-cell {
  white-space: nowrap;
}

.produce-cell {
  min-width: 120px;
  white-space: normal;
}

.type-cell {
  min-width: 95px;
}

.actions-cell {
  min-width: 140px;
}

</style>
