/** Tests shared frontend date-format helpers. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatDisplayRange,
  formatDisplayTimestamp
} from '../src/utils/dateFormat.mjs';

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
