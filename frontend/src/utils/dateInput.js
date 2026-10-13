// Normalize a date-like value into the YYYY-MM-DD shape used by date inputs.
const toDateInput = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export { toDateInput };
