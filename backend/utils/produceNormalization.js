/**
 * Supplies shared utility helpers used across multiple backend modules.
 * File: backend/utils/produceNormalization.js
 */

// Normalize whitespace and trim text input.
const normalizeWhitespace = (value) => String(value || '').replace(/\s+/g, ' ').trim();

// Normalize unicode dash variants to ASCII hyphen.
const normalizeDash = (value) => normalizeWhitespace(value).replace(/[\u2010-\u2015\u2212]/g, '-');

// Convert text to title case while preserving digits.
const toTitleCase = (value) =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/\b([a-z])([a-z]*)/g, (_match, first, rest) => first.toUpperCase() + rest);

// Canonical aliases for produce names that frequently appear with singular/plural variants.
const PRODUCE_NAME_ALIASES = {
  'red bean': 'Red Beans',
  'red beans': 'Red Beans',
  'brown bean': 'Brown Beans',
  'brown beans': 'Brown Beans',
  'groundnut': 'Groundnuts',
  'groundnuts': 'Groundnuts',
  'cow pea': 'Cow Peas',
  'cow peas': 'Cow Peas',
  'white maize': 'White Maize',
  'yellow maize': 'Yellow Maize'
};

// Canonical aliases for produce type values.
const PRODUCE_TYPE_ALIASES = {
  beans: 'Beans',
  'grain maize': 'Grain Maize',
  'cow peas': 'Cow peas',
  'g-nuts': 'G-nuts',
  soybeans: 'Soybeans'
};

// Normalize source type aliases.
const SOURCE_TYPE_ALIASES = {
  own_farm: 'kgl_farm'
};

// Normalize a produce name to a stable canonical value.
const normalizeProduceName = (value) => {
  if (typeof value !== 'string') return value;
  const normalized = normalizeWhitespace(value);
  if (!normalized) return normalized;

  const aliasKey = normalized.toLowerCase();
  if (PRODUCE_NAME_ALIASES[aliasKey]) {
    return PRODUCE_NAME_ALIASES[aliasKey];
  }

  return toTitleCase(normalized);
};

// Normalize produce type to a canonical enum value.
const normalizeProduceType = (value) => {
  if (typeof value !== 'string') return value;
  const normalized = normalizeDash(value).replace(/\s*-\s*/g, '-').toLowerCase();
  return PRODUCE_TYPE_ALIASES[normalized] || normalizeWhitespace(value);
};

// Normalize source type values.
const normalizeSourceType = (value) => {
  if (typeof value !== 'string') return value;
  const normalized = normalizeWhitespace(value).toLowerCase();
  return SOURCE_TYPE_ALIASES[normalized] || normalized;
};

// Convert produce name to a comparison key (case-insensitive and punctuation-stable).
const normalizeProduceNameKey = (value) =>
  normalizeProduceName(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export {
  normalizeWhitespace,
  normalizeProduceName,
  normalizeProduceType,
  normalizeSourceType,
  normalizeProduceNameKey
};





