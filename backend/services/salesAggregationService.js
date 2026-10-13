/*
 * Builds sales aggregation context and payloads for director reporting, including branch filters,
 * period windows, trend buckets, and combined cash/credit/procurement totals.
 */

import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';
import Procurement from '../models/Procurement.js';
import {
  normalizeProduceNameKey,
  normalizeProduceType
} from '../utils/produceNormalization.js';
import { addUtcDays, formatDisplayDate, startOfUtcDay } from '../utils/dateFormat.js';
import { roundUgx } from '../utils/money.js';
import { getRegisteredBranches } from '../config/branches.js';
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

  const matched = getRegisteredBranches().find(
    (branch) => branch.toLowerCase() === requested.toLowerCase()
  );
  return matched || null;
};

// Convert date to UTC start-of-day so report buckets match specificDate (also UTC midnight).
const atStartOfDay = (dateValue) => startOfUtcDay(dateValue);

// Return a new date shifted by the requested number of UTC calendar days.
const addDays = (dateValue, days) => addUtcDays(dateValue, days);

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
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1));
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

  const selectedBranches = normalizedBranch === 'all' ? getRegisteredBranches() : [normalizedBranch];
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

const bucketBoundaries = (trendBuckets) => {
  const boundaries = trendBuckets.map((bucket) => new Date(bucket.start));
  boundaries.push(new Date(trendBuckets[trendBuckets.length - 1].end));
  return boundaries;
};

const dateMatch = (dateField, rangeStart, rangeEnd) => ({
  [dateField]: { $gte: rangeStart, $lt: rangeEnd }
});

const aggregateByBranch = (Model, match, amountField) =>
  Model.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$branch',
        amount: { $sum: `$${amountField}` },
        totalKg: { $sum: '$tonnageKg' },
        count: { $sum: 1 }
      }
    }
  ]);

const aggregateByBucket = (Model, match, dateField, amountField, boundaries) =>
  Model.aggregate([
    { $match: match },
    {
      $bucket: {
        groupBy: `$${dateField}`,
        boundaries,
        default: 'other',
        output: { amount: { $sum: `$${amountField}` } }
      }
    }
  ]);

const applyBucketRows = (trendBuckets, rows) => {
  rows.forEach((row) => {
    if (row._id === 'other' || row._id == null) return;
    const key = new Date(row._id).getTime();
    const bucket = trendBuckets.find((item) => item.start.getTime() === key);
    if (bucket) bucket.total = roundUgx(bucket.total + Number(row.amount || 0));
  });
};

const sumCount = (rows) => rows.reduce((sum, row) => sum + Number(row.count || 0), 0);

// Build final aggregation response payload with branch totals, trends, and report counters.
const buildSalesAggregationPayload = ({
  period,
  branch,
  rangeStart,
  rangeEnd,
  selectedBranches,
  trendBuckets,
  salesByBranch,
  creditByBranch,
  procurementByBranch,
  salesTrend,
  creditTrend
}) => {
  const branchTotals = {};
  const procurementTotals = {};

  selectedBranches.forEach((selectedBranch) => {
    branchTotals[selectedBranch] = { cash: 0, credit: 0, totalKg: 0 };
    procurementTotals[selectedBranch] = { totalCost: 0, totalKg: 0, count: 0 };
  });

  salesByBranch.forEach((row) => {
    if (!branchTotals[row._id]) return;
    branchTotals[row._id].cash = roundUgx(branchTotals[row._id].cash + Number(row.amount || 0));
    branchTotals[row._id].totalKg += Number(row.totalKg || 0);
  });

  creditByBranch.forEach((row) => {
    if (!branchTotals[row._id]) return;
    branchTotals[row._id].credit = roundUgx(branchTotals[row._id].credit + Number(row.amount || 0));
    branchTotals[row._id].totalKg += Number(row.totalKg || 0);
  });

  procurementByBranch.forEach((row) => {
    const totals = procurementTotals[row._id];
    if (!totals) return;
    totals.totalCost = roundUgx(totals.totalCost + Number(row.amount || 0));
    totals.totalKg += Number(row.totalKg || 0);
    totals.count += Number(row.count || 0);
  });

  applyBucketRows(trendBuckets, salesTrend);
  applyBucketRows(trendBuckets, creditTrend);

  const grandTotal = Object.values(branchTotals).reduce(
    (totals, selectedBranch) => ({
      cash: totals.cash + selectedBranch.cash,
      credit: totals.credit + selectedBranch.credit,
      totalKg: totals.totalKg + selectedBranch.totalKg
    }),
    { cash: 0, credit: 0, totalKg: 0 }
  );

  const procurementTotal = procurementByBranch.reduce(
    (sum, row) => sum + Number(row.amount || 0),
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
      salesCount: sumCount(salesByBranch),
      creditSalesCount: sumCount(creditByBranch),
      procurementCount: sumCount(procurementByBranch),
      procurementTotal
    }
  };
};

const loadDirectorAggregation = async ({ period, branch, specificDate }) => {
  const context = buildAggregationContext({ period, branch, specificDate });
  if (context.error) return context;

  const { selectedBranches, trendBuckets, rangeStart, rangeEnd } = context;
  const boundaries = bucketBoundaries(trendBuckets);
  const branchMatch = { branch: { $in: selectedBranches } };

  const [salesByBranch, creditByBranch, procurementByBranch, salesTrend, creditTrend] =
    await Promise.all([
      aggregateByBranch(Sale, { ...branchMatch, deletedAt: null, ...dateMatch('date', rangeStart, rangeEnd) }, 'amountPaidUgx'),
      aggregateByBranch(
        CreditSale,
        { ...branchMatch, deletedAt: null, ...dateMatch('dateOfDispatch', rangeStart, rangeEnd) },
        'amountDueUgx'
      ),
      aggregateByBranch(
        Procurement,
        { ...branchMatch, deletedAt: null, ...dateMatch('dateReceived', rangeStart, rangeEnd) },
        'costUgx'
      ),
      aggregateByBucket(
        Sale,
        { ...branchMatch, deletedAt: null, ...dateMatch('date', rangeStart, rangeEnd) },
        'date',
        'amountPaidUgx',
        boundaries
      ),
      aggregateByBucket(
        CreditSale,
        { ...branchMatch, deletedAt: null, ...dateMatch('dateOfDispatch', rangeStart, rangeEnd) },
        'dateOfDispatch',
        'amountDueUgx',
        boundaries
      )
    ]);

  return buildSalesAggregationPayload({
    period: context.period,
    branch: context.branch,
    rangeStart,
    rangeEnd,
    selectedBranches,
    trendBuckets,
    salesByBranch,
    creditByBranch,
    procurementByBranch,
    salesTrend,
    creditTrend
  });
};

export {
  resolveProduceTypeForSale,
  buildAggregationContext,
  buildSalesAggregationPayload,
  bucketBoundaries,
  aggregateByBranch,
  aggregateByBucket,
  loadDirectorAggregation
};