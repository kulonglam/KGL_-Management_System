// Helper utilities used by credit-sales records to compute balances and validate repayments.
 
// Resolve remaining balance from normalized API data or derived fields.
export const getCreditSaleBalance = (item) => {
  if (!item) return 0;
  if (item.balanceUgx !== undefined && item.balanceUgx !== null) {
    return Number(item.balanceUgx || 0);
  }
  return Math.max(Number(item.amountDueUgx || 0) - Number(item.amountPaidUgx || 0), 0);
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
