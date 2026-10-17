import ExchangeRate from '../models/ExchangeRate.js';
import { businessDateKey } from '../utils/businessTime.js';
import { trustedQuery } from '../utils/listQuery.js';
import { SUPPORTED_CURRENCIES, convertToUgx } from '../utils/currencyMath.js';

const FOREIGN = SUPPORTED_CURRENCIES.filter((code) => code !== 'UGX');

const latestRate = async (code, on = businessDateKey()) =>
  ExchangeRate.findOne({ code, effectiveOn: trustedQuery({ $lte: on }) }).sort({ effectiveOn: -1, createdAt: -1 }).lean();

const listExchangeRates = async () => {
  const today = businessDateKey();
  const rows = [];
  for (const code of FOREIGN) {
    const rate = await latestRate(code, today);
    rows.push(
      rate
        ? { code, rateToUgx: rate.rateToUgx, effectiveOn: rate.effectiveOn }
        : { code, rateToUgx: null, effectiveOn: null }
    );
  }
  return { baseCurrency: 'UGX', rates: rows };
};

const setExchangeRate = async ({ actorUser, code, rateToUgx, effectiveOn }) => {
  const currency = String(code || '').trim().toUpperCase();
  if (!FOREIGN.includes(currency)) {
    const error = new Error(`code must be one of ${FOREIGN.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }
  const day = effectiveOn || businessDateKey();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(day))) {
    const error = new Error('effectiveOn must be YYYY-MM-DD');
    error.statusCode = 400;
    throw error;
  }
  const saved = await ExchangeRate.create({
    code: currency,
    rateToUgx: Number(rateToUgx),
    effectiveOn: day,
    setBy: actorUser?._id || null
  });
  return saved.toObject();
};

const quoteCurrency = async ({ code, amount, on }) => {
  const currency = String(code || 'UGX').trim().toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    const error = new Error(`Unsupported currency ${currency}`);
    error.statusCode = 400;
    throw error;
  }
  if (currency === 'UGX') {
    return { code: 'UGX', rateToUgx: 1, foreignAmount: Number(amount) || 0, amountUgx: convertToUgx(amount || 0, 1) };
  }
  const rate = await latestRate(currency, on || businessDateKey());
  if (!rate) {
    const error = new Error(`No ${currency} exchange rate is set`);
    error.statusCode = 400;
    throw error;
  }
  return {
    code: currency,
    rateToUgx: rate.rateToUgx,
    effectiveOn: rate.effectiveOn,
    foreignAmount: Number(amount),
    amountUgx: convertToUgx(amount, rate.rateToUgx)
  };
};

export { listExchangeRates, setExchangeRate, quoteCurrency };
