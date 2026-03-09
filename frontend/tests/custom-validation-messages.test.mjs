import test from 'node:test';
import assert from 'node:assert/strict';
import { buildValidationMessage } from '../src/utils/customValidationMessages.js';

const createField = ({
  label = 'Contact',
  validity = {},
  attributes = {},
  type = 'text',
  minLength = 0,
  maxLength = 0,
  min = '',
  max = '',
  placeholder = ''
} = {}) => ({
  dataset: attributes.dataset || {},
  getAttribute(name) {
    return attributes[name] ?? null;
  },
  id: attributes.id || '',
  labels: label ? [{ textContent: label }] : [],
  max,
  maxLength,
  min,
  minLength,
  name: attributes.name || '',
  placeholder,
  title: attributes.title || '',
  type,
  validationMessage: attributes.validationMessage || '',
  validity: {
    valueMissing: false,
    patternMismatch: false,
    tooShort: false,
    tooLong: false,
    rangeUnderflow: false,
    rangeOverflow: false,
    typeMismatch: false,
    badInput: false,
    stepMismatch: false,
    customError: false,
    ...validity
  }
});

test('buildValidationMessage returns a required-field message from the field label', () => {
  const field = createField({
    label: 'Username',
    validity: { valueMissing: true }
  });

  assert.equal(buildValidationMessage(field), 'Username is required.');
});

test('buildValidationMessage returns the custom 07 phone format message', () => {
  const field = createField({
    label: 'Contact',
    validity: { patternMismatch: true },
    attributes: { pattern: '^07[0-9]{8}$' }
  });

  assert.equal(buildValidationMessage(field), 'Contact must use the 07XXXXXXXX format.');
});

test('buildValidationMessage returns the alpha-numeric message for common name fields', () => {
  const field = createField({
    label: 'Buyer Name',
    validity: { patternMismatch: true },
    attributes: { pattern: '^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$' }
  });

  assert.equal(buildValidationMessage(field), 'Buyer Name must be alpha-numeric.');
});

test('buildValidationMessage ignores title hints and keeps the shared alpha-numeric message', () => {
  const field = createField({
    label: 'Buyer Name',
    validity: { patternMismatch: true },
    attributes: {
      pattern: '^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$',
      title: 'Use letters and numbers only.'
    }
  });

  assert.equal(buildValidationMessage(field), 'Buyer Name must be alpha-numeric.');
});

test('buildValidationMessage uses an explicit dataset override for pattern rules', () => {
  const field = createField({
    label: 'Buyer Name',
    validity: { patternMismatch: true },
    attributes: {
      pattern: '^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$',
      dataset: { patternMessage: 'Buyer Name must use the approved format.' }
    }
  });

  assert.equal(buildValidationMessage(field), 'Buyer Name must use the approved format.');
});

test('buildValidationMessage explains dotted full-name constraints', () => {
  const field = createField({
    label: 'Full Name',
    validity: { patternMismatch: true },
    attributes: { pattern: '^[A-Za-z0-9\\s.]+$' }
  });

  assert.equal(
    buildValidationMessage(field),
    'Full Name must contain only letters, numbers, spaces, and full stops.'
  );
});

test('buildValidationMessage returns a minimum-length message', () => {
  const field = createField({
    label: 'Password',
    validity: { tooShort: true },
    minLength: 10,
    attributes: { minlength: '10' }
  });

  assert.equal(buildValidationMessage(field), 'Password must be at least 10 characters.');
});
