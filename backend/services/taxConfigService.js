import TaxConfig from '../models/TaxConfig.js';
import { roundUgx } from '../utils/money.js';

const DEFAULTS = {
  key: 'default',
  companyName: 'Karibu Groceries LTD',
  tin: '',
  vatRatePercent: 18,
  invoicePreamble: 'Tax invoice issued under the laws of Uganda.',
  currency: 'UGX'
};

const getTaxConfig = async () => {
  let config = await TaxConfig.findOne({ key: 'default' });
  if (!config) {
    config = await TaxConfig.create(DEFAULTS);
  }
  return config;
};

const updateTaxConfig = async ({ actorUser, payload }) => {
  const config = await getTaxConfig();
  if (payload.companyName !== undefined) config.companyName = String(payload.companyName).trim().slice(0, 200);
  if (payload.tin !== undefined) config.tin = String(payload.tin).trim().slice(0, 40);
  if (payload.invoicePreamble !== undefined) {
    config.invoicePreamble = String(payload.invoicePreamble).trim().slice(0, 500);
  }
  if (payload.vatRatePercent !== undefined) {
    const rate = Number(payload.vatRatePercent);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      const error = new Error('vatRatePercent must be between 0 and 100');
      error.statusCode = 400;
      throw error;
    }
    config.vatRatePercent = rate;
  }
  config.updatedBy = actorUser._id;
  await config.save();
  return config;
};

/** Split a VAT-inclusive gross into net + VAT at the configured rate. */
const splitVatInclusive = (grossUgx, vatRatePercent) => {
  const gross = roundUgx(grossUgx);
  const rate = Number(vatRatePercent) || 0;
  if (rate <= 0) {
    return { netUgx: gross, vatUgx: 0, grossUgx: gross };
  }
  const netUgx = roundUgx(gross / (1 + rate / 100));
  const vatUgx = roundUgx(gross - netUgx);
  return { netUgx, vatUgx, grossUgx: gross };
};

export { getTaxConfig, updateTaxConfig, splitVatInclusive, DEFAULTS };
