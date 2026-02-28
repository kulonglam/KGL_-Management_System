<template>
  <div class="card quick-actions-card">
    <div class="card-body">
      <div class="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-3">
        <div>
          <h5 class="mb-1">{{ title }}</h5>
          <p v-if="subtitle" class="quick-actions-subtitle mb-0">{{ subtitle }}</p>
        </div>
      </div>

      <div class="quick-actions-grid">
        <component
          :is="item.to ? 'router-link' : 'button'"
          v-for="item in items"
          :key="item.key || item.label"
          :to="item.to"
          type="button"
          class="quick-action-tile"
          @click="item.onClick ? item.onClick() : null"
        >
          <span class="quick-action-icon">
            <i :class="item.icon"></i>
          </span>
          <span class="quick-action-content">
            <span class="quick-action-label">{{ item.label }}</span>
            <small class="quick-action-meta">{{ item.meta }}</small>
          </span>
          <i class="bi bi-arrow-right-short quick-action-arrow"></i>
        </component>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: 'Quick Actions'
  },
  subtitle: {
    type: String,
    default: ''
  },
  items: {
    type: Array,
    default: () => []
  }
});
</script>

<style scoped>
.quick-actions-subtitle {
  color: var(--text-muted, #64748b);
  font-size: 0.84rem;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}

.quick-action-tile {
  border: 1px solid var(--surface-border, #e2e8f0);
  background: linear-gradient(160deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 0.7rem;
  padding: 0.72rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: inherit;
  text-align: left;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.quick-action-tile:hover {
  border-color: rgba(13, 110, 253, 0.35);
  box-shadow: 0 12px 20px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
  text-decoration: none;
  color: inherit;
}

.quick-action-tile:focus-visible {
  outline: none;
  border-color: rgba(14, 165, 233, 0.55);
  box-shadow: var(--focus-ring, 0 0 0 0.24rem rgba(14, 165, 233, 0.22));
}

.quick-action-icon {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 0.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(13, 110, 253, 0.09);
  color: #1d4ed8;
}

.quick-action-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.quick-action-label {
  font-weight: 700;
  font-size: 0.88rem;
  line-height: 1.2;
  color: #0f172a;
}

.quick-action-meta {
  color: #64748b;
  font-size: 0.75rem;
  line-height: 1.2;
}

.quick-action-arrow {
  margin-left: auto;
  color: #64748b;
}

@media (max-width: 991.98px) {
  .quick-actions-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 575.98px) {
  .quick-actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
