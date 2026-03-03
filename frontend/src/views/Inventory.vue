<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Inventory</h2>
      <p class="page-subtitle">
        {{ user.role === 'director' ? 'All branches' : user.branch }} inventory overview
      </p>
    </div>
    <div
      v-if="loadError"
      class="alert alert-danger d-flex align-items-start justify-content-between gap-3"
      role="alert"
    >
      <span>{{ loadError }}</span>
      <button type="button" class="btn btn-sm btn-outline-danger" :disabled="loading" @click="loadInventory">
        Retry
      </button>
    </div>
    <div v-if="loading" class="card mb-4" role="status" aria-live="polite">
      <div class="card-body d-flex align-items-center gap-2">
        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
        <span>Loading inventory data...</span>
      </div>
    </div>

    <!-- Low Stock Alert -->
    <div v-if="lowStockItems.length > 0" class="alert alert-warning">
      <i class="bi bi-exclamation-triangle me-2"></i>
      <strong>Low Stock Alert!</strong> {{ lowStockAlertMessage }}
    </div>
    <div v-if="outOfStockItems.length > 0" class="alert alert-danger">
      <i class="bi bi-x-octagon me-2"></i>
      <strong>Out of Stock!</strong> {{ outOfStockAlertMessage }}
    </div>

    <!-- Summary Cards -->
    <div class="row g-4 mb-4">
      <div class="col-md-3">
        <div class="card stats-card">
          <div class="card-body text-center">
            <i class="bi bi-box text-primary" style="font-size: 2rem"></i>
            <h6 class="text-muted mt-2">Total Items</h6>
            <h3>{{ statistics.totalItems }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card stats-card">
          <div class="card-body text-center">
            <i class="bi bi-box-seam text-success" style="font-size: 2rem"></i>
            <h6 class="text-muted mt-2">Total Weight</h6>
            <h3 class="stats-value">{{ formatCompactNumber(statistics.totalWeight) }} kg</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card stats-card">
          <div class="card-body text-center">
            <i class="bi bi-currency-exchange text-info" style="font-size: 2rem"></i>
            <h6 class="text-muted mt-2">Total Value</h6>
            <h3 class="stats-value">{{ formatStatCurrency(statistics.totalValue) }}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card stats-card">
          <div class="card-body text-center">
            <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem"></i>
            <h6 class="text-muted mt-2">Low Stock</h6>
            <h3>{{ statistics.lowStockCount }}</h3>
          </div>
        </div>
      </div>
    </div>

    <!-- Inventory Table -->
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Inventory Details</h5>
      </div>
      <div class="card-body">
        <div class="data-toolbar">
          <div class="data-toolbar-group">
            <div class="data-toolbar-field">
              <label class="form-label mb-1" for="inventory-search">Search</label>
              <input
                id="inventory-search"
                v-model.trim="searchQuery"
                type="text"
                class="form-control form-control-sm"
                placeholder="Produce, type, branch..."
              />
            </div>
            <div class="data-toolbar-field">
              <label class="form-label mb-1" for="inventory-status-filter">Status</label>
              <select id="inventory-status-filter" v-model="statusFilter" class="form-select form-select-sm">
                <option value="all">All statuses</option>
                <option value="in_stock">In stock</option>
                <option value="low_stock">Low stock</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
            </div>
            <div class="data-toolbar-field">
              <label class="form-label mb-1" for="inventory-sort">Sort By</label>
              <select id="inventory-sort" v-model="sortBy" class="form-select form-select-sm">
                <option value="stock_desc">Highest stock</option>
                <option value="stock_asc">Lowest stock</option>
                <option value="value_desc">Highest value</option>
                <option value="name_asc">Name A-Z</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            :disabled="!searchQuery && statusFilter === 'all' && sortBy === 'stock_desc'"
            @click="resetInventoryFilters"
          >
            Reset Filters
          </button>
        </div>

        <div v-if="inventory.length === 0" class="text-center py-5">
          <i class="bi bi-box" style="font-size: 4rem; color: #ccc"></i>
          <p class="text-muted mt-3">No inventory items</p>
        </div>
        <div v-else-if="filteredInventory.length === 0" class="empty-state">
          No inventory items match your current filters.
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover table-sticky table-row-hover">
            <thead class="table-light">
              <tr>
                <th>Produce Name</th>
                <th>Type</th>
                <th>Branch</th>
                <th class="text-end">Stock (kg)</th>
                <th class="text-end">Price/kg</th>
                <th class="text-end">Total Value</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in paginatedInventory" :key="idx">
                <td>
                  <strong>{{ item.produceName }}</strong>
                </td>
                <td>{{ item.produceType }}</td>
                <td>{{ item.branch }}</td>
                <td
                  class="text-end fw-bold"
                  :class="{
                    'text-danger': item.totalTonnageKg < 500,
                    'text-success': item.totalTonnageKg >= 500
                  }"
                >
                  {{ item.totalTonnageKg.toLocaleString() }}
                </td>
                <td class="text-end">{{ formatCurrency(item.sellingPrice) }}</td>
                <td class="text-end">
                  {{ formatCurrency(item.totalTonnageKg * item.sellingPrice) }}
                </td>
                <td class="text-center">
                  <span v-if="item.totalTonnageKg === 0" class="badge bg-danger">Out of Stock</span>
                  <span v-else-if="item.totalTonnageKg < 500" class="badge bg-warning"
                    >Low Stock</span
                  >
                  <span v-else class="badge bg-success">In Stock</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          :current-page="currentPage"
          :total-pages="totalInventoryPages"
          :total-items="filteredInventory.length"
          :page-size="pageSize"
          :page-size-options="pageSizeOptions"
          id-prefix="inventory-table"
          @update:currentPage="goToPage"
          @update:pageSize="handlePageSizeUpdate"
        />
      </div>
    </div>

    <!-- Out of Stock Table -->
    <div v-if="outOfStockItems.length > 0" class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Out of Stock Items</h5>
        <span class="badge bg-danger">{{ outOfStockItems.length }}</span>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead class="table-light">
              <tr>
                <th>Produce Name</th>
                <th>Type</th>
                <th>Branch</th>
                <th class="text-end">Stock (kg)</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in outOfStockItems" :key="`out-${idx}`">
                <td>
                  <strong>{{ item.produceName }}</strong>
                </td>
                <td>{{ item.produceType }}</td>
                <td>{{ item.branch }}</td>
                <td class="text-end fw-bold text-danger">
                  {{ Number(item.totalTonnageKg || 0).toLocaleString('en-UG') }}
                </td>
                <td class="text-center">
                  <span class="badge bg-danger">Out of Stock</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inventoryAPI } from '../services/api';
import TablePagination from '../components/common/TablePagination.vue';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';
import { formatCompactNumber, formatCompactCurrency } from '../utils/numberFormat';

export default {
  name: 'Inventory',
  components: {
    TablePagination
  },
  data() {
    return {
      user: {},
      loading: false,
      loadError: '',
      searchQuery: '',
      statusFilter: 'all',
      sortBy: 'stock_desc',
      currentPage: 1,
      pageSize: 20,
      pageSizeOptions: [10, 20, 50, 100],
      inventory: [],
      outOfStockItems: [],
      statistics: {
        totalItems: 0,
        totalWeight: 0,
        totalValue: 0,
        lowStockCount: 0
      }
    };
  },
  async created() {
    const authStore = useAuthStore(pinia);
    this.user = authStore.user || {};
    await this.loadInventory();
  },
  computed: {
    // Handle low stock items.
    lowStockItems() {
      return this.inventory.filter((item) => {
        const tonnage = Number(item.totalTonnageKg || 0);
        return tonnage > 0 && tonnage < 500;
      });
    },
    outOfStockAlertMessage() {
      const labels = this.outOfStockItems
        .map((item) => `${item.produceName} (${item.produceType})`)
        .slice(0, 4);

      if (labels.length === 0) return '';

      const suffix =
        this.outOfStockItems.length > 4 ? `, and ${this.outOfStockItems.length - 4} more` : '';

      return `${labels.join(', ')}${suffix} need restocking.`;
    },
    lowStockAlertMessage() {
      const labels = this.lowStockItems
        .map(
          (item) =>
            `${item.produceName} (${Number(item.totalTonnageKg || 0).toLocaleString('en-UG')} kg)`
        )
        .slice(0, 4);

      if (labels.length === 0) return '';

      const suffix =
        this.lowStockItems.length > 4 ? `, and ${this.lowStockItems.length - 4} more` : '';

      return `${labels.join(', ')}${suffix} running low on stock.`;
    },
    filteredInventory() {
      const query = this.searchQuery.trim().toLowerCase();
      const searched = this.inventory.filter((item) => {
        if (!query) return true;
        const haystack = [item.produceName, item.produceType, item.branch]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });

      const filteredByStatus =
        this.statusFilter === 'all'
          ? searched
          : searched.filter((item) => {
              const stock = Number(item.totalTonnageKg || 0);
              if (this.statusFilter === 'out_of_stock') return stock === 0;
              if (this.statusFilter === 'low_stock') return stock > 0 && stock < 500;
              return stock >= 500;
            });

      const sorted = [...filteredByStatus];
      if (this.sortBy === 'stock_asc') {
        sorted.sort((a, b) => Number(a.totalTonnageKg || 0) - Number(b.totalTonnageKg || 0));
      } else if (this.sortBy === 'value_desc') {
        sorted.sort(
          (a, b) =>
            Number((b.totalTonnageKg || 0) * (b.sellingPrice || 0)) -
            Number((a.totalTonnageKg || 0) * (a.sellingPrice || 0))
        );
      } else if (this.sortBy === 'name_asc') {
        sorted.sort((a, b) => String(a.produceName || '').localeCompare(String(b.produceName || '')));
      } else {
        sorted.sort((a, b) => Number(b.totalTonnageKg || 0) - Number(a.totalTonnageKg || 0));
      }

      return sorted;
    },
    totalInventoryPages() {
      return Math.max(1, Math.ceil(this.filteredInventory.length / this.pageSize));
    },
    paginatedInventory() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredInventory.slice(start, start + this.pageSize);
    }
  },
  watch: {
    pageSize() {
      this.currentPage = 1;
    },
    inventory() {
      if (this.currentPage > this.totalInventoryPages) {
        this.currentPage = this.totalInventoryPages;
      }
    },
    searchQuery() {
      this.currentPage = 1;
    },
    statusFilter() {
      this.currentPage = 1;
    },
    sortBy() {
      this.currentPage = 1;
    }
  },
  methods: {
    // Handle load inventory.
    async loadInventory() {
      this.loading = true;
      this.loadError = '';
      try {
        const response = await inventoryAPI.get();
        this.inventory = response.data.inventory || [];
        this.outOfStockItems = response.data.outOfStockItems || [];
        this.statistics = response.data.statistics || {};
      } catch (error) {
        this.loadError = error.response?.data?.message || 'Failed to load inventory data.';
      } finally {
        this.loading = false;
      }
    },
    formatCurrency(amount) {
      return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0
      }).format(amount);
    },
    formatStatCurrency(amount) {
      return formatCompactCurrency(amount);
    },
    resetInventoryFilters() {
      this.searchQuery = '';
      this.statusFilter = 'all';
      this.sortBy = 'stock_desc';
      this.currentPage = 1;
    },
    goToPage(page) {
      const nextPage = Math.max(1, Math.min(this.totalInventoryPages, Number(page || 1)));
      this.currentPage = nextPage;
    },
    handlePageSizeUpdate(size) {
      this.pageSize = Number(size || 20);
    },
    formatCompactNumber
  }
};
</script>

<style scoped>
/* Component styles */
.stats-value {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: clamp(1.4rem, 1.8vw, 1.95rem);
}
</style>

