<template>
  <div class="view-shell">
    <div class="view-header">
      <div class="view-heading">
        <h2 class="page-title">Record Credit Sale</h2>
        <p class="page-subtitle">
          Register trusted-buyer dispatches with automatic pricing and due-date tracking.
        </p>
      </div>
      <div class="view-badges">
        <span class="view-badge view-badge--accent">Trusted buyers only</span>
        <span class="view-badge view-badge--neutral">Review required</span>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">Credit Sale Details</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="openReviewModal">
          <CreditBuyerSection
            v-model:form="form"
            :trusted-buyers="trustedBuyers"
            :can-manage-buyers="canManageBuyers"
            :errors="fieldErrors"
            @buyer-change="handleBuyerSelect"
          />

          <CreditProduceSection
            v-model:form="form"
            :inventory="inventory"
            :errors="fieldErrors"
            @produce-change="updateProduceDetails"
            @tonnage-input="updatePrice"
          />

          <CreditDispatchSection v-model:form="form" :user="user" :errors="fieldErrors" />

          <FormAlerts :stock-warning="stockWarning" :error="error" :success="success" />

          <div class="form-action-bar">
            <div class="form-action-copy">
              
              <strong>
                Amount due is calculated automatically from the active manager-set price before
                you review and save.
              </strong>
            </div>
            <div class="form-action-buttons">
              <button type="submit" class="btn btn-success" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                Review Credit Sale
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
        class="modal-card credit-review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="credit-sale-review-title"
        tabindex="-1"
      >
        <div class="modal-header">
          <h5 id="credit-sale-review-title" class="mb-0">Review Credit Sale</h5>
          <button
            type="button"
            class="btn-close"
            aria-label="Close review modal"
            :disabled="loading"
            @click="closeReviewModal"
          ></button>
        </div>
        <div class="modal-body">
          <div class="review-summary-panel review-summary-panel--credit card border-0 mb-3">
            <div class="card-body py-2 px-3">
              <div class="row g-3">
                <div class="col-md-4">
                  <small class="text-muted d-block">Trusted Buyer</small>
                  <strong>{{ form.buyerName || '-' }}</strong>
                </div>
                <div class="col-md-4">
                  <small class="text-muted d-block">Produce</small>
                  <strong>{{ form.produceName || '-' }} <span v-if="form.produceType">({{ form.produceType }})</span></strong>
                </div>
                <div class="col-md-4">
                  <small class="text-muted d-block">Amount Due</small>
                  <strong>{{ formatCurrency(form.amountDueUgx) }}</strong>
                </div>
                <div class="col-md-4">
                  <small class="text-muted d-block">Tonnage</small>
                  <strong>{{ Number(form.tonnageKg || 0).toLocaleString() }} kg</strong>
                </div>
                <div class="col-md-4">
                  <small class="text-muted d-block">Due Date</small>
                  <strong>{{ formatDisplayDate(form.dueDate) }}</strong>
                </div>
                <div class="col-md-4">
                  <small class="text-muted d-block">Dispatch Date</small>
                  <strong>{{ formatDisplayDate(form.dateOfDispatch) }}</strong>
                </div>
                <div class="col-md-4">
                  <small class="text-muted d-block">Buyer Contact</small>
                  <strong>{{ form.contact || '-' }}</strong>
                </div>
                <div class="col-md-4">
                  <small class="text-muted d-block">Sales Agent</small>
                  <strong>{{ user.name || '-' }}</strong>
                </div>
              </div>
            </div>
          </div>

          <p class="review-summary-note">
            Confirm only after checking the trusted buyer, due date, tonnage, and computed
            balance.
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
              @click="confirmSaveCreditSale"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Save Credit Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Credit-sales entry page: selects trusted buyers, validates stock, and saves deferred-payment sales.
 * File: frontend/src/views/CreditSales.vue
 */

import { computed, onMounted, ref } from 'vue';
import { creditSalesAPI, inventoryAPI, trustedBuyersAPI } from '../services/api';
import { useAutoClearFieldErrors } from '../composables/useAutoClearFieldErrors';
import { useFormFeedback } from '../composables/useFormFeedback';
import { useModalFocusTrap } from '../composables/useModalFocusTrap';
import { useFormValidation } from '../composables/useFormValidation';
import { useStockValidation } from '../composables/useStockValidation';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';
import FormAlerts from '../components/common/FormAlerts.vue';
import CreditBuyerSection from '../components/credit/CreditBuyerSection.vue';
import CreditProduceSection from '../components/credit/CreditProduceSection.vue';
import CreditDispatchSection from '../components/credit/CreditDispatchSection.vue';
import { formatDisplayDate } from '../utils/dateFormat.js';
import { formatUgx } from '../utils/numberFormat';
import { creditSaleValidationSchema } from '../utils/formSchemas.js';
import { normalizeLocalPhone } from '../utils/phoneNumber.js';

// Authenticated user context for agent/branch-specific fields.
const user = ref({});
// Branch-approved trusted buyers used to populate buyer details.
const trustedBuyers = ref([]);
// Current inventory list used for produce selection and stock checks.
const inventory = ref([]);
// Credit-sale form state.
const form = ref(createInitialForm());
// Controls visibility of review modal prior to final save.
const showReviewModal = ref(false);
// DOM ref used for keyboard focus handling in review modal.
const reviewModalRef = ref(null);
const authStore = useAuthStore(pinia);

const { loading, error, success, beginSubmit, endSubmit, setError, setSuccess, resetFeedback } =
  useFormFeedback();
const { stockWarning, evaluateStock } = useStockValidation();
const { errors: fieldErrors, validateForm, clearFieldError, resetErrors } =
  useFormValidation(creditSaleValidationSchema);
useAutoClearFieldErrors(form, clearFieldError);

// Managers can navigate and maintain trusted buyers list.
const canManageBuyers = computed(() => user.value.role === 'manager');
const { captureTriggerFocus } = useModalFocusTrap({
  isOpen: showReviewModal,
  modalRef: reviewModalRef,
  onRequestClose: () => {
    closeReviewModal();
  }
});

// Build a fresh credit-sale form with dispatch date defaulted to today.
function createInitialForm() {
  return {
    trustedBuyerId: '',
    buyerName: '',
    nationalId: '',
    location: '',
    contact: '',
    produceName: '',
    produceType: '',
    tonnageKg: '',
    amountDueUgx: '',
    dueDate: '',
    dateOfDispatch: new Date().toISOString().split('T')[0]
  };
}

// Load inventory used for produce dropdown and amount calculations.
const loadInventory = async () => {
  try {
    const response = await inventoryAPI.get();
    inventory.value = response.data.inventory;
  } catch (fetchError) {
    console.error('Error loading inventory:', fetchError);
  }
};

// Load trusted-buyer records for buyer selection.
const loadTrustedBuyers = async () => {
  try {
    const response = await trustedBuyersAPI.getAll();
    trustedBuyers.value = response.data.map((item) => ({
      ...item,
      contact: normalizeLocalPhone(item.contact) || item.contact
    }));
  } catch (fetchError) {
    console.error('Error loading trusted buyers:', fetchError);
  }
};

// Copy selected trusted-buyer details into read-only form fields.
const handleBuyerSelect = () => {
  const buyer = trustedBuyers.value.find((entry) => entry._id === form.value.trustedBuyerId);
  if (!buyer) {
    form.value.buyerName = '';
    form.value.nationalId = '';
    form.value.location = '';
    form.value.contact = '';
    return;
  }

  form.value.buyerName = buyer.name;
  form.value.nationalId = buyer.nationalId;
  form.value.location = buyer.location;
  form.value.contact = normalizeLocalPhone(buyer.contact) || buyer.contact;
};

// Sync produce type and amount when produce selection changes.
const updateProduceDetails = () => {
  if (!form.value.produceName) {
    form.value.produceType = '';
    form.value.amountDueUgx = '';
    return;
  }

  let item = inventory.value.find(
    (entry) =>
      entry.produceName === form.value.produceName &&
      (!form.value.produceType || entry.produceType === form.value.produceType)
  );

  if (!item && form.value.produceType) {
    item = inventory.value.find((entry) => entry.produceName === form.value.produceName);
  }

  if (!item) {
    form.value.produceType = '';
    form.value.amountDueUgx = '';
    return;
  }

  form.value.produceType = item.produceType;
  updatePrice();
};

// Compute amount due from selected produce stock price and tonnage.
const updatePrice = () => {
  const { amount } = evaluateStock(
    inventory.value,
    form.value.produceName,
    form.value.tonnageKg,
    form.value.produceType
  );
  form.value.amountDueUgx = amount || '';
};

// Reset form fields plus validation and warning state.
const resetForm = ({ preserveFeedback = false } = {}) => {
  form.value = createInitialForm();
  stockWarning.value = '';
  resetErrors();
  if (!preserveFeedback) {
    resetFeedback();
  }
};

// Validate data before opening final confirmation modal.
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

// Close review modal unless submit is in progress.
const closeReviewModal = () => {
  if (loading.value) return;
  showReviewModal.value = false;
};

// Submit credit sale after modal confirmation and validation.
const confirmSaveCreditSale = async () => {
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
    await creditSalesAPI.create(form.value);
    setSuccess('Credit sale recorded successfully!');
    showReviewModal.value = false;
    resetForm({ preserveFeedback: true });
    await loadInventory();
  } catch (submitError) {
    setError(submitError.response?.data?.message || 'Failed to record credit sale');
  } finally {
    endSubmit();
  }
};

const formatCurrency = (amount) => formatUgx(amount);

onMounted(async () => {
  user.value = authStore.user || {};
  await Promise.all([loadTrustedBuyers(), loadInventory()]);
});
</script>

<style scoped>
.credit-review-modal {
  max-width: 760px;
}
</style>

