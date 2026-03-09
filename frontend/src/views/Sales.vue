<template>
  <div class="view-shell">
    <div class="view-header">
      <div class="view-heading">
        <h2 class="page-title">Record Sale</h2>
        <p class="page-subtitle">
          Capture branch cash sales with automatic pricing and a final review step.
        </p>
      </div>
      <div class="view-badges">
        <span class="view-badge view-badge--success">Manager-set pricing</span>
        <span class="view-badge view-badge--neutral">Review required</span>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Sale Details</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="openReviewModal">
          <SalesDetailsSection
            v-model:form="form"
            :inventory="inventory"
            :user="user"
            :errors="fieldErrors"
            @produce-change="updatePrice"
            @tonnage-input="updatePrice"
          />

          <FormAlerts :stock-warning="stockWarning" :error="error" :success="success" />

          <div class="form-action-bar">
            <div class="form-action-copy">
              
              <strong>
                Review the transaction before saving. Stock is reduced only after confirmation.
              </strong>
            </div>
            <div class="form-action-buttons">
              <button type="submit" class="btn btn-success" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                Review Sale
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="loading"
                @click="resetForm"
              >
                Clear Form
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showReviewModal" class="modal-mask" @click.self="closeReviewModal">
      <div
        ref="reviewModalRef"
        class="modal-card sale-review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cash-sale-review-title"
        tabindex="-1"
      >
        <div class="modal-header">
          <h5 id="cash-sale-review-title" class="mb-0">Review Cash Sale</h5>
          <button
            type="button"
            class="btn-close"
            aria-label="Close review modal"
            :disabled="loading"
            @click="closeReviewModal"
          ></button>
        </div>
        <div class="modal-body">
          <div class="review-summary-panel review-summary-panel--cash card border-0 mb-3">
            <div class="card-body py-2 px-3">
              <div class="row g-2">
                <div class="col-md-6">
                  <small class="text-muted d-block">Produce Name</small>
                  <strong>{{ form.produceName || '-' }}</strong>
                </div>
                <div class="col-md-6">
                  <small class="text-muted d-block">Buyer Name</small>
                  <strong>{{ form.buyerName || '-' }}</strong>
                </div>
                <div class="col-md-6">
                  <small class="text-muted d-block">Tonnage</small>
                  <strong>{{ Number(form.tonnageKg || 0).toLocaleString() }} kg</strong>
                </div>
                <div class="col-md-6">
                  <small class="text-muted d-block">Cash Amount</small>
                  <strong>{{ formatCurrency(form.amountPaidUgx) }}</strong>
                </div>
              </div>
            </div>
          </div>

          <p class="review-summary-note">
            Confirm only after checking the buyer, tonnage, and computed amount for this branch.
          </p>

          <div class="modal-action-row mt-4">
            <button
              type="button"
              class="btn btn-outline-secondary"
              :disabled="loading"
              @click="closeReviewModal"
            >
              Back
            </button>
            <button
              type="button"
              class="btn btn-success"
              :disabled="loading"
              @click="confirmSaveSale"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Save Cash Sale
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
// Cash-sales entry page: validates stock and captures sale details with review modal confirmation.
 
import { onMounted, ref } from 'vue';
import { inventoryAPI, salesAPI } from '../services/api';
import { useAutoClearFieldErrors } from '../composables/useAutoClearFieldErrors';
import { useFormFeedback } from '../composables/useFormFeedback';
import { useModalFocusTrap } from '../composables/useModalFocusTrap';
import { useFormValidation } from '../composables/useFormValidation';
import { useStockValidation } from '../composables/useStockValidation';
import { formatUgx } from '../utils/numberFormat';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';
import FormAlerts from '../components/common/FormAlerts.vue';
import SalesDetailsSection from '../components/sales/SalesDetailsSection.vue';
import { salesValidationSchema } from '../utils/formSchemas.js';

// Authenticated user context for default branch/agent display.
const user = ref({});
// Branch inventory used for produce selection and stock checks.
const inventory = ref([]);
// Cash-sale form state.
const form = ref(createInitialForm());
// Controls visibility of pre-submit review modal.
const showReviewModal = ref(false);
// DOM ref used for review modal focus management.
const reviewModalRef = ref(null);
const authStore = useAuthStore(pinia);

const { loading, error, success, beginSubmit, endSubmit, setError, setSuccess, resetFeedback } =
  useFormFeedback();
const { stockWarning, evaluateStock } = useStockValidation();
const { errors: fieldErrors, validateForm, clearFieldError, resetErrors } =
  useFormValidation(salesValidationSchema);
useAutoClearFieldErrors(form, clearFieldError);

const { captureTriggerFocus } = useModalFocusTrap({
  isOpen: showReviewModal,
  modalRef: reviewModalRef,
  onRequestClose: () => {
    closeReviewModal();
  }
});

// Build a fresh cash-sale form with current date/time defaults.
function createInitialForm() {
  return {
    produceName: '',
    produceType: '',
    tonnageKg: '',
    amountPaidUgx: '',
    buyerName: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5)
  };
}

// Load inventory options for produce dropdown and stock validations.
const loadInventory = async () => {
  try {
    const response = await inventoryAPI.get();
    inventory.value = response.data.inventory;
  } catch (fetchError) {
    console.error('Error loading inventory:', fetchError);
  }
};

// Calculate amount due from selected produce, tonnage, and managed selling price.
const updatePrice = () => {
  let result = evaluateStock(
    inventory.value,
    form.value.produceName,
    form.value.tonnageKg,
    form.value.produceType
  );
  if (!result.item && form.value.produceType) {
    result = evaluateStock(inventory.value, form.value.produceName, form.value.tonnageKg);
  }

  form.value.produceType = result.item?.produceType || '';
  form.value.amountPaidUgx = result.amount || '';
};

// Reset form, warnings, and validation errors.
const resetForm = ({ preserveFeedback = false } = {}) => {
  form.value = createInitialForm();
  stockWarning.value = '';
  resetErrors();
  if (!preserveFeedback) {
    resetFeedback();
  }
};

// Validate form then open review modal for final confirmation.
const openReviewModal = () => {
  const validation = validateForm(form.value);
  if (!validation.valid) {
    setError('Please fix highlighted fields before review.');
    return;
  }

  if (stockWarning.value) {
    setError(stockWarning.value);
    return;
  }

  captureTriggerFocus();
  showReviewModal.value = true;
};

// Close review modal unless submit is currently running.
const closeReviewModal = () => {
  if (loading.value) return;
  showReviewModal.value = false;
};

// Final submit action after review confirmation.
const confirmSaveSale = async () => {
  const validation = validateForm(form.value);
  if (!validation.valid) {
    setError('Please fix highlighted fields before saving.');
    return;
  }

  if (stockWarning.value) {
    setError(stockWarning.value);
    return;
  }

  beginSubmit();

  try {
    await salesAPI.create(form.value);
    setSuccess('Sale recorded successfully!');
    showReviewModal.value = false;
    resetForm({ preserveFeedback: true });
    await loadInventory();
  } catch (submitError) {
    setError(submitError.response?.data?.message || 'Failed to record sale');
  } finally {
    endSubmit();
  }
};

const formatCurrency = (amount) => formatUgx(amount);

onMounted(async () => {
  user.value = authStore.user || {};
  await loadInventory();
});
</script>

<style scoped>
.sale-review-modal {
  max-width: 760px;
}
</style>

