const requiredMessage = (label) => `${label} is required.`;

const minLengthMessage = (label, min) => `${label} must be at least ${min} characters.`;

const maxLengthMessage = (label, max) => `${label} cannot exceed ${max} characters.`;

const alphaNumericMessage = (label) => `${label} must be alpha-numeric.`;

const lettersOnlyMessage = (label) => `${label} must contain letters only.`;

const dottedTextMessage = (label) =>
  `${label} must contain only letters, numbers, spaces, and full stops.`;

const localPhoneMessage = (label) => `${label} must use the 07XXXXXXXX format.`;

const ninMessage = (label) => `${label} must be a valid NIN.`;

const invalidFormatMessage = (label) => `${label} has an invalid format.`;

const invalidValueMessage = (label) => `${label} is invalid.`;

const validNumberMessage = (label) => `${label} must be a valid number.`;

const minValueMessage = (label, min) => `${label} must be at least ${min}.`;

const maxValueMessage = (label, max) => `${label} cannot be more than ${max}.`;

const validDateMessage = (label) => `${label} must be a valid date.`;

const validTimeMessage = (label) => `${label} must be a valid time.`;

const validEmailMessage = () => 'Enter a valid email address.';

const resolvePatternMessage = (label, pattern) => {
  const normalizedPattern = String(pattern || '');

  if (
    normalizedPattern === '^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$' ||
    normalizedPattern === '^[A-Za-z0-9\\s]+$'
  ) {
    return alphaNumericMessage(label);
  }

  if (
    normalizedPattern === '^[A-Za-z]+(?: [A-Za-z]+)*$' ||
    normalizedPattern === '^[A-Za-z\\s]+$'
  ) {
    return lettersOnlyMessage(label);
  }

  if (normalizedPattern === '^[A-Za-z0-9\\s.]+$') {
    return dottedTextMessage(label);
  }

  if (normalizedPattern.includes('07') && normalizedPattern.includes('[0-9]{8}')) {
    return localPhoneMessage(label);
  }

  if (normalizedPattern.includes('CM|CF')) {
    return ninMessage(label);
  }

  return invalidFormatMessage(label);
};

export {
  alphaNumericMessage,
  dottedTextMessage,
  invalidFormatMessage,
  invalidValueMessage,
  lettersOnlyMessage,
  localPhoneMessage,
  maxLengthMessage,
  maxValueMessage,
  minLengthMessage,
  minValueMessage,
  ninMessage,
  requiredMessage,
  resolvePatternMessage,
  validDateMessage,
  validEmailMessage,
  validNumberMessage,
  validTimeMessage
};
