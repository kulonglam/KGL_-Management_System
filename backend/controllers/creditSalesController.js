import CreditSale from '../models/CreditSale.js';
import TrustedBuyer from '../models/TrustedBuyer.js';
import { calculateInventoryByBranch } from '../services/inventoryService.js';
import { withStockLock } from '../services/stockLockService.js';
import { createOutOfStockNotification } from '../services/stockNotificationService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const resolveProduceTypeForCreditSale = (inventory, produceName, requestedProduceType) => {
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

const createCreditSale = async (req, res) => {
  try {
    const {
      trustedBuyerId,
      dueDate,
      produceName,
      produceType: requestedProduceType,
      tonnageKg,
      dateOfDispatch
    } = req.body;

    const tonnage = Number(tonnageKg);
    if (!tonnage || Number.isNaN(tonnage)) {
      return res.status(400).json({ message: 'Invalid tonnage value' });
    }

    const dueDateValue = new Date(dueDate);
    if (Number.isNaN(dueDateValue.getTime())) {
      return res.status(400).json({ message: 'Invalid due date' });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    dueDateValue.setHours(0, 0, 0, 0);
    if (dueDateValue < startOfToday) {
      return res.status(400).json({ message: 'Due date must be today or a future date' });
    }

    if (!trustedBuyerId) {
      return res.status(400).json({ message: 'Trusted buyer is required for credit sales' });
    }

    const trustedBuyer = await TrustedBuyer.findById(trustedBuyerId);

    if (!trustedBuyer || trustedBuyer.branch !== req.user.branch) {
      return res.status(400).json({ message: 'Trusted buyer not found for this branch' });
    }

    const openCredits = await CreditSale.find({
      trustedBuyer: trustedBuyer._id,
      branch: req.user.branch,
      $or: [{ isPaid: false }, { balanceUgx: { $gt: 0 } }]
    })
      .select('amountDueUgx amountPaidUgx balanceUgx')
      .lean();

    const outstandingBalance = openCredits.reduce((sum, sale) => {
      const due = Number(sale.amountDueUgx || 0);
      const paid = Number(sale.amountPaidUgx || 0);
      const balance =
        sale.balanceUgx !== undefined && sale.balanceUgx !== null
          ? Number(sale.balanceUgx)
          : Math.max(due - paid, 0);
      return sum + Math.max(balance, 0);
    }, 0);

    if (outstandingBalance > 0) {
      return res.status(400).json({
        message: `Trusted buyer has an outstanding balance of ${Math.round(outstandingBalance).toLocaleString('en-UG')} UGX. Clear previous credit first.`
      });
    }

    const inventory = await calculateInventoryByBranch(req.user.branch);
    const resolvedType = resolveProduceTypeForCreditSale(inventory, produceName, requestedProduceType);
    if (resolvedType.error) {
      return res.status(400).json({ message: resolvedType.error });
    }

    const lockKey = {
      branch: req.user.branch,
      produceName,
      produceType: resolvedType.produceType
    };

    const creditSale = await withStockLock(lockKey, async () => {
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

      const amountDueUgx = item.sellingPrice * tonnage;
      const remainingStock = Number(item.totalTonnageKg || 0) - tonnage;

      const creditSale = await CreditSale.create({
        buyerName: trustedBuyer.name,
        nationalId: trustedBuyer.nationalId,
        location: trustedBuyer.location,
        contact: trustedBuyer.contact,
        amountDueUgx,
        amountPaidUgx: 0,
        balanceUgx: amountDueUgx,
        salesAgentName: req.user.name,
        dueDate,
        produceName,
        produceType: item.produceType,
        tonnageKg: tonnage,
        dateOfDispatch,
        branch: req.user.branch,
        recordedBy: req.user._id,
        trustedBuyer: trustedBuyer._id,
        isPaid: false
      });

      if (remainingStock <= 0) {
        await createOutOfStockNotification({
          branch: req.user.branch,
          produceName,
          produceType: item.produceType
        });
      }

      return creditSale;
    });

    res.status(201).json(creditSale);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({ message: error.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const creditSale = await CreditSale.findById(req.params.id);

    if (!creditSale) {
      return res.status(404).json({ message: 'Credit sale not found' });
    }

    // Check if user has access to this branch
    if (req.user.role === 'manager' && creditSale.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }

    const isPaid = Boolean(req.body.isPaid);
    const updated = await CreditSale.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          isPaid,
          amountPaidUgx: isPaid ? creditSale.amountDueUgx : 0,
          balanceUgx: isPaid ? 0 : creditSale.amountDueUgx
        }
      },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const repayCreditSale = async (req, res) => {
  try {
    const creditSale = await CreditSale.findById(req.params.id);

    if (!creditSale) {
      return res.status(404).json({ message: 'Credit sale not found' });
    }

    if (req.user.role === 'manager' && creditSale.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }

    const amount = Number(req.body.amountUgx);
    const paidAt = req.body.paidAt ? new Date(req.body.paidAt) : new Date();

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than 0' });
    }
    if (Number.isNaN(paidAt.getTime())) {
      return res.status(400).json({ message: 'Invalid payment date' });
    }

    const currentPaid = creditSale.amountPaidUgx || 0;
    const currentBalance =
      creditSale.balanceUgx !== undefined && creditSale.balanceUgx !== null
        ? creditSale.balanceUgx
        : Math.max(creditSale.amountDueUgx - currentPaid, 0);

    if (amount > currentBalance) {
      return res.status(400).json({ message: `Payment exceeds balance (${currentBalance} UGX)` });
    }

    const newPaid = currentPaid + amount;
    const newBalance = Math.max(creditSale.amountDueUgx - newPaid, 0);

    const updated = await CreditSale.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          amountPaidUgx: newPaid,
          balanceUgx: newBalance,
          isPaid: newBalance === 0
        },
        $push: {
          payments: {
            amountUgx: amount,
            paidAt,
            receivedBy: req.user._id
          }
        }
      },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

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
