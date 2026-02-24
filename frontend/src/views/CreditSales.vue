<template>
  <div>
    <h2 class="page-title mb-4">Record Credit Sale</h2>

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
            @buyer-change="handleBuyerSelect"
          />

          <CreditProduceSection
            v-model:form="form"
            :inventory="inventory"
            @produce-change="updateProduceDetails"
            @tonnage-input="updatePrice"
          />

          <CreditDispatchSection v-model:form="form" :user="user" />

          <FormAlerts :stock-warning="stockWarning" :error="error" :success="success" />

          <div class="mt-4">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Record Credit Sale
            </button>
            <button type="button" class="btn btn-outline-danger ms-2" :disabled="loading" @click="resetForm">
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showReviewModal" class="modal-mask">
      <div class="modal-card credit-review-modal">
        <div class="modal-header">
          <h5 class="mb-0">Review Credit Sale</h5>
          <button type="button" class="btn-close" :disabled="loading" @click="closeReviewModal"></button>
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
              <label class="form-label fw-bold">Trusted Buyer</label>
              <select class="form-select" v-model="form.trustedBuyerId" @change="handleBuyerSelect">
                <option value="">Select trusted buyer</option>
                <option v-for="buyer in trustedBuyers" :key="buyer._id" :value="buyer._id">
                  {{ buyer.name }} ({{ buyer.nationalId }})
                </option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold">Produce Name</label>
              <select class="form-select" v-model="form.produceName" @change="updateProduceDetails">
                <option value="">Select produce</option>
                <option
                  v-for="item in inventory"
                  :key="`${item.produceName}-${item.produceType}`"
                  :value="item.produceName"
                >
                  {{ item.produceName }} ({{ item.produceType }}) - {{ item.totalTonnageKg }} kg
                </option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold">Tonnage (kg)</label>
              <input type="number" class="form-control" v-model="form.tonnageKg" min="1" @input="updatePrice" required />
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold">Amount Due (UGX)</label>
              <input type="number" class="form-control" :value="form.amountDueUgx" readonly />
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold">Due Date</label>
              <input type="date" class="form-control" v-model="form.dueDate" :min="todayIsoDate" required />
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold">Dispatch Date</label>
              <input type="date" class="form-control" v-model="form.dateOfDispatch" required />
            </div>
          </div>

          <div class="mt-4 d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-secondary" :disabled="loading" @click="closeReviewModal">
              Back
            </button>
            <button type="button" class="btn btn-primary" :disabled="loading" @click="confirmSaveCreditSale">
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
import { computed, onMounted, ref } from 'vue';
import { creditSalesAPI, inventoryAPI, trustedBuyersAPI } from '../services/api';
import { useFormFeedback } from '../composables/useFormFeedback';
import { useStockValidation } from '../composables/useStockValidation';
import FormAlerts from '../components/common/FormAlerts.vue';
import CreditBuyerSection from '../components/credit/CreditBuyerSection.vue';
import CreditProduceSection from '../components/credit/CreditProduceSection.vue';
import CreditDispatchSection from '../components/credit/CreditDispatchSection.vue';

const user = ref({});
const trustedBuyers = ref([]);
const inventory = ref([]);
const form = ref(createInitialForm());
const showReviewModal = ref(false);
const todayIsoDate = new Date().toISOString().split('T')[0];

const { loading, error, success, beginSubmit, endSubmit, setError, setSuccess } = useFormFeedback();
const { stockWarning, evaluateStock } = useStockValidation();

const canManageBuyers = computed(() => user.value.role === 'manager');

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

const loadInventory = async () => {
  try {
    const response = await inventoryAPI.get();
    inventory.value = response.data.inventory;
  } catch (fetchError) {
    console.error('Error loading inventory:', fetchError);
  }
};

const loadTrustedBuyers = async () => {
  try {
    const response = await trustedBuyersAPI.getAll();
    trustedBuyers.value = response.data;
  } catch (fetchError) {
    console.error('Error loading trusted buyers:', fetchError);
  }
};

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

const updateProduceDetails = () => {
  if (!form.value.produceName) {
    return;
  }

  const item = inventory.value.find((entry) => entry.produceName === form.value.produceName);
  if (!item) {
    return;
  }

  form.value.produceType = item.produceType;
  updatePrice();
};

const updatePrice = () => {
  const { amount } = evaluateStock(
    inventory.value,
    form.value.produceName,
    form.value.tonnageKg,
    form.value.produceType
  );
  form.value.amountDueUgx = amount || '';
};

const resetForm = () => {
  form.value = createInitialForm();
  stockWarning.value = '';
};

const openReviewModal = () => {
  if (stockWarning.value) {
    setError(stockWarning.value);
    return;
  }

  if (!form.value.trustedBuyerId) {
    setError('Please select a trusted buyer');
    return;
  }

  if (!form.value.produceName || !form.value.tonnageKg || !form.value.dueDate) {
    setError('Please complete required credit sale fields before review.');
    return;
  }

  const selectedDueDate = new Date(form.value.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  selectedDueDate.setHours(0, 0, 0, 0);
  if (Number.isNaN(selectedDueDate.getTime()) || selectedDueDate < today) {
    setError('Due date must be today or a future date.');
    return;
  }

  showReviewModal.value = true;
};

const closeReviewModal = () => {
  if (loading.value) return;
  showReviewModal.value = false;
};

const confirmSaveCreditSale = async () => {
  if (stockWarning.value) {
    setError(stockWarning.value);
    return;
  }

  if (!form.value.trustedBuyerId) {
    setError('Please select a trusted buyer');
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

const formatCurrency = (amount) => new Intl.NumberFormat('en-UG', {
  style: 'currency',
  currency: 'UGX',
  minimumFractionDigits: 0
}).format(Number(amount || 0));

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem('user') || '{}');
  await Promise.all([loadTrustedBuyers(), loadInventory()]);
});
</script>

<style scoped>
.credit-review-modal {
  max-width: 760px;
}

.credit-summary {
  background: linear-gradient(180deg, #f8fafc, #ecfdf5);
  border: 1px solid #dcfce7;
}
</style>
