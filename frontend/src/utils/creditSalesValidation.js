// Helper utilities used by credit-sales records to compute balances and validate repayments.
 
// Resolve remaining balance from normalized API data or derived fields.
export const getCreditSaleBalance = (item) => {
  if (!item) return 0;
  if (item.balanceUgx !== undefined && item.balanceUgx !== null) {
    return Number(item.balanceUgx || 0);
  }
  return Math.max(Number(item.amountDueUgx || 0) - Number(item.amountPaidUgx || 0), 0);
};

export const CREDIT_LIMIT_WARNING_RATIO = 0.9;

// Classify a projected credit sale against the buyer's limit: none (no limit set), ok, near (>= 90%), over.
export const getCreditLimitStatus = ({ creditLimitUgx, outstandingUgx, amountDueUgx }) => {
  const outstanding = Number(outstandingUgx || 0);
  const projected = outstanding + Number(amountDueUgx || 0);
  if (creditLimitUgx === null || creditLimitUgx === undefined || creditLimitUgx === '') {
    return { level: outstanding > 0 ? 'blocked' : 'none', limit: null, outstanding, projected, ratio: null };
  }
  const limit = Number(creditLimitUgx);
  const ratio = limit > 0 ? projected / limit : Infinity;
  let level = 'ok';
  if (projected > limit) level = 'over';
  else if (ratio >= CREDIT_LIMIT_WARNING_RATIO) level = 'near';
  return { level, limit, outstanding, projected, ratio };
};

// Validate repayment input against a positive amount and current outstanding balance.
export const validateRepaymentAmount = (amountInput, balanceInput) => {
  const amount = Number(amountInput || 0);
  const balance = Number(balanceInput || 0);

  if (!amount || Number.isNaN(amount) || amount <= 0) {
    return {
      amount: 0,
      error: 'Amount paid must be greater than 0.'
    };
  }

  if (amount > balance) {
    return {
      amount,
      error: 'Amount paid cannot exceed the current balance.'
    };
  }

  return {
    amount,
    error: ''
  };
};
