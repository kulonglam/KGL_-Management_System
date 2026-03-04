/** Unit tests for credit-sales balance and repayment validation helper functions. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { getCreditSaleBalance, validateRepaymentAmount } from '../src/utils/creditSalesValidation.mjs';

test('getCreditSaleBalance uses explicit balance when provided', () => {
  const balance = getCreditSaleBalance({
    amountDueUgx: 1200000,
    amountPaidUgx: 500000,
    balanceUgx: 250000
  });
  assert.equal(balance, 250000);
});

test('getCreditSaleBalance falls back to amountDue minus amountPaid', () => {
  const balance = getCreditSaleBalance({
    amountDueUgx: 1200000,
    amountPaidUgx: 300000
  });
  assert.equal(balance, 900000);
});

test('validateRepaymentAmount rejects invalid and overflow amounts', () => {
  const empty = validateRepaymentAmount('', 2000);
  assert.equal(empty.error, 'Amount paid must be greater than 0.');

  const overflow = validateRepaymentAmount(3000, 2000);
  assert.equal(overflow.error, 'Amount paid cannot exceed the current balance.');
});

test('validateRepaymentAmount accepts valid amount', () => {
  const result = validateRepaymentAmount(1500, 2000);
  assert.equal(result.error, '');
  assert.equal(result.amount, 1500);
});

