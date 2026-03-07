/**
 * Encapsulates produce-pricing rules: input validation, branch price row composition,
 * and synchronization of procurement selling prices when managed prices change.
 * File: backend/services/priceService.js
 */

import mongoose from 'mongoose';
import PriceSetting from '../models/PriceSetting.js';
import Procurement from '../models/Procurement.js';
import {
  normalizeProduceName,
  normalizeProduceNameKey,
  normalizeProduceType
} from '../utils/produceNormalization.js';

// Canonical produce types supported by branch price settings.
const PRODUCE_TYPES = ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans'];
const PRICE_SCOPE = {
  SPECIFIC: 'specific',
  TYPE_DEFAULT: 'type_default'
};
const ALPHANUMERIC_TEXT = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;

// Normalize optional produce names so blank input can represent a type-wide default price.
const normalizeOptionalProduceName = (value) => {
  if (value === undefined || value === null) return undefined;
  const normalized = normalizeProduceName(value);
  return normalized || undefined;
};

// Build a stable lookup key for one produce-specific or type-default price row.
const buildPriceLookupKey = ({ produceName, produceType }) => {
  const normalizedType = normalizeProduceType(produceType);
  const normalizedName = normalizeOptionalProduceName(produceName);

  return `${normalizedType}::${normalizedName ? normalizeProduceNameKey(normalizedName) : '__type_default__'}`;
};

// Translate one price identity into the mongo query used for exact lookups.
const buildPriceIdentityQuery = (branch, produceName, produceType) => {
  const normalizedType = normalizeProduceType(produceType);
  const normalizedName = normalizeOptionalProduceName(produceName);

  if (normalizedName) {
    return {
      branch,
      produceName: normalizedName,
      produceType: normalizedType
    };
  }

  return {
    branch,
    produceName: mongoose.trusted({ $in: [null, ''] }),
    produceType: normalizedType
  };
};

// Sort price rows consistently so type defaults stay near their matching produce-specific rows.
const comparePriceRows = (left, right) => {
  const typeComparison = String(left.produceType || '').localeCompare(String(right.produceType || ''));
  if (typeComparison !== 0) return typeComparison;

  const leftSpecificity = left.produceName ? 1 : 0;
  const rightSpecificity = right.produceName ? 1 : 0;
  if (leftSpecificity !== rightSpecificity) {
    return leftSpecificity - rightSpecificity;
  }

  return String(left.produceName || '').localeCompare(String(right.produceName || ''));
};

// Validate produce identity + numeric price input and return normalized values.
const parseAndValidatePriceInput = (produceName, produceType, priceUgx) => {
  if (!produceType) {
    return { error: 'Produce type is required' };
  }

  const normalizedType = normalizeProduceType(produceType);
  if (!PRODUCE_TYPES.includes(normalizedType)) {
    return { error: 'Invalid produce type' };
  }

  const normalizedName = normalizeOptionalProduceName(produceName);
  if (normalizedName) {
    if (normalizedName.length < 2) {
      return { error: 'Produce name must be at least 2 characters' };
    }

    if (!ALPHANUMERIC_TEXT.test(normalizedName)) {
      return { error: 'Produce name must be alphanumeric' };
    }
  }

  const price = Number(priceUgx);
  if (!price || Number.isNaN(price) || price < 10000) {
    return { error: 'Price must be at least 10000 UGX' };
  }

  return {
    price,
    produceName: normalizedName,
    produceType: normalizedType
  };
};

// Build branch price rows containing managed prices and inferred produce-specific suggestions.
const getBranchPriceRows = async (branch) => {
  const settings = await PriceSetting.find({ branch }).sort({ produceType: 1, produceName: 1 });
  const priceMap = new Map();

  settings.forEach((setting) => {
    const produceName = normalizeOptionalProduceName(setting.produceName);
    priceMap.set(buildPriceLookupKey(setting), {
      _id: setting._id,
      produceName: produceName || '',
      produceType: normalizeProduceType(setting.produceType),
      priceUgx: setting.priceUgx,
      source: 'managed',
      scope: produceName ? PRICE_SCOPE.SPECIFIC : PRICE_SCOPE.TYPE_DEFAULT
    });
  });

  const procurements = await Procurement.find({ branch }).sort({ createdAt: -1, produceType: 1, produceName: 1 });
  procurements.forEach((procurement) => {
    const key = buildPriceLookupKey(procurement);
    if (!priceMap.has(key)) {
      priceMap.set(key, {
        _id: null,
        produceName: normalizeProduceName(procurement.produceName),
        produceType: procurement.produceType,
        priceUgx: procurement.sellingPrice,
        source: 'inferred',
        scope: PRICE_SCOPE.SPECIFIC
      });
    }
  });

  return Array.from(priceMap.values()).sort(comparePriceRows);
};

// Propagate managed price updates to matching procurement records in the same branch.
const syncProcurementPrices = async (branch, produceName, produceType, priceUgx) => {
  const normalizedName = normalizeOptionalProduceName(produceName);
  const normalizedType = normalizeProduceType(produceType);

  if (normalizedName) {
    const result = await Procurement.updateMany(
      {
        branch,
        produceName: normalizedName,
        produceType: normalizedType
      },
      { $set: { sellingPrice: priceUgx } }
    );

    return result.modifiedCount || 0;
  }

  const produceNamesWithSpecificPrices = await PriceSetting.distinct('produceName', {
    branch,
    produceName: { $exists: true, $ne: null },
    produceType: normalizedType
  });
  const filter = {
    branch,
    produceType: normalizedType
  };

  if (produceNamesWithSpecificPrices.length > 0) {
    filter.produceName = { $nin: produceNamesWithSpecificPrices };
  }

  const result = await Procurement.updateMany(filter, { $set: { sellingPrice: priceUgx } });

  return result.modifiedCount || 0;
};

export {
  PRICE_SCOPE,
  PRODUCE_TYPES,
  buildPriceIdentityQuery,
  buildPriceLookupKey,
  getBranchPriceRows,
  normalizeOptionalProduceName,
  parseAndValidatePriceInput,
  syncProcurementPrices
};





