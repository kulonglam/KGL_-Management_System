<template>
  <div>
    <!-- Show low stock or stock-related warnings. -->
    <div v-if="stockWarning" class="alert alert-warning">
      <i class="bi bi-exclamation-triangle me-2"></i>{{ stockWarning }}
    </div>

    <!-- Show general form feedback messages. -->
    <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
    <div v-if="success" class="alert alert-success mt-3">{{ success }}</div>
  </div>
</template>

<script setup>
// Define props for all alert message states.
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
