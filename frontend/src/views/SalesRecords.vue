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
        <div class="data-toolbar">
          <div class="data-toolbar-group">
            <div class="data-toolbar-field">
              <label class="form-label mb-1" for="sales-search">Search</label>
              <input
                id="sales-search"
                v-model.trim="searchQuery"
                type="text"
                class="form-control form-control-sm"
                placeholder="Produce, buyer, agent..."
              />
            </div>
            <div class="data-toolbar-field">
              <label class="form-label mb-1" for="sales-type-filter">Produce Type</label>
              <select
                id="sales-type-filter"
                v-model="selectedProduceType"
                class="form-select form-select-sm"
              >
                <option value="all">All types</option>
                <option v-for="type in produceTypeOptions" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </div>
            <div class="data-toolbar-field">
              <label class="form-label mb-1" for="sales-sort">Sort By</label>
              <select id="sales-sort" v-model="sortBy" class="form-select form-select-sm">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="amount_desc">Highest amount</option>
                <option value="quantity_desc">Highest quantity</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            :disabled="!searchQuery && selectedProduceType === 'all' && sortBy === 'newest'"
            @click="resetFilters"
          >
            Reset Filters
          </button>
        </div>

        <div v-if="loading" class="text-center py-5 text-muted">Loading sales records...</div>
        <div v-else-if="salesRecords.length === 0" class="empty-state">No sales records found.</div>
        <div v-else-if="filteredSalesRecords.length === 0" class="empty-state">
          No sales records match your current filters.
        </div>
        <div v-else class="table-responsive">
          <table class="table align-middle table-sticky table-row-hover">
            <thead>
              <tr>
                <th>Produce</th>
                <th class="text-end">Quantity (kg)</th>
                <th class="text-end">Amount Paid (UGX)</th>
                <th>Buyer</th>
                <th>Sales Agent</th>
                <th>Date/Time</th>
                <th v-if="canManageRecords" class="text-end">Actions</th>
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
                <td v-if="canManageRecords" class="text-end">
                  <div class="d-inline-flex gap-2">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-primary"
                      @click="openEditModal(item)"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
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
          :total-pages="totalSalesPages"
          :total-items="filteredSalesRecords.length"
          :page-size="pageSize"
          :page-size-options="pageSizeOptions"
          id-prefix="sales-records"
          @update:currentPage="goToPage"
          @update:pageSize="handlePageSizeUpdate"
        />
      </div>
    </div>

    <div v-if="editModalOpen" class="modal-mask" @click.self="closeEditModal">
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="sale-edit-title">
        <div class="modal-header">
          <h5 id="sale-edit-title" class="mb-0">Edit Cash Sale</h5>
          <button type="button" class="btn-close" aria-label="Close edit sale" @click="closeEditModal"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitEdit">
            <div class="row g-3">
              <div class="col-md-12">
                <label class="form-label" for="edit-sale-buyer">Buyer Name *</label>
                <input
                  id="edit-sale-buyer"
                  v-model.trim="editForm.buyerName"
                  type="text"
                  class="form-control"
                  minlength="2"
                  pattern="^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$"
                  required
                />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="edit-sale-date">Date *</label>
                <input id="edit-sale-date" v-model="editForm.date" type="date" class="form-control" required />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="edit-sale-time">Time *</label>
                <input
                  id="edit-sale-time"
                  v-model="editForm.time"
                  type="time"
                  class="form-control"
                  required
                />
              </div>
            </div>

            <div v-if="editError" class="alert alert-danger mt-3">{{ editError }}</div>

            <div class="mt-4 d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-outline-secondary" :disabled="editLoading" @click="closeEditModal">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="editLoading">
                <span v-if="editLoading" class="spinner-border spinner-border-sm me-2"></span>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :show="deleteDialog.show"
      title="Delete Cash Sale"
      :message="`Delete cash sale record for ${deleteDialog.saleLabel}? This cannot be undone.`"
      confirm-text="Delete"
      :busy="deleteDialog.processing"
      @cancel="closeDeleteDialog"
      @confirm="confirmDeleteSale"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import ConfirmDialog from '../components/common/ConfirmDialog.vue';
import TablePagination from '../components/common/TablePagination.vue';
import { salesAPI } from '../services/api';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore(pinia);
const user = ref({});
const salesRecords = ref([]);
const loading = ref(false);
const loadError = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const pageSizeOptions = [10, 20, 50, 100];
const searchQuery = ref('');
const selectedProduceType = ref('all');
const sortBy = ref('newest');
const editModalOpen = ref(false);
const editLoading = ref(false);
const editError = ref('');
const editForm = ref({
  id: '',
  buyerName: '',
  date: '',
  time: ''
});
const deleteDialog = ref({
  show: false,
  saleId: '',
  saleLabel: '',
  processing: false
});

const canManageRecords = computed(() => user.value.role === 'manager');

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

const produceTypeOptions = computed(() =>
  Array.from(new Set(salesRecords.value.map((item) => item.produceType).filter(Boolean))).sort()
);

const filteredSalesRecords = computed(() => {
  const query = searchQuery.value.toLowerCase();
  const searched = salesRecords.value.filter((item) => {
    if (!query) return true;
    const haystack = [item.produceName, item.produceType, item.buyerName, item.salesAgentName]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });

  const filtered =
    selectedProduceType.value === 'all'
      ? searched
      : searched.filter((item) => item.produceType === selectedProduceType.value);

  const sorted = [...filtered];
  if (sortBy.value === 'oldest') {
    sorted.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  } else if (sortBy.value === 'amount_desc') {
    sorted.sort((a, b) => Number(b.amountPaidUgx || 0) - Number(a.amountPaidUgx || 0));
  } else if (sortBy.value === 'quantity_desc') {
    sorted.sort((a, b) => Number(b.tonnageKg || 0) - Number(a.tonnageKg || 0));
  } else {
    sorted.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }
  return sorted;
});

const totalSalesPages = computed(() =>
  Math.max(1, Math.ceil(filteredSalesRecords.value.length / pageSize.value))
);

const paginatedSalesRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredSalesRecords.value.slice(start, start + pageSize.value);
});

const goToPage = (page) => {
  const nextPage = Math.max(1, Math.min(totalSalesPages.value, Number(page || 1)));
  currentPage.value = nextPage;
};

const handlePageSizeUpdate = (size) => {
  pageSize.value = Number(size || 20);
};

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const openEditModal = (item) => {
  editError.value = '';
  editForm.value = {
    id: item._id,
    buyerName: item.buyerName || '',
    date: toDateInput(item.date),
    time: item.time || ''
  };
  editModalOpen.value = true;
};

const closeEditModal = () => {
  if (editLoading.value) return;
  editModalOpen.value = false;
  editError.value = '';
};

const submitEdit = async () => {
  if (!editForm.value.id) return;
  editLoading.value = true;
  editError.value = '';
  try {
    await salesAPI.update(editForm.value.id, {
      buyerName: editForm.value.buyerName,
      date: editForm.value.date,
      time: editForm.value.time
    });
    editModalOpen.value = false;
    await loadSalesRecords();
  } catch (error) {
    editError.value = error.response?.data?.message || 'Failed to update sale record.';
  } finally {
    editLoading.value = false;
  }
};

const openDeleteDialog = (item) => {
  deleteDialog.value = {
    show: true,
    saleId: item._id,
    saleLabel: item.buyerName || 'selected buyer',
    processing: false
  };
};

const closeDeleteDialog = () => {
  if (deleteDialog.value.processing) return;
  deleteDialog.value.show = false;
};

const confirmDeleteSale = async () => {
  if (!deleteDialog.value.saleId) return;
  deleteDialog.value.processing = true;
  try {
    await salesAPI.delete(deleteDialog.value.saleId);
    deleteDialog.value.show = false;
    await loadSalesRecords();
  } catch (error) {
    loadError.value = error.response?.data?.message || 'Failed to delete sale record.';
  } finally {
    deleteDialog.value.processing = false;
  }
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

watch([searchQuery, selectedProduceType, sortBy], () => {
  currentPage.value = 1;
});

const resetFilters = () => {
  searchQuery.value = '';
  selectedProduceType.value = 'all';
  sortBy.value = 'newest';
};

onMounted(async () => {
  user.value = authStore.user || {};
  await loadSalesRecords();
});
</script>

