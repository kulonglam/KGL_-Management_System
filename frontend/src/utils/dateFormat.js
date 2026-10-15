// Shared frontend date formatting helpers for consistent DD/MM/YYYY display.
import { getDisplayTimeZone, zonedParts } from './businessTime.js';

const DISPLAY_DATE_SEPARATOR = '/';

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_ONLY_PATTERN = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;
// Calendar-date fields are stored at 00:00 UTC; their date must not shift with the viewer's zone.
const UTC_MIDNIGHT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T00:00(?::00(?:\.0+)?)?(?:Z|[+-]00:?00)$/;
const ZONED_TIMESTAMP_PATTERN = /T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/i;

const zonedInstant = (value) => {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!ZONED_TIMESTAMP_PATTERN.test(text)) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

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

  const dateOnlyMatch = text.match(DATE_ONLY_PATTERN) || text.match(UTC_MIDNIGHT_PATTERN);
  if (dateOnlyMatch) {
    return {
      year: Number(dateOnlyMatch[1]),
      month: Number(dateOnlyMatch[2]),
      day: Number(dateOnlyMatch[3])
    };
  }

  const instant = zonedInstant(text);
  if (instant) {
    const { year, month, day } = zonedParts(instant, getDisplayTimeZone());
    return { year, month, day };
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

  // Real instants (Date objects, zoned ISO strings) render in the chosen display zone;
  // zone-less strings are already wall-clock values.
  const isInstant = value instanceof Date || Boolean(zonedInstant(value));
  if (isInstant) {
    const parts = zonedParts(date, getDisplayTimeZone());
    return `${buildDateLabel(parts, separator)} ${padTwo(parts.hour)}:${padTwo(parts.minute)}`;
  }

  return `${formatDisplayDate(date, separator)} ${padTwo(date.getHours())}:${padTwo(date.getMinutes())}`;
};

export const formatDisplayRange = (from, to, separator = DISPLAY_DATE_SEPARATOR) => {
  if (!from || !to) return '-';

  const start = formatDisplayDate(from, separator);
  const end = formatDisplayDate(to, separator);

  if (start === '-' || end === '-') return '-';
  return start === end ? start : `${start} - ${end}`;
};
