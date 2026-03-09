const LOCAL_PHONE_PATTERN = /^07\d{8}$/;
const LOCAL_PHONE_PATTERN_HTML = '^07[0-9]{8}$';
const LOCAL_PHONE_PLACEHOLDER = '0700000000';
const LOCAL_PHONE_HINT = 'Use the 07XXXXXXXX format only.';

const normalizeLocalPhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('256')) {
    const localDigits = digits.slice(3);
    return (localDigits.startsWith('0') ? localDigits : `0${localDigits}`).slice(0, 10);
  }

  if (digits.startsWith('7')) {
    return `0${digits}`.slice(0, 10);
  }

  return digits.slice(0, 10);
};

export {
  LOCAL_PHONE_HINT,
  LOCAL_PHONE_PATTERN,
  LOCAL_PHONE_PATTERN_HTML,
  LOCAL_PHONE_PLACEHOLDER,
  normalizeLocalPhone
};
