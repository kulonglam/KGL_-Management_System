import CreditSale from '../models/CreditSale.js';
import {
  applyCreditPaymentStatusUpdate,
  createCreditSaleRecord,
  repayCreditSaleRecord
} from '../services/creditSalesService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

// Retrieve all credit sales.
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

// Create credit sale.
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

// Update payment status.
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

// Handle repay credit sale.
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
// Delete credit sale.
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

    await creditSale.deleteOne();
    res.json({ message: 'Credit sale deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  getAllCreditSales,
  createCreditSale,
  updatePaymentStatus,
  repayCreditSale,
  deleteCreditSale
};
