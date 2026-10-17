import { roundUgx } from './money.js';

const SUPPORTED_CURRENCIES = ['UGX', 'USD', 'KES', 'EUR', 'GBP'];

const convertToUgx = (foreignAmount, rateToUgx) => {
  const amount = Number(foreignAmount);
  const rate = Number(rateToUgx);
  if (!Number.isFinite(amount) || amount < 0) {
    const error = new Error('foreignAmount must be a non-negative number');
    error.statusCode = 400;
    throw error;
  }
  if (!Number.isFinite(rate) || rate <= 0) {
    const error = new Error('rateToUgx must be greater than zero');
    error.statusCode = 400;
    throw error;
  }
  return roundUgx(amount * rate);
};

export { SUPPORTED_CURRENCIES, convertToUgx };
