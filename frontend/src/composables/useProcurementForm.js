import { ref } from 'vue';
import { priceAPI } from '../services/api';

const createInitialProcurementForm = () => ({
  name: '',
  type: '',
  sourceType: '',
  dateReceived: new Date().toISOString().split('T')[0],
  timeReceived: new Date().toTimeString().slice(0, 5),
  tonnageKg: '',
  costUgx: '',
  sellingPrice: '',
  dealerName: '',
  dealerContact: ''
});

const useProcurementPricing = () => {
  const priceSettings = ref({});
  const priceLocked = ref(false);

  const loadPrices = async () => {
    try {
      const response = await priceAPI.getAll();
      const map = {};
      response.data.forEach((entry) => {
        map[entry.produceType] = entry.priceUgx;
      });
      priceSettings.value = map;
    } catch (fetchError) {
      console.error('Failed to load prices:', fetchError);
    }
  };

  const applyPriceSetting = (form) => {
    const price = priceSettings.value[form.type];
    if (price) {
      form.sellingPrice = price;
      priceLocked.value = true;
    } else {
      priceLocked.value = false;
    }
  };

  const clearPriceLock = () => {
    priceLocked.value = false;
  };

  return {
    priceSettings,
    priceLocked,
    loadPrices,
    applyPriceSetting,
    clearPriceLock
  };
};

const formatSource = (value) => {
  if (value === 'individual') return 'Individual';
  if (value === 'company') return 'Company';
  if (value === 'own_farm') return 'Own Farm';
  return value || '-';
};

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export {
  createInitialProcurementForm,
  useProcurementPricing,
  formatSource,
  toDateInput
};
