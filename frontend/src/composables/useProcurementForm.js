/**
 * Provides procurement-form defaults and managed-price synchronization helpers.
 * File: frontend/src/composables/useProcurementForm.js
 */

import { ref } from 'vue';
import { priceAPI } from '../services/api';

const normalizeWhitespace = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const PRODUCE_NAME_ALIASES = {
  'red bean': 'Red Beans',
  'red beans': 'Red Beans',
  'brown bean': 'Brown Beans',
  'brown beans': 'Brown Beans',
  'ground nut': 'Groundnuts',
  'ground nuts': 'Groundnuts',
  groundnut: 'Groundnuts',
  groundnuts: 'Groundnuts',
  'cow pea': 'Cow Peas',
  'cow peas': 'Cow Peas',
  'white maize': 'White Maize',
  'yellow maize': 'Yellow Maize'
};
const toTitleCase = (value) =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/\b([a-z])([a-z]*)/g, (_match, first, rest) => first.toUpperCase() + rest);
const normalizeProduceName = (value) => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return '';

  return PRODUCE_NAME_ALIASES[normalized.toLowerCase()] || toTitleCase(normalized);
};
const normalizeProduceNameKey = (value) =>
  normalizeProduceName(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
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

  // Fetch managed prices and map them by produce identity for quick lookup.
  const loadPrices = async () => {
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
      console.error('Failed to load prices:', fetchError);
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
    loadPrices,
    applyPriceSetting,
    clearPriceLock
  };
};

// Convert source enum values into display-friendly labels.
const formatSource = (value) => {
  if (value === 'individual') return 'Individual';
  if (value === 'company') return 'Company';
  if (value === 'kgl_farm') return 'KGL Farm';
  return value || '-';
};

// Normalize date-like input into HTML date input format (YYYY-MM-DD).
const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export { createInitialProcurementForm, useProcurementPricing, formatSource, toDateInput };
