// Provides procurement-form defaults and managed-price synchronization helpers.
 

import { ref } from 'vue';
import { priceAPI } from '../services/api';
import { normalizeProduceName, normalizeProduceNameKey, normalizeWhitespace } from '../utils/produceName.js';
const buildPriceKey = (produceName, produceType) =>
  `${normalizeWhitespace(produceType)}::${normalizeProduceNameKey(produceName) || '__type_default__'}`;

// Create a new procurement form object with current date/time defaults.
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

// Load manager-defined selling prices and apply them to procurement selections.
const useProcurementPricing = () => {
  const priceSettings = ref({});
  const priceTargetsByType = ref({});
  const priceLocked = ref(true);
  const priceLoadError = ref('');

  // Fetch managed prices and map them by produce identity for quick lookup.
  const loadPrices = async () => {
    priceLoadError.value = '';
    try {
      const response = await priceAPI.getAll();
      const map = {};
      const typeTargets = {};
      response.data.forEach((entry) => {
        if (entry.source === 'managed' && typeof entry.priceUgx === 'number') {
          map[buildPriceKey(entry.produceName, entry.produceType)] = entry.priceUgx;

          const normalizedType = normalizeWhitespace(entry.produceType);
          if (!typeTargets[normalizedType]) {
            typeTargets[normalizedType] = {
              names: [],
              hasTypeDefault: false
            };
          }

          const normalizedName = normalizeProduceName(entry.produceName);
          if (normalizedName) {
            typeTargets[normalizedType].names.push(normalizedName);
          } else {
            typeTargets[normalizedType].hasTypeDefault = true;
          }
        }
      });
      priceSettings.value = map;
      priceTargetsByType.value = Object.fromEntries(
        Object.entries(typeTargets).map(([produceType, value]) => [
          produceType,
          {
            names: [...new Set(value.names)].sort((left, right) => left.localeCompare(right)),
            hasTypeDefault: value.hasTypeDefault
          }
        ])
      );
    } catch (fetchError) {
      priceLoadError.value = fetchError.response?.data?.message || 'Unable to load selling prices.';
    }
  };

  // Apply the selected produce price, falling back to a type default when no specific override exists.
  const applyPriceSetting = (form) => {
    const exactPrice = priceSettings.value[buildPriceKey(form.produceName, form.produceType)];
    const typeDefaultPrice = priceSettings.value[buildPriceKey('', form.produceType)];
    const price = exactPrice ?? typeDefaultPrice;
    if (typeof price === 'number') {
      form.sellingPrice = price;
    } else {
      form.sellingPrice = '';
    }
    priceLocked.value = true;
  };

  // Keep the price field read-only because pricing is controlled centrally.
  const clearPriceLock = () => {
    priceLocked.value = true;
  };

  const getAvailableProduceNames = (produceType) =>
    priceTargetsByType.value[normalizeWhitespace(produceType)]?.names || [];

  const hasTypeDefaultPrice = (produceType) =>
    Boolean(priceTargetsByType.value[normalizeWhitespace(produceType)]?.hasTypeDefault);

  return {
    getAvailableProduceNames,
    priceSettings,
    hasTypeDefaultPrice,
    priceLocked,
    priceLoadError,
    loadPrices,
    applyPriceSetting,
    clearPriceLock
  };
};

// Normalize date-like input into HTML date input format (YYYY-MM-DD).
const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export { createInitialProcurementForm, useProcurementPricing, toDateInput };
