// Utility helpers for credit-sale repayments.

export const getCreditSaleBalance = (item) => {
  if (!item) return 0;
  if (item.balanceUgx !== undefined && item.balanceUgx !== null) {
    return Number(item.balanceUgx || 0);
  }
  return Math.max(Number(item.amountDueUgx || 0) - Number(item.amountPaidUgx || 0), 0);
};

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
