// Configure branches.
const BRANCHES = ['Maganjo', 'Matugga'];
// Configure supported aggregation periods.
const PERIODS = new Set(['weekly', 'monthly', 'yearly']);

// Resolve produce type for sale creation from current inventory.
const resolveProduceTypeForSale = (inventory, produceName, requestedProduceType) => {
  const candidates = inventory.filter((entry) => entry.produceName === produceName);
  if (candidates.length === 0) {
    return { error: 'Product not available in inventory' };
  }

  if (requestedProduceType) {
    const match = candidates.find((entry) => entry.produceType === requestedProduceType);
    if (!match) {
      return { error: 'Selected produce type is not available in inventory' };
    }
    return { produceType: match.produceType };
  }

  if (candidates.length > 1) {
    return { error: 'Multiple produce types found. Please select a produce type.' };
  }

  return { produceType: candidates[0].produceType };
};

// Normalize incoming period value with a safe default.
const normalizePeriod = (value) => {
  const period = String(value || 'weekly').toLowerCase();
  return PERIODS.has(period) ? period : 'weekly';
};

// Normalize incoming branch filter and preserve branch casing.
const normalizeBranch = (value) => {
  if (value === undefined || value === null || value === '') {
    return 'all';
  }

  const requested = String(value).trim();
  if (requested.toLowerCase() === 'all') {
    return 'all';
  }

  const matched = BRANCHES.find((branch) => branch.toLowerCase() === requested.toLowerCase());
  return matched || null;
};

// Return midnight for a date value.
const atStartOfDay = (dateValue) => {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Return a date offset by a number of days.
const addDays = (dateValue, days) => {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + days);
  return date;
};

// Build trend buckets for the selected period.
const buildTrendBuckets = (period) => {
  const now = new Date();
  const buckets = [];

  if (period === 'yearly') {
    for (let i = 11; i >= 0; i -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      buckets.push({
        start,
        end,
        label: start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        total: 0
      });
    }
    return buckets;
  }

  const dayCount = period === 'monthly' ? 30 : 7;
  const today = atStartOfDay(now);

  for (let i = dayCount - 1; i >= 0; i -= 1) {
    const start = addDays(today, -i);
    const end = addDays(start, 1);
    buckets.push({
      start,
      end,
      label:
        period === 'weekly'
          ? start.toLocaleDateString('en-US', { weekday: 'short' })
          : start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: 0
    });
  }

  return buckets;
};

// Add a sale amount to the correct trend bucket.
const addAmountToTrend = (buckets, dateValue, amount) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return;

  const numericAmount = Number(amount || 0);
  for (let i = 0; i < buckets.length; i += 1) {
    const bucket = buckets[i];
    if (date >= bucket.start && date < bucket.end) {
      bucket.total += numericAmount;
      return;
    }
  }
};

// Build normalized aggregation context from query filters.
const buildAggregationContext = ({ period, branch }) => {
  const normalizedPeriod = normalizePeriod(period);
  const normalizedBranch = normalizeBranch(branch);

  if (!normalizedBranch) {
    return { error: 'Invalid branch filter.' };
  }

  const selectedBranches = normalizedBranch === 'all' ? BRANCHES : [normalizedBranch];
  const trendBuckets = buildTrendBuckets(normalizedPeriod);
  const rangeStart = trendBuckets[0].start;
  const rangeEnd = trendBuckets[trendBuckets.length - 1].end;

  return {
    period: normalizedPeriod,
    branch: normalizedBranch,
    selectedBranches,
    trendBuckets,
    rangeStart,
    rangeEnd
  };
};

// Build sales aggregation response payload.
const buildSalesAggregationPayload = ({
  period,
  branch,
  rangeStart,
  rangeEnd,
  selectedBranches,
  trendBuckets,
  sales,
  creditSales,
  procurements
}) => {
  const branchTotals = {};
  const procurementTotals = {};

  selectedBranches.forEach((selectedBranch) => {
    branchTotals[selectedBranch] = { cash: 0, credit: 0, totalKg: 0 };
    procurementTotals[selectedBranch] = { totalCost: 0, totalKg: 0, count: 0 };
  });

  sales.forEach((sale) => {
    if (!branchTotals[sale.branch]) return;
    branchTotals[sale.branch].cash += Number(sale.amountPaidUgx || 0);
    branchTotals[sale.branch].totalKg += Number(sale.tonnageKg || 0);
    addAmountToTrend(trendBuckets, sale.date, sale.amountPaidUgx);
  });

  creditSales.forEach((creditSale) => {
    if (!branchTotals[creditSale.branch]) return;
    branchTotals[creditSale.branch].credit += Number(creditSale.amountDueUgx || 0);
    branchTotals[creditSale.branch].totalKg += Number(creditSale.tonnageKg || 0);
    addAmountToTrend(trendBuckets, creditSale.dateOfDispatch, creditSale.amountDueUgx);
  });

  procurements.forEach((procurement) => {
    const totals = procurementTotals[procurement.branch];
    if (!totals) return;
    totals.totalCost += Number(procurement.costUgx || 0);
    totals.totalKg += Number(procurement.tonnageKg || 0);
    totals.count += 1;
  });

  const grandTotal = Object.values(branchTotals).reduce(
    (totals, selectedBranch) => ({
      cash: totals.cash + selectedBranch.cash,
      credit: totals.credit + selectedBranch.credit,
      totalKg: totals.totalKg + selectedBranch.totalKg
    }),
    { cash: 0, credit: 0, totalKg: 0 }
  );

  const procurementTotal = procurements.reduce(
    (sum, procurement) => sum + Number(procurement.costUgx || 0),
    0
  );

  return {
    period,
    branch,
    range: {
      from: rangeStart,
      to: new Date(rangeEnd.getTime() - 1)
    },
    branchTotals,
    procurementTotals,
    grandTotal,
    trends: {
      labels: trendBuckets.map((bucket) => bucket.label),
      data: trendBuckets.map((bucket) => bucket.total)
    },
    report: {
      salesCount: sales.length,
      creditSalesCount: creditSales.length,
      procurementCount: procurements.length,
      procurementTotal
    }
  };
};

export { resolveProduceTypeForSale, buildAggregationContext, buildSalesAggregationPayload };
