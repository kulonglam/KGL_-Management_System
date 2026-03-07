<!-- Sales records view for listing, refreshing, and maintaining cash sale entries. -->
<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Sales Records</h2>
      <p class="page-subtitle">Review all cash sale entries.</p>
    </div>

    <InsightStrip label="Sales records overview" :items="overviewItems" />

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
          <table class="table align-middle table-sticky table-row-hover responsive-stack-table">
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
                <td data-label="Produce">{{ item.produceName }} ({{ item.produceType }})</td>
                <td data-label="Quantity (kg)" class="text-end">
                  {{ Number(item.tonnageKg || 0).toLocaleString() }}
                </td>
                <td data-label="Amount Paid (UGX)" class="text-end">
                  {{ formatAmount(item.amountPaidUgx) }}
                </td>
                <td data-label="Buyer">{{ item.buyerName }}</td>
                <td data-label="Sales Agent">{{ item.salesAgentName || '-' }}</td>
                <td data-label="Date/Time">{{ formatDateTime(item.date, item.time) }}</td>
                <td v-if="canManageRecords" data-label="Actions" class="text-end">
                  <div class="record-row-actions justify-content-end">
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
            <p class="text-muted small mb-3">
              You can correct produce, quantity, buyer, sales agent, date, and time. Amount is recalculated automatically.
            </p>
            <div class="row g-3">
              <div class="col-md-8">
                <label class="form-label" for="edit-sale-produce">Produce</label>
                <select
                  id="edit-sale-produce"
                  v-model="editForm.produceName"
                  class="form-select"
                  required
                >
                  <option value="">Select produce</option>
                  <option v-for="name in editProduceNameOptions" :key="name" :value="name">
                    {{ name }}
                  </option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label" for="edit-sale-type">Produce Type</label>
                <select
                  id="edit-sale-type"
                  v-model="editForm.produceType"
                  class="form-select"
                  :disabled="editProduceTypeOptions.length === 0"
                  required
                >
                  <option value="">Select type</option>
                  <option v-for="type in editProduceTypeOptions" :key="type" :value="type">
                    {{ type }}
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="edit-sale-tonnage">Quantity (kg)</label>
                <input
                  id="edit-sale-tonnage"
                  v-model.number="editForm.tonnageKg"
                  type="number"
                  class="form-control"
                  min="1"
                  required
                />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="edit-sale-amount">Amount Paid (UGX)</label>
                <input
                  id="edit-sale-amount"
                  :value="formatAmount(editAmountPreview)"
                  type="text"
                  class="form-control readonly-display"
                  disabled
                />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="edit-sale-agent">Sales Agent</label>
                <input
                  id="edit-sale-agent"
                  v-model.trim="editForm.salesAgentName"
                  type="text"
                  class="form-control"
                  minlength="2"
                  pattern="^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$"
                  required
                />
              </div>
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

            <div class="form-action-bar">
              <div class="form-action-copy">
                <strong>Amount is recalculated from the active inventory price.</strong>
                <span>Use this editor to correct the record details, then save the updated sale.</span>
              </div>
              <div class="form-action-buttons">
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  :disabled="editLoading"
                  @click="closeEditModal"
                >
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" :disabled="editLoading">
                  <span v-if="editLoading" class="spinner-border spinner-border-sm me-2"></span>
                  Save Changes
                </button>
              </div>
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
import InsightStrip from '../components/common/InsightStrip.vue';
import TablePagination from '../components/common/TablePagination.vue';
import { inventoryAPI, salesAPI } from '../services/api';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';
import { formatDisplayDateTime } from '../utils/dateFormat.mjs';

const authStore = useAuthStore(pinia);
const user = ref({});
const salesRecords = ref([]);
const inventory = ref([]);
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
  produceName: '',
  produceType: '',
  tonnageKg: '',
  amountPaidUgx: '',
  salesAgentName: '',
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
const totalSalesAmount = computed(() =>
  salesRecords.value.reduce((sum, item) => sum + Number(item.amountPaidUgx || 0), 0)
);
const activeFilterCount = computed(() => {
  let count = 0;
  if (searchQuery.value) count += 1;
  if (selectedProduceType.value !== 'all') count += 1;
  if (sortBy.value !== 'newest') count += 1;
  return count;
});
const sortLabelMap = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  amount_desc: 'Highest amount',
  quantity_desc: 'Highest quantity'
};
const overviewItems = computed(() => [
  {
    label: 'Branch',
    value: user.value.branch || 'Unassigned',
    meta: canManageRecords.value ? 'Manager records workspace' : 'Sales agent records workspace'
  },
  {
    label: 'Cash Records',
    value: salesRecords.value.length.toLocaleString('en-UG'),
    meta: 'Loaded branch entries'
  },
  {
    label: 'Visible Results',
    value: filteredSalesRecords.value.length.toLocaleString('en-UG'),
    meta: activeFilterCount.value
      ? `${activeFilterCount.value} filter(s) applied`
      : 'No filters applied'
  },
  {
    label: 'Cash Value',
    value: `UGX ${formatAmount(totalSalesAmount.value)}`,
    meta: sortLabelMap[sortBy.value] || 'Newest first'
  }
]);

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

const loadInventory = async () => {
  try {
    const response = await inventoryAPI.get();
    inventory.value = response.data?.inventory || [];
  } catch (fetchError) {
    if (!loadError.value) {
      loadError.value = fetchError.response?.data?.message || 'Failed to load inventory options.';
    }
  }
};

const produceTypeOptions = computed(() =>
  Array.from(new Set(salesRecords.value.map((item) => item.produceType).filter(Boolean))).sort()
);

const editProduceNameOptions = computed(() =>
  Array.from(
    new Set([
      ...inventory.value.map((item) => item.produceName).filter(Boolean),
      editForm.value.produceName || null
    ])
  )
    .filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b)))
);

// Derive valid produce types from inventory for the selected produce name and keep current selection visible.
const editProduceTypeOptions = computed(() => {
  if (!editForm.value.produceName) return [];
  return Array.from(
    new Set(
      [
        ...inventory.value
        .filter((item) => item.produceName === editForm.value.produceName)
        .map((item) => item.produceType)
        .filter(Boolean),
        editForm.value.produceType || null
      ]
    )
  )
    .filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b)));
});

// Preview amount using current inventory pricing; fall back to stored amount when price context is unavailable.
const editAmountPreview = computed(() => {
  const tonnage = Number(editForm.value.tonnageKg || 0);
  if (!tonnage || Number.isNaN(tonnage)) {
    return Number(editForm.value.amountPaidUgx || 0);
  }

  const matchingInventory = inventory.value.find(
    (item) =>
      item.produceName === editForm.value.produceName &&
      item.produceType === editForm.value.produceType
  );
  if (!matchingInventory) {
    return Number(editForm.value.amountPaidUgx || 0);
  }

  return Number(matchingInventory.sellingPrice || 0) * tonnage;
});

// Apply search, optional type filter, then sorting so table output stays predictable across controls.
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
    produceName: item.produceName || '',
    produceType: item.produceType || '',
    tonnageKg: item.tonnageKg || '',
    amountPaidUgx: item.amountPaidUgx || '',
    salesAgentName: item.salesAgentName || '',
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
      produceName: editForm.value.produceName,
      produceType: editForm.value.produceType,
      tonnageKg: Number(editForm.value.tonnageKg || 0),
      buyerName: editForm.value.buyerName,
      salesAgentName: editForm.value.salesAgentName,
      date: editForm.value.date,
      time: editForm.value.time
    });
    editModalOpen.value = false;
    await Promise.all([loadSalesRecords(), loadInventory()]);
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

const formatAmount = (amount) =>
  Number(amount || 0).toLocaleString('en-UG', {
    maximumFractionDigits: 0
  });

const formatDateTime = (dateValue, timeValue) => {
  return formatDisplayDateTime(dateValue, timeValue);
};

watch(
  () => editForm.value.produceName,
  () => {
    if (!editForm.value.produceName) {
      editForm.value.produceType = '';
      return;
    }

    // Keep produce type valid whenever produce name changes in the edit form.
    if (!editProduceTypeOptions.value.includes(editForm.value.produceType)) {
      editForm.value.produceType = editProduceTypeOptions.value[0] || '';
    }
  }
);

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
  // Load records and inventory together so edit dropdowns and amount previews are immediately usable.
  await Promise.all([loadSalesRecords(), loadInventory()]);
});
</script>


