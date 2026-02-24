<template>
  <fieldset class="credit-section">
    <legend class="section-legend">
      <i class="bi bi-calendar2-check"></i>
      <span>Payment & Dispatch</span>
    </legend>
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Due Date *</label>
        <input type="date" class="form-control" v-model="form.dueDate" :min="todayIsoDate" required />
      </div>
      <div class="col-md-6">
        <label class="form-label">Date of Dispatch</label>
        <input type="date" class="form-control" v-model="form.dateOfDispatch" required />
      </div>
      <div class="col-md-6">
        <label class="form-label">Sales Agent</label>
        <input type="text" class="form-control branch-display" :value="user.name" disabled />
      </div>
      <div class="col-md-6">
        <label class="form-label">Branch</label>
        <input type="text" class="form-control branch-display" :value="user.branch" disabled />
      </div>
    </div>
  </fieldset>
</template>

<script setup>
const form = defineModel('form', {
  type: Object,
  required: true
});

const todayIsoDate = new Date().toISOString().split('T')[0];

defineProps({
  user: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>
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
