import { ref } from 'vue';
import { priceAPI } from '../services/api';

// Create initial procurement form.
const createInitialProcurementForm = () => ({
  produceName: '',
  produceType: '',
  sourceType: '',
  dateReceived: new Date().toISOString().split('T')[0],
  timeReceived: new Date().toTimeString().slice(0, 5),
  tonnageKg: '',
  costUgx: '',
  sellingPrice: '',
  dealerName: '',
  dealerContact: ''
});

// Handle use procurement pricing.
const useProcurementPricing = () => {
  const priceSettings = ref({});
  const priceLocked = ref(true);

  // Handle load prices.
  const loadPrices = async () => {
    try {
      const response = await priceAPI.getAll();
      const map = {};
      response.data.forEach((entry) => {
        if (entry.source === 'managed' && typeof entry.priceUgx === 'number') {
          map[entry.produceType] = entry.priceUgx;
        }
      });
      priceSettings.value = map;
    } catch (fetchError) {
      console.error('Failed to load prices:', fetchError);
    }
  };

  // Handle apply price setting.
  const applyPriceSetting = (form) => {
    const price = priceSettings.value[form.produceType];
    if (typeof price === 'number') {
      form.sellingPrice = price;
    } else {
      form.sellingPrice = '';
    }
    priceLocked.value = true;
  };

  // Handle clear price lock.
  const clearPriceLock = () => {
    priceLocked.value = true;
  };

  return {
    priceSettings,
    priceLocked,
    loadPrices,
    applyPriceSetting,
    clearPriceLock
  };
};

// Format source.
const formatSource = (value) => {
  if (value === 'individual') return 'Individual';
  if (value === 'company') return 'Company';
  if (value === 'kgl_farm') return 'KGL Farm';
  return value || '-';
};

// Handle to date input.
const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export { createInitialProcurementForm, useProcurementPricing, formatSource, toDateInput };
