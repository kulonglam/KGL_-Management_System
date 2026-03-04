/** Dashboard chart component tests with chart stubs and accessibility assertions. */
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import DirectorDashboardCharts from '../../src/components/dashboards/DirectorDashboardCharts.vue';
import ManagerDashboardCharts from '../../src/components/dashboards/ManagerDashboardCharts.vue';
import { expectNoA11yViolations, runA11yAudit } from './a11y-utils.mjs';

vi.mock('vue-chartjs', () => {
  const stub = defineComponent({
    name: 'ChartStub',
    template: '<div class="chart-stub"></div>'
  });
  return {
    Bar: stub,
    Doughnut: stub,
    Line: stub
  };
});

const emptyDataset = {
  labels: [],
  datasets: []
};

describe('Dashboard chart components', () => {
  it('shows empty-state messages for manager charts when data is missing', () => {
    const wrapper = mount(ManagerDashboardCharts, {
      props: {
        selectedPeriodLabel: 'Weekly',
        hasRevenueSplitData: false,
        revenueSplitChartData: emptyDataset,
        hasCreditCollectionData: false,
        creditCollectionChartData: emptyDataset,
        hasSalesTrendData: false,
        salesOverTimeChartData: emptyDataset,
        agentPerformance: [],
        agentPerformanceChartData: emptyDataset,
        topProducts: [],
        topProductsChartData: emptyDataset,
        stockByProduct: [],
        stockByProductChartData: emptyDataset,
        dealerPerformance: [],
        dealerPerformanceChartData: emptyDataset
      }
    });

    expect(wrapper.text()).toContain('No sales recorded yet');
    expect(wrapper.text()).toContain('No inventory available');
    expect(wrapper.text()).toContain('No procurement recorded yet');
  });

  it('renders branch summary table rows in director charts', () => {
    const wrapper = mount(DirectorDashboardCharts, {
      props: {
        selectedPeriodLabel: 'Monthly',
        hasTrendData: true,
        trendChartData: emptyDataset,
        hasRevenueData: true,
        revenueCompositionChartData: emptyDataset,
        branchLabels: ['Maganjo'],
        branchRevenueChartData: emptyDataset,
        branchVolumeChartData: emptyDataset,
        branchTotals: {
          Maganjo: {
            cash: 100000,
            credit: 20000,
            totalKg: 500
          }
        },
        formatCurrency: (value) => `UGX ${Number(value || 0)}`
      }
    });

    expect(wrapper.text()).toContain('Branch Totals Summary');
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(wrapper.text()).toContain('Maganjo');
    expect(wrapper.text()).toContain('UGX 100000');
  });

  it('has no detectable accessibility violations for manager chart layout', async () => {
    const wrapper = mount(ManagerDashboardCharts, {
      props: {
        selectedPeriodLabel: 'Weekly',
        hasRevenueSplitData: false,
        revenueSplitChartData: emptyDataset,
        hasCreditCollectionData: false,
        creditCollectionChartData: emptyDataset,
        hasSalesTrendData: false,
        salesOverTimeChartData: emptyDataset,
        agentPerformance: [],
        agentPerformanceChartData: emptyDataset,
        topProducts: [],
        topProductsChartData: emptyDataset,
        stockByProduct: [],
        stockByProductChartData: emptyDataset,
        dealerPerformance: [],
        dealerPerformanceChartData: emptyDataset
      }
    });

    const results = await runA11yAudit(wrapper.element);
    expectNoA11yViolations(results);
  });

  it('has no detectable accessibility violations for director chart layout', async () => {
    const wrapper = mount(DirectorDashboardCharts, {
      props: {
        selectedPeriodLabel: 'Monthly',
        hasTrendData: true,
        trendChartData: emptyDataset,
        hasRevenueData: true,
        revenueCompositionChartData: emptyDataset,
        branchLabels: ['Maganjo'],
        branchRevenueChartData: emptyDataset,
        branchVolumeChartData: emptyDataset,
        branchTotals: {
          Maganjo: {
            cash: 100000,
            credit: 20000,
            totalKg: 500
          }
        },
        formatCurrency: (value) => `UGX ${Number(value || 0)}`
      }
    });

    const results = await runA11yAudit(wrapper.element);
    expectNoA11yViolations(results);
  });
});

