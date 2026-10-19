/** Purchasing shows recording actions only to a branch manager. */
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Purchasing from '../../src/views/Purchasing.vue';
import { useAuthStore } from '../../src/stores/auth.js';
import { procurementAPI, suppliersAPI } from '../../src/services/api.js';

vi.mock('../../src/services/api', () => ({
  procurementAPI: {
    listOrders: vi.fn().mockResolvedValue({
      data: [
        {
          _id: 'order-1',
          status: 'draft',
          supplier: { name: 'Maganjo Farm' },
          lines: [{ produceName: 'Beans', receivedKg: 0, orderedKg: 200 }]
        }
      ]
    })
  },
  suppliersAPI: {
    getAll: vi.fn().mockResolvedValue({ data: [] })
  }
}));

const mountPurchasing = async (role) => {
  const pinia = createPinia();
  setActivePinia(pinia);
  useAuthStore().user = { role, name: 'Tester' };
  const wrapper = mount(Purchasing, {
    global: {
      plugins: [pinia],
      mocks: { $t: (label) => label }
    }
  });
  await flushPromises();
  return wrapper;
};

describe('Purchasing', () => {
  beforeEach(() => {
    procurementAPI.listOrders.mockClear();
    suppliersAPI.getAll.mockClear();
  });

  it('lets a director approve a draft and hides order entry and receipts', async () => {
    const wrapper = await mountPurchasing('director');

    expect(wrapper.text()).toContain('Approve draft purchase orders from the branch managers.');
    expect(wrapper.text()).toContain('Approve');
    expect(wrapper.text()).not.toContain('Create draft');
    expect(wrapper.text()).not.toContain('Receive into stock');
    expect(suppliersAPI.getAll).not.toHaveBeenCalled();
  });

  it('lets a manager create an order and receive goods', async () => {
    const wrapper = await mountPurchasing('manager');

    expect(wrapper.text()).toContain('Create draft');
    expect(wrapper.text()).toContain('Receive into stock');
    expect(suppliersAPI.getAll).toHaveBeenCalled();
  });
});
