//  Coordinates request handling: reads HTTP input, invokes domain services, and returns response payloads.
 

import CreditSale from '../models/CreditSale.js';
import {
  applyCreditPaymentStatusUpdate,
  createCreditSaleRecord,
  repayCreditSaleRecord
} from '../services/creditSalesService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

// GET /api/credit-sales: list branch-scoped credit sales with optional pagination.
const getAllCreditSales = async (req, res) => {
  try {
    const filter = {};

    // Filter by branch for manager and sales agent
    if (req.user.role !== 'director') {
      filter.branch = req.user.branch;
    }

    const pagination = parsePagination(req.query);
    const creditSalesQuery = CreditSale.find(filter)
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    if (pagination.enabled) {
      creditSalesQuery.skip(pagination.skip).limit(pagination.limit);
    }

    const creditSales = await creditSalesQuery;
    if (!pagination.enabled) {
      return res.json(creditSales);
    }

    const total = await CreditSale.countDocuments(filter);

    return res.json({
      items: creditSales,
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

// POST /api/credit-sales: create a credit sale using service-layer stock, buyer, and balance rules.
const createCreditSale = async (req, res) => {
  try {
    const creditSale = await createCreditSaleRecord({
      actorUser: req.user,
      payload: req.body
    });

    res.status(201).json(creditSale);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ message: error.message });
  }
};

// PUT /api/credit-sales/:id/payment: toggle paid/unpaid state with service-level consistency checks.
const updatePaymentStatus = async (req, res) => {
  try {
    const isPaid = req.body.isPaid === true || req.body.isPaid === 'true';
    const updated = await applyCreditPaymentStatusUpdate({
      actorUser: req.user,
      creditSaleId: req.params.id,
      isPaid
    });

    res.json(updated);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ message: error.message });
  }
};

// POST /api/credit-sales/:id/repay: register a repayment installment against one credit sale.
const repayCreditSale = async (req, res) => {
  try {
    const updated = await repayCreditSaleRecord({
      actorUser: req.user,
      creditSaleId: req.params.id,
      payload: req.body
    });

    res.json(updated);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ message: error.message });
  }
};

// PUT /api/credit-sales/:id: update manager-allowed correction fields (due/dispatch dates).
const updateCreditSale = async (req, res) => {
  try {
    const creditSale = await CreditSale.findById(req.params.id);
    if (!creditSale) {
      return res.status(404).json({ message: 'Credit sale not found' });
    }

    if (req.user.role === 'manager' && creditSale.branch !== req.user.branch) {
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
    return res.json(creditSale);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
// DELETE /api/credit-sales/:id: remove one credit sale when branch access and payment-state rules allow.
const deleteCreditSale = async (req, res) => {
  try {
    const creditSale = await CreditSale.findById(req.params.id);
    if (!creditSale) {
      return res.status(404).json({ message: 'Credit sale not found' });
    }
    // Check if user has access to this branch
    if (req.user.role === 'manager' && creditSale.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }

    if (Array.isArray(creditSale.payments) && creditSale.payments.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete credit sale with repayments. Use repayment/status controls instead.'
      });
    }

    await creditSale.deleteOne();
    res.json({ message: 'Credit sale deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
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





