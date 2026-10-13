import test from 'node:test';
import assert from 'node:assert/strict';
import { asListPayload } from '../src/utils/listPayload.js';

test('asListPayload wraps a raw array', () => {
  const payload = asListPayload([{ id: 1 }]);
  assert.equal(payload.items.length, 1);
  assert.equal(payload.total, 1);
  assert.equal(payload.totalPages, 1);
});

test('asListPayload reads pagination metadata', () => {
  const payload = asListPayload({
    items: [{ id: 1 }, { id: 2 }],
    pagination: { total: 40, page: 2, totalPages: 20 },
    summary: { paidCount: 4 }
  });
  assert.equal(payload.total, 40);
  assert.equal(payload.page, 2);
  assert.equal(payload.totalPages, 20);
  assert.equal(payload.summary.paidCount, 4);
});

test('fetchAllPages walks every page and stops after the last one', async () => {
  const { fetchAllPages } = await import('../src/utils/listPayload.js');
  const pages = [];
  const items = await fetchAllPages(async ({ page, limit }) => {
    pages.push({ page, limit });
    return {
      data: {
        items: [{ id: page }],
        pagination: { total: 2, page, totalPages: 2 }
      }
    };
  });

  assert.deepEqual(pages, [
    { page: 1, limit: 200 },
    { page: 2, limit: 200 }
  ]);
  assert.deepEqual(items, [{ id: 1 }, { id: 2 }]);
});
