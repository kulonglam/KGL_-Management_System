// Shared frontend date formatting helpers for consistent DD/MM/YYYY display.

const DISPLAY_DATE_SEPARATOR = '/';

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_ONLY_PATTERN = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;

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

const toDateObject = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();
  if (!text) return null;

  const dateOnlyMatch = text.match(DATE_ONLY_PATTERN);
  if (dateOnlyMatch) {
    return new Date(
      Number(dateOnlyMatch[1]),
      Number(dateOnlyMatch[2]) - 1,
      Number(dateOnlyMatch[3])
    );
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeTimeText = (value) => {
  if (!value) return '';

  const text = String(value).trim();
  if (!text) return '';

  const timeMatch = text.match(TIME_ONLY_PATTERN);
  if (!timeMatch) return text;

  return `${padTwo(timeMatch[1])}:${timeMatch[2]}`;
};

const buildDateLabel = (parts, separator) =>
  `${padTwo(parts.day)}${separator}${padTwo(parts.month)}${separator}${parts.year}`;

export const formatDisplayDate = (value, separator = DISPLAY_DATE_SEPARATOR) => {
  const parts = extractDateParts(value);
  if (!parts) return value ? String(value) : '-';
  return buildDateLabel(parts, separator);
};

export const formatDisplayDateTime = (
  dateValue,
  timeValue = '',
  separator = DISPLAY_DATE_SEPARATOR
) => {
  const formattedDate = dateValue ? formatDisplayDate(dateValue, separator) : '';
  const formattedTime = normalizeTimeText(timeValue);

  if (formattedDate && formattedTime) {
    return `${formattedDate} ${formattedTime}`;
  }

  return formattedDate || formattedTime || '-';
};

export const formatDisplayTimestamp = (value, separator = DISPLAY_DATE_SEPARATOR) => {
  const date = toDateObject(value);
  if (!date) return value ? String(value) : '-';

  return `${formatDisplayDate(date, separator)} ${padTwo(date.getHours())}:${padTwo(date.getMinutes())}`;
};

export const formatDisplayRange = (from, to, separator = DISPLAY_DATE_SEPARATOR) => {
  if (!from || !to) return '-';

  const start = formatDisplayDate(from, separator);
  const end = formatDisplayDate(to, separator);

  if (start === '-' || end === '-') return '-';
  return start === end ? start : `${start} - ${end}`;
};
