import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';
import Procurement from '../models/Procurement.js';
import { calculateInventoryByBranch } from '../services/inventoryService.js';
import { withStockLock } from '../services/stockLockService.js';
import { createOutOfStockNotification } from '../services/stockNotificationService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const BRANCHES = ['Maganjo', 'Matugga'];
const PERIODS = new Set(['weekly', 'monthly', 'yearly']);

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

const normalizePeriod = (value) => {
  const period = String(value || 'weekly').toLowerCase();
  return PERIODS.has(period) ? period : 'weekly';
};

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

const atStartOfDay = (dateValue) => {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (dateValue, days) => {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + days);
  return date;
};

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
      label: period === 'weekly'
        ? start.toLocaleDateString('en-US', { weekday: 'short' })
        : start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: 0
    });
  }

  return buckets;
};

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

const getAllSales = async (req, res) => {
  try {
    const filter = {};

    // Filter by branch for manager and sales agent
    if (req.user.role !== 'director') {
      filter.branch = req.user.branch;
    }

    const pagination = parsePagination(req.query);
    const salesQuery = Sale.find(filter)
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    if (pagination.enabled) {
      salesQuery.skip(pagination.skip).limit(pagination.limit);
    }

    const sales = await salesQuery;
    if (!pagination.enabled) {
      return res.json(sales);
    }

    const total = await Sale.countDocuments(filter);

    return res.json({
      items: sales,
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total
      })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSale = async (req, res) => {
  try {
    const {
      produceName,
      produceType: requestedProduceType,
      tonnageKg,
      buyerName,
      date,
      time
    } = req.body;
    const tonnage = Number(tonnageKg);
    if (!tonnage || Number.isNaN(tonnage)) {
      return res.status(400).json({ message: 'Invalid tonnage value' });
    }

    const inventory = await calculateInventoryByBranch(req.user.branch);
    const resolvedType = resolveProduceTypeForSale(inventory, produceName, requestedProduceType);
    if (resolvedType.error) {
      return res.status(400).json({ message: resolvedType.error });
    }

    const lockKey = {
      branch: req.user.branch,
      produceName,
      produceType: resolvedType.produceType
    };

    const sale = await withStockLock(lockKey, async () => {
      const lockedInventory = await calculateInventoryByBranch(req.user.branch);
      const item = lockedInventory.find((entry) => (
        entry.produceName === produceName &&
        entry.produceType === resolvedType.produceType
      ));

      if (!item) {
        throw Object.assign(new Error('Product not available in inventory'), { statusCode: 400 });
      }

      if (item.totalTonnageKg < tonnage) {
        throw Object.assign(
          new Error(`Insufficient stock. Available: ${item.totalTonnageKg} kg`),
          { statusCode: 400 }
        );
      }

      const amountPaidUgx = item.sellingPrice * tonnage;
      const remainingStock = Number(item.totalTonnageKg || 0) - tonnage;

      const sale = await Sale.create({
        produceName,
        produceType: item.produceType,
        tonnageKg: tonnage,
        amountPaidUgx,
        buyerName,
        salesAgentName: req.user.name,
        date,
        time,
        branch: req.user.branch,
        recordedBy: req.user._id
      });

      if (remainingStock <= 0) {
        await createOutOfStockNotification({
          branch: req.user.branch,
          produceName,
          produceType: item.produceType
        });
      }

      return sale;
    });

    res.status(201).json(sale);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ message: error.message });
  }
};

const getSalesAggregation = async (req, res) => {
  try {
    const period = normalizePeriod(req.query.period);
    const branchFilter = normalizeBranch(req.query.branch);

    if (!branchFilter) {
      return res.status(400).json({ message: 'Invalid branch filter.' });
    }

    const selectedBranches = branchFilter === 'all' ? BRANCHES : [branchFilter];
    const trendBuckets = buildTrendBuckets(period);
    const rangeStart = trendBuckets[0].start;
    const rangeEnd = trendBuckets[trendBuckets.length - 1].end;

    const [sales, creditSales, procurements] = await Promise.all([
      Sale.find({
        branch: { $in: selectedBranches },
        date: { $gte: rangeStart, $lt: rangeEnd }
      }),
      CreditSale.find({
        branch: { $in: selectedBranches },
        dateOfDispatch: { $gte: rangeStart, $lt: rangeEnd }
      }),
      Procurement.find({
        branch: { $in: selectedBranches },
        dateReceived: { $gte: rangeStart, $lt: rangeEnd }
      })
    ]);

    const branchTotals = {};
    const procurementTotals = {};
    selectedBranches.forEach((branch) => {
      branchTotals[branch] = { cash: 0, credit: 0, totalKg: 0 };
      procurementTotals[branch] = { totalCost: 0, totalKg: 0, count: 0 };
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
      (totals, branch) => ({
        cash: totals.cash + branch.cash,
        credit: totals.credit + branch.credit,
        totalKg: totals.totalKg + branch.totalKg
      }),
      { cash: 0, credit: 0, totalKg: 0 }
    );

    const procurementTotal = procurements.reduce(
      (sum, procurement) => sum + Number(procurement.costUgx || 0),
      0
    );

    res.json({
      period,
      branch: branchFilter,
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
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Check if user has access to this branch
    if (req.user.role === 'manager' && sale.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }

    await sale.deleteOne();
    res.json({ message: 'Sale deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getAllSales, createSale, getSalesAggregation, deleteSale };
