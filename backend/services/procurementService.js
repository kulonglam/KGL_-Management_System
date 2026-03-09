// Provides procurement-domain helpers for manager price resolution and branch-access checks.
 
import PriceSetting from '../models/PriceSetting.js';
import {
  normalizeOptionalProduceName
} from './priceService.js';
import {
  normalizeProduceNameKey,
  normalizeProduceType
} from '../utils/produceNormalization.js';

const normalizeStoredPriceSetting = (setting) => ({
  ...setting,
  produceName: normalizeOptionalProduceName(setting.produceName),
  produceType: normalizeProduceType(setting.produceType)
});

const findSpecificPriceSetting = (settings, produceName) => {
  const normalizedName = normalizeOptionalProduceName(produceName);
  if (!normalizedName) return null;

  const exactSetting = settings.find((setting) => setting.produceName === normalizedName);
  if (exactSetting) {
    return exactSetting;
  }

  const normalizedNameKey = normalizeProduceNameKey(normalizedName);
  return settings.find(
    (setting) =>
      setting.produceName &&
      normalizeProduceNameKey(setting.produceName) === normalizedNameKey
  ) || null;
};

const findTypeDefaultPriceSetting = (settings) =>
  settings.find((setting) => !setting.produceName) || null;

const buildMissingPriceMessage = ({ branch, produceName, produceType, settings }) => {
  const normalizedType = normalizeProduceType(produceType);
  const normalizedName = normalizeOptionalProduceName(produceName);
  const availableNames = [...new Set(settings.map((setting) => setting.produceName).filter(Boolean))];
  const targetLabel = normalizedName
    ? `${normalizedName} (${normalizedType})`
    : `${normalizedType} produce`;

  if (availableNames.length > 0) {
    return `No manager price found for ${targetLabel} in ${branch}. Available ${normalizedType} prices in this branch: ${availableNames.join(', ')}. Use one of those exact produce names or create a ${normalizedType} type default in Price Management.`;
  }

  return `No manager price found for ${targetLabel} in ${branch}. Create a produce-specific price or a ${normalizedType} type default in Price Management.`;
};

const resolveSellingPriceDetails = async ({ branch, produceName, produceType }) => {
  const normalizedType = normalizeProduceType(produceType);
  const normalizedName = normalizeOptionalProduceName(produceName);
  const branchPriceSettings = (await PriceSetting.find({ branch }).lean()).map(normalizeStoredPriceSetting);
  const branchTypePriceSettings = branchPriceSettings.filter(
    (setting) => setting.produceType === normalizedType
  );

  const specificSetting = findSpecificPriceSetting(branchTypePriceSettings, normalizedName);
  if (specificSetting) {
    return {
      priceUgx: specificSetting.priceUgx,
      produceName: specificSetting.produceName,
      produceType: normalizedType,
      scope: 'specific'
    };
  }

  const typeDefaultSetting = findTypeDefaultPriceSetting(branchTypePriceSettings);
  if (typeDefaultSetting) {
    return {
      priceUgx: typeDefaultSetting.priceUgx,
      produceName: normalizedName,
      produceType: normalizedType,
      scope: 'type_default'
    };
  }

  throw new Error(
    buildMissingPriceMessage({
      branch,
      produceName: normalizedName,
      produceType: normalizedType,
      settings: branchTypePriceSettings
    })
  );
};

// Resolve current manager-configured selling price for a branch + produce combination.
const resolveSellingPrice = async ({ branch, produceName, produceType }) => {
  return (await resolveSellingPriceDetails({ branch, produceName, produceType })).priceUgx;
};

// Return true when requester is allowed to access records for the specified branch.
const canManagerAccessBranch = (user, branch) => {
  return !(user.role === 'manager' && user.branch !== branch);
};

export { resolveSellingPrice, resolveSellingPriceDetails, canManagerAccessBranch };