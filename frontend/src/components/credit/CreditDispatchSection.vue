<template>
  <fieldset class="form-section">
    <legend class="form-section-legend">
      <i class="bi bi-calendar2-check"></i>
      <span>Payment & Dispatch</span>
    </legend>
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label" for="credit-due-date">Due Date</label>
        <input
          id="credit-due-date"
          type="date"
          :class="['form-control', { 'is-invalid': errors.dueDate }]"
          v-model="form.dueDate"
          required
        />
        <div v-if="errors.dueDate" class="invalid-feedback">{{ errors.dueDate }}</div>
        <small class="field-note">Use the payment date agreed with the trusted buyer.</small>
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
        <input id="credit-sales-agent" type="text" class="form-control readonly-display" :value="user.name" disabled />
      </div>
      <div class="col-md-6">
        <label class="form-label" for="credit-branch">Branch</label>
        <input id="credit-branch" type="text" class="form-control readonly-display" :value="user.branch" disabled />
      </div>
    </div>
  </fieldset>
</template>

<script setup>
// Shared credit-sale form model passed from parent view.
const form = defineModel('form', {
  type: Object,
  required: true
});

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
