// Primitive reusable validators and schema runners for frontend form validation.
 
const isEmpty = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  return false;
};

const toNumber = (value) => Number(value);

// Each validator returns a function so schemas can compose rules declaratively per field.
const validators = {
  required:
    (message = 'This field is required.') =>
    (value) =>
      isEmpty(value) ? message : '',
  minLength:
    (min, message = `Must be at least ${min} characters.`) =>
    (value) => {
      if (isEmpty(value)) return '';
      return String(value).trim().length >= min ? '' : message;
    },
  pattern:
    (regex, message = 'Invalid format.') =>
    (value) => {
      if (isEmpty(value)) return '';
      return regex.test(String(value).trim()) ? '' : message;
    },
  number:
    (message = 'Must be a valid number.') =>
    (value) => {
      if (isEmpty(value)) return '';
      const parsed = toNumber(value);
      return Number.isFinite(parsed) ? '' : message;
    },
  minValue:
    (min, message = `Must be at least ${min}.`) =>
    (value) => {
      if (isEmpty(value)) return '';
      const parsed = toNumber(value);
      if (!Number.isFinite(parsed)) return 'Must be a valid number.';
      return parsed >= min ? '' : message;
    },
  oneOf:
    (allowedValues, message = 'Invalid value.') =>
    (value) => {
      if (isEmpty(value)) return '';
      return allowedValues.includes(value) ? '' : message;
    },
  isoDate:
    (message = 'Must be a valid date.') =>
    (value) => {
      if (isEmpty(value)) return '';
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? message : '';
    },
  timeHHmm:
    (message = 'Time must be in HH:mm format.') =>
    (value) => {
      if (isEmpty(value)) return '';
      return /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(value)) ? '' : message;
    },
  notPastDate:
    (message = 'Date cannot be in the past.') =>
    (value) => {
      if (isEmpty(value)) return '';
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return 'Must be a valid date.';
      const selected = new Date(parsed);
      selected.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected >= today ? '' : message;
    },
  mongoId:
    (message = 'Invalid value.') =>
    (value) => {
      if (isEmpty(value)) return '';
      return /^[0-9a-fA-F]{24}$/.test(String(value)) ? '' : message;
    },
  custom:
    (test, message = 'Invalid value.') =>
    (value, values) =>
      test(value, values) ? '' : message
};

// Resolve static or dynamic rule definitions for one field.
const getFieldRules = (schema, fieldName, values) => {
  const ruleConfig = schema?.[fieldName];
  if (!ruleConfig) return [];
  // Allow dynamic rule generation (function) for cross-field validation scenarios.
  if (typeof ruleConfig === 'function') {
    const resolved = ruleConfig(values);
    return Array.isArray(resolved) ? resolved : [];
  }
  return Array.isArray(ruleConfig) ? ruleConfig : [];
};

// Evaluate rules for a single field and return the first failing message.
const validateFieldValue = (fieldName, values, schema) => {
  const rules = getFieldRules(schema, fieldName, values);
  const fieldValue = values?.[fieldName];

  // Return on first error to keep messaging focused and avoid overwhelming users.
  for (let i = 0; i < rules.length; i += 1) {
    const rule = rules[i];
    if (typeof rule !== 'function') continue;
    const error = rule(fieldValue, values, fieldName);
    if (error) return error;
  }

  return '';
};

// Validate all schema fields and return boolean + keyed error map.
const validateValues = (values, schema) => {
  const errors = {};
  const fields = Object.keys(schema || {});

  fields.forEach((fieldName) => {
    const error = validateFieldValue(fieldName, values, schema);
    if (error) errors[fieldName] = error;
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

export { validators, validateValues, validateFieldValue };

