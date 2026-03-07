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
      <InsightStrip class="mb-3" label="Procurement overview" :items="overviewItems" />

      <div class="data-toolbar">
        <div class="data-toolbar-group">
          <div class="data-toolbar-field">
            <label class="form-label mb-1" for="procurement-search">Search</label>
            <input
              id="procurement-search"
              v-model.trim="searchQuery"
              type="text"
              class="form-control form-control-sm"
              placeholder="Produce, dealer, branch..."
            />
          </div>

          <div class="data-toolbar-field">
            <label class="form-label mb-1" for="procurement-type-filter">Produce Type</label>
            <select
              id="procurement-type-filter"
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
            <label class="form-label mb-1" for="procurement-sort">Sort By</label>
            <select id="procurement-sort" v-model="sortBy" class="form-select form-select-sm">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="tonnage_desc">Highest tonnage</option>
              <option value="cost_desc">Highest cost</option>
              <option value="dealer_asc">Dealer A-Z</option>
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

      <div v-if="procurements.length === 0" class="empty-state">
        No procurement records found.
      </div>

      <div
        v-else-if="filteredProcurements.length === 0"
        class="empty-state"
      >
        No procurement records match your current filters.
      </div>

      <div v-else class="table-responsive procurement-table-container">
        <table class="table table-hover procurement-table align-middle table-sticky table-row-hover responsive-stack-table">
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
              <td data-label="Produce Name" class="produce-cell">
                <div class="fw-semibold text-dark">{{ item.produceName }}</div>
              </td>
              <td data-label="Produce Type" class="type-cell">
                <span class="badge text-bg-light border">{{ item.produceType }}</span>
              </td>
              <td data-label="Cost (UGX)" class="text-end fw-semibold text-nowrap">
                {{ formatNumber(item.costUgx) }}
              </td>
              <td data-label="Tonnage (kg)" class="text-end fw-semibold text-nowrap">
                {{ formatNumber(item.tonnageKg) }}
              </td>
              <td data-label="Branch">{{ item.branch || '-' }}</td>
              <td data-label="Dealer">
                <div class="fw-semibold">{{ item.dealerName || '-' }}</div>
              </td>
              <td data-label="Date/Time" class="text-nowrap">
                {{ formatDateTime(item.dateReceived, item.timeReceived) }}
              </td>
              <td data-label="Price (UGX)" class="text-end fw-semibold text-nowrap">
                {{ formatNumber(item.sellingPrice) }}
              </td>
              <td data-label="Actions" class="text-end text-nowrap actions-cell">
                <div class="record-row-actions justify-content-end">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary"
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
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <TablePagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="filteredProcurements.length"
        :page-size="pageSize"
        :page-size-options="pageSizeOptions"
        id-prefix="procurement-records"
        @update:currentPage="goToPage"
        @update:pageSize="handlePageSizeUpdate"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import InsightStrip from '../common/InsightStrip.vue';
import TablePagination from '../common/TablePagination.vue';
import { formatDisplayDateTime } from '../../utils/dateFormat.mjs';

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
const searchQuery = ref('');
const selectedProduceType = ref('all');
const sortBy = ref('newest');

const produceTypeOptions = computed(() =>
  Array.from(new Set(props.procurements.map((record) => record.produceType).filter(Boolean))).sort()
);
const totalTonnage = computed(() =>
  props.procurements.reduce((sum, record) => sum + Number(record.tonnageKg || 0), 0)
);
const totalCost = computed(() =>
  props.procurements.reduce((sum, record) => sum + Number(record.costUgx || 0), 0)
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
  tonnage_desc: 'Highest tonnage',
  cost_desc: 'Highest cost',
  dealer_asc: 'Dealer A-Z'
};

// Apply search, optional produce-type filter, then selected sort order.
const filteredProcurements = computed(() => {
  const query = searchQuery.value.toLowerCase();
  const bySearch = props.procurements.filter((record) => {
    if (!query) return true;
    const haystack = [
      record.produceName,
      record.produceType,
      record.dealerName,
      record.branch
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });

  const byType =
    selectedProduceType.value === 'all'
      ? bySearch
      : bySearch.filter((record) => record.produceType === selectedProduceType.value);

  const sorted = [...byType];
  if (sortBy.value === 'oldest') {
    sorted.sort((a, b) => new Date(a.dateReceived || 0) - new Date(b.dateReceived || 0));
  } else if (sortBy.value === 'tonnage_desc') {
    sorted.sort((a, b) => Number(b.tonnageKg || 0) - Number(a.tonnageKg || 0));
  } else if (sortBy.value === 'cost_desc') {
    sorted.sort((a, b) => Number(b.costUgx || 0) - Number(a.costUgx || 0));
  } else if (sortBy.value === 'dealer_asc') {
    sorted.sort((a, b) => String(a.dealerName || '').localeCompare(String(b.dealerName || '')));
  } else {
    sorted.sort((a, b) => new Date(b.dateReceived || 0) - new Date(a.dateReceived || 0));
  }

  return sorted;
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredProcurements.value.length / pageSize.value))
);

const paginatedProcurements = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredProcurements.value.slice(start, start + pageSize.value);
});
const overviewItems = computed(() => [
  {
    label: 'Procurements',
    value: props.procurements.length.toLocaleString('en-UG'),
    meta: 'Loaded branch records'
  },
  {
    label: 'Visible Results',
    value: filteredProcurements.value.length.toLocaleString('en-UG'),
    meta: activeFilterCount.value
      ? `${activeFilterCount.value} filter(s) applied`
      : 'No filters applied'
  },
  {
    label: 'Total Tonnage',
    value: `${formatNumber(totalTonnage.value)} kg`,
    meta: 'Combined procurement volume'
  },
  {
    label: 'Procurement Cost',
    value: `UGX ${formatNumber(totalCost.value)}`,
    meta: sortLabelMap[sortBy.value] || 'Newest first'
  }
]);

// Clamp target page so pagination controls cannot exceed valid bounds.
const goToPage = (page) => {
  const nextPage = Math.max(1, Math.min(totalPages.value, Number(page || 1)));
  currentPage.value = nextPage;
};

const handlePageSizeUpdate = (size) => {
  pageSize.value = Number(size || 20);
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

watch([searchQuery, selectedProduceType, sortBy], () => {
  currentPage.value = 1;
});

const resetFilters = () => {
  searchQuery.value = '';
  selectedProduceType.value = 'all';
  sortBy.value = 'newest';
};

// Render numeric values with local grouping separators for easier scanning.
const formatNumber = (value) => {
  if (value === undefined || value === null) return '-';
  return Number(value).toLocaleString();
};

const formatDateTime = (dateValue, timeValue) => {
  return formatDisplayDateTime(dateValue, timeValue);
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
