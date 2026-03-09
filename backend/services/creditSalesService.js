/**
 * Implements credit-sale business workflows: stock-safe creation, due-date validation,
 * outstanding-balance checks, payment-status transitions, and repayment posting.
  */

import CreditSale from '../models/CreditSale.js';
import TrustedBuyer from '../models/TrustedBuyer.js';
import mongoose from 'mongoose';
import { calculateInventoryByBranch } from './inventoryService.js';
import { createOutOfStockNotification } from './stockNotificationService.js';
import { withStockLock } from './stockLockService.js';
import {
  normalizeProduceName,
  normalizeProduceNameKey,
  normalizeProduceType
} from '../utils/produceNormalization.js';

// Construct a service-domain error object with an explicit HTTP status code.
const createServiceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Resolve the concrete produceType to use for a credit sale from inventory + optional requester hint.
const resolveProduceTypeForCreditSale = (inventory, produceName, requestedProduceType) => {
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

// Validate due date format only; business rules require a due date but do not restrict its range.
const validateDueDate = (dueDate) => {
  const dueDateValue = new Date(dueDate);
  if (Number.isNaN(dueDateValue.getTime())) {
    return { error: 'Invalid due date' };
  }

  return { dueDateValue };
};

// Sum effective outstanding balances across open credit sales for one trusted buyer.
const calculateOutstandingBalance = (openCredits) => {
  return openCredits.reduce((sum, sale) => {
    const due = Number(sale.amountDueUgx || 0);
    const paid = Number(sale.amountPaidUgx || 0);
    const balance =
      sale.balanceUgx !== undefined && sale.balanceUgx !== null
        ? Number(sale.balanceUgx)
        : Math.max(due - paid, 0);
    return sum + Math.max(balance, 0);
  }, 0);
};

// Build a user-facing message when buyer has unresolved prior credit balance.
const buildOutstandingBalanceMessage = (outstandingBalance) => {
  return `Trusted buyer has an outstanding balance of ${Math.round(outstandingBalance).toLocaleString('en-UG')} UGX. Clear previous credit first.`;
};

// Parse and validate repayment input values (amount and payment date).
const parseRepaymentInput = ({ amountUgx, paidAt }) => {
  const amount = Number(amountUgx);
  const paidAtDate = paidAt ? new Date(paidAt) : new Date();

  if (!amount || amount <= 0) {
    return { error: 'Payment amount must be greater than 0' };
  }
  if (Number.isNaN(paidAtDate.getTime())) {
    return { error: 'Invalid payment date' };
  }

  return { amount, paidAt: paidAtDate };
};

// Reusable aggregation expression for current paid amount in atomic update pipelines.
const CURRENT_PAID_EXPR = { $ifNull: ['$amountPaidUgx', 0] };
// Reusable aggregation expression for computed current balance in atomic update pipelines.
const CURRENT_BALANCE_EXPR = {
  $ifNull: ['$balanceUgx', { $max: [{ $subtract: ['$amountDueUgx', CURRENT_PAID_EXPR] }, 0] }]
};

// Create a credit sale after validating buyer eligibility, due date, stock, and outstanding-balance rules.
const createCreditSaleRecord = async ({ actorUser, payload }) => {
  const {
    trustedBuyerId,
    dueDate,
    produceName: rawProduceName,
    produceType: requestedProduceType,
    tonnageKg,
    dateOfDispatch
  } = payload;
  const produceName = normalizeProduceName(rawProduceName);

  const tonnage = Number(tonnageKg);
  if (!tonnage || Number.isNaN(tonnage)) {
    throw createServiceError(400, 'Invalid tonnage value');
  }

  const dueDateValidation = validateDueDate(dueDate);
  if (dueDateValidation.error) {
    throw createServiceError(400, dueDateValidation.error);
  }

  if (!trustedBuyerId) {
    throw createServiceError(400, 'Trusted buyer is required for credit sales');
  }

  const trustedBuyer = await TrustedBuyer.findById(trustedBuyerId);
  if (!trustedBuyer || trustedBuyer.branch !== actorUser.branch) {
    throw createServiceError(400, 'Trusted buyer not found for this branch');
  }

  const openCredits = await CreditSale.find({
    trustedBuyer: trustedBuyer._id,
    branch: actorUser.branch,
    $or: [{ isPaid: false }, { balanceUgx: mongoose.trusted({ $gt: 0 }) }]
  })
    .select('amountDueUgx amountPaidUgx balanceUgx')
    .lean();

  const outstandingBalance = calculateOutstandingBalance(openCredits);
  if (outstandingBalance > 0) {
    throw createServiceError(400, buildOutstandingBalanceMessage(outstandingBalance));
  }

  const inventory = await calculateInventoryByBranch(actorUser.branch);
  const resolvedType = resolveProduceTypeForCreditSale(
    inventory,
    produceName,
    requestedProduceType
  );
  if (resolvedType.error) {
    throw createServiceError(400, resolvedType.error);
  }

  return withStockLock(
      {
        branch: actorUser.branch,
        produceName,
        produceType: normalizeProduceType(resolvedType.produceType)
      },
      async () => {
        const lockedInventory = await calculateInventoryByBranch(actorUser.branch);
        const item = lockedInventory.find(
          (entry) =>
            normalizeProduceNameKey(entry.produceName) === normalizeProduceNameKey(produceName) &&
            normalizeProduceType(entry.produceType) === normalizeProduceType(resolvedType.produceType)
        );

      if (!item) {
        throw createServiceError(400, 'Product not available in inventory');
      }

      if (item.totalTonnageKg < tonnage) {
        throw createServiceError(400, `Insufficient stock. Available: ${item.totalTonnageKg} kg`);
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
        salesAgentName: actorUser.name,
        dueDate,
          produceName: item.produceName,
          produceType: item.produceType,
        tonnageKg: tonnage,
        dateOfDispatch,
        branch: actorUser.branch,
        recordedBy: actorUser._id,
        trustedBuyer: trustedBuyer._id,
        isPaid: false
      });

        if (remainingStock <= 0) {
          await createOutOfStockNotification({
            branch: actorUser.branch,
            produceName: item.produceName,
            produceType: item.produceType
          });
        }

      return creditSale;
    }
  );
};

// Apply paid/unpaid status transition while preserving repayment-history consistency.
const applyCreditPaymentStatusUpdate = async ({ actorUser, creditSaleId, isPaid }) => {
  const creditSale = await CreditSale.findById(creditSaleId).select(
    'branch amountDueUgx amountPaidUgx balanceUgx payments'
  );

  if (!creditSale) {
    throw createServiceError(404, 'Credit sale not found');
  }

  if (actorUser.role === 'manager' && creditSale.branch !== actorUser.branch) {
    throw createServiceError(403, 'Access denied to this branch data');
  }

  if (!isPaid) {
    if (Array.isArray(creditSale.payments) && creditSale.payments.length > 0) {
      throw createServiceError(400, 'Cannot mark unpaid after repayments have been recorded');
    }

    const updated = await CreditSale.findOneAndUpdate(
      {
        _id: creditSaleId,
        'payments.0': mongoose.trusted({ $exists: false })
      },
      {
        $set: {
          isPaid: false,
          amountPaidUgx: 0,
          balanceUgx: creditSale.amountDueUgx
        }
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw createServiceError(409, 'Payment status changed. Refresh and try again.');
    }

    return updated;
  }

  const paidAt = new Date();
  const updated = await CreditSale.findOneAndUpdate(
    { _id: creditSaleId },
    [
      {
        $set: {
          _currentPaid: CURRENT_PAID_EXPR,
          _currentBalance: CURRENT_BALANCE_EXPR
        }
      },
      {
        $set: {
          amountPaidUgx: '$amountDueUgx',
          balanceUgx: 0,
          isPaid: true,
          payments: {
            $cond: [
              { $gt: ['$_currentBalance', 0] },
              {
                $concatArrays: [
                  { $ifNull: ['$payments', []] },
                  [
                    {
                      amountUgx: '$_currentBalance',
                      paidAt,
                      receivedBy: actorUser._id
                    }
                  ]
                ]
              },
              { $ifNull: ['$payments', []] }
            ]
          }
        }
      },
      {
        $unset: ['_currentPaid', '_currentBalance']
      }
    ],
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw createServiceError(404, 'Credit sale not found');
  }

  return updated;
};

// Apply one repayment installment atomically and update balance/isPaid fields accordingly.
const repayCreditSaleRecord = async ({ actorUser, creditSaleId, payload }) => {
  const creditSale = await CreditSale.findById(creditSaleId);
  if (!creditSale) {
    throw createServiceError(404, 'Credit sale not found');
  }

  if (actorUser.role === 'manager' && creditSale.branch !== actorUser.branch) {
    throw createServiceError(403, 'Access denied to this branch data');
  }

  const repaymentInput = parseRepaymentInput(payload);
  if (repaymentInput.error) {
    throw createServiceError(400, repaymentInput.error);
  }

  const updated = await CreditSale.findOneAndUpdate(
    {
      _id: creditSaleId,
      // Mark this internal operator as trusted while keeping global sanitizeFilter enabled.
      $expr: mongoose.trusted({
        $gte: [CURRENT_BALANCE_EXPR, repaymentInput.amount]
      })
    },
    [
      {
        $set: {
          _currentPaid: CURRENT_PAID_EXPR,
          _currentBalance: CURRENT_BALANCE_EXPR
        }
      },
      {
        $set: {
          amountPaidUgx: { $add: ['$_currentPaid', repaymentInput.amount] },
          balanceUgx: { $max: [{ $subtract: ['$_currentBalance', repaymentInput.amount] }, 0] },
          isPaid: {
            $lte: [{ $max: [{ $subtract: ['$_currentBalance', repaymentInput.amount] }, 0] }, 0]
          },
          payments: {
            $concatArrays: [
              { $ifNull: ['$payments', []] },
              [
                {
                  amountUgx: repaymentInput.amount,
                  paidAt: repaymentInput.paidAt,
                  receivedBy: actorUser._id
                }
              ]
            ]
          }
        }
      },
      {
        $unset: ['_currentPaid', '_currentBalance']
      }
    ],
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw createServiceError(
      409,
      'Payment exceeds current balance or the record changed. Refresh and retry.'
    );
  }

  return updated;
};

export {
  applyCreditPaymentStatusUpdate,
  createCreditSaleRecord,
  repayCreditSaleRecord
};