import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PriceManagement from '../../src/views/PriceManagement.vue';
import { priceAPI } from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
  priceAPI: {
    getAll: vi.fn(),
    getHistory: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

describe('PriceManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    priceAPI.getAll.mockResolvedValue({
      data: [
        {
          _id: 'price-1',
          produceName: 'Red Beans',
          produceType: 'Beans',
          priceUgx: 35000,
          source: 'managed'
        }
      ]
    });
    priceAPI.getHistory.mockResolvedValue({
      data: [
        {
          _id: 'history-1',
          action: 'update',
          previousProduceName: 'Red Beans',
          previousProduceType: 'Beans',
          previousPriceUgx: 35000,
          nextProduceName: 'Red Beans',
          nextProduceType: 'Beans',
          nextPriceUgx: 36000,
          changedBy: { name: 'Kulong' },
          createdAt: '2026-03-07T08:00:00.000Z'
        }
      ]
    });
  });

  it('opens the price history modal and renders audit entries', async () => {
    const wrapper = mount(PriceManagement);
    await flushPromises();

    const historyButton = wrapper
      .findAll('button')
      .find((button) => button.text().trim().includes('History'));

    expect(historyButton).toBeTruthy();
    await historyButton.trigger('click');
    await flushPromises();

    expect(priceAPI.getHistory).toHaveBeenCalledWith('price-1');
    expect(wrapper.text()).toContain('Price History');
    expect(wrapper.text()).toContain('Kulong');
    expect(wrapper.text()).toContain('Changed price from UGX');
    expect(wrapper.text()).toContain('36,000');
  });
});
