<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Record Procurement</h2>
      <p class="page-subtitle">Capture inbound produce, cost, and dealer details.</p>
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
            price-lock-hint="Price is controlled in Price Management."
            @type-change="handleTypeChange"
          />

          <FormAlerts :error="error" :success="success" />

          <div class="mt-4">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Record Procurement
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary ms-2"
              @click="resetForm"
              :disabled="loading"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import FormAlerts from '../components/common/FormAlerts.vue';
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
import { procurementValidationSchema } from '../utils/formSchemas.mjs';

// Configure user.
const user = ref({});
// Configure form.
const form = ref(createInitialProcurementForm());
const authStore = useAuthStore(pinia);

const { loading, error, success, beginSubmit, endSubmit, setError, setSuccess, resetFeedback } =
  useFormFeedback();
const { priceLocked, loadPrices, applyPriceSetting, clearPriceLock } = useProcurementPricing();
const { errors: fieldErrors, validateForm, clearFieldError, resetErrors } =
  useFormValidation(procurementValidationSchema);

// Handle type change.
const handleTypeChange = () => {
  applyPriceSetting(form.value);
};

// Handle reset form.
const resetForm = () => {
  form.value = createInitialProcurementForm();
  clearPriceLock();
  resetErrors();
  resetFeedback();
};

// Handle submit.
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
  authStore.hydrateFromStorage();
  user.value = authStore.user || {};
  await loadPrices();
});

watch(
  form,
  (next, previous) => {
    Object.keys(next).forEach((fieldName) => {
      if (next[fieldName] !== previous[fieldName]) {
        clearFieldError(fieldName);
      }
    });
  },
  { deep: true }
);
</script>
