import ProductBarcode from '../models/ProductBarcode.js';
import PriceSetting from '../models/PriceSetting.js';
import { isDirectorAccount } from './authService.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';

const branchFor = (actorUser, branch) => (isDirectorAccount(actorUser) ? branch || actorUser.branch : actorUser.branch);

const registerBarcode = async ({ actorUser, code, branch, produceName, produceType }) => {
  const resolvedBranch = branchFor(actorUser, branch);
  if (!resolvedBranch) {
    const error = new Error('branch is required');
    error.statusCode = 400;
    throw error;
  }
  const saved = await ProductBarcode.findOneAndUpdate(
    { code: String(code || '').trim() },
    {
      code: String(code || '').trim(),
      branch: resolvedBranch,
      produceName: normalizeProduceName(produceName),
      produceType: normalizeProduceType(produceType)
    },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
  return saved.toObject();
};

const lookupBarcode = async ({ actorUser, code, branch }) => {
  const resolvedBranch = branchFor(actorUser, branch);
  const barcode = String(code || '').trim();
  const row = await ProductBarcode.findOne(resolvedBranch ? { code: barcode, branch: resolvedBranch } : { code: barcode }).lean();
  if (!row) {
    const error = new Error('Barcode is not registered at this branch');
    error.statusCode = 404;
    throw error;
  }
  const price = await PriceSetting.findOne({
    branch: row.branch,
    produceName: row.produceName,
    produceType: row.produceType
  })
    .select('priceUgx')
    .lean();
  return {
    code: row.code,
    branch: row.branch,
    produceName: row.produceName,
    produceType: row.produceType,
    priceUgx: price?.priceUgx ?? null
  };
};

export { registerBarcode, lookupBarcode };
