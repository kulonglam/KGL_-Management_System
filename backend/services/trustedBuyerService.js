import TrustedBuyer from '../models/TrustedBuyer.js';

// Normalize free-text input values.
const normalizeText = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');

// Normalize national ID value for consistent lookups.
const normalizeNationalId = (value) =>
  String(value ?? '')
    .trim()
    .toUpperCase();

// Find an existing trusted buyer with the same national ID in a branch.
const findDuplicateTrustedBuyer = async ({ branch, nationalId, excludeId = null }) => {
  const query = {
    branch,
    nationalId: normalizeNationalId(nationalId)
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return TrustedBuyer.findOne(query);
};

export { normalizeText, normalizeNationalId, findDuplicateTrustedBuyer };
