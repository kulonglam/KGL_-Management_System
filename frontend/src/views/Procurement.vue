<template>
  <div>
    <h2 class="page-title mb-4">Record Procurement</h2>

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
import { onMounted, ref } from 'vue';
import FormAlerts from '../components/common/FormAlerts.vue';
import ProcurementFormFields from '../components/procurement/ProcurementFormFields.vue';
import { useFormFeedback } from '../composables/useFormFeedback';
import {
  createInitialProcurementForm,
  useProcurementPricing
} from '../composables/useProcurementForm';
import { procurementAPI } from '../services/api';

// Configure user.
const user = ref({});
// Configure form.
const form = ref(createInitialProcurementForm());

const { loading, error, success, beginSubmit, endSubmit, setError, setSuccess, resetFeedback } =
  useFormFeedback();
const { priceLocked, loadPrices, applyPriceSetting, clearPriceLock } = useProcurementPricing();

// Handle type change.
const handleTypeChange = () => {
  applyPriceSetting(form.value);
};

// Handle reset form.
const resetForm = () => {
  form.value = createInitialProcurementForm();
  clearPriceLock();
  resetFeedback();
};

// Handle submit.
const handleSubmit = async () => {
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
  user.value = JSON.parse(localStorage.getItem('user') || '{}');
  await loadPrices();
});
</script>
