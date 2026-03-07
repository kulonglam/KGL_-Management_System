<template>
  <section class="summary-strip" :aria-label="label">
    <article v-for="item in items" :key="item.label" class="summary-tile">
      <span class="summary-tile-label">{{ item.label }}</span>
      <strong class="summary-tile-value">{{ item.value ?? '-' }}</strong>
      <span v-if="item.meta" class="summary-tile-meta">{{ item.meta }}</span>
    </article>
  </section>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: 'Overview'
  },
  items: {
    type: Array,
    default: () => []
  }
});
</script>
