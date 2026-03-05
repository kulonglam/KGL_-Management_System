/**
 * Evaluates inventory availability for sales forms and computes payable totals.
 * File: frontend/src/composables/useStockValidation.js
 */

import { ref } from 'vue';

// Expose stock warnings plus an inventory lookup utility for selected produce.
const useStockValidation = () => {
  const stockWarning = ref('');

  // Match selected produce against inventory and flag insufficient stock.
  const evaluateStock = (inventory, produceName, tonnageKg, produceType = '') => {
    const tonnage = Number(tonnageKg);
    if (!produceName || !tonnage || Number.isNaN(tonnage)) {
      stockWarning.value = '';
      return { item: null, amount: '' };
    }

    const item = inventory.find(
      (entry) =>
        entry.produceName === produceName && (!produceType || entry.produceType === produceType)
    );
    if (!item) {
      stockWarning.value = '';
      return { item: null, amount: '' };
    }

    stockWarning.value =
      tonnage > item.totalTonnageKg
        ? `Insufficient stock. Only ${item.totalTonnageKg} kg available.`
        : '';

    return {
      item,
      amount: item.sellingPrice * tonnage
    };
  };

  return {
    stockWarning,
    evaluateStock
  };
};

export { useStockValidation };
