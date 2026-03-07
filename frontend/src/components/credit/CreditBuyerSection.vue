<template>
  <fieldset class="form-section mb-0">
    <legend class="form-section-legend">
      <i class="bi bi-person-vcard"></i>
      <span>Buyer Information</span>
    </legend>
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label" for="credit-trusted-buyer">Trusted Buyer</label>
        <select
          id="credit-trusted-buyer"
          :class="['form-select', { 'is-invalid': errors.trustedBuyerId }]"
          v-model="form.trustedBuyerId"
          @change="$emit('buyer-change')"
          required
        >
          <option value="">Select trusted buyer</option>
          <option v-for="buyer in trustedBuyers" :key="buyer._id" :value="buyer._id">
            {{ buyer.name }} ({{ buyer.nationalId }})
          </option>
        </select>
        <div v-if="errors.trustedBuyerId" class="invalid-feedback">{{ errors.trustedBuyerId }}</div>
        <div class="mt-2">
          <small v-if="canManageBuyers" class="field-note">
            Buyer details are filled automatically from the Trusted Buyers page.
          </small>
          <small v-else class="field-note">
            Select a trusted buyer. The manager maintains this buyer registry.
          </small>
        </div>
      </div>
      <div class="col-md-6">
        <label class="form-label" for="credit-buyer-nin">National ID (NIN)</label>
        <input
          id="credit-buyer-nin"
          type="text"
          :class="['form-control readonly-display', { 'is-invalid': errors.nationalId }]"
          v-model="form.nationalId"
          disabled
        />
        <div v-if="errors.nationalId" class="invalid-feedback">{{ errors.nationalId }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label" for="credit-buyer-location">Location</label>
        <input
          id="credit-buyer-location"
          type="text"
          :class="['form-control readonly-display', { 'is-invalid': errors.location }]"
          v-model="form.location"
          disabled
        />
        <div v-if="errors.location" class="invalid-feedback">{{ errors.location }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label" for="credit-buyer-contact">Contact</label>
        <input
          id="credit-buyer-contact"
          type="text"
          :class="['form-control readonly-display', { 'is-invalid': errors.contact }]"
          v-model="form.contact"
          disabled
        />
        <div v-if="errors.contact" class="invalid-feedback">{{ errors.contact }}</div>
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
  trustedBuyers: {
    type: Array,
    required: true
  },
  canManageBuyers: {
    type: Boolean,
    required: true
  },
  errors: {
    type: Object,
    default: () => ({})
  }
});

defineEmits(['buyer-change']);
</script>
