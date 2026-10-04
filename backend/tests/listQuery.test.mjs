import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchFilter, resolveSort } from '../utils/listQuery.js';
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
