import { formatDisplayTimestamp } from '../dateFormat.js';
import {
  alphaNumericMessage,
  minLengthMessage,
  minValueMessage,
  requiredMessage
} from '../validationMessages.js';

export const PRICE_PRODUCE_TYPES = [
  'Beans',
  'Grain Maize',
  'Cow peas',
  'Groundnuts',
  'Soybeans'
];

const ALPHANUMERIC_TEXT = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;

export const createDraftPrice = () => ({
  produceName: '',
  produceType: '',
  priceUgx: '',
  saving: false,
  error: ''
});

export const createEditableRow = (entry = {}) => ({
  _id: entry._id || null,
  produceName: entry.produceName || '',
  produceType: entry.produceType || '',
  priceUgx: entry.priceUgx ?? '',
  source: entry.source || 'managed',
  saving: false,
  deleting: false,
  error: ''
});

export const createEditDialog = () => ({
  show: false,
  saving: false,
  error: '',
  form: {
    _id: '',
    produceName: '',
    produceType: '',
    priceUgx: ''
  }
});

export const createDeleteDialog = () => ({
  show: false,
  priceId: '',
  label: '',
  processing: false
});

export const createHistoryDialog = () => ({
  show: false,
  priceId: '',
  label: '',
  loading: false,
  error: '',
  entries: []
});

export const normalizeProduceName = (value) => String(value || '').replace(/\s+/g, ' ').trim();

export const formatPriceCurrency = (value) =>
  Number(value || 0).toLocaleString('en-UG', {
    maximumFractionDigits: 0
  });

export const getPriceStatusLabel = (source) => {
  if (source === 'managed') return 'Managed';
  if (source === 'inferred') return 'Suggested';
  return 'Unknown';
};

const resolvePriceScope = (row) =>
  normalizeProduceName(row.produceName) ? 'specific' : 'type_default';

export const buildPriceOverviewItems = (rows) => {
  const managedCount = rows.filter((row) => row.source === 'managed').length;
  const specificCount = rows.filter(
    (row) => row.source === 'managed' && resolvePriceScope(row) === 'specific'
  ).length;
  const typeDefaultCount = rows.filter(
    (row) => row.source === 'managed' && resolvePriceScope(row) === 'type_default'
  ).length;

  return [
    {
      label: 'Managed',
      value: managedCount.toLocaleString('en-UG'),
      meta: 'Active branch price rows'
    },
    {
      label: 'Specific Prices',
      value: specificCount.toLocaleString('en-UG'),
      meta: 'Produce-name overrides'
    },
    {
      label: 'Type Defaults',
      value: typeDefaultCount.toLocaleString('en-UG'),
      meta: 'Fallback prices by type'
    }
  ];
};

export const actorLabel = (entry) =>
  entry.changedBy?.name || entry.changedBy?.username || 'Unknown user';

export const historyActionLabel = (action) => {
  if (action === 'create') return 'Created';
  if (action === 'update') return 'Updated';
  if (action === 'delete') return 'Deleted';
  return 'Changed';
};

export const formatHistoryTimestamp = (value) => formatDisplayTimestamp(value);

export const describeHistoryTarget = (produceName, produceType) => {
  const normalizedName = normalizeProduceName(produceName);
  if (normalizedName) {
    return `${normalizedName} (${produceType})`;
  }
  if (produceType) {
    return `${produceType} type default`;
  }
  return 'unknown price row';
};

export const describePrice = (target) => {
  const produceName = normalizeProduceName(target.produceName);
  if (produceName) {
    return `${produceName} (${target.produceType})`;
  }

  return `${target.produceType} type default`;
};

export const historySummary = (entry) => {
  const previousTarget = describeHistoryTarget(
    entry.previousProduceName,
    entry.previousProduceType
  );
  const nextTarget = describeHistoryTarget(entry.nextProduceName, entry.nextProduceType);

  if (entry.action === 'create') {
    return `Set ${nextTarget} to UGX ${formatPriceCurrency(entry.nextPriceUgx)}.`;
  }

  if (entry.action === 'delete') {
    return `Removed ${previousTarget} at UGX ${formatPriceCurrency(entry.previousPriceUgx)}.`;
  }

  return `Changed price from UGX ${formatPriceCurrency(entry.previousPriceUgx)} to UGX ${formatPriceCurrency(entry.nextPriceUgx)}.`;
};

export const historyTargetChange = (entry) => {
  if (entry.action !== 'update') return '';

  const previousTarget = describeHistoryTarget(
    entry.previousProduceName,
    entry.previousProduceType
  );
  const nextTarget = describeHistoryTarget(entry.nextProduceName, entry.nextProduceType);

  if (previousTarget === nextTarget) return '';
  return `Target changed from ${previousTarget} to ${nextTarget}.`;
};

export const validatePriceTarget = (target) => {
  const produceName = normalizeProduceName(target.produceName);

  if (produceName && produceName.length < 2) {
    return minLengthMessage('Produce Name', 2);
  }

  if (produceName && !ALPHANUMERIC_TEXT.test(produceName)) {
    return alphaNumericMessage('Produce Name');
  }

  if (!target.produceType) {
    return requiredMessage('Produce Type');
  }

  const price = Number(target.priceUgx);
  if (!price || Number.isNaN(price) || price < 10000) {
    return minValueMessage('Price per kg (UGX)', 10000);
  }

  return '';
};

export const buildPricePayload = (target) => ({
  produceName: normalizeProduceName(target.produceName) || undefined,
  produceType: target.produceType,
  priceUgx: Number(target.priceUgx)
});
