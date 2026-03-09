<template>
  <div class="view-shell">
    <div class="view-header">
      <div class="view-heading">
        <h2 class="page-title">Record Procurement</h2>
        <p class="page-subtitle">
          Capture inbound stock, dealer details, and manager-controlled selling price.
        </p>
      </div>
      <div class="view-badges">
        <span class="view-badge view-badge--success">Manager-only entry</span>
        <span class="view-badge view-badge--neutral">Price Management linked</span>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Procurement Details</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <ProcurementFormFields
            v-model:form="form"
            :user="user"
            :price-locked="priceLocked"
            :errors="fieldErrors"
            :available-produce-names="availablePriceNames"
            :has-type-default-price="hasManagedTypeDefault"
            price-lock-hint="Selling price comes from Price Management."
            @type-change="handleTypeChange"
          />

          <FormAlerts :error="error" :success="success" />

          <div class="form-action-bar">
            <div class="form-action-copy">
              <strong>Saving adds stock to {{ user.branch || 'the current' }} branch.</strong>
              <span>
                Price per kilogram is pulled from Price Management once the produce name and type
                match an existing manager price or type default.
              </span>
            </div>
            <div class="form-action-buttons">
              <button type="submit" class="btn btn-success" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                Record Procurement
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="resetForm"
                :disabled="loading"
              >
                Clear Form
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Procurement entry page: validates input, applies managed pricing, and submits new records.
 * File: frontend/src/views/Procurement.vue
 */

import { computed, onMounted, ref, watch } from 'vue';
import FormAlerts from '../components/common/FormAlerts.vue';
import { useAutoClearFieldErrors } from '../composables/useAutoClearFieldErrors';
import ProcurementFormFields from '../components/procurement/ProcurementFormFields.vue';
import { useFormFeedback } from '../composables/useFormFeedback';
import { useFormValidation } from '../composables/useFormValidation';
import {
  createInitialProcurementForm,
  useProcurementPricing
} from '../composables/useProcurementForm';
import { procurementAPI } from '../services/api';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';
import { procurementValidationSchema } from '../utils/formSchemas.js';

// Authenticated user metadata used for branch context in the form.
const user = ref({});
// Reactive procurement form state.
const form = ref(createInitialProcurementForm());
const authStore = useAuthStore(pinia);

const { loading, error, success, beginSubmit, endSubmit, setError, setSuccess, resetFeedback } =
  useFormFeedback();
const {
  priceLocked,
  loadPrices,
  applyPriceSetting,
  clearPriceLock,
  getAvailableProduceNames,
  hasTypeDefaultPrice
} = useProcurementPricing();
const { errors: fieldErrors, validateForm, clearFieldError, resetErrors } =
  useFormValidation(procurementValidationSchema);
useAutoClearFieldErrors(form, clearFieldError);
const availablePriceNames = computed(() => getAvailableProduceNames(form.value.produceType));
const hasManagedTypeDefault = computed(() => hasTypeDefaultPrice(form.value.produceType));

// Re-apply manager-controlled price when produce type changes.
const handleTypeChange = () => {
  applyPriceSetting(form.value);
};

// Reset form values and clear visual validation/feedback state.
const resetForm = () => {
  form.value = createInitialProcurementForm();
  clearPriceLock();
  resetErrors();
  resetFeedback();
};

// Validate and submit procurement entry to backend.
const handleSubmit = async () => {
  const validation = validateForm(form.value);
  if (!validation.valid) {
    setError('Please fix highlighted fields and try again.');
    return;
  }

  beginSubmit();
  try {
    await procurementAPI.create(form.value);
    setSuccess('Procurement recorded successfully!');
    form.value = createInitialProcurementForm();
    clearPriceLock();
  } catch (submitError) {
    setError(submitError.response?.data?.message || 'Failed to record procurement');
  } finally {
    endSubmit();
  }
};

onMounted(async () => {
  user.value = authStore.user || {};
  await loadPrices();
  applyPriceSetting(form.value);
});

watch(
  [() => form.value.produceName, () => form.value.produceType],
  () => {
    applyPriceSetting(form.value);
  }
);
</script>

