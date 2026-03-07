import { computed, onMounted, reactive, ref } from 'vue';
import { priceAPI } from '../services/api';
import {
  buildPriceOverviewItems,
  buildPricePayload,
  createDeleteDialog,
  createDraftPrice,
  createEditDialog,
  createEditableRow,
  createHistoryDialog,
  describePrice,
  formatPriceCurrency,
  getPriceStatusLabel,
  normalizeProduceName,
  PRICE_PRODUCE_TYPES,
  resolvePriceScope,
  validatePriceTarget
} from '../utils/pricing/priceManagement.mjs';

export function usePriceManagement() {
  const loading = ref(false);
  const globalError = ref('');
  const globalSuccess = ref('');
  const rows = ref([]);
  const draftPrice = reactive(createDraftPrice());
  const editDialog = reactive(createEditDialog());
  const deleteDialog = reactive(createDeleteDialog());
  const historyDialog = reactive(createHistoryDialog());

  const summaryItems = computed(() => buildPriceOverviewItems(rows.value));

  const clearMessages = () => {
    globalError.value = '';
    globalSuccess.value = '';
  };

  const resetDraft = () => {
    Object.assign(draftPrice, createDraftPrice());
  };

  const resetEditDialog = () => {
    Object.assign(editDialog, createEditDialog());
  };

  const loadPrices = async () => {
    loading.value = true;
    clearMessages();
    try {
      const response = await priceAPI.getAll();
      rows.value = response.data.map((entry) => createEditableRow(entry));
    } catch (error) {
      globalError.value = error.response?.data?.message || 'Failed to load prices';
    } finally {
      loading.value = false;
    }
  };

  const createPrice = async () => {
    clearMessages();
    draftPrice.error = '';

    const validationError = validatePriceTarget(draftPrice);
    if (validationError) {
      draftPrice.error = validationError;
      return;
    }

    draftPrice.saving = true;
    const payload = buildPricePayload(draftPrice);
    const label = describePrice(payload);

    try {
      await priceAPI.create(payload);
      resetDraft();
      await loadPrices();
      globalSuccess.value = `Price created for ${label}`;
    } catch (error) {
      draftPrice.error = error.response?.data?.message || 'Failed to create price';
    } finally {
      draftPrice.saving = false;
    }
  };

  const openEditDialog = (row) => {
    clearMessages();
    Object.assign(editDialog, {
      show: true,
      saving: false,
      error: '',
      form: {
        _id: row._id || '',
        produceName: row.produceName || '',
        produceType: row.produceType || '',
        priceUgx: row.priceUgx ?? ''
      }
    });
  };

  const closeEditDialog = () => {
    if (editDialog.saving) return;
    resetEditDialog();
  };

  const confirmEditDialog = async () => {
    clearMessages();
    editDialog.error = '';

    const validationError = validatePriceTarget(editDialog.form);
    if (validationError) {
      editDialog.error = validationError;
      return;
    }

    editDialog.saving = true;
    const payload = buildPricePayload(editDialog.form);
    const label = describePrice(payload);

    try {
      if (editDialog.form._id) {
        await priceAPI.update(editDialog.form._id, payload);
      } else {
        await priceAPI.create(payload);
      }
      await loadPrices();
      globalSuccess.value = `Price ${editDialog.form._id ? 'updated' : 'created'} for ${label}`;
      resetEditDialog();
    } catch (error) {
      editDialog.error = error.response?.data?.message || 'Failed to save price';
    } finally {
      editDialog.saving = false;
    }
  };

  const openDeleteDialog = (row) => {
    clearMessages();
    if (!row._id) {
      globalError.value = 'No managed price to delete';
      return;
    }

    Object.assign(deleteDialog, {
      show: true,
      priceId: row._id,
      label: describePrice(row),
      processing: false
    });
  };

  const closeDeleteDialog = () => {
    if (deleteDialog.processing) return;
    deleteDialog.show = false;
  };

  const confirmDeletePrice = async () => {
    if (!deleteDialog.priceId) return;
    clearMessages();
    deleteDialog.processing = true;

    try {
      await priceAPI.delete(deleteDialog.priceId);
      await loadPrices();
      globalSuccess.value = `Deleted managed price for ${deleteDialog.label}`;
    } catch (error) {
      globalError.value = error.response?.data?.message || 'Failed to delete price';
    } finally {
      deleteDialog.processing = false;
      deleteDialog.show = false;
    }
  };

  const openHistoryDialog = async (row) => {
    if (!row._id) return;

    Object.assign(historyDialog, {
      show: true,
      priceId: row._id,
      label: describePrice(row),
      loading: true,
      error: '',
      entries: []
    });

    try {
      const response = await priceAPI.getHistory(row._id);
      historyDialog.entries = response.data;
    } catch (error) {
      historyDialog.error = error.response?.data?.message || 'Failed to load price history';
    } finally {
      historyDialog.loading = false;
    }
  };

  const closeHistoryDialog = () => {
    if (historyDialog.loading) return;
    historyDialog.show = false;
  };

  onMounted(async () => {
    await loadPrices();
  });

  return {
    closeDeleteDialog,
    closeEditDialog,
    closeHistoryDialog,
    confirmDeletePrice,
    confirmEditDialog,
    createPrice,
    deleteDialog,
    draftPrice,
    editDialog,
    formatCurrency: formatPriceCurrency,
    globalError,
    globalSuccess,
    historyDialog,
    loadPrices,
    loading,
    normalizeProduceName,
    openDeleteDialog,
    openEditDialog,
    openHistoryDialog,
    priceStatusLabel: getPriceStatusLabel,
    produceTypes: PRICE_PRODUCE_TYPES,
    resolveScope: resolvePriceScope,
    rows,
    summaryItems
  };
}
