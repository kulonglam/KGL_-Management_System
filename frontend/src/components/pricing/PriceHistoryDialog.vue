<template>
  <div v-if="show" class="modal-mask" @click.self="$emit('close')">
    <div
      class="modal-card price-history-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="price-history-title"
    >
      <div class="modal-header">
        <h5 id="price-history-title" class="mb-0">Price History</h5>
        <button
          type="button"
          class="btn-close"
          aria-label="Close price history dialog"
          :disabled="loading"
          @click="$emit('close')"
        ></button>
      </div>
      <div class="modal-body">
        <p class="text-muted small mb-3">{{ label }}</p>

        <div v-if="loading" class="text-center py-4 text-muted">
          Loading price history...
        </div>
        <div v-else-if="error" class="alert alert-danger">
          {{ error }}
        </div>
        <div v-else-if="entries.length === 0" class="empty-state">
          No price history found for this row.
        </div>
        <div v-else class="history-list">
          <article
            v-for="entry in entries"
            :key="entry._id || `${entry.action}-${entry.createdAt}`"
            class="history-item"
          >
            <div class="history-item-header">
              <div class="d-flex flex-wrap align-items-center gap-2">
                <span class="history-action-badge" :class="`history-${entry.action}`">
                  {{ historyActionLabel(entry.action) }}
                </span>
                <strong>{{ actorLabel(entry) }}</strong>
              </div>
              <small class="text-muted">{{ formatHistoryTimestamp(entry.createdAt) }}</small>
            </div>
            <p class="history-summary mb-1">{{ historySummary(entry) }}</p>
            <p v-if="historyTargetChange(entry)" class="history-detail mb-0">
              {{ historyTargetChange(entry) }}
            </p>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  actorLabel,
  formatHistoryTimestamp,
  historyActionLabel,
  historySummary,
  historyTargetChange
} from '../../utils/pricing/priceManagement.js';

defineProps({
  show: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  entries: {
    type: Array,
    default: () => []
  }
});

defineEmits(['close']);
</script>

<style scoped>
.price-history-modal {
  max-width: 760px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.history-item {
  border: 1px solid #e2e8f0;
  border-radius: 0.8rem;
  padding: 0.9rem 1rem;
  background: #f8fafc;
}

.history-item-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.45rem;
}

.history-action-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.74rem;
  font-weight: 700;
  border: 1px solid transparent;
}

.history-create {
  background: #e8f8ee;
  border-color: #bbebcd;
  color: #0f766e;
}

.history-update {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.history-delete {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}

.history-summary {
  color: #0f172a;
  font-weight: 600;
}

.history-detail {
  color: #64748b;
  font-size: 0.88rem;
}
</style>
