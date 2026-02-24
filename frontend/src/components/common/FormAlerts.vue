<template>
  <div>
    <div v-if="stockWarning" class="alert alert-warning">
      <i class="bi bi-exclamation-triangle me-2"></i>{{ stockWarning }}
    </div>

    <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
    <div v-if="success" class="alert alert-success mt-3">{{ success }}</div>
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
