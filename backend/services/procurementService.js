/**
 * Provides procurement-domain helpers for manager price resolution and branch-access checks.
 * File: backend/services/procurementService.js
 */

import PriceSetting from '../models/PriceSetting.js';

// Resolve current manager-configured selling price for a branch + produceType pair.
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

// Return true when requester is allowed to access records for the specified branch.
const canManagerAccessBranch = (user, branch) => {
  return !(user.role === 'manager' && user.branch !== branch);
};

export { resolveSellingPrice, canManagerAccessBranch };





