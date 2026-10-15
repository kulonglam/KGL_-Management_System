/** Tests shared frontend date-format helpers. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatDisplayRange,
  formatDisplayTimestamp
} from '../src/utils/dateFormat.js';
import { businessTodayIso, isValidTimeZone, shiftDateKey } from '../src/utils/businessTime.js';

test('formatDisplayDate renders YYYY-MM-DD values as DD/MM/YYYY', () => {
  assert.equal(formatDisplayDate('2025-12-31'), '31/12/2025');
});

test('formatDisplayDateTime keeps numeric date display and HH:mm time', () => {
  assert.equal(formatDisplayDateTime('2025-12-31', '8:05:00'), '31/12/2025 08:05');
});

test('formatDisplayRange returns one numeric date for same-day ranges', () => {
  assert.equal(formatDisplayRange('2025-12-31', '2025-12-31'), '31/12/2025');
});

test('formatDisplayTimestamp renders ISO timestamps as DD/MM/YYYY HH:mm', () => {
  assert.equal(formatDisplayTimestamp('2025-12-31T14:45:00'), '31/12/2025 14:45');
});

test('formatDisplayTimestamp shows UTC instants in the business timezone by default', () => {
  assert.equal(formatDisplayTimestamp('2025-12-31T22:30:00.000Z'), '01/01/2026 01:30');
});

test('formatDisplayDate keeps UTC-midnight calendar dates on the stored day', () => {
  assert.equal(formatDisplayDate('2025-12-31T00:00:00.000Z'), '31/12/2025');
});

test('businessTodayIso follows the business timezone, not UTC', () => {
  assert.equal(businessTodayIso(new Date('2025-12-31T22:30:00Z')), '2026-01-01');
  assert.equal(businessTodayIso(new Date('2025-12-31T20:59:00Z')), '2025-12-31');
});

test('shiftDateKey moves calendar keys across month boundaries', () => {
  assert.equal(shiftDateKey('2026-03-01', -1), '2026-02-28');
  assert.equal(shiftDateKey('2025-12-31', 1), '2026-01-01');
});

test('isValidTimeZone rejects unknown zones', () => {
  assert.equal(isValidTimeZone('Africa/Kampala'), true);
  assert.equal(isValidTimeZone('Mars/Olympus'), false);
});
