<template>
  <div>
    <!-- Show low stock or stock-related warnings. -->
    <div v-if="stockWarning" class="alert alert-warning" role="status" aria-live="polite">
      <i class="bi bi-exclamation-triangle me-2"></i>{{ stockWarning }}
    </div>

    <!-- Show general form feedback messages. -->
    <div v-if="error" class="alert alert-danger mt-3" role="alert" aria-live="assertive">
      <i class="bi bi-exclamation-octagon me-2"></i>{{ error }}
    </div>
    <div v-if="success" class="alert alert-success mt-3" role="status" aria-live="polite">
      <i class="bi bi-check-circle me-2"></i>{{ success }}
    </div>
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
