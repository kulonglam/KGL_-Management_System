/**
 * Numeric formatting helpers for compact dashboard/table display values.
 * File: frontend/src/utils/numberFormat.js
 */

// Convert unknown input into a finite number, defaulting invalid values to zero.
const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// Format scaled values with one decimal and a compact unit suffix.
const compactSuffix = (value, divisor, suffix) => {
  const scaled = value / divisor;
  return `${scaled.toFixed(1).replace(/\.0$/, '')}${suffix}`;
};

// Render numbers using B/M/k suffixes when large, otherwise locale integers.
const formatCompactNumber = (value) => {
  const number = toNumber(value);
  const absolute = Math.abs(number);
  const sign = number < 0 ? '-' : '';

  if (absolute >= 1_000_000_000) {
    return `${sign}${compactSuffix(absolute, 1_000_000_000, 'B')}`;
  }

  if (absolute >= 1_000_000) {
    return `${sign}${compactSuffix(absolute, 1_000_000, 'M')}`;
  }

  if (absolute >= 1_000) {
    return `${sign}${compactSuffix(absolute, 1_000, 'k')}`;
  }

  return Math.round(number).toLocaleString('en-UG');
};

// Prefix compact numeric output with a currency label.
const formatCompactCurrency = (value, currencyLabel = 'UGX') =>
  `${currencyLabel} ${formatCompactNumber(value)}`;

export { toNumber, formatCompactNumber, formatCompactCurrency };
