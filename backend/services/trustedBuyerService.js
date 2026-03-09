/*
 * Provides trusted-buyer normalization and duplicate-detection helpers
 * used by create/update flows in branch-scoped buyer management.
 */

import TrustedBuyer from '../models/TrustedBuyer.js';
import mongoose from 'mongoose';

// Normalize free-text values by trimming and collapsing internal whitespace.
const normalizeText = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');

// Normalize national ID to uppercase canonical form for consistent comparisons.
const normalizeNationalId = (value) =>
  String(value ?? '')
    .trim()
    .toUpperCase();

// Find existing buyer with same NIN in a branch, optionally excluding one record during updates.
const findDuplicateTrustedBuyer = async ({ branch, nationalId, excludeId = null }) => {
  const query = {
    branch,
    nationalId: normalizeNationalId(nationalId)
  };

  if (excludeId) {
    query._id = mongoose.trusted({ $ne: excludeId });
  }

  return TrustedBuyer.findOne(query);
};

export { normalizeText, normalizeNationalId, findDuplicateTrustedBuyer };