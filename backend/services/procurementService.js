import PriceSetting from '../models/PriceSetting.js';

// Resolve selling price using manager-controlled settings.
const resolveSellingPrice = async ({ branch, produceType }) => {
  const setting = await PriceSetting.findOne({
    branch,
    produceType
  });

  if (!setting) {
    throw new Error('Manager price is required for this produce type. Configure it in Price Management.');
  }

  return setting.priceUgx;
};

// Check whether a manager can access data for the specified branch.
const canManagerAccessBranch = (user, branch) => {
  return !(user.role === 'manager' && user.branch !== branch);
};

export { resolveSellingPrice, canManagerAccessBranch };
