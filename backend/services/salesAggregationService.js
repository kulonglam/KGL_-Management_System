/*
 * Builds sales aggregation context and payloads for director reporting, including branch filters,
 * period windows, trend buckets, and combined cash/credit/procurement totals.
 */

import {
  normalizeProduceNameKey,
  normalizeProduceType
} from '../utils/produceNormalization.js';
import { formatDisplayDate } from '../utils/dateFormat.js';

// Branch identifiers supported by aggregation endpoints.
const BRANCHES = ['Maganjo', 'Matugga'];
// Allowed period filters for trend calculations.
const PERIODS = new Set(['weekly', 'monthly', 'yearly']);
// Strict specific-date input format (YYYY-MM-DD).
const SPECIFIC_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Resolve concrete produce type for a sale using current inventory rows and optional type hint.
const resolveProduceTypeForSale = (inventory, produceName, requestedProduceType) => {
  const requestedNameKey = normalizeProduceNameKey(produceName);
  const requestedType = normalizeProduceType(requestedProduceType || '');
  const candidates = inventory.filter(
    (entry) => normalizeProduceNameKey(entry.produceName) === requestedNameKey
  );
  if (candidates.length === 0) {
    return { error: 'Product not available in inventory' };
  }

  if (requestedType) {
    const match = candidates.find((entry) => normalizeProduceType(entry.produceType) === requestedType);
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

// Normalize period input and fall back to weekly for unknown values.
const normalizePeriod = (value) => {
  const period = String(value || 'weekly').toLowerCase();
  return PERIODS.has(period) ? period : 'weekly';
};

// Normalize branch filter input; supports explicit branch names and "all".
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

// Convert date to start-of-day timestamp for bucket boundaries.
const atStartOfDay = (dateValue) => {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Return a new date shifted by the requested number of calendar days.
const addDays = (dateValue, days) => {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + days);
  return date;
};

// Parse specific-date query input and return canonical UTC midnight date or error.
const parseSpecificDate = (value) => {
  if (value === undefined || value === null || value === '') {
    return { specificDate: null };
  }

  const dateText = String(value).trim();
  if (!SPECIFIC_DATE_PATTERN.test(dateText)) {
    return { error: 'specificDate must be in YYYY-MM-DD format' };
  }

  const parsed = new Date(`${dateText}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return { error: 'specificDate must be a valid date' };
  }

  return { specificDate: parsed };
};

// Build ordered trend buckets for weekly/monthly/yearly or one-day specific-date mode.
const buildTrendBuckets = (period, specificDate = null) => {
  if (specificDate) {
    const start = new Date(specificDate);
    const end = addDays(start, 1);
    return [
      {
        start,
        end,
        label: formatDisplayDate(start),
        total: 0
      }
    ];
  }

  const now = new Date();
  const buckets = [];

  if (period === 'yearly') {
    for (let i = 11; i >= 0; i -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      buckets.push({
        start,
        end,
        label: formatDisplayDate(start),
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
      label: formatDisplayDate(start),
      total: 0
    });
  }

  return buckets;
};

// Add one monetary amount to its corresponding trend bucket by transaction date.
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

// Build validated aggregation context (filters, date range, branches, and trend buckets).
const buildAggregationContext = ({ period, branch, specificDate }) => {
  const normalizedPeriod = normalizePeriod(period);
  const normalizedBranch = normalizeBranch(branch);
  const parsedSpecificDate = parseSpecificDate(specificDate);

  if (!normalizedBranch) {
    return { error: 'Invalid branch filter.' };
  }
  if (parsedSpecificDate.error) {
    return { error: parsedSpecificDate.error };
  }

  const selectedBranches = normalizedBranch === 'all' ? BRANCHES : [normalizedBranch];
  const trendBuckets = buildTrendBuckets(normalizedPeriod, parsedSpecificDate.specificDate);
  const rangeStart = new Date(trendBuckets[0].start);
  const rangeEnd = new Date(trendBuckets[trendBuckets.length - 1].end);

  return {
    period: parsedSpecificDate.specificDate ? 'specific_date' : normalizedPeriod,
    branch: normalizedBranch,
    specificDate: parsedSpecificDate.specificDate,
    selectedBranches,
    trendBuckets,
    rangeStart,
    rangeEnd
  };
};

// Build final aggregation response payload with branch totals, trends, and report counters.
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