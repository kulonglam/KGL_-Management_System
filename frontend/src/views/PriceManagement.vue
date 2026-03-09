<template>
  <div class="price-page view-shell">
    <div class="view-header">
      <div class="view-heading">
        <h2 class="page-title">Price Management</h2>
        <p class="page-subtitle mb-0">
          Manage branch-level prices by produce name, with optional type defaults.
        </p>
      </div>
      <div class="view-actions">
        <button class="btn btn-outline-primary refresh-btn" @click="loadPrices" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </button>
      </div>
    </div>

    <div v-if="globalError" class="alert alert-danger">{{ globalError }}</div>
    <div v-if="globalSuccess" class="alert alert-success">{{ globalSuccess }}</div>

    <InsightStrip label="Price overview" :items="summaryItems" />

    <PriceCreateCard
      v-model:produce-name="draftPrice.produceName"
      v-model:produce-type="draftPrice.produceType"
      v-model:price-ugx="draftPrice.priceUgx"
      :saving="draftPrice.saving"
      :error="draftPrice.error"
      :produce-types="produceTypes"
      @submit="createPrice"
    />

    <PriceTableCard
      :rows="rows"
      :format-currency="formatCurrency"
      :normalize-produce-name="normalizeProduceName"
      :price-status-label="priceStatusLabel"
      @edit="openEditDialog"
      @history="openHistoryDialog"
      @delete="openDeleteDialog"
    />

    <PriceEditorDialog
      :show="editDialog.show"
      :form="editDialog.form"
      :produce-types="produceTypes"
      :saving="editDialog.saving"
      :error="editDialog.error"
      @close="closeEditDialog"
      @submit="confirmEditDialog"
    />

    <PriceHistoryDialog
      :show="historyDialog.show"
      :loading="historyDialog.loading"
      :error="historyDialog.error"
      :label="historyDialog.label"
      :entries="historyDialog.entries"
      @close="closeHistoryDialog"
    />

    <ConfirmDialog
      :show="deleteDialog.show"
      title="Delete Managed Price"
      :message="`Delete managed price for ${deleteDialog.label}?`"
      confirm-text="Delete"
      :busy="deleteDialog.processing"
      @cancel="closeDeleteDialog"
      @confirm="confirmDeletePrice"
    />
  </div>
</template>

<script setup>
import ConfirmDialog from '../components/common/ConfirmDialog.vue';
import InsightStrip from '../components/common/InsightStrip.vue';
import PriceCreateCard from '../components/pricing/PriceCreateCard.vue';
import PriceEditorDialog from '../components/pricing/PriceEditorDialog.vue';
import PriceHistoryDialog from '../components/pricing/PriceHistoryDialog.vue';
import PriceTableCard from '../components/pricing/PriceTableCard.vue';
import { usePriceManagement } from '../composables/usePriceManagement.js';

const {
  closeDeleteDialog,
  closeEditDialog,
  closeHistoryDialog,
  confirmDeletePrice,
  confirmEditDialog,
  createPrice,
  deleteDialog,
  draftPrice,
  editDialog,
  formatCurrency,
  globalError,
  globalSuccess,
  historyDialog,
  loadPrices,
  loading,
  normalizeProduceName,
  openDeleteDialog,
  openEditDialog,
  openHistoryDialog,
  priceStatusLabel,
  produceTypes,
  rows,
  summaryItems
} = usePriceManagement();
</script>

<style scoped>
.price-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.refresh-btn {
  min-width: 115px;
}
</style>
