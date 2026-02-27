import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';
import Procurement from '../models/Procurement.js';
import { calculateInventoryByBranch } from '../services/inventoryService.js';
import { createOutOfStockNotification } from '../services/stockNotificationService.js';
import { withStockLock } from '../services/stockLockService.js';
import {
  resolveProduceTypeForSale,
  buildAggregationContext,
  buildSalesAggregationPayload
} from '../services/salesAggregationService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

// Retrieve all sales.
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

// Create sale.
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

    const sale = await withStockLock(
      {
        branch: req.user.branch,
        produceName,
        produceType: resolvedType.produceType
      },
      async () => {
        const lockedInventory = await calculateInventoryByBranch(req.user.branch);
        const item = lockedInventory.find(
          (entry) => entry.produceName === produceName && entry.produceType === resolvedType.produceType
        );

        if (!item) {
          throw Object.assign(new Error('Product not available in inventory'), { statusCode: 400 });
        }

        if (item.totalTonnageKg < tonnage) {
          throw Object.assign(new Error(`Insufficient stock. Available: ${item.totalTonnageKg} kg`), {
            statusCode: 400
          });
        }

        const amountPaidUgx = item.sellingPrice * tonnage;
        const remainingStock = Number(item.totalTonnageKg || 0) - tonnage;

        const createdSale = await Sale.create({
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

        return createdSale;
      }
    );

    res.status(201).json(sale);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ message: error.message });
  }
};

// Retrieve sales aggregation.
const getSalesAggregation = async (req, res) => {
  try {
    const aggregationContext = buildAggregationContext({
      period: req.query.period,
      branch: req.query.branch
    });
    if (aggregationContext.error) {
      return res.status(400).json({ message: aggregationContext.error });
    }

    const {
      period,
      branch: branchFilter,
      selectedBranches,
      trendBuckets,
      rangeStart,
      rangeEnd
    } = aggregationContext;

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

    const payload = buildSalesAggregationPayload({
      period,
      branch: branchFilter,
      rangeStart,
      rangeEnd,
      selectedBranches,
      trendBuckets,
      sales,
      creditSales,
      procurements
    });

    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete sale.
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
