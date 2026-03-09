import {
  invalidValueMessage,
  maxLengthMessage,
  maxValueMessage,
  minLengthMessage,
  minValueMessage,
  requiredMessage,
  resolvePatternMessage,
  validDateMessage,
  validEmailMessage,
  validNumberMessage,
  validTimeMessage
} from './validationMessages.js';

const FORM_SELECTOR = 'form';
const FIELD_SELECTOR = 'input, select, textarea';

const humanizeIdentifier = (value) =>
  String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const normalizeLabel = (value) =>
  String(value || '')
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const getFieldLabel = (field) => {
  const explicitLabel = normalizeLabel(field?.dataset?.validationLabel);
  if (explicitLabel) return explicitLabel;

  const ariaLabel = normalizeLabel(field?.getAttribute?.('aria-label'));
  if (ariaLabel) return ariaLabel;

  const labelText = normalizeLabel(field?.labels?.[0]?.textContent);
  if (labelText) return labelText;

  const placeholder = normalizeLabel(field?.placeholder);
  if (placeholder) return placeholder;

  return humanizeIdentifier(field?.name || field?.id || 'This field');
};

const getFieldMinLength = (field) => Number(field?.getAttribute?.('minlength') || field?.minLength || 0);
const getFieldMaxLength = (field) => Number(field?.getAttribute?.('maxlength') || field?.maxLength || 0);

const buildPatternMessage = (field, label) => {
  const explicitMessage = field?.dataset?.patternMessage || field?.dataset?.validationMessage;
  if (explicitMessage) return explicitMessage;

  const pattern = String(field?.getAttribute?.('pattern') || '');
  return resolvePatternMessage(label, pattern);
};

const buildValidationMessage = (field) => {
  const label = getFieldLabel(field);
  const validity = field?.validity || {};

  if (validity.valueMissing) {
    return field?.dataset?.requiredMessage || requiredMessage(label);
  }

  if (validity.patternMismatch) {
    return buildPatternMessage(field, label);
  }

  if (validity.tooShort) {
    const minLength = getFieldMinLength(field);
    return field?.dataset?.minlengthMessage || minLengthMessage(label, minLength);
  }

  if (validity.tooLong) {
    const maxLength = getFieldMaxLength(field);
    return field?.dataset?.maxlengthMessage || maxLengthMessage(label, maxLength);
  }

  if (validity.rangeUnderflow) {
    return field?.dataset?.minMessage || minValueMessage(label, field?.min);
  }

  if (validity.rangeOverflow) {
    return field?.dataset?.maxMessage || maxValueMessage(label, field?.max);
  }

  if (validity.typeMismatch) {
    if (field?.type === 'email') {
      return field?.dataset?.typeMessage || validEmailMessage();
    }

    if (field?.type === 'date') {
      return field?.dataset?.typeMessage || validDateMessage(label);
    }

    if (field?.type === 'time') {
      return field?.dataset?.typeMessage || validTimeMessage(label);
    }

    return field?.dataset?.typeMessage || invalidValueMessage(label);
  }

  if (validity.badInput) {
    if (field?.type === 'number') {
      return validNumberMessage(label);
    }

    if (field?.type === 'date') {
      return validDateMessage(label);
    }

    if (field?.type === 'time') {
      return validTimeMessage(label);
    }

    return invalidValueMessage(label);
  }

  if (validity.stepMismatch) {
    if (field?.type === 'time') {
      return validTimeMessage(label);
    }

    return invalidValueMessage(label);
  }

  if (validity.customError && field?.validationMessage) {
    return field.validationMessage;
  }

  return invalidValueMessage(label);
};

const isValidatableField = (field) =>
  typeof field?.setCustomValidity === 'function' &&
  typeof field?.reportValidity === 'function' &&
  Boolean(field?.willValidate);

const clearFieldMessage = (field) => {
  if (!isValidatableField(field)) return;
  field.setCustomValidity('');
};

const setFieldMessage = (field) => {
  if (!isValidatableField(field)) return;

  field.setCustomValidity('');
  if (field.validity.valid) return;

  field.setCustomValidity(buildValidationMessage(field));
};

const applyNoValidate = (root) => {
  if (!root?.querySelectorAll) return;

  if (root.matches?.(FORM_SELECTOR)) {
    root.noValidate = true;
    root.setAttribute('novalidate', 'novalidate');
  }

  root.querySelectorAll(FORM_SELECTOR).forEach((form) => {
    form.noValidate = true;
    form.setAttribute('novalidate', 'novalidate');
  });
};

const validateFormWithCustomMessages = (form) => {
  const fields = Array.from(form.querySelectorAll(FIELD_SELECTOR)).filter(isValidatableField);
  let firstInvalidField = null;

  fields.forEach((field) => {
    setFieldMessage(field);
    if (field.validity.valid) return;
    if (!firstInvalidField) {
      firstInvalidField = field;
    }
  });

  return firstInvalidField;
};

const installCustomValidationMessages = () => {
  if (typeof document === 'undefined' || !document.body) {
    return () => {};
  }

  applyNoValidate(document);

  const handleSubmit = (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    applyNoValidate(form);
    const firstInvalidField = validateFormWithCustomMessages(form);
    if (!firstInvalidField) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    firstInvalidField.reportValidity();
  };

  const handleInvalid = (event) => {
    setFieldMessage(event.target);
  };

  const handleFieldInput = (event) => {
    clearFieldMessage(event.target);
  };

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        applyNoValidate(node);
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('invalid', handleInvalid, true);
  document.addEventListener('submit', handleSubmit, true);
  document.addEventListener('input', handleFieldInput, true);
  document.addEventListener('change', handleFieldInput, true);

  return () => {
    observer.disconnect();
    document.removeEventListener('invalid', handleInvalid, true);
    document.removeEventListener('submit', handleSubmit, true);
    document.removeEventListener('input', handleFieldInput, true);
    document.removeEventListener('change', handleFieldInput, true);
  };
};

export { buildValidationMessage, installCustomValidationMessages };
