<template>
  <div>
    <h2 class="page-title mb-4">Procurement Records</h2>

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
            <button type="button" class="btn btn-outline-secondary ms-2" :disabled="loading" @click="cancelEdit">
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
      @delete="deleteProcurement"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
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

const user = ref({});
const procurements = ref([]);
const loadingList = ref(false);
const editingId = ref(null);
const form = ref(createInitialProcurementForm());

const { loading, error, success, beginSubmit, endSubmit, setError, setSuccess, resetFeedback } =
  useFormFeedback();
const { priceLocked, loadPrices, applyPriceSetting, clearPriceLock } = useProcurementPricing();

const handleTypeChange = () => {
  applyPriceSetting(form.value);
};

const resetForm = () => {
  form.value = createInitialProcurementForm();
  clearPriceLock();
};

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

const startEdit = (item) => {
  editingId.value = item._id;
  form.value = {
    name: item.name || '',
    type: item.type || '',
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

const cancelEdit = () => {
  editingId.value = null;
  resetForm();
  resetFeedback();
};

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

const deleteProcurement = async (id) => {
  if (!confirm('Delete this procurement record?')) return;
  resetFeedback();
  try {
    await procurementAPI.delete(id);
    setSuccess('Procurement record deleted.');
    if (editingId.value === id) {
      cancelEdit();
    }
    await loadProcurements();
  } catch (deleteError) {
    setError(deleteError.response?.data?.message || 'Failed to delete procurement');
  }
};

onMounted(async () => {
  user.value = JSON.parse(localStorage.getItem('user') || '{}');
  await loadPrices();
  await loadProcurements();
});
</script>
