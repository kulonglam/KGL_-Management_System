/** Finance screen renders its tabs instead of failing while the ledger is empty. */
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FinanceOps from '../../src/views/FinanceOps.vue';

vi.mock('../../src/services/api', () => ({
  financeAPI: {
    listCashUps: vi.fn().mockResolvedValue({ data: [] }),
    listInvoices: vi.fn(),
    listWriteOffs: vi.fn(),
    getAging: vi.fn(),
    listBankLines: vi.fn(),
    listPeriodLocks: vi.fn(),
    getTaxConfig: vi.fn(),
    getRetention: vi.fn()
  },
  authAPI: {},
  branchAPI: { list: vi.fn() },
  trustedBuyersAPI: { getAll: vi.fn() }
}));

describe('FinanceOps', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('shows the finance tabs when no journal has been posted', async () => {
    const wrapper = mount(FinanceOps, {
      global: {
        mocks: { $t: (label) => label }
      }
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Finance & compliance');
    expect(wrapper.text()).toContain('End-of-day cash-up');
    expect(wrapper.text()).toContain('Ledger');
  });
});
