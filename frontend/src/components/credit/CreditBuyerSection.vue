<template>
  <fieldset class="credit-section mb-3">
    <legend class="section-legend">
      <i class="bi bi-person-vcard"></i>
      <span>Buyer Information</span>
    </legend>
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Trusted Buyer </label>
        <select
          class="form-select"
          v-model="form.trustedBuyerId"
          @change="$emit('buyer-change')"
          required
        >
          <option value="">Select trusted buyer</option>
          <option v-for="buyer in trustedBuyers" :key="buyer._id" :value="buyer._id">
            {{ buyer.name }} ({{ buyer.nationalId }})
          </option>
        </select>
        <div class="mt-2">
          <small v-if="canManageBuyers" class="text-muted">
            Manage trusted buyers in the Trusted Buyers page.
          </small>
          <small v-else class="text-muted">Trusted buyers are managed by the manager.</small>
        </div>
      </div>
      <div class="col-md-6">
        <label class="form-label">National ID (NIN)</label>
        <input type="text" class="form-control branch-display" v-model="form.nationalId" disabled />
      </div>
      <div class="col-md-6">
        <label class="form-label">Location</label>
        <input type="text" class="form-control branch-display" v-model="form.location" disabled />
      </div>
      <div class="col-md-6">
        <label class="form-label">Contact</label>
        <input type="text" class="form-control branch-display" v-model="form.contact" disabled />
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

defineProps({
  trustedBuyers: {
    type: Array,
    required: true
  },
  canManageBuyers: {
    type: Boolean,
    required: true
  }
});

defineEmits(['buyer-change']);
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
