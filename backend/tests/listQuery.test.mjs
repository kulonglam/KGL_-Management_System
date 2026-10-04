import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { buildSearchFilter, resolveSort, trustedQuery } from '../utils/listQuery.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

test('buildSearchFilter returns empty object when search is blank', () => {
  assert.deepEqual(buildSearchFilter('  ', ['name']), {});
});

test('buildSearchFilter matches any listed field', () => {
  const filter = buildSearchFilter('maize', ['produceName', 'buyerName']);
  assert.equal(filter.$or.length, 2);
  assert.equal(filter.$or[0].produceName.$options, 'i');
});

test('resolveSort uses mapped key and fallback', () => {
  const map = { newest: { createdAt: -1 }, oldest: { createdAt: 1 } };
  assert.deepEqual(resolveSort('oldest', map), { createdAt: 1 });
  assert.deepEqual(resolveSort('unknown', map, { name: 1 }), { name: 1 });
});

test('parsePagination stays disabled until page or limit is provided', () => {
  assert.equal(parsePagination({}).enabled, false);
  const enabled = parsePagination({ page: '2', limit: '20' });
  assert.equal(enabled.enabled, true);
  assert.equal(enabled.page, 2);
  assert.equal(enabled.limit, 20);
  assert.equal(enabled.skip, 20);
});

test('buildPaginationMeta computes total pages', () => {
  assert.deepEqual(buildPaginationMeta({ page: 1, limit: 20, total: 45 }), {
    page: 1,
    limit: 20,
    total: 45,
    totalPages: 3
  });
});

test('sanitizeFilter rewrites untrusted overdue operators but keeps trustedQuery', () => {
  mongoose.set('sanitizeFilter', true);
  const due = new Date('2026-01-01T00:00:00.000Z');
  const rewritten = mongoose.sanitizeFilter({
    isPaid: false,
    dueDate: { $lt: due },
    balanceUgx: { $gt: 0 }
  });
  assert.deepEqual(rewritten.balanceUgx, { $eq: { $gt: 0 } });

  const safe = mongoose.sanitizeFilter({
    isPaid: false,
    dueDate: trustedQuery({ $lt: due }),
    balanceUgx: trustedQuery({ $gt: 0 })
  });
  assert.equal(safe.balanceUgx.$gt, 0);
  assert.equal(new Date(safe.dueDate.$lt).toISOString(), due.toISOString());
});
