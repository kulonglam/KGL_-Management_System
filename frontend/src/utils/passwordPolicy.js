const PASSWORD_MIN_LENGTH = 10;

const PASSWORD_REQUIREMENTS =
  'Use at least 10 characters with an uppercase letter, a lowercase letter, a number, and a symbol.';

const validatePasswordStrength = (password) => {
  const value = String(password || '');
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (!/[A-Z]/.test(value)) {
    return 'Password must include at least one uppercase letter';
  }
  if (!/[a-z]/.test(value)) {
    return 'Password must include at least one lowercase letter';
  }
  if (!/[0-9]/.test(value)) {
    return 'Password must include at least one number';
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    return 'Password must include at least one symbol';
  }
  return '';
};

export { PASSWORD_MIN_LENGTH, PASSWORD_REQUIREMENTS, validatePasswordStrength };
