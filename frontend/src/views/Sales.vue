<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Record Sale</h2>
      <p class="page-subtitle">Capture cash sales and review before submission.</p>
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

          <div class="mt-4">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Record Sale
            </button>
            <button
              type="button"
              class="btn btn-danger ms-2"
              :disabled="loading"
              @click="resetForm"
            >
              Clear Form
            </button>
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
          <div class="sale-summary card border-0 mb-3">
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

          <div class="mt-4 d-flex justify-content-end gap-2">
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
              class="btn btn-primary"
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
/**
 * Cash-sales entry page: validates stock and captures sale details with review modal confirmation.
 * File: frontend/src/views/Sales.vue
 */

import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { inventoryAPI, salesAPI } from '../services/api';
import { useFormFeedback } from '../composables/useFormFeedback';
import { useFormValidation } from '../composables/useFormValidation';
import { useStockValidation } from '../composables/useStockValidation';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';
import FormAlerts from '../components/common/FormAlerts.vue';
import SalesDetailsSection from '../components/sales/SalesDetailsSection.vue';
import { salesValidationSchema } from '../utils/formSchemas.mjs';

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
// Element that had focus before modal opened, restored on close.
const lastFocusedElement = ref(null);
const authStore = useAuthStore(pinia);

const { loading, error, success, beginSubmit, endSubmit, setError, setSuccess } = useFormFeedback();
const { stockWarning, evaluateStock } = useStockValidation();
const { errors: fieldErrors, validateForm, clearFieldError, resetErrors } =
  useFormValidation(salesValidationSchema);

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
const resetForm = () => {
  form.value = createInitialForm();
  stockWarning.value = '';
  resetErrors();
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

  lastFocusedElement.value = document.activeElement;
  showReviewModal.value = true;
};

// Close review modal unless submit is currently running.
const closeReviewModal = () => {
  if (loading.value) return;
  showReviewModal.value = false;
};

// Focus first interactive control when the review modal becomes visible.
const focusReviewModal = async () => {
  await nextTick();
  const firstFocusable = getReviewModalFocusableElements()[0];
  if (firstFocusable) {
    firstFocusable.focus();
    return;
  }
  reviewModalRef.value?.focus();
};

// Return focusable controls used to trap tab navigation inside modal.
const getReviewModalFocusableElements = () =>
  Array.from(
    reviewModalRef.value?.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) || []
  );

// Keep keyboard tab sequence contained inside the open review modal.
const trapReviewModalFocus = (event) => {
  if (!showReviewModal.value || event.key !== 'Tab') return;

  const focusable = getReviewModalFocusableElements();
  if (focusable.length === 0) {
    event.preventDefault();
    reviewModalRef.value?.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
};

// Restore focus to the control that launched the modal.
const restorePreviousFocus = () => {
  const element = lastFocusedElement.value;
  if (element && typeof element.focus === 'function') {
    element.focus();
  }
};

// Process keyboard shortcuts while review modal is open.
const handleReviewModalKeydown = (event) => {
  if (!showReviewModal.value) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeReviewModal();
    return;
  }

  trapReviewModalFocus(event);
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
    resetForm();
    await loadInventory();
  } catch (submitError) {
    setError(submitError.response?.data?.message || 'Failed to record sale');
  } finally {
    endSubmit();
  }
};

// Format UGX values for review card display.
const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0
  }).format(Number(amount || 0));

watch(showReviewModal, (isOpen) => {
  if (isOpen) {
    focusReviewModal();
    window.addEventListener('keydown', handleReviewModalKeydown);
    return;
  }
  window.removeEventListener('keydown', handleReviewModalKeydown);
  restorePreviousFocus();
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

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleReviewModalKeydown);
});

onMounted(async () => {
  user.value = authStore.user || {};
  await loadInventory();
});
</script>

<style scoped>
/* Component styles */
.sale-review-modal {
  max-width: 760px;
}

.sale-summary {
  background: linear-gradient(180deg, #f8fafc, #eef2ff);
  border: 1px solid #e2e8f0;
}
</style>

