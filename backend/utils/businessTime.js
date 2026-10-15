// Time policy:
// - Event timestamps (createdAt, paidAt, voidedAt, ...) are stored as UTC instants.
// - Calendar-date fields (sale date, dispatch, receipt, due date) store the business
//   calendar day at 00:00 UTC, so their UTC date part *is* the business date.
// - "Today" and day boundaries for timestamps follow BUSINESS_TIMEZONE (default Africa/Kampala).

const DEFAULT_BUSINESS_TIMEZONE = 'Africa/Kampala';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const isValidTimeZone = (value) => {
  if (!value || typeof value !== 'string') return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

const businessTimeZone = () => {
  const configured = String(process.env.BUSINESS_TIMEZONE || '').trim();
  return isValidTimeZone(configured) ? configured : DEFAULT_BUSINESS_TIMEZONE;
};

const formatterCache = new Map();
const partsFormatter = (timeZone) => {
  if (!formatterCache.has(timeZone)) {
    formatterCache.set(
      timeZone,
      new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
      })
    );
  }
  return formatterCache.get(timeZone);
};

const zonedParts = (instant, timeZone = businessTimeZone()) => {
  const parts = {};
  for (const part of partsFormatter(timeZone).formatToParts(instant)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  return parts;
};

// Offset in ms between the zone's wall clock and UTC at a given instant.
const zoneOffsetMs = (instant, timeZone = businessTimeZone()) => {
  const parts = zonedParts(instant, timeZone);
  const wallClockAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return wallClockAsUtc - Math.floor(instant.getTime() / 1000) * 1000;
};

const toDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// YYYY-MM-DD for the business day containing the instant.
const businessDateKey = (value = new Date(), timeZone = businessTimeZone()) => {
  const date = toDate(value);
  if (!date) return null;
  const parts = zonedParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
};

// YYYY-MM-DD of a calendar-date field (stored at 00:00 UTC).
const calendarDateKey = (value) => {
  if (typeof value === 'string' && ISO_DATE.test(value)) return value;
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 10) : null;
};

// Today's business date as the UTC-midnight Date used by calendar-date fields.
const businessToday = (now = new Date()) => new Date(`${businessDateKey(now)}T00:00:00.000Z`);

// UTC instants bounding a business day, for filtering timestamp fields.
const businessDayRange = (dateKey, timeZone = businessTimeZone()) => {
  if (!ISO_DATE.test(String(dateKey || ''))) return null;
  const midnightUtc = new Date(`${dateKey}T00:00:00.000Z`);
  const start = new Date(midnightUtc.getTime() - zoneOffsetMs(midnightUtc, timeZone));
  const nextMidnightUtc = new Date(midnightUtc.getTime() + 24 * 60 * 60 * 1000);
  const next = new Date(nextMidnightUtc.getTime() - zoneOffsetMs(nextMidnightUtc, timeZone));
  return { start, end: new Date(next.getTime() - 1) };
};

export {
  DEFAULT_BUSINESS_TIMEZONE,
  businessDateKey,
  businessDayRange,
  businessTimeZone,
  businessToday,
  calendarDateKey,
  isValidTimeZone
};
