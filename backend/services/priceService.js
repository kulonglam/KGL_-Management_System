/**
 * Encapsulates produce-pricing rules: input validation, branch price row composition,
 * and synchronization of procurement selling prices when managed prices change.
 * File: backend/services/priceService.js
 */

import PriceSetting from '../models/PriceSetting.js';
import Procurement from '../models/Procurement.js';

// Canonical produce types supported by branch price settings.
const PRODUCE_TYPES = ['Beans', 'Grain Maize', 'Cow peas', 'G-nuts', 'Soybeans'];

// Validate produce type + numeric price input and return parsed price value.
const parseAndValidatePriceInput = (produceType, priceUgx) => {
  if (!produceType) {
    return { error: 'Produce type is required' };
  }

  if (!PRODUCE_TYPES.includes(produceType)) {
    return { error: 'Invalid produce type' };
  }

  const price = Number(priceUgx);
  if (!price || Number.isNaN(price) || price < 10000) {
    return { error: 'Price must be at least 10000 UGX' };
  }

  return { price };
};

// Build branch price grid containing managed prices plus inferred/unset fallback rows.
const getBranchPriceRows = async (branch) => {
  const settings = await PriceSetting.find({ branch }).sort({ produceType: 1 });
  const priceMap = {};

  settings.forEach((setting) => {
    priceMap[setting.produceType] = {
      _id: setting._id,
      produceType: setting.produceType,
      priceUgx: setting.priceUgx,
      source: 'managed'
    };
  });

  const procurements = await Procurement.find({ branch }).sort({ createdAt: -1 });
  procurements.forEach((procurement) => {
    if (priceMap[procurement.produceType] === undefined) {
      priceMap[procurement.produceType] = {
        _id: null,
        produceType: procurement.produceType,
        priceUgx: procurement.sellingPrice,
        source: 'inferred'
      };
    }
  });

  PRODUCE_TYPES.forEach((produceType) => {
    if (!priceMap[produceType]) {
      priceMap[produceType] = {
        _id: null,
        produceType,
        priceUgx: null,
        source: 'unset'
      };
    }
  });

  return PRODUCE_TYPES.map((produceType) => priceMap[produceType]);
};

// Propagate managed price updates to matching procurement records in the same branch.
const syncProcurementPrices = async (branch, produceType, priceUgx) => {
  const result = await Procurement.updateMany(
    { branch, produceType },
    { $set: { sellingPrice: priceUgx } }
  );

  return result.modifiedCount || 0;
};

export { PRODUCE_TYPES, parseAndValidatePriceInput, getBranchPriceRows, syncProcurementPrices };





