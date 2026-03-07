import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DirectorDashboard from '../../src/views/DirectorDashboard.vue';
import ManagerDashboard from '../../src/views/ManagerDashboard.vue';

const managerSpies = vi.hoisted(() => ({
  buildDashboardData: vi.fn(),
  clearExportError: vi.fn(),
  clearSpecificDate: vi.fn(),
  exportCsv: vi.fn(),
  exportExcel: vi.fn(),
  exportPdf: vi.fn(),
  loadData: vi.fn()
}));

const directorSpies = vi.hoisted(() => ({
  clearExportError: vi.fn(),
  clearSpecificDate: vi.fn(),
  exportCsv: vi.fn(),
  exportExcel: vi.fn(),
  exportPdf: vi.fn(),
  loadData: vi.fn()
}));

vi.mock('../../src/composables/useManagerDashboard.mjs', () => ({
  useManagerDashboard: () => ({
    agentPerformance: [],
    agentPerformanceChartData: { labels: [], datasets: [] },
    buildDashboardData: managerSpies.buildDashboardData,
    clearSpecificDate: managerSpies.clearSpecificDate,
    clearExportError: managerSpies.clearExportError,
    creditCollectionChartData: { labels: [], datasets: [] },
    dealerPerformance: [],
    dealerPerformanceChartData: { labels: [], datasets: [] },
    exportCsv: managerSpies.exportCsv,
    exportError: 'Popup blocked',
    exportExcel: managerSpies.exportExcel,
    exportPdf: managerSpies.exportPdf,
    filters: { period: 'weekly', specificDate: '2026-03-07' },
    hasCreditCollectionData: false,
    hasRevenueSplitData: false,
    hasSalesTrendData: false,
    loadData: managerSpies.loadData,
    loadError: 'Unable to load dashboard data.',
    loading: false,
    metricItems: [],
    overviewItems: [],
    periodOptions: [
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'yearly', label: 'Yearly' }
    ],
    quickActions: [],
    revenueSplitChartData: { labels: [], datasets: [] },
    salesOverTimeChartData: { labels: [], datasets: [] },
    selectedPeriodLabel: 'Weekly',
    statusMessage: 'Manager dashboard data loaded.',
    stockByProduct: [],
    stockByProductChartData: { labels: [], datasets: [] },
    todayIsoDate: '2026-03-07',
    topProducts: [],
    topProductsChartData: { labels: [], datasets: [] },
    user: { branch: 'Maganjo' }
  })
}));

vi.mock('../../src/composables/useDirectorDashboard.mjs', () => ({
  useDirectorDashboard: () => ({
    branchOptions: [
      { value: 'all', label: 'All Branches' },
      { value: 'Maganjo', label: 'Maganjo' },
      { value: 'Matugga', label: 'Matugga' }
    ],
    branchLabels: ['Maganjo', 'Matugga'],
    branchRevenueChartData: { labels: [], datasets: [] },
    branchTotals: {
      Maganjo: { cash: 1, credit: 2, totalKg: 3 },
      Matugga: { cash: 4, credit: 5, totalKg: 6 }
    },
    branchVolumeChartData: { labels: [], datasets: [] },
    clearSpecificDate: directorSpies.clearSpecificDate,
    clearExportError: directorSpies.clearExportError,
    exportCsv: directorSpies.exportCsv,
    exportError: 'Popup blocked',
    exportExcel: directorSpies.exportExcel,
    exportPdf: directorSpies.exportPdf,
    filters: { period: 'monthly', branch: 'all', specificDate: '2026-03-07' },
    formatCurrency: (value) => `UGX ${value}`,
    hasRevenueData: true,
    hasTrendData: true,
    loadData: directorSpies.loadData,
    loadError: '',
    loading: false,
    metricItems: [],
    overviewItems: [],
    periodOptions: [
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'yearly', label: 'Yearly' }
    ],
    quickActions: [],
    revenueCompositionChartData: { labels: [], datasets: [] },
    selectedPeriodLabel: 'Monthly',
    statusMessage: 'Director dashboard data loaded.',
    todayIsoDate: '2026-03-07',
    trendChartData: { labels: [], datasets: [] }
  })
}));

const globalStubs = {
  InsightStrip: { template: '<div class="insight-strip-stub"></div>' },
  DashboardMetricGrid: { template: '<div class="metric-grid-stub"></div>' },
  QuickActionsPanel: { template: '<div class="quick-actions-stub"></div>' },
  ManagerDashboardCharts: { template: '<div class="manager-charts-stub"></div>' },
  DirectorDashboardCharts: { template: '<div class="director-charts-stub"></div>' }
};

describe('Dashboard views', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders manager toolbar options and handles warning controls', async () => {
    const wrapper = mount(ManagerDashboard, {
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.text()).toContain('Manager Dashboard');
    expect(wrapper.text()).toContain('Maganjo Overview');
    expect(wrapper.findAll('#manager-period-filter option')).toHaveLength(3);

    const buttons = wrapper.findAll('button');
    const clearDateButton = buttons.find((button) => button.text().includes('Clear Date'));
    const retryButton = buttons.find((button) => button.text().includes('Retry'));
    const dismissButton = wrapper.find('button.btn-close');

    await clearDateButton.trigger('click');
    await retryButton.trigger('click');
    await dismissButton.trigger('click');

    expect(managerSpies.clearSpecificDate).toHaveBeenCalledTimes(1);
    expect(managerSpies.loadData).toHaveBeenCalledTimes(1);
    expect(managerSpies.clearExportError).toHaveBeenCalledTimes(1);
  });

  it('renders director period and branch filters and handles warning dismissal', async () => {
    const wrapper = mount(DirectorDashboard, {
      global: {
        stubs: globalStubs
      }
    });

    expect(wrapper.text()).toContain('Director Dashboard');
    expect(wrapper.text()).toContain('Cross-branch report');
    expect(wrapper.findAll('#director-period-filter option')).toHaveLength(3);
    expect(wrapper.findAll('#director-branch-filter option')).toHaveLength(3);

    const buttons = wrapper.findAll('button');
    const clearDateButton = buttons.find((button) => button.text().includes('Clear Date'));
    const dismissButton = wrapper.find('button.btn-close');

    await clearDateButton.trigger('click');
    await dismissButton.trigger('click');

    expect(directorSpies.clearSpecificDate).toHaveBeenCalledTimes(1);
    expect(directorSpies.clearExportError).toHaveBeenCalledTimes(1);
  });
});
