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

    <div v-if="showReviewModal" class="modal-mask">
      <div class="modal-card sale-review-modal">
        <div class="modal-header">
          <h5 class="mb-0">Review Cash Sale</h5>
          <button
            type="button"
            class="btn-close"
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

    <div class="card mt-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Sales Records</h5>
        <button class="btn btn-outline-primary btn-sm" :disabled="loadingSalesList" @click="loadSalesRecords">
          <span v-if="loadingSalesList" class="spinner-border spinner-border-sm me-2"></span>
          Refresh
        </button>
      </div>
      <div class="card-body">
        <div v-if="salesRecords.length === 0" class="text-center py-5 text-muted">
          No sales records found.
        </div>
        <div v-else class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Produce</th>
                <th class="text-end">Quantity (kg)</th>
                <th class="text-end">Amount Paid (UGX)</th>
                <th>Buyer</th>
                <th>Sales Agent</th>
                <th>Date/Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in salesRecords" :key="item._id">
                <td>{{ item.produceName }} ({{ item.produceType }})</td>
                <td class="text-end">{{ Number(item.tonnageKg || 0).toLocaleString() }}</td>
                <td class="text-end">{{ formatCurrency(item.amountPaidUgx) }}</td>
                <td>{{ item.buyerName }}</td>
                <td>{{ item.salesAgentName || '-' }}</td>
                <td>{{ formatDateTime(item.date, item.time) }}</td>
              </tr>
            </tbody>
          </table>
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

// Configure user.
const user = ref({});
// Configure inventory.
const inventory = ref([]);
// Configure form.
const form = ref(createInitialForm());
// Configure show review modal.
const showReviewModal = ref(false);
// Configure sales records.
const salesRecords = ref([]);
// Configure loading sales list.
const loadingSalesList = ref(false);

const { loading, error, success, beginSubmit, endSubmit, setError, setSuccess } = useFormFeedback();
const { stockWarning, evaluateStock } = useStockValidation();

// Create initial form.
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

// Handle load inventory.
const loadInventory = async () => {
  try {
    const response = await inventoryAPI.get();
    inventory.value = response.data.inventory;
  } catch (fetchError) {
    console.error('Error loading inventory:', fetchError);
  }
};

// Handle load sales records.
const loadSalesRecords = async () => {
  loadingSalesList.value = true;
  try {
    const response = await salesAPI.getAll();
    salesRecords.value = response.data;
  } catch (fetchError) {
    console.error('Error loading sales records:', fetchError);
  } finally {
    loadingSalesList.value = false;
  }
};

// Update price.
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

// Handle reset form.
const resetForm = () => {
  form.value = createInitialForm();
  stockWarning.value = '';
};

// Handle open review modal.
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

// Handle close review modal.
const closeReviewModal = () => {
  if (loading.value) return;
  showReviewModal.value = false;
};

// Handle confirm save sale.
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
    await Promise.all([loadInventory(), loadSalesRecords()]);
  } catch (submitError) {
    setError(submitError.response?.data?.message || 'Failed to record sale');
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

// Format combined date and time.
const formatDateTime = (dateValue, timeValue) => {
  if (!dateValue && !timeValue) return '-';

  const date = dateValue ? new Date(dateValue) : null;
  const formattedDate =
    date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : String(dateValue || '-');
  const formattedTime = timeValue ? String(timeValue) : '-';

  return `${formattedDate} ${formattedTime}`;
};

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem('user') || '{}');
  await Promise.all([loadInventory(), loadSalesRecords()]);
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
