<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Procurement Records</h2>
      <p class="page-subtitle">Review, edit, and remove procurement entries.</p>
    </div>

    <div v-if="editingId" class="card mb-4">
      <div class="card-header">
        <h5 class="mb-0">Update Procurement</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleUpdate">
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
              Update Procurement
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary ms-2"
              :disabled="loading"
              @click="cancelEdit"
            >
              Cancel Edit
            </button>
          </div>
        </form>
      </div>
    </div>

    <ProcurementRecordsTable
      :procurements="procurements"
      :loading="loadingList"
      @refresh="loadProcurements"
      @edit="startEdit"
      @delete="openDeleteDialog"
    />

    <ConfirmDialog
      :show="deleteDialog.show"
      title="Delete Procurement"
      message="Delete this procurement record? This action cannot be undone."
      confirm-text="Delete"
      :busy="deleteDialog.processing"
      @cancel="closeDeleteDialog"
      @confirm="confirmDeleteProcurement"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import ConfirmDialog from '../components/common/ConfirmDialog.vue';
import FormAlerts from '../components/common/FormAlerts.vue';
import ProcurementFormFields from '../components/procurement/ProcurementFormFields.vue';
import ProcurementRecordsTable from '../components/procurement/ProcurementRecordsTable.vue';
import { useFormFeedback } from '../composables/useFormFeedback';
import {
  createInitialProcurementForm,
  toDateInput,
  useProcurementPricing
} from '../composables/useProcurementForm';
import { procurementAPI } from '../services/api';

// Configure user.
const user = ref({});
// Configure procurements.
const procurements = ref([]);
// Configure loading list.
const loadingList = ref(false);
// Configure editing id.
const editingId = ref(null);
// Configure form.
const form = ref(createInitialProcurementForm());
// Configure delete dialog state.
const deleteDialog = ref({
  show: false,
  procurementId: '',
  processing: false
});

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
};

// Handle load procurements.
const loadProcurements = async () => {
  loadingList.value = true;
  try {
    const response = await procurementAPI.getAll();
    procurements.value = response.data;
  } catch (fetchError) {
    setError(fetchError.response?.data?.message || 'Failed to load procurement records');
  } finally {
    loadingList.value = false;
  }
};

// Handle start edit.
const startEdit = (item) => {
  editingId.value = item._id;
  form.value = {
    produceName: item.produceName || '',
    produceType: item.produceType || '',
    sourceType: item.sourceType || '',
    dateReceived: toDateInput(item.dateReceived),
    timeReceived: item.timeReceived || '',
    tonnageKg: item.tonnageKg || '',
    costUgx: item.costUgx || '',
    dealerName: item.dealerName || '',
    dealerContact: item.dealerContact || '',
    sellingPrice: item.sellingPrice || ''
  };
  applyPriceSetting(form.value);
  resetFeedback();
};

// Handle cancel edit.
const cancelEdit = () => {
  editingId.value = null;
  resetForm();
  resetFeedback();
};

// Handle update.
const handleUpdate = async () => {
  if (!editingId.value) return;
  beginSubmit();
  try {
    await procurementAPI.update(editingId.value, form.value);
    setSuccess('Procurement updated successfully!');
    editingId.value = null;
    resetForm();
    await loadProcurements();
  } catch (submitError) {
    setError(submitError.response?.data?.message || 'Failed to update procurement');
  } finally {
    endSubmit();
  }
};

const openDeleteDialog = (id) => {
  deleteDialog.value = {
    show: true,
    procurementId: id,
    processing: false
  };
};

const closeDeleteDialog = () => {
  if (deleteDialog.value.processing) return;
  deleteDialog.value.show = false;
};

// Delete procurement.
const confirmDeleteProcurement = async () => {
  if (!deleteDialog.value.procurementId) return;
  deleteDialog.value.processing = true;
  resetFeedback();
  try {
    await procurementAPI.delete(deleteDialog.value.procurementId);
    setSuccess('Procurement record deleted.');
    if (editingId.value === deleteDialog.value.procurementId) {
      cancelEdit();
    }
    await loadProcurements();
  } catch (deleteError) {
    setError(deleteError.response?.data?.message || 'Failed to delete procurement');
  } finally {
    deleteDialog.value.processing = false;
    deleteDialog.value.show = false;
  }
};

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem('user') || '{}');
  await loadPrices();
  await loadProcurements();
});
</script>
