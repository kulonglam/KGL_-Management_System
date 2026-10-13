// Builds manager and sales-agent dashboard totals with MongoDB grouping.
import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';
import Procurement from '../models/Procurement.js';
import { startOfToday, trustedQuery } from '../utils/listQuery.js';
import {
  aggregateByBucket,
  bucketBoundaries,
  buildAggregationContext
} from './salesAggregationService.js';

const firstTotal = (rows) => rows[0] || {};

const ranked = (rows, limit = 5) =>
  rows
    .map((row) => ({ name: row._id || 'Unknown', amount: Number(row.amount || 0), totalKg: Number(row.totalKg || 0) }))
    .filter((row) => row.name)
    .sort((left, right) => (right.amount || right.totalKg) - (left.amount || left.totalKg))
    .slice(0, limit);

const mergeNamedTotals = (groups, valueKey) => {
  const totals = new Map();
  groups.forEach((rows) => {
    rows.forEach((row) => {
      const name = row._id || 'Unknown';
      totals.set(name, (totals.get(name) || 0) + Number(row[valueKey] || 0));
    });
  });
  return [...totals.entries()].map(([_id, value]) => ({ _id, [valueKey]: value }));
};

const summarizeCollection = (Model, match, spec) =>
  Model.aggregate([
    { $match: match },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              amount: { $sum: `$${spec.amountField}` },
              paid: { $sum: { $ifNull: ['$amountPaidUgx', 0] } },
              balance: { $sum: { $ifNull: ['$balanceUgx', 0] } },
              totalKg: { $sum: '$tonnageKg' },
              count: { $sum: 1 }
            }
          }
        ],
        names: [
          { $group: { _id: `$${spec.nameField}`, amount: { $sum: `$${spec.amountField}` }, totalKg: { $sum: '$tonnageKg' } } },
          { $sort: { [spec.sortField]: -1 } },
          { $limit: 50 }
        ]
      }
    }
  ]);

const buildManagerDashboardSummary = async ({ branch, period, specificDate }) => {
  const context = buildAggregationContext({ period, branch, specificDate });
  if (context.error) return context;

  const { trendBuckets, rangeStart, rangeEnd } = context;
  const boundaries = bucketBoundaries(trendBuckets);
  const salesMatch = { branch, deletedAt: null, date: { $gte: rangeStart, $lt: rangeEnd } };
  const creditMatch = { branch, deletedAt: null, dateOfDispatch: { $gte: rangeStart, $lt: rangeEnd } };
  const procurementMatch = { branch, deletedAt: null, dateReceived: { $gte: rangeStart, $lt: rangeEnd } };

  const [salesFacet, creditFacet, procurementFacet, salesTrend, creditTrend] = await Promise.all([
    summarizeCollection(Sale, salesMatch, { amountField: 'amountPaidUgx', nameField: 'produceName', sortField: 'totalKg' }),
    summarizeCollection(CreditSale, creditMatch, { amountField: 'amountDueUgx', nameField: 'produceName', sortField: 'totalKg' }),
    summarizeCollection(Procurement, procurementMatch, { amountField: 'costUgx', nameField: 'dealerName', sortField: 'amount' }),
    aggregateByBucket(Sale, salesMatch, 'date', 'amountPaidUgx', boundaries),
    aggregateByBucket(CreditSale, creditMatch, 'dateOfDispatch', 'amountDueUgx', boundaries)
  ]);

  const sales = firstTotal(salesFacet[0]?.totals);
  const credit = firstTotal(creditFacet[0]?.totals);
  const procurement = firstTotal(procurementFacet[0]?.totals);
  const trendBucketsWithAmounts = trendBuckets.map((bucket) => ({ ...bucket, total: 0 }));
  salesTrend.forEach((row) => {
    if (row._id === 'other' || row._id == null) return;
    const bucket = trendBucketsWithAmounts.find((item) => item.start.getTime() === new Date(row._id).getTime());
    if (bucket) bucket.total += Number(row.amount || 0);
  });
  creditTrend.forEach((row) => {
    if (row._id === 'other' || row._id == null) return;
    const bucket = trendBucketsWithAmounts.find((item) => item.start.getTime() === new Date(row._id).getTime());
    if (bucket) bucket.total += Number(row.amount || 0);
  });

  const [agentSales, agentCredit] = await Promise.all([
    Sale.aggregate([
      { $match: salesMatch },
      { $group: { _id: '$salesAgentName', amount: { $sum: '$amountPaidUgx' } } },
      { $sort: { amount: -1 } },
      { $limit: 50 }
    ]),
    CreditSale.aggregate([
      { $match: creditMatch },
      { $group: { _id: '$salesAgentName', amount: { $sum: '$amountDueUgx' } } },
      { $sort: { amount: -1 } },
      { $limit: 50 }
    ])
  ]);

  const topProducts = ranked(
    mergeNamedTotals([salesFacet[0]?.names || [], creditFacet[0]?.names || []], 'totalKg').map((row) => ({
      _id: row._id,
      totalKg: row.totalKg,
      amount: row.totalKg
    })),
    5
  ).map((row) => ({ name: row.name, totalKg: row.totalKg }));

  return {
    reportRange: {
      from: rangeStart,
      to: new Date(rangeEnd.getTime() - 1)
    },
    stats: {
      cashSales: Number(sales.amount || 0),
      cashCount: Number(sales.count || 0),
      creditSales: Number(credit.amount || 0),
      creditCount: Number(credit.count || 0),
      procurementTotal: Number(procurement.amount || 0),
      procurementCount: Number(procurement.count || 0)
    },
    topProducts,
    salesOverTime: trendBucketsWithAmounts.map((bucket) => ({
      label: bucket.label,
      amount: bucket.total
    })),
    creditCollection: {
      collected: Number(credit.paid || 0),
      outstanding: Number(credit.balance || 0)
    },
    agentPerformance: ranked(mergeNamedTotals([agentSales, agentCredit], 'amount'), 5).map((row) => ({
      name: row.name,
      amount: row.amount
    })),
    dealerPerformance: ranked(procurementFacet[0]?.names || [], 5).map((row) => ({
      name: row.name,
      amount: row.amount
    }))
  };
};

const buildAgentDashboardSummary = async ({ userId, branch }) => {
  const start = startOfToday();
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const mine = { branch, recordedBy: userId };
  const todaySales = { ...mine, deletedAt: null, date: { $gte: start, $lt: end } };
  const todayCredit = { ...mine, deletedAt: null, dateOfDispatch: { $gte: start, $lt: end } };

  const [salesRows, creditRows, overdueCount] = await Promise.all([
    Sale.aggregate([
      { $match: todaySales },
      { $group: { _id: null, amount: { $sum: '$amountPaidUgx' }, count: { $sum: 1 }, totalKg: { $sum: '$tonnageKg' } } }
    ]),
    CreditSale.aggregate([
      { $match: todayCredit },
      { $group: { _id: null, amount: { $sum: '$amountDueUgx' }, count: { $sum: 1 }, totalKg: { $sum: '$tonnageKg' } } }
    ]),
    CreditSale.countDocuments({
      ...mine,
      isPaid: false,
      dueDate: trustedQuery({ $lt: start }),
      balanceUgx: trustedQuery({ $gt: 0 })
    })
  ]);

  const sales = firstTotal(salesRows);
  const credit = firstTotal(creditRows);
  return {
    cashSales: Number(sales.amount || 0),
    cashCount: Number(sales.count || 0),
    creditSales: Number(credit.amount || 0),
    creditCount: Number(credit.count || 0),
    totalKg: Number(sales.totalKg || 0) + Number(credit.totalKg || 0),
    overdueCount
  };
};

export { buildManagerDashboardSummary, buildAgentDashboardSummary };
