<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Sales Records</h2>
      <p class="page-subtitle">Review all cash sale entries.</p>
    </div>

    <div
      v-if="loadError"
      class="alert alert-danger d-flex align-items-start justify-content-between gap-3"
      role="alert"
    >
      <span>{{ loadError }}</span>
      <button type="button" class="btn btn-sm btn-outline-danger" :disabled="loading" @click="loadSalesRecords">
        Retry
      </button>
    </div>

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">All Sales</h5>
        <button class="btn btn-outline-primary btn-sm" :disabled="loading" @click="loadSalesRecords">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          Refresh
        </button>
      </div>
      <div class="card-body">
        <div v-if="loading" class="text-center py-5 text-muted">Loading sales records...</div>
        <div v-else-if="salesRecords.length === 0" class="text-center py-5 text-muted">
          No sales records found.
        </div>
        <div v-else class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Produce</th>
                <th class="text-end">Quantity (kg)</th>
                <th class="text-end">Amount Paid (UGX)</th>
                <th>Buyer</th>
                <th>Sales Agent</th>
                <th>Date/Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in paginatedSalesRecords" :key="item._id">
                <td>{{ item.produceName }} ({{ item.produceType }})</td>
                <td class="text-end">{{ Number(item.tonnageKg || 0).toLocaleString() }}</td>
                <td class="text-end">{{ formatCurrency(item.amountPaidUgx) }}</td>
                <td>{{ item.buyerName }}</td>
                <td>{{ item.salesAgentName || '-' }}</td>
                <td>{{ formatDateTime(item.date, item.time) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          v-if="salesRecords.length > 0"
          class="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3"
        >
          <small class="text-muted">
            Showing {{ salesRowsStart }}-{{ salesRowsEnd }} of
            {{ salesRecords.length.toLocaleString('en-UG') }} records
          </small>
          <div class="d-flex align-items-center gap-2">
            <label class="small text-muted mb-0" for="sales-records-page-size">Rows</label>
            <select id="sales-records-page-size" class="form-select form-select-sm" v-model.number="pageSize">
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
            <span class="small text-muted">Page {{ currentPage }} / {{ totalSalesPages }}</span>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary"
              :disabled="currentPage >= totalSalesPages"
              @click="goToPage(currentPage + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { salesAPI } from '../services/api';

const salesRecords = ref([]);
const loading = ref(false);
const loadError = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const pageSizeOptions = [10, 20, 50, 100];

const loadSalesRecords = async () => {
  loading.value = true;
  loadError.value = '';
  try {
    const response = await salesAPI.getAll();
    salesRecords.value = response.data || [];
  } catch (fetchError) {
    loadError.value = fetchError.response?.data?.message || 'Failed to load sales records.';
  } finally {
    loading.value = false;
  }
};

const totalSalesPages = computed(() =>
  Math.max(1, Math.ceil(salesRecords.value.length / pageSize.value))
);

const paginatedSalesRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return salesRecords.value.slice(start, start + pageSize.value);
});

const salesRowsStart = computed(() => {
  if (salesRecords.value.length === 0) return 0;
  return (currentPage.value - 1) * pageSize.value + 1;
});

const salesRowsEnd = computed(() =>
  Math.min(currentPage.value * pageSize.value, salesRecords.value.length)
);

const goToPage = (page) => {
  const nextPage = Math.max(1, Math.min(totalSalesPages.value, Number(page || 1)));
  currentPage.value = nextPage;
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0
  }).format(Number(amount || 0));

const formatDateTime = (dateValue, timeValue) => {
  if (!dateValue && !timeValue) return '-';

  const date = dateValue ? new Date(dateValue) : null;
  const formattedDate =
    date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : String(dateValue || '-');
  const formattedTime = timeValue ? String(timeValue) : '-';

  return `${formattedDate} ${formattedTime}`;
};

watch(pageSize, () => {
  currentPage.value = 1;
});

watch(salesRecords, () => {
  if (currentPage.value > totalSalesPages.value) {
    currentPage.value = totalSalesPages.value;
  }
});

onMounted(async () => {
  await loadSalesRecords();
});
</script>
