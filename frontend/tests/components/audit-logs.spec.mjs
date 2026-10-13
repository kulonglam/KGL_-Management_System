import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuditLogs from '../../src/views/AuditLogs.vue';
import { auditAPI } from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
  auditAPI: {
    list: vi.fn()
  }
}));

describe('AuditLogs details', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditAPI.list.mockResolvedValue({
      data: {
        items: [
          {
            _id: 'log-sale',
            createdAt: '2026-03-07T10:00:00.000Z',
            actorName: 'Audit Manager',
            actorRole: 'manager',
            action: 'delete',
            entityType: 'sale',
            entityId: 'sale-1',
            branch: 'Maganjo',
            metadata: {
              produceName: 'White Maize',
              tonnageKg: 10,
              buyerName: 'Marys Restaurant',
              amountPaidUgx: 200000
            }
          },
          {
            _id: 'log-gone',
            createdAt: '2026-03-01T10:00:00.000Z',
            actorName: 'Old Manager',
            actorRole: 'manager',
            action: 'create',
            entityType: 'sale',
            entityId: 'sale-gone',
            branch: 'Maganjo',
            metadata: {},
            detailsNote: 'The original record is no longer available.'
          }
        ],
        pagination: { total: 2, page: 1, totalPages: 1 }
      }
    });
  });

  it('shows stored sale facts after the record is gone, and the note when nothing was stored', async () => {
    const wrapper = mount(AuditLogs, {
      global: {
        stubs: {
          TablePagination: { template: '<div />' }
        }
      }
    });
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain('Produce: White Maize');
    expect(text).toContain('Kilograms: 10 kg');
    expect(text).toContain('Buyer: Marys Restaurant');
    expect(text).toContain('Amount paid: 200,000 UGX');
    expect(text).toContain('The original record is no longer available.');
    expect(text).not.toContain('"produceName"');
  });
});