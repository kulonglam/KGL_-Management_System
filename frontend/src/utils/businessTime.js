// Business-day and display-timezone helpers. The API stores event times as UTC
// instants; "today" follows the business timezone (matches backend BUSINESS_TIMEZONE).

export const DEFAULT_BUSINESS_TIMEZONE = 'Africa/Kampala';
export const DISPLAY_TIMEZONE_STORAGE_KEY = 'kgl.displayTimeZone';

export const DISPLAY_TIMEZONE_OPTIONS = [
  'Africa/Kampala',
  'Africa/Nairobi',
  'Africa/Kigali',
  'Africa/Lagos',
  'Africa/Johannesburg',
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'America/New_York'
];

export const isValidTimeZone = (value) => {
  if (!value || typeof value !== 'string') return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

const configuredBusinessZone = (() => {
  const fromEnv = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_BUSINESS_TIMEZONE : '';
  return isValidTimeZone(fromEnv) ? fromEnv : DEFAULT_BUSINESS_TIMEZONE;
})();

export const businessTimeZone = () => configuredBusinessZone;

const storage = () => {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
};

/** User-selected display zone, falling back to the business zone. */
export const getDisplayTimeZone = () => {
  const stored = storage()?.getItem(DISPLAY_TIMEZONE_STORAGE_KEY) || '';
  return isValidTimeZone(stored) ? stored : businessTimeZone();
};

/** Persists a display zone; an empty value resets to the business zone. */
export const setDisplayTimeZone = (value) => {
  const store = storage();
  if (!store) return getDisplayTimeZone();
  if (!value) {
    store.removeItem(DISPLAY_TIMEZONE_STORAGE_KEY);
  } else if (isValidTimeZone(value)) {
    store.setItem(DISPLAY_TIMEZONE_STORAGE_KEY, value);
  }
  return getDisplayTimeZone();
};

/** Wall-clock parts of an instant in the given zone. */
export const zonedParts = (date, timeZone = getDisplayTimeZone()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const pick = (type) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: pick('hour') % 24,
    minute: pick('minute')
  };
};

/** YYYY-MM-DD for an instant in the business zone (defaults to now). */
export const businessDateKey = (value = new Date(), timeZone = businessTimeZone()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const { year, month, day } = zonedParts(date, timeZone);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const businessTodayIso = (now = new Date()) => businessDateKey(now);

/** Shifts a YYYY-MM-DD key by whole days without touching local time. */
export const shiftDateKey = (dateKey, days) => {
  const [year, month, day] = String(dateKey).split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
};
