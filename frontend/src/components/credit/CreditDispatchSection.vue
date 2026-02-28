<template>
  <fieldset class="credit-section">
    <legend class="section-legend">
      <i class="bi bi-calendar2-check"></i>
      <span>Payment & Dispatch</span>
    </legend>
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label" for="credit-due-date">Due Date </label>
        <input
          id="credit-due-date"
          type="date"
          :class="['form-control', { 'is-invalid': errors.dueDate }]"
          v-model="form.dueDate"
          :min="todayIsoDate"
          required
        />
        <div v-if="errors.dueDate" class="invalid-feedback">{{ errors.dueDate }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label" for="credit-dispatch-date">Date of Dispatch</label>
        <input
          id="credit-dispatch-date"
          type="date"
          :class="['form-control', { 'is-invalid': errors.dateOfDispatch }]"
          v-model="form.dateOfDispatch"
          required
        />
        <div v-if="errors.dateOfDispatch" class="invalid-feedback">{{ errors.dateOfDispatch }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label" for="credit-sales-agent">Sales Agent</label>
        <input id="credit-sales-agent" type="text" class="form-control branch-display" :value="user.name" disabled />
      </div>
      <div class="col-md-6">
        <label class="form-label" for="credit-branch">Branch</label>
        <input id="credit-branch" type="text" class="form-control branch-display" :value="user.branch" disabled />
      </div>
    </div>
  </fieldset>
</template>

<script setup>
// Configure form.
const form = defineModel('form', {
  type: Object,
  required: true
});

// Configure today iso date.
const todayIsoDate = new Date().toISOString().split('T')[0];

defineProps({
  user: {
    type: Object,
    required: true
  },
  errors: {
    type: Object,
    default: () => ({})
  }
});
</script>

<style scoped>
/* Component styles */
.credit-section {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 0.95rem 0.95rem 1rem;
  background: #fbfcfd;
  min-width: 0;
}

.section-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.1rem;
  color: #1f2937;
  margin: 0 auto 0.8rem;
  padding: 0 0.45rem;
  text-align: center;
}

.section-legend i {
  color: #198754;
}

.credit-section .form-label {
  font-weight: 700;
  font-size: 0.95rem;
  color: #1f2937;
}

.branch-display {
  background-color: #f1f5f9;
  color: #334155;
  font-weight: 500;
}
</style>
