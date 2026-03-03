import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Procurement from '../../src/views/Procurement.vue';
import Sales from '../../src/views/Sales.vue';
import CreditSales from '../../src/views/CreditSales.vue';
import TrustedBuyers from '../../src/views/TrustedBuyers.vue';
import {
  procurementAPI,
  salesAPI,
  creditSalesAPI,
  inventoryAPI,
  trustedBuyersAPI,
  priceAPI
} from '../../src/services/api';

vi.mock('../../src/services/api', () => ({
  procurementAPI: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  salesAPI: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    getAggregation: vi.fn(),
    delete: vi.fn()
  },
  creditSalesAPI: {
    getAll: vi.fn(),
    create: vi.fn(),
    repay: vi.fn()
  },
  inventoryAPI: {
    get: vi.fn()
  },
  trustedBuyersAPI: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  priceAPI: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

const findButtonByText = (wrapper, text) =>
  wrapper.findAll('button').find((button) => button.text().trim().includes(text));

const tomorrowIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const yesterdayIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const inventoryPayload = {
  data: {
    inventory: [
      {
        produceName: 'Beans',
        produceType: 'Beans',
        totalTonnageKg: 5000,
        sellingPrice: 25000
      }
    ],
    statistics: {
      totalValue: 1000000,
      totalItems: 1
    },
    outOfStockItems: []
  }
};

describe('Forms Validation E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    localStorage.setItem(
      'user',
      JSON.stringify({
        name: 'Manager One',
        role: 'manager',
        branch: 'Maganjo'
      })
    );

    priceAPI.getAll.mockResolvedValue({
      data: [{ source: 'managed', produceType: 'Beans', priceUgx: 22000 }]
    });
    inventoryAPI.get.mockResolvedValue(inventoryPayload);
    trustedBuyersAPI.getAll.mockResolvedValue({
      data: [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Buyer One',
          nationalId: 'CF120000000000',
          location: 'Kampala 1',
          contact: '+256700000001'
        }
      ]
    });
    procurementAPI.create.mockResolvedValue({ data: {} });
    salesAPI.create.mockResolvedValue({ data: {} });
    creditSalesAPI.create.mockResolvedValue({ data: {} });
    trustedBuyersAPI.create.mockResolvedValue({ data: {} });
  });

  it('shows per-field errors and blocks invalid procurement submission', async () => {
    const wrapper = mount(Procurement);
    await flushPromises();

    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.text()).toContain('Produce name is required.');
    expect(wrapper.text()).toContain('Produce type is required.');
    expect(wrapper.text()).toContain('Source type is required.');
    expect(procurementAPI.create).not.toHaveBeenCalled();
  });

  it('submits procurement when all fields pass validation', async () => {
    const wrapper = mount(Procurement);
    await flushPromises();

    await wrapper.find('#procurement-produce-name').setValue('Beans 1');
    await wrapper.find('#procurement-produce-type').setValue('Beans');
    await wrapper.find('#procurement-source-type').setValue('company');
    await wrapper.find('#procurement-tonnage').setValue('500');
    await wrapper.find('#procurement-cost').setValue('15000');
    await wrapper.find('#procurement-dealer-name').setValue('Dealer 1');
    await wrapper.find('#procurement-dealer-contact').setValue('+256700000002');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(procurementAPI.create).toHaveBeenCalledTimes(1);
    expect(procurementAPI.create).toHaveBeenCalledWith(
      expect.objectContaining({
        produceName: 'Beans 1',
        produceType: 'Beans',
        sourceType: 'company',
        tonnageKg: 500,
        costUgx: 15000,
        sellingPrice: 22000,
        dealerName: 'Dealer 1',
        dealerContact: '+256700000002'
      })
    );
  });

  it('blocks procurement when individual source tonnage is below 1000 kg', async () => {
    const wrapper = mount(Procurement);
    await flushPromises();

    await wrapper.find('#procurement-produce-name').setValue('Beans 1');
    await wrapper.find('#procurement-produce-type').setValue('Beans');
    await wrapper.find('#procurement-source-type').setValue('individual');
    await wrapper.find('#procurement-tonnage').setValue('999');
    await wrapper.find('#procurement-cost').setValue('15000');
    await wrapper.find('#procurement-dealer-name').setValue('Dealer 1');
    await wrapper.find('#procurement-dealer-contact').setValue('+256700000002');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.text()).toContain('Tonnage must be at least 1000 kg for individual dealers.');
    expect(procurementAPI.create).not.toHaveBeenCalled();
  });

  it('blocks procurement when dealer contact format is invalid', async () => {
    const wrapper = mount(Procurement);
    await flushPromises();

    await wrapper.find('#procurement-produce-name').setValue('Beans 1');
    await wrapper.find('#procurement-produce-type').setValue('Beans');
    await wrapper.find('#procurement-source-type').setValue('company');
    await wrapper.find('#procurement-tonnage').setValue('500');
    await wrapper.find('#procurement-cost').setValue('15000');
    await wrapper.find('#procurement-dealer-name').setValue('Dealer 1');
    await wrapper.find('#procurement-dealer-contact').setValue('0700');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.text()).toContain('Dealer contact must be a valid Ugandan phone number.');
    expect(procurementAPI.create).not.toHaveBeenCalled();
  });

  it('shows per-field errors and blocks invalid sale submission', async () => {
    const wrapper = mount(Sales);
    await flushPromises();

    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.text()).toContain('Produce name is required.');
    expect(wrapper.text()).toContain('Tonnage is required.');
    expect(wrapper.text()).toContain('Buyer name is required.');
    expect(salesAPI.create).not.toHaveBeenCalled();
  });

  it('submits sale after passing validation and confirmation', async () => {
    const wrapper = mount(Sales);
    await flushPromises();

    await wrapper.find('#sales-produce-name').setValue('Beans');
    await wrapper.find('#sales-tonnage-kg').setValue('2');
    await wrapper.find('#sales-buyer-name').setValue('Buyer 2');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    const saveButton = findButtonByText(wrapper, 'Save Cash Sale');
    expect(saveButton).toBeTruthy();
    await saveButton.trigger('click');
    await flushPromises();

    expect(salesAPI.create).toHaveBeenCalledTimes(1);
    expect(salesAPI.create).toHaveBeenCalledWith(
      expect.objectContaining({
        produceName: 'Beans',
        produceType: 'Beans',
        tonnageKg: 2,
        buyerName: 'Buyer 2'
      })
    );
  });

  it('blocks sale when buyer name contains invalid characters', async () => {
    const wrapper = mount(Sales);
    await flushPromises();

    await wrapper.find('#sales-produce-name').setValue('Beans');
    await wrapper.find('#sales-tonnage-kg').setValue('2');
    await wrapper.find('#sales-buyer-name').setValue('@@@');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.text()).toContain('Buyer name must be alphanumeric.');
    expect(salesAPI.create).not.toHaveBeenCalled();
  });

  it('shows per-field errors and blocks invalid credit-sale submission', async () => {
    const wrapper = mount(CreditSales);
    await flushPromises();

    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.text()).toContain('Trusted buyer is required.');
    expect(wrapper.text()).toContain('Produce name is required.');
    expect(wrapper.text()).toContain('Due date is required.');
    expect(creditSalesAPI.create).not.toHaveBeenCalled();
  });

  it('submits credit sale after passing validation and confirmation', async () => {
    const wrapper = mount(CreditSales);
    await flushPromises();

    await wrapper.find('#credit-trusted-buyer').setValue('507f1f77bcf86cd799439011');
    await wrapper.find('#credit-produce-name').setValue('Beans');
    await wrapper.find('#credit-tonnage-kg').setValue('2');
    await wrapper.find('#credit-due-date').setValue(tomorrowIso);
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    const saveButton = findButtonByText(wrapper, 'Save Credit Sale');
    expect(saveButton).toBeTruthy();
    await saveButton.trigger('click');
    await flushPromises();

    expect(creditSalesAPI.create).toHaveBeenCalledTimes(1);
    expect(creditSalesAPI.create).toHaveBeenCalledWith(
      expect.objectContaining({
        trustedBuyerId: '507f1f77bcf86cd799439011',
        produceName: 'Beans',
        produceType: 'Beans',
        tonnageKg: 2
      })
    );
  });

  it('blocks credit sale when due date is in the past', async () => {
    const wrapper = mount(CreditSales);
    await flushPromises();

    await wrapper.find('#credit-trusted-buyer').setValue('507f1f77bcf86cd799439011');
    await wrapper.find('#credit-produce-name').setValue('Beans');
    await wrapper.find('#credit-tonnage-kg').setValue('2');
    await wrapper.find('#credit-due-date').setValue(yesterdayIso);
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.text()).toContain('Due date must be today or a future date.');
    expect(creditSalesAPI.create).not.toHaveBeenCalled();
  });

  it('shows per-field errors and blocks invalid trusted-buyer submission', async () => {
    const wrapper = mount(TrustedBuyers);
    await flushPromises();

    const addBuyerButton = findButtonByText(wrapper, 'Add Buyer');
    await addBuyerButton.trigger('click');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.text()).toContain('Buyer name is required.');
    expect(wrapper.text()).toContain('National ID is required.');
    expect(wrapper.text()).toContain('Location is required.');
    expect(wrapper.text()).toContain('Contact is required.');
    expect(trustedBuyersAPI.create).not.toHaveBeenCalled();
  });

  it('submits trusted-buyer form when validation passes', async () => {
    const wrapper = mount(TrustedBuyers);
    await flushPromises();

    const addBuyerButton = findButtonByText(wrapper, 'Add Buyer');
    await addBuyerButton.trigger('click');

    await wrapper.find('#trusted-buyer-name').setValue('Buyer 3');
    await wrapper.find('#trusted-buyer-nin').setValue('cf120000000000');
    await wrapper.find('#trusted-buyer-location').setValue('Kampala 2');
    await wrapper.find('#trusted-buyer-contact').setValue('+256700000003');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(trustedBuyersAPI.create).toHaveBeenCalledTimes(1);
    expect(trustedBuyersAPI.create).toHaveBeenCalledWith({
      name: 'Buyer 3',
      nationalId: 'CF120000000000',
      location: 'Kampala 2',
      contact: '+256700000003'
    });
  });

  it('blocks trusted-buyer submission when NIN format is invalid', async () => {
    const wrapper = mount(TrustedBuyers);
    await flushPromises();

    const addBuyerButton = findButtonByText(wrapper, 'Add Buyer');
    await addBuyerButton.trigger('click');

    await wrapper.find('#trusted-buyer-name').setValue('Buyer 3');
    await wrapper.find('#trusted-buyer-nin').setValue('INVALID');
    await wrapper.find('#trusted-buyer-location').setValue('Kampala 2');
    await wrapper.find('#trusted-buyer-contact').setValue('+256700000003');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.text()).toContain('National ID must be a valid NIN.');
    expect(trustedBuyersAPI.create).not.toHaveBeenCalled();
  });

  it('blocks trusted-buyer submission when contact format is invalid', async () => {
    const wrapper = mount(TrustedBuyers);
    await flushPromises();

    const addBuyerButton = findButtonByText(wrapper, 'Add Buyer');
    await addBuyerButton.trigger('click');

    await wrapper.find('#trusted-buyer-name').setValue('Buyer 3');
    await wrapper.find('#trusted-buyer-nin').setValue('CF120000000000');
    await wrapper.find('#trusted-buyer-location').setValue('Kampala 2');
    await wrapper.find('#trusted-buyer-contact').setValue('12345');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(wrapper.text()).toContain('Contact must be a valid Ugandan phone number.');
    expect(trustedBuyersAPI.create).not.toHaveBeenCalled();
  });

});
