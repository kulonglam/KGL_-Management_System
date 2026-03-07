<template>
  <div v-if="stockWarning || error || success" class="feedback-stack">
    <div
      v-if="stockWarning"
      class="feedback-card feedback-card--warning"
      role="status"
      aria-live="polite"
    >
      <span class="feedback-card-icon">
        <i class="bi bi-exclamation-triangle"></i>
      </span>
      <div class="feedback-card-copy">
        <strong class="feedback-card-title">Stock alert</strong>
        <span>{{ stockWarning }}</span>
      </div>
    </div>

    <div
      v-if="error"
      class="feedback-card feedback-card--danger"
      role="alert"
      aria-live="assertive"
    >
      <span class="feedback-card-icon">
        <i class="bi bi-exclamation-octagon"></i>
      </span>
      <div class="feedback-card-copy">
        <strong class="feedback-card-title">Attention needed</strong>
        <span>{{ error }}</span>
      </div>
    </div>

    <div
      v-if="success"
      class="feedback-card feedback-card--success"
      role="status"
      aria-live="polite"
    >
      <span class="feedback-card-icon">
        <i class="bi bi-check-circle"></i>
      </span>
      <div class="feedback-card-copy">
        <strong class="feedback-card-title">Saved</strong>
        <span>{{ success }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stockWarning: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  success: {
    type: String,
    default: ''
  }
});
</script>
