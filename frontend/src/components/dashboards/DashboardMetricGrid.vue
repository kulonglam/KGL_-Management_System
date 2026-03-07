<template>
  <div class="row g-4 mb-4">
    <div
      v-for="item in items"
      :key="item.key || item.title"
      :class="item.columnClass || defaultColumnClass"
    >
      <div class="card metric-card">
        <div class="card-body">
          <span v-if="item.icon" class="metric-badge">
            <i :class="item.icon"></i>
          </span>
          <p class="metric-title">{{ item.title }}</p>
          <h3 class="metric-value">{{ item.value }}</h3>
          <small v-if="item.meta" class="metric-meta">{{ item.meta }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    default: () => []
  },
  defaultColumnClass: {
    type: String,
    default: 'col-xl-4 col-md-6'
  }
});
</script>
