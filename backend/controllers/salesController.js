/**
 * Coordinates request handling: reads HTTP input, invokes domain services, and returns response payloads.
 * File: backend/controllers/salesController.js
 */

import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';
import Procurement from '../models/Procurement.js';
import mongoose from 'mongoose';
import { calculateInventoryByBranch, calculateInventoryByFilter } from '../services/inventoryService.js';
import { createOutOfStockNotification } from '../services/stockNotificationService.js';
import { withStockLock } from '../services/stockLockService.js';
import {
  resolveProduceTypeForSale,
  buildAggregationContext,
  buildSalesAggregationPayload
} from '../services/salesAggregationService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import {
  normalizeProduceName,
  normalizeProduceNameKey,
  normalizeProduceType
} from '../utils/produceNormalization.js';

// GET /api/sales: list sales visible to requester branch scope with optional pagination metadata.
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

// POST /api/sales: record a cash sale after stock/type resolution, locking, and out-of-stock notification checks.
const createSale = async (req, res) => {
  try {
    const {
      produceName: rawProduceName,
      produceType: requestedProduceType,
      tonnageKg,
      buyerName,
      date,
      time
    } = req.body;
    const produceName = normalizeProduceName(rawProduceName);
    const requestedType = normalizeProduceType(requestedProduceType || '');
    const tonnage = Number(tonnageKg);
    if (!tonnage || Number.isNaN(tonnage)) {
      return res.status(400).json({ message: 'Invalid tonnage value' });
    }

    const inventory = await calculateInventoryByBranch(req.user.branch);
    const resolvedType = resolveProduceTypeForSale(inventory, produceName, requestedType);
    if (resolvedType.error) {
      return res.status(400).json({ message: resolvedType.error });
    }

    // Lock branch + produce writes so concurrent sale requests cannot oversell the same stock bucket.
    const sale = await withStockLock(
      {
        branch: req.user.branch,
        produceName,
        produceType: normalizeProduceType(resolvedType.produceType)
      },
      async () => {
        // Re-read inventory under the lock to validate against the latest committed stock.
        const lockedInventory = await calculateInventoryByBranch(req.user.branch);
        const item = lockedInventory.find(
          (entry) =>
            normalizeProduceNameKey(entry.produceName) === normalizeProduceNameKey(produceName) &&
            normalizeProduceType(entry.produceType) === normalizeProduceType(resolvedType.produceType)
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
          produceName: item.produceName,
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
            produceName: item.produceName,
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

// GET /api/sales/aggregation: build director-facing totals/trends across selected branches and time window.
const getSalesAggregation = async (req, res) => {
  try {
    const aggregationContext = buildAggregationContext({
      period: req.query.period,
      branch: req.query.branch,
      specificDate: req.query.specificDate
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
        branch: mongoose.trusted({ $in: selectedBranches }),
        date: mongoose.trusted({ $gte: rangeStart, $lt: rangeEnd })
      }),
      CreditSale.find({
        branch: mongoose.trusted({ $in: selectedBranches }),
        dateOfDispatch: mongoose.trusted({ $gte: rangeStart, $lt: rangeEnd })
      }),
      Procurement.find({
        branch: mongoose.trusted({ $in: selectedBranches }),
        dateReceived: mongoose.trusted({ $gte: rangeStart, $lt: rangeEnd })
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

// DELETE /api/sales/:id: delete one sale after branch access validation.
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

// PUT /api/sales/:id: correct sale fields with stock-aware recalculation when produce/tonnage changes.
const updateSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    if (req.user.role === 'manager' && sale.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }

    const updatableFields = [
      'produceName',
      'produceType',
      'tonnageKg',
      'buyerName',
      'salesAgentName',
      'date',
      'time'
    ];
    const fieldsToApply = {};

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        fieldsToApply[field] = req.body[field];
      }
    });

    if (Object.keys(fieldsToApply).length === 0) {
      return res.status(400).json({ message: 'No updatable fields provided' });
    }

    const hasStockSensitiveChanges =
      fieldsToApply.produceName !== undefined ||
      fieldsToApply.produceType !== undefined ||
      fieldsToApply.tonnageKg !== undefined;

    const applyNonStockFields = () => {
      if (fieldsToApply.buyerName !== undefined) sale.buyerName = fieldsToApply.buyerName;
      if (fieldsToApply.salesAgentName !== undefined) {
        sale.salesAgentName = fieldsToApply.salesAgentName;
      }
      if (fieldsToApply.date !== undefined) sale.date = fieldsToApply.date;
      if (fieldsToApply.time !== undefined) sale.time = fieldsToApply.time;
    };

    if (!hasStockSensitiveChanges) {
      applyNonStockFields();
      await sale.save();
      return res.json(sale);
    }

    const requestedProduceName =
      fieldsToApply.produceName !== undefined
        ? normalizeProduceName(fieldsToApply.produceName)
        : sale.produceName;
    const requestedProduceType =
      fieldsToApply.produceType !== undefined
        ? normalizeProduceType(fieldsToApply.produceType)
        : normalizeProduceType(sale.produceType);
    const requestedTonnage =
      fieldsToApply.tonnageKg !== undefined ? Number(fieldsToApply.tonnageKg) : Number(sale.tonnageKg);

    if (!requestedTonnage || Number.isNaN(requestedTonnage) || requestedTonnage < 1) {
      return res.status(400).json({ message: 'Invalid tonnage value' });
    }

    const updatedSale = await withStockLock(
      {
        branch: sale.branch,
        produceName: requestedProduceName,
        produceType: requestedProduceType
      },
      async () => {
        const lockedInventory = await calculateInventoryByFilter({ branch: sale.branch });
        const resolvedType = resolveProduceTypeForSale(
          lockedInventory,
          requestedProduceName,
          requestedProduceType
        );

        if (resolvedType.error) {
          throw Object.assign(new Error(resolvedType.error), { statusCode: 400 });
        }

        const normalizedTargetType = normalizeProduceType(resolvedType.produceType);
        const targetItem = lockedInventory.find(
          (entry) =>
            normalizeProduceNameKey(entry.produceName) === normalizeProduceNameKey(requestedProduceName) &&
            normalizeProduceType(entry.produceType) === normalizedTargetType
        );

        if (!targetItem) {
          throw Object.assign(new Error('Product not available in inventory'), { statusCode: 400 });
        }

        // If correction stays in the same produce bucket, treat old sale quantity as returned stock first.
        const sameStockBucket =
          normalizeProduceNameKey(sale.produceName) === normalizeProduceNameKey(targetItem.produceName) &&
          normalizeProduceType(sale.produceType) === normalizeProduceType(targetItem.produceType);

        let availableTonnage = Number(targetItem.totalTonnageKg || 0);
        if (sameStockBucket) {
          availableTonnage += Number(sale.tonnageKg || 0);
        }

        if (requestedTonnage > availableTonnage) {
          throw Object.assign(
            new Error(`Insufficient stock. Available: ${Math.max(availableTonnage, 0)} kg`),
            { statusCode: 400 }
          );
        }

        // Recompute amount from current bucket price so corrected records stay pricing-consistent.
        const unitPrice = Number(targetItem.sellingPrice || 0);
        if (!unitPrice || Number.isNaN(unitPrice)) {
          throw Object.assign(new Error('Unable to determine selling price for selected produce'), {
            statusCode: 400
          });
        }

        sale.produceName = targetItem.produceName;
        sale.produceType = targetItem.produceType;
        sale.tonnageKg = requestedTonnage;
        sale.amountPaidUgx = unitPrice * requestedTonnage;
        applyNonStockFields();

        await sale.save();

        // Notify only when the post-correction stock drops to zero.
        const remainingStock = availableTonnage - requestedTonnage;
        if (remainingStock <= 0) {
          await createOutOfStockNotification({
            branch: sale.branch,
            produceName: sale.produceName,
            produceType: sale.produceType
          });
        }

        return sale;
      }
    );

    return res.json(updatedSale);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};

export { getAllSales, createSale, getSalesAggregation, updateSale, deleteSale };





