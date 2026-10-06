/** Component tests for credit-sales repayment dialog behavior. */
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreditSalesRecords from '../../src/views/CreditSalesRecords.vue';
import { creditSalesAPI } from '../../src/services/api';
import { pinia } from '../../src/stores';
import { useAuthStore } from '../../src/stores/auth';

vi.mock('../../src/services/api', () => ({
  creditSalesAPI: {
    getAll: vi.fn(),
    repay: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

const outstandingSale = {
  _id: 'credit-1',
  buyerName: 'Amina Nalwoga',
  nationalId: 'CM123456789012',
  location: 'Maganjo',
  contact: '0700123456',
  amountDueUgx: 100000,
  amountPaidUgx: 0,
  balanceUgx: 100000,
  isPaid: false,
  produceName: 'Red Beans',
  produceType: 'Beans',
  salesAgentName: 'Agent One',
  dueDate: '2026-12-01',
  dateOfDispatch: '2026-10-01',
  payments: []
};

describe('CreditSalesRecords repayment dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const authStore = useAuthStore(pinia);
    authStore.user = { role: 'manager', name: 'Manager One', branch: 'Maganjo' };
    creditSalesAPI.getAll.mockResolvedValue({
      data: {
        items: [outstandingSale],
        pagination: { total: 1, page: 1, totalPages: 1 },
        summary: { outstandingCount: 1, paidCount: 0, outstandingBalance: 100000 }
      }
    });
  });

  it('opens a modal dialog when Repay is clicked instead of an inline card', async () => {
    const wrapper = mount(CreditSalesRecords, {
      global: {
        stubs: {
          InsightStrip: { template: '<div />' },
          TablePagination: { template: '<div />' },
          ConfirmDialog: { template: '<div />' }
        }
      }
    });

    await flushPromises();

    expect(wrapper.find('.modal-mask').exists()).toBe(false);

    const repayButton = wrapper.findAll('button').find((button) => button.text().trim() === 'Repay');
    expect(repayButton).toBeTruthy();
    await repayButton.trigger('click');

    const dialog = wrapper.find('.modal-mask [role="dialog"]');
    expect(dialog.exists()).toBe(true);
    expect(dialog.classes()).toContain('repay-modal');
    expect(dialog.text()).toContain('Record Repayment');
    expect(wrapper.find('#repay-amount').exists()).toBe(true);
    expect(wrapper.find('.card.mb-4').exists()).toBe(false);
  });

  it('closes the repay dialog while a payment request is still in flight', async () => {
    let resolveRepay;
    creditSalesAPI.repay.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRepay = resolve;
        })
    );

    const wrapper = mount(CreditSalesRecords, {
      global: {
        stubs: {
          InsightStrip: { template: '<div />' },
          TablePagination: { template: '<div />' },
          ConfirmDialog: { template: '<div />' }
        }
      }
    });
    await flushPromises();

    await wrapper.findAll('button').find((button) => button.text().trim() === 'Repay').trigger('click');
    await wrapper.find('#repay-amount').setValue('1000');
    await wrapper.find('.repay-modal form').trigger('submit.prevent');

    expect(wrapper.find('.repay-modal').exists()).toBe(true);

    await wrapper.find('.repay-modal .btn-outline-secondary').trigger('click');

    expect(wrapper.find('.repay-modal').exists()).toBe(false);
    resolveRepay({ data: { ...outstandingSale, balanceUgx: 99000 } });
    await flushPromises();
    expect(wrapper.find('.repay-modal').exists()).toBe(false);
  });

  it('opens Edit even if a repayment request is still loading', async () => {
    creditSalesAPI.repay.mockImplementation(() => new Promise(() => {}));

    const wrapper = mount(CreditSalesRecords, {
      global: {
        stubs: {
          InsightStrip: { template: '<div />' },
          TablePagination: { template: '<div />' },
          ConfirmDialog: { template: '<div />' }
        }
      }
    });
    await flushPromises();

    await wrapper.findAll('button').find((button) => button.text().trim() === 'Repay').trigger('click');
    await wrapper.find('#repay-amount').setValue('1000');
    await wrapper.find('.repay-modal form').trigger('submit.prevent');
    await wrapper.findAll('button').find((button) => button.text().trim() === 'Edit').trigger('click');

    expect(wrapper.find('.repay-modal').exists()).toBe(false);
    expect(wrapper.find('#credit-sale-edit-title').exists()).toBe(true);
  });
});
