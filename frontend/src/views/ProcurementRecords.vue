<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Procurement Records</h2>
      <p class="page-subtitle">Review, edit, and remove procurement entries.</p>
    </div>

    <div v-if="editingId" class="modal-mask" @click.self="cancelEdit">
      <div
        class="modal-card procurement-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="procurement-edit-title"
      >
        <div class="modal-header">
          <h5 id="procurement-edit-title" class="mb-0">Update Procurement</h5>
          <button
            type="button"
            class="btn-close"
            aria-label="Close update procurement dialog"
            :disabled="loading"
            @click="cancelEdit"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleUpdate">
            <ProcurementFormFields
              v-model:form="form"
              :user="user"
              :price-locked="priceLocked"
              price-lock-hint="Price is controlled in Price Management."
              @type-change="handleTypeChange"
            />

            <FormAlerts :error="error" :success="success" />

            <div class="mt-4 d-flex justify-content-end gap-2">
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="loading"
                @click="cancelEdit"
              >
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                Update Procurement
              </button>
            </div>
          </form>
        </div>
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
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';

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
const authStore = useAuthStore(pinia);

const { loading, error, success, beginSubmit, endSubmit, setError, setSuccess, resetFeedback } =
  useFormFeedback();
const { priceLocked, loadPrices, applyPriceSetting, clearPriceLock } = useProcurementPricing();

// This handle type change.
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
  // Re-apply price rule on loaded values so locked/inferred pricing state matches current produce type.
  applyPriceSetting(form.value);
  resetFeedback();
};

// cancel edit procurement record.
const cancelEdit = () => {
  editingId.value = null;
  resetForm();
  resetFeedback();
};

//Uupdating procurement record.
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
    // If the deleted row is currently open in edit mode, close and reset that editor state.
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
  user.value = authStore.user || {};
  // Load managed pricing first so edit/create forms resolve the correct lock state immediately.
  await loadPrices();
  await loadProcurements();
});
</script>

<style scoped>
.procurement-edit-modal {
  max-width: 920px;
}
</style>

