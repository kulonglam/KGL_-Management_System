/**
 * Shared backend date formatting helpers for consistent DD/MM/YYYY labels.
 * File: backend/utils/dateFormat.js
 */

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const padTwo = (value) => String(value).padStart(2, '0');

const extractDateParts = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate()
    };
  }

  const text = String(value).trim();
  if (!text) return null;

  const dateOnlyMatch = text.match(DATE_ONLY_PATTERN);
  if (dateOnlyMatch) {
    return {
      year: Number(dateOnlyMatch[1]),
      month: Number(dateOnlyMatch[2]),
      day: Number(dateOnlyMatch[3])
    };
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;

  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
    day: parsed.getDate()
  };
};

export const formatDisplayDate = (value, separator = '/') => {
  const parts = extractDateParts(value);
  if (!parts) return value ? String(value) : '-';

  return `${padTwo(parts.day)}${separator}${padTwo(parts.month)}${separator}${parts.year}`;
};
