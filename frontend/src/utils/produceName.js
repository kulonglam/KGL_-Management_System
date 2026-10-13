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

export { normalizeProduceName, normalizeProduceNameKey, normalizeWhitespace };
