<template>
  <div>
    <h2 class="page-title mb-4">Record Sale</h2>

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
            @produce-change="updatePrice"
            @tonnage-input="updatePrice"
          />

          <FormAlerts :stock-warning="stockWarning" :error="error" :success="success" />

          <div class="mt-4">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              Record Sale
            </button>
            <button type="button" class="btn btn-danger ms-2" :disabled="loading" @click="resetForm">
              Clear Form
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showReviewModal" class="modal-mask">
      <div class="modal-card sale-review-modal">
        <div class="modal-header">
          <h5 class="mb-0">Review Cash Sale</h5>
          <button type="button" class="btn-close" :disabled="loading" @click="closeReviewModal"></button>
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
            <button type="button" class="btn btn-outline-secondary" :disabled="loading" @click="closeReviewModal">
              Back
            </button>
            <button type="button" class="btn btn-primary" :disabled="loading" @click="confirmSaveSale">
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
import { onMounted, ref } from 'vue';
import { inventoryAPI, salesAPI } from '../services/api';
import { useFormFeedback } from '../composables/useFormFeedback';
import { useStockValidation } from '../composables/useStockValidation';
import FormAlerts from '../components/common/FormAlerts.vue';
import SalesDetailsSection from '../components/sales/SalesDetailsSection.vue';

const user = ref({});
const inventory = ref([]);
const form = ref(createInitialForm());
const showReviewModal = ref(false);

const { loading, error, success, beginSubmit, endSubmit, setError, setSuccess } = useFormFeedback();
const { stockWarning, evaluateStock } = useStockValidation();

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

const loadInventory = async () => {
  try {
    const response = await inventoryAPI.get();
    inventory.value = response.data.inventory;
  } catch (fetchError) {
    console.error('Error loading inventory:', fetchError);
  }
};

const updatePrice = () => {
  let result = evaluateStock(
    inventory.value,
    form.value.produceName,
    form.value.tonnageKg,
    form.value.produceType
  );
  if (!result.item && form.value.produceType) {
    result = evaluateStock(
      inventory.value,
      form.value.produceName,
      form.value.tonnageKg
    );
  }

  form.value.produceType = result.item?.produceType || '';
  form.value.amountPaidUgx = result.amount || '';
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

  if (!form.value.produceName || !form.value.tonnageKg || !form.value.buyerName) {
    setError('Please complete all required sale fields before review.');
    return;
  }

  showReviewModal.value = true;
};

const closeReviewModal = () => {
  if (loading.value) return;
  showReviewModal.value = false;
};

const confirmSaveSale = async () => {
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

const formatCurrency = (amount) => new Intl.NumberFormat('en-UG', {
  style: 'currency',
  currency: 'UGX',
  minimumFractionDigits: 0
}).format(Number(amount || 0));

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem('user') || '{}');
  await loadInventory();
});
</script>

<style scoped>
.sale-review-modal {
  max-width: 760px;
}

.sale-summary {
  background: linear-gradient(180deg, #f8fafc, #eef2ff);
  border: 1px solid #e2e8f0;
}
</style>
