<template>
  <div>
    <h2 class="mb-4">Inventory</h2>
    <p class="text-muted">
      {{ user.role === 'director' ? 'All branches' : user.branch }} inventory overview
    </p>

    <!-- Low Stock Alert -->
    <div v-if="lowStockItems.length > 0" class="alert alert-warning">
      <i class="bi bi-exclamation-triangle me-2"></i>
      <strong>Low Stock Alert!</strong> {{ lowStockAlertMessage }}
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
        <div v-if="inventory.length === 0" class="text-center py-5">
          <i class="bi bi-box" style="font-size: 4rem; color: #ccc"></i>
          <p class="text-muted mt-3">No inventory items</p>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover">
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
              <tr v-for="(item, idx) in inventory" :key="idx">
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
      </div>
    </div>
  </div>
</template>

<script>
import { inventoryAPI } from '../services/api';
import { formatCompactNumber, formatCompactCurrency } from '../utils/numberFormat';

export default {
  name: 'Inventory',
  data() {
    return {
      user: {},
      inventory: [],
      statistics: {
        totalItems: 0,
        totalWeight: 0,
        totalValue: 0,
        lowStockCount: 0
      }
    };
  },
  async created() {
    this.user = JSON.parse(localStorage.getItem('user'));
    await this.loadInventory();
  },
  computed: {
    // Handle low stock items.
    lowStockItems() {
      return this.inventory.filter((item) => Number(item.totalTonnageKg || 0) < 500);
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
    }
  },
  methods: {
    // Handle load inventory.
    async loadInventory() {
      try {
        const response = await inventoryAPI.get();
        this.inventory = response.data.inventory;
        this.statistics = response.data.statistics;
      } catch (error) {
        console.error('Error loading inventory:', error);
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
