<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Record Credit Sale</h2>
      <p class="page-subtitle">Register trusted-buyer credit transactions with dispatch details.</p>
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

          <div class="mt-4">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Record Credit Sale
            </button>
            <button
              type="button"
              class="btn btn-outline-danger ms-2"
              :disabled="loading"
              @click="resetForm"
            >
              Reset Form
            </button>
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
          <div class="credit-summary card border-0 mb-3">
            <div class="card-body py-2 px-3">
              <div class="row g-2">
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
                  <strong>{{ form.dueDate || '-' }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label fw-bold" for="credit-review-buyer">Trusted Buyer</label>
              <select
                id="credit-review-buyer"
                :class="['form-select', { 'is-invalid': fieldErrors.trustedBuyerId }]"
                v-model="form.trustedBuyerId"
                @change="handleBuyerSelect"
              >
                <option value="">Select trusted buyer</option>
                <option v-for="buyer in trustedBuyers" :key="buyer._id" :value="buyer._id">
                  {{ buyer.name }} ({{ buyer.nationalId }})
                </option>
              </select>
              <div v-if="fieldErrors.trustedBuyerId" class="invalid-feedback">
                {{ fieldErrors.trustedBuyerId }}
              </div>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold" for="credit-review-produce">Produce Name</label>
              <select
                id="credit-review-produce"
                :class="['form-select', { 'is-invalid': fieldErrors.produceName }]"
                v-model="form.produceName"
                @change="handleReviewProduceChange"
              >
                <option value="">Select produce</option>
                <option
                  v-for="item in inventory"
                  :key="`${item.produceName}-${item.produceType}`"
                  :value="item.produceName"
                  :data-produce-type="item.produceType"
                >
                  {{ item.produceName }} ({{ item.produceType }}) - {{ item.totalTonnageKg }} kg
                </option>
              </select>
              <div v-if="fieldErrors.produceName" class="invalid-feedback">
                {{ fieldErrors.produceName }}
              </div>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold" for="credit-review-tonnage">Tonnage (kg)</label>
              <input
                id="credit-review-tonnage"
                type="number"
                :class="['form-control', { 'is-invalid': fieldErrors.tonnageKg }]"
                v-model="form.tonnageKg"
                min="1"
                @input="updatePrice"
                required
              />
              <div v-if="fieldErrors.tonnageKg" class="invalid-feedback">{{ fieldErrors.tonnageKg }}</div>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold" for="credit-review-amount">Amount Due (UGX)</label>
              <input
                id="credit-review-amount"
                type="number"
                :class="['form-control', { 'is-invalid': fieldErrors.amountDueUgx }]"
                :value="form.amountDueUgx"
                readonly
              />
              <div v-if="fieldErrors.amountDueUgx" class="invalid-feedback">{{ fieldErrors.amountDueUgx }}</div>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold" for="credit-review-due-date">Due Date</label>
              <input
                id="credit-review-due-date"
                type="date"
                :class="['form-control', { 'is-invalid': fieldErrors.dueDate }]"
                v-model="form.dueDate"
                :min="todayIsoDate"
                required
              />
              <div v-if="fieldErrors.dueDate" class="invalid-feedback">{{ fieldErrors.dueDate }}</div>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold" for="credit-review-dispatch-date">Dispatch Date</label>
              <input
                id="credit-review-dispatch-date"
                type="date"
                :class="['form-control', { 'is-invalid': fieldErrors.dateOfDispatch }]"
                v-model="form.dateOfDispatch"
                required
              />
              <div v-if="fieldErrors.dateOfDispatch" class="invalid-feedback">
                {{ fieldErrors.dateOfDispatch }}
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { creditSalesAPI, inventoryAPI, trustedBuyersAPI } from '../services/api';
import { useFormFeedback } from '../composables/useFormFeedback';
import { useFormValidation } from '../composables/useFormValidation';
import { useStockValidation } from '../composables/useStockValidation';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';
import FormAlerts from '../components/common/FormAlerts.vue';
import CreditBuyerSection from '../components/credit/CreditBuyerSection.vue';
import CreditProduceSection from '../components/credit/CreditProduceSection.vue';
import CreditDispatchSection from '../components/credit/CreditDispatchSection.vue';
import { creditSaleValidationSchema } from '../utils/formSchemas.mjs';

// Configure user.
const user = ref({});
// Configure trusted buyers.
const trustedBuyers = ref([]);
// Configure inventory.
const inventory = ref([]);
// Configure form.
const form = ref(createInitialForm());
// Configure show review modal.
const showReviewModal = ref(false);
// Configure review modal ref.
const reviewModalRef = ref(null);
// Configure last focused element before opening review modal.
const lastFocusedElement = ref(null);
// Configure today iso date.
const todayIsoDate = new Date().toISOString().split('T')[0];
const authStore = useAuthStore(pinia);

const { loading, error, success, beginSubmit, endSubmit, setError, setSuccess } = useFormFeedback();
const { stockWarning, evaluateStock } = useStockValidation();
const { errors: fieldErrors, validateForm, clearFieldError, resetErrors } =
  useFormValidation(creditSaleValidationSchema);

// Configure can manage buyers.
const canManageBuyers = computed(() => user.value.role === 'manager');

// Create initial form.
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

// Handle load inventory.
const loadInventory = async () => {
  try {
    const response = await inventoryAPI.get();
    inventory.value = response.data.inventory;
  } catch (fetchError) {
    console.error('Error loading inventory:', fetchError);
  }
};

// Handle load trusted buyers.
const loadTrustedBuyers = async () => {
  try {
    const response = await trustedBuyersAPI.getAll();
    trustedBuyers.value = response.data;
  } catch (fetchError) {
    console.error('Error loading trusted buyers:', fetchError);
  }
};

// Handle buyer select.
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
  form.value.contact = buyer.contact;
};

// Update produce details.
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

// Keep produce type synchronized when selecting produce from review modal.
const handleReviewProduceChange = (event) => {
  const selected = event?.target?.options?.[event.target.selectedIndex];
  form.value.produceType = selected?.dataset?.produceType || '';
  updateProduceDetails();
};

// Update price.
const updatePrice = () => {
  const { amount } = evaluateStock(
    inventory.value,
    form.value.produceName,
    form.value.tonnageKg,
    form.value.produceType
  );
  form.value.amountDueUgx = amount || '';
};

// Handle reset form.
const resetForm = () => {
  form.value = createInitialForm();
  stockWarning.value = '';
  resetErrors();
};

// Handle open review modal.
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

// Handle close review modal.
const closeReviewModal = () => {
  if (loading.value) return;
  showReviewModal.value = false;
};

// Focus review modal container when it opens.
const focusReviewModal = async () => {
  await nextTick();
  const firstFocusable = getReviewModalFocusableElements()[0];
  if (firstFocusable) {
    firstFocusable.focus();
    return;
  }
  reviewModalRef.value?.focus();
};

const getReviewModalFocusableElements = () =>
  Array.from(
    reviewModalRef.value?.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) || []
  );

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

const restorePreviousFocus = () => {
  const element = lastFocusedElement.value;
  if (element && typeof element.focus === 'function') {
    element.focus();
  }
};

// Handle review modal key events.
const handleReviewModalKeydown = (event) => {
  if (!showReviewModal.value) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeReviewModal();
    return;
  }

  trapReviewModalFocus(event);
};

// Handle confirm save credit sale.
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
    resetForm();
    await loadInventory();
  } catch (submitError) {
    setError(submitError.response?.data?.message || 'Failed to record credit sale');
  } finally {
    endSubmit();
  }
};

// Format currency.
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
  await Promise.all([loadTrustedBuyers(), loadInventory()]);
});
</script>

<style scoped>
/* Component styles */
.credit-review-modal {
  max-width: 760px;
}

.credit-summary {
  background: linear-gradient(180deg, #f8fafc, #ecfdf5);
  border: 1px solid #dcfce7;
}
</style>

