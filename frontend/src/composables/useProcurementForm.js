/**
 * Provides procurement-form defaults and managed-price synchronization helpers.
 * File: frontend/src/composables/useProcurementForm.js
 */

import { ref } from 'vue';
import { priceAPI } from '../services/api';

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
  const priceLocked = ref(true);

  // Fetch managed prices and map them by produce type for quick lookup.
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

  // Apply the selected produce type price; clear when no managed price exists.
  const applyPriceSetting = (form) => {
    const price = priceSettings.value[form.produceType];
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

  return {
    priceSettings,
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
