// Coordinates request handling: reads HTTP input, invokes domain services, and returns response payloads.
import Sale from '../models/Sale.js';
import { calculateInventoryByBranch, calculateInventoryByFilter, getBucketTonnage } from '../services/inventoryService.js';
import { syncStockLevelNotifications } from '../services/stockNotificationService.js';
import { withStockLock, withStockLocks } from '../services/stockLockService.js';
import { deniesBranchAccess } from '../utils/branchAccess.js';
import { forwardControllerError } from '../utils/httpError.js';
import { roundUgx } from '../utils/money.js';
import {
  resolveProduceTypeForSale,
  loadDirectorAggregation
} from '../services/salesAggregationService.js';
import {
  buildAgentDashboardSummary,
  buildManagerDashboardSummary
} from '../services/dashboardSummaryService.js';
import { recordAudit, transactionAuditMetadata } from '../services/auditService.js';
import { parsePagination, buildPaginationMeta, applyListLimit } from '../utils/pagination.js';
import { removedOnly, removedRecordFilter } from '../utils/softDelete.js';
import { buildSearchFilter, resolveSort, buildDateRangeFilter } from '../utils/listQuery.js';
import {
  normalizeProduceName,
  normalizeProduceNameKey,
  normalizeProduceType
} from '../utils/produceNormalization.js';
import {
  issueTaxInvoiceForSale,
  issueCreditNoteForVoidedSale
} from '../services/invoiceService.js';
import { emitDomainEvent } from '../services/webhookService.js';
import { assertPeriodOpen } from '../services/periodLockService.js';

const recordSaleAudit = (actor, action, sale) =>
  recordAudit({
    actor,
    action,
    entityType: 'sale',
    entityId: sale._id,
    branch: sale.branch,
    metadata: transactionAuditMetadata(sale)
  });

// GET /api/sales: list sales visible to requester branch scope with optional pagination metadata.
const getAllSales = async (req, res, next) => {
  try {
    const filter = {};

    // Filter by branch for manager and sales agent
    if (req.user.role !== 'director') {
      filter.branch = req.user.branch;
    }

    Object.assign(
      filter,
      buildSearchFilter(req.query.search, ['produceName', 'produceType', 'buyerName', 'salesAgentName'])
    );
    if (req.query.produceType && req.query.produceType !== 'all') {
      filter.produceType = req.query.produceType;
    }

    if (String(req.query.mine) === 'true') {
      filter.recordedBy = req.user._id;
    }
    Object.assign(filter, removedRecordFilter(req.query.deleted));

    const dateRange = buildDateRangeFilter(req.query.from, req.query.to);
    if (dateRange.error) {
      return res.status(400).json({ message: dateRange.error });
    }
    if (dateRange.filter) {
      filter.date = dateRange.filter;
    }

    const pagination = parsePagination(req.query);
    const sort = resolveSort(req.query.sort, {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      amount_desc: { amountPaidUgx: -1 },
      quantity_desc: { tonnageKg: -1 }
    });
    const salesQuery = Sale.find(filter)
      .populate('recordedBy', 'name')
      .sort(sort)
      .lean();
    applyListLimit(salesQuery, pagination);

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
    return forwardControllerError(error, res, next);
  }
};

// POST /api/sales: record a cash sale after stock/type resolution, locking, and out-of-stock notification checks.
const createSale = async (req, res, next) => {
  try {
    const {
      produceName: rawProduceName,
      produceType: requestedProduceType,
      tonnageKg,
      buyerName,
      date,
      time,
      paymentMethod: rawPaymentMethod,
      tenderAmountUgx: rawTenderAmountUgx
    } = req.body;
    const paymentMethod = ['cash', 'momo', 'bank'].includes(String(rawPaymentMethod || '').trim())
      ? String(rawPaymentMethod).trim()
      : 'cash';
    const produceName = normalizeProduceName(rawProduceName);
    const requestedType = normalizeProduceType(requestedProduceType || '');
    const tonnage = Number(tonnageKg);
    if (!tonnage || Number.isNaN(tonnage)) {
      return res.status(400).json({ message: 'Invalid tonnage value' });
    }
    await assertPeriodOpen({ branch: req.user.branch, dates: [date] });

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

        const amountPaidUgx = roundUgx(item.sellingPrice * tonnage);
        const remainingStock = Number(item.totalTonnageKg || 0) - tonnage;
        const tenderAmountUgx =
          rawTenderAmountUgx === undefined || rawTenderAmountUgx === null || rawTenderAmountUgx === ''
            ? amountPaidUgx
            : roundUgx(rawTenderAmountUgx);
        if (tenderAmountUgx < amountPaidUgx) {
          throw Object.assign(
            new Error('tenderAmountUgx must be greater than or equal to amountPaidUgx'),
            { statusCode: 400 }
          );
        }

        const createdSale = await Sale.create({
          produceName: item.produceName,
          produceType: item.produceType,
          tonnageKg: tonnage,
          amountPaidUgx,
          paymentMethod,
          tenderAmountUgx,
          buyerName,
          salesAgentName: req.user.name,
          date,
          time,
          branch: req.user.branch,
          recordedBy: req.user._id
        });

        await syncStockLevelNotifications({
          branch: req.user.branch,
          produceName: item.produceName,
          produceType: item.produceType,
          remainingStock
        });

        return createdSale;
      }
    );

    await recordSaleAudit(req.user, 'create', sale);
    let invoice = null;
    try {
      invoice = await issueTaxInvoiceForSale({ actorUser: req.user, sale });
    } catch {
      /* invoice failure must not block the sale */
    }
    const payload = typeof sale.toObject === 'function' ? sale.toObject() : sale;
    emitDomainEvent('sale.created', {
      saleId: String(sale._id),
      branch: sale.branch,
      amountPaidUgx: sale.amountPaidUgx,
      paymentMethod: sale.paymentMethod || 'cash',
      produceName: sale.produceName
    }).catch(() => {});
    res.status(201).json({ ...payload, invoice });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// GET /api/sales/aggregation: build director-facing totals/trends across selected branches and time window.
const getSalesAggregation = async (req, res, next) => {
  try {
    const payload = await loadDirectorAggregation({
      period: req.query.period,
      branch: req.query.branch,
      specificDate: req.query.specificDate
    });
    if (payload.error) {
      return res.status(400).json({ message: payload.error });
    }
    res.json(payload);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// GET /api/sales/dashboard: branch totals for the manager dashboard, grouped in the database.
const getManagerDashboard = async (req, res, next) => {
  try {
    if (!req.user.branch) {
      return res.status(400).json({ message: 'Manager branch is missing.' });
    }
    const summary = await buildManagerDashboardSummary({
      branch: req.user.branch,
      period: req.query.period,
      specificDate: req.query.specificDate
    });
    if (summary.error) {
      return res.status(400).json({ message: summary.error });
    }
    res.json(summary);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// GET /api/sales/agent-dashboard: today's personal totals for the signed-in sales agent.
const getAgentDashboard = async (req, res, next) => {
  try {
    if (!req.user.branch) {
      return res.status(400).json({ message: 'Sales agent branch is missing.' });
    }
    const summary = await buildAgentDashboardSummary({
      userId: req.user._id,
      branch: req.user.branch
    });
    res.json(summary);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// DELETE /api/sales/:id: delete one sale after branch access validation.
const deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Check if user has access to this branch
    if (deniesBranchAccess(req.user, sale.branch)) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }

    if (sale.voidedAt) {
      return res.status(400).json({ message: 'Voided sales cannot be removed again' });
    }
    await assertPeriodOpen({ branch: sale.branch, dates: [sale.date] });

    await withStockLock(
      {
        branch: sale.branch,
        produceName: sale.produceName,
        produceType: sale.produceType
      },
      async () => {
        sale.deletedAt = new Date();
        await sale.save();
        const snapshot = await calculateInventoryByFilter({ branch: sale.branch });
        await syncStockLevelNotifications({
          branch: sale.branch,
          produceName: sale.produceName,
          produceType: sale.produceType,
          remainingStock: getBucketTonnage(snapshot, sale.produceName, sale.produceType, sale.branch)
        });
      }
    );
    await recordSaleAudit(req.user, 'delete', sale);
    res.json({ message: 'Sale removed. You can restore it from removed records.' });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const restoreSale = async (req, res, next) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, deletedAt: removedOnly() });
    if (!sale) {
      return res.status(404).json({ message: 'Removed sale not found' });
    }
    if (deniesBranchAccess(req.user, sale.branch)) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }
    if (sale.voidedAt) {
      return res.status(400).json({ message: 'Voided sales cannot be restored' });
    }
    await assertPeriodOpen({ branch: sale.branch, dates: [sale.date] });

    await withStockLock(
      {
        branch: sale.branch,
        produceName: sale.produceName,
        produceType: sale.produceType
      },
      async () => {
        const snapshot = await calculateInventoryByFilter({ branch: sale.branch });
        const available = getBucketTonnage(snapshot, sale.produceName, sale.produceType, sale.branch);
        if (available < Number(sale.tonnageKg || 0)) {
          const error = new Error(`Not enough stock to restore this sale. Available: ${available} kg`);
          error.statusCode = 400;
          throw error;
        }
        sale.deletedAt = null;
        await sale.save();
        const afterSnapshot = await calculateInventoryByFilter({ branch: sale.branch });
        await syncStockLevelNotifications({
          branch: sale.branch,
          produceName: sale.produceName,
          produceType: sale.produceType,
          remainingStock: getBucketTonnage(afterSnapshot, sale.produceName, sale.produceType, sale.branch)
        });
      }
    );

    await recordSaleAudit(req.user, 'update', sale);
    res.json(sale);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const voidSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    if (deniesBranchAccess(req.user, sale.branch)) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }
    if (sale.voidedAt || sale.deletedAt) {
      return res.status(400).json({ message: 'Sale is already voided or removed' });
    }

    const voidReason = String(req.body.reason || '').trim();
    if (voidReason.length < 5) {
      return res.status(400).json({ message: 'Void reason must be at least 5 characters' });
    }
    await assertPeriodOpen({ branch: sale.branch, dates: [sale.date] });

    await withStockLock(
      {
        branch: sale.branch,
        produceName: sale.produceName,
        produceType: sale.produceType
      },
      async () => {
        sale.voidedAt = new Date();
        sale.voidReason = voidReason;
        sale.voidedBy = req.user._id;
        sale.deletedAt = sale.voidedAt;
        await sale.save();
        const snapshot = await calculateInventoryByFilter({ branch: sale.branch });
        await syncStockLevelNotifications({
          branch: sale.branch,
          produceName: sale.produceName,
          produceType: sale.produceType,
          remainingStock: getBucketTonnage(snapshot, sale.produceName, sale.produceType, sale.branch)
        });
      }
    );

    await recordAudit({
      actor: req.user,
      action: 'void',
      entityType: 'sale',
      entityId: sale._id,
      branch: sale.branch,
      metadata: { ...transactionAuditMetadata(sale), voidReason }
    });
    let creditNote = null;
    try {
      creditNote = await issueCreditNoteForVoidedSale({
        actorUser: req.user,
        sale,
        voidReason
      });
    } catch {
      /* credit note failure must not block void */
    }
    emitDomainEvent('sale.voided', {
      saleId: String(sale._id),
      branch: sale.branch,
      voidReason,
      amountPaidUgx: sale.amountPaidUgx
    }).catch(() => {});
    res.json({ message: 'Sale voided. Stock has been returned.', sale, creditNote });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// PUT /api/sales/:id: correct sale fields with stock-aware recalculation when produce/tonnage changes.
const updateSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    if (deniesBranchAccess(req.user, sale.branch)) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }
    if (sale.voidedAt) {
      return res.status(400).json({ message: 'Cannot edit a voided sale' });
    }
    await assertPeriodOpen({ branch: sale.branch, dates: [sale.date, req.body.date] });

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
      await recordSaleAudit(req.user, 'update', sale);
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

    const previousProduceName = sale.produceName;
    const previousProduceType = sale.produceType;
    const updatedSale = await withStockLocks(
      [
        {
          branch: sale.branch,
          produceName: previousProduceName,
          produceType: previousProduceType
        },
        {
          branch: sale.branch,
          produceName: requestedProduceName,
          produceType: requestedProduceType
        }
      ],
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
        sale.amountPaidUgx = roundUgx(unitPrice * requestedTonnage);
        applyNonStockFields();

        await sale.save();

        const remainingStock = availableTonnage - requestedTonnage;
        await syncStockLevelNotifications({
          branch: sale.branch,
          produceName: sale.produceName,
          produceType: sale.produceType,
          remainingStock
        });

        if (!sameStockBucket) {
          const afterSnapshot = await calculateInventoryByFilter({ branch: sale.branch });
          await syncStockLevelNotifications({
            branch: sale.branch,
            produceName: previousProduceName,
            produceType: previousProduceType,
            remainingStock: getBucketTonnage(
              afterSnapshot,
              previousProduceName,
              previousProduceType,
              sale.branch
            )
          });
        }

        return sale;
      }
    );

    await recordSaleAudit(req.user, 'update', updatedSale);
    return res.json(updatedSale);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

export {
  getAllSales,
  createSale,
  getSalesAggregation,
  getManagerDashboard,
  getAgentDashboard,
  updateSale,
  deleteSale,
  restoreSale,
  voidSale
};





