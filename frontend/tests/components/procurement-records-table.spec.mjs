/** Component tests for procurement records table behavior, pagination, and accessibility checks. */
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ProcurementRecordsTable from '../../src/components/procurement/ProcurementRecordsTable.vue';
import { expectNoA11yViolations, runA11yAudit } from './a11y-utils.mjs';

const createProcurement = (index) => ({
  _id: `id-${index}`,
  produceName: `Produce ${index}`,
  produceType: 'Beans',
  costUgx: 1000 + index,
  tonnageKg: 100 + index,
  branch: 'Maganjo',
  dealerName: `Dealer ${index}`,
  sellingPrice: 2000 + index
});

describe('ProcurementRecordsTable', () => {
  it('paginates records and navigates pages', async () => {
    const procurements = Array.from({ length: 25 }, (_, index) => createProcurement(index + 1));
    const wrapper = mount(ProcurementRecordsTable, {
      props: {
        procurements,
        loading: false
      },
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>'
          }
        }
      }
    });

    expect(wrapper.text()).toContain('Showing 1-20 of 25 records');
    expect(wrapper.findAll('tbody tr')).toHaveLength(20);
    expect(wrapper.find('tbody tr td').text()).toContain('Produce 1');

    const nextButton = wrapper
      .findAll('button')
      .find((button) => button.text().trim() === 'Next');
    await nextButton.trigger('click');

    expect(wrapper.text()).toContain('Showing 21-25 of 25 records');
    expect(wrapper.findAll('tbody tr')).toHaveLength(5);
    expect(wrapper.find('tbody tr td').text()).toContain('Produce 21');
  });

  it('emits edit and delete actions for a row', async () => {
    const wrapper = mount(ProcurementRecordsTable, {
      props: {
        procurements: [createProcurement(1)],
        loading: false
      },
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>'
          }
        }
      }
    });

    const rowButtons = wrapper.findAll('tbody tr button');
    await rowButtons[0].trigger('click');
    await rowButtons[1].trigger('click');

    expect(wrapper.emitted('edit')).toHaveLength(1);
    expect(wrapper.emitted('edit')[0][0]._id).toBe('id-1');
    expect(wrapper.emitted('delete')).toHaveLength(1);
    expect(wrapper.emitted('delete')[0][0]).toBe('id-1');
  });

  it(
    'has no detectable accessibility violations',
    async () => {
    const wrapper = mount(ProcurementRecordsTable, {
      props: {
        procurements: [createProcurement(1)],
        loading: false
      },
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>'
          }
        }
      }
    });

    const results = await runA11yAudit(wrapper.element);
    expectNoA11yViolations(results);
    },
    10000
  );
});

