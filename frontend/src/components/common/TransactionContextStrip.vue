<template>
  <section class="transaction-context" :aria-label="label">
    <div class="transaction-context-grid">
      <article
        v-for="item in items"
        :key="item.label"
        class="transaction-context-item"
      >
        <span class="transaction-context-label">{{ item.label }}</span>
        <strong class="transaction-context-value">{{ item.value || '-' }}</strong>
        <small v-if="item.note" class="transaction-context-note">{{ item.note }}</small>
      </article>
    </div>
  </section>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    default: 'Transaction context'
  },
  items: {
    type: Array,
    default: () => []
  }
});
</script>
