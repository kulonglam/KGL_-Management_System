//  Coordinates request handling: reads HTTP input, invokes domain services, and returns response payloads.
 

import CreditSale from '../models/CreditSale.js';
import {
  applyCreditPaymentStatusUpdate,
  createCreditSaleRecord,
  repayCreditSaleRecord
} from '../services/creditSalesService.js';
import { recordAudit, transactionAuditMetadata } from '../services/auditService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { buildSearchFilter, startOfToday, resolveSort, trustedQuery, buildDateRangeFilter } from '../utils/listQuery.js';
import { deniesBranchAccess } from '../utils/branchAccess.js';
import { forwardControllerError } from '../utils/httpError.js';
import { roundUgx } from '../utils/money.js';

const recordCreditSaleAudit = (actor, action, creditSale, extra) =>
  recordAudit({
    actor,
    action,
    entityType: 'creditSale',
    entityId: creditSale._id,
    branch: creditSale.branch,
    metadata: transactionAuditMetadata(creditSale, extra)
  });

// GET /api/credit-sales: list branch-scoped credit sales with optional pagination.
const getAllCreditSales = async (req, res, next) => {
  try {
    const filter = {};

    // Filter by branch for manager and sales agent
    if (req.user.role !== 'director') {
      filter.branch = req.user.branch;
    }

    Object.assign(
      filter,
      buildSearchFilter(req.query.search, [
        'buyerName',
        'nationalId',
        'produceName',
        'produceType',
        'salesAgentName',
        'contact'
      ])
    );
    if (String(req.query.mine) === 'true') {
      filter.recordedBy = req.user._id;
    }

    const dateRange = buildDateRangeFilter(req.query.from, req.query.to);
    if (dateRange.error) {
      return res.status(400).json({ message: dateRange.error });
    }
    if (dateRange.filter) {
      filter.dateOfDispatch = dateRange.filter;
    }

    // Summary stays branch-wide. Status only narrows the table rows.
    const summaryFilter = { ...filter };
    const status = String(req.query.status || 'all');
    const today = startOfToday();
    if (status === 'paid') {
      filter.isPaid = true;
    } else if (status === 'outstanding') {
      filter.isPaid = false;
      filter.dueDate = trustedQuery({ $gte: today });
    } else if (status === 'overdue') {
      filter.isPaid = false;
      filter.dueDate = trustedQuery({ $lt: today });
      filter.balanceUgx = trustedQuery({ $gt: 0 });
    }

    const pagination = parsePagination(req.query);
    const sort = resolveSort(req.query.sort, {
      newest: { dateOfDispatch: -1, createdAt: -1 },
      oldest: { dateOfDispatch: 1, createdAt: 1 },
      balance_desc: { balanceUgx: -1 },
      due_soon: { dueDate: 1 }
    });
    const creditSalesQuery = CreditSale.find(filter)
      .populate('recordedBy', 'name')
      .sort(sort)
      .lean();

    if (pagination.enabled) {
      creditSalesQuery.skip(pagination.skip).limit(pagination.limit);
    }

    const creditSales = await creditSalesQuery;
    if (!pagination.enabled) {
      return res.json(creditSales);
    }

    const total = await CreditSale.countDocuments(filter);
    const [paidCount, overdueCount, outstandingCount, balanceRows] = await Promise.all([
      CreditSale.countDocuments({ ...summaryFilter, isPaid: true }),
      CreditSale.countDocuments({
        ...summaryFilter,
        isPaid: false,
        dueDate: trustedQuery({ $lt: today }),
        balanceUgx: trustedQuery({ $gt: 0 })
      }),
      CreditSale.countDocuments({
        ...summaryFilter,
        isPaid: false,
        dueDate: trustedQuery({ $gte: today })
      }),
      CreditSale.aggregate([
        { $match: { ...summaryFilter, isPaid: false } },
        { $group: { _id: null, total: { $sum: '$balanceUgx' } } }
      ])
    ]);

    return res.json({
      items: creditSales,
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total
      }),
      summary: {
        paidCount,
        overdueCount,
        outstandingCount,
        outstandingBalance: roundUgx(balanceRows[0]?.total || 0)
      }
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// POST /api/credit-sales: create a credit sale using service-layer stock, buyer, and balance rules.
const createCreditSale = async (req, res, next) => {
  try {
    const creditSale = await createCreditSaleRecord({
      actorUser: req.user,
      payload: req.body
    });
    await recordCreditSaleAudit(req.user, 'create', creditSale);

    res.status(201).json(creditSale);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// PUT /api/credit-sales/:id/payment: toggle paid/unpaid state with service-level consistency checks.
const updatePaymentStatus = async (req, res, next) => {
  try {
    const isPaid = req.body.isPaid === true || req.body.isPaid === 'true';
    const updated = await applyCreditPaymentStatusUpdate({
      actorUser: req.user,
      creditSaleId: req.params.id,
      isPaid
    });
    await recordCreditSaleAudit(req.user, 'update', updated, { isPaid: updated.isPaid });

    res.json(updated);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// POST /api/credit-sales/:id/repay: register a repayment installment against one credit sale.
const repayCreditSale = async (req, res, next) => {
  try {
    const updated = await repayCreditSaleRecord({
      actorUser: req.user,
      creditSaleId: req.params.id,
      payload: req.body
    });
    const latestPayment = Array.isArray(updated.payments) ? updated.payments.at(-1) : null;
    await recordCreditSaleAudit(req.user, 'repay', updated, {
      repaymentAmountUgx: latestPayment?.amountUgx
    });

    res.json(updated);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// PUT /api/credit-sales/:id: update manager-allowed correction fields (due/dispatch dates).
const updateCreditSale = async (req, res, next) => {
  try {
    const creditSale = await CreditSale.findById(req.params.id);
    if (!creditSale) {
      return res.status(404).json({ message: 'Credit sale not found' });
    }

    if (deniesBranchAccess(req.user, creditSale.branch)) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }

    const updatableFields = ['dueDate', 'dateOfDispatch'];
    const fieldsToApply = {};
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        fieldsToApply[field] = req.body[field];
      }
    });

    if (Object.keys(fieldsToApply).length === 0) {
      return res.status(400).json({ message: 'No updatable fields provided' });
    }

    Object.assign(creditSale, fieldsToApply);
    await creditSale.save();
    await recordCreditSaleAudit(req.user, 'update', creditSale);
    return res.json(creditSale);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};
// DELETE /api/credit-sales/:id: remove one credit sale when branch access and payment-state rules allow.
const deleteCreditSale = async (req, res, next) => {
  try {
    const creditSale = await CreditSale.findById(req.params.id);
    if (!creditSale) {
      return res.status(404).json({ message: 'Credit sale not found' });
    }
    // Check if user has access to this branch
    if (deniesBranchAccess(req.user, creditSale.branch)) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }

    if (Array.isArray(creditSale.payments) && creditSale.payments.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete credit sale with repayments. Use repayment/status controls instead.'
      });
    }

    await creditSale.deleteOne();
    await recordCreditSaleAudit(req.user, 'delete', creditSale);
    res.json({ message: 'Credit sale deleted' });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

export {
  getAllCreditSales,
  createCreditSale,
  updateCreditSale,
  updatePaymentStatus,
  repayCreditSale,
  deleteCreditSale
};





