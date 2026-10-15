// Hide removed rows from ordinary finds. A query that already sets deletedAt is left alone
// so restore and the "show removed" list can still load those documents.

import mongoose from 'mongoose';

const excludeRemovedRecords = (schema) => {
  const addActiveFilter = function addActiveFilter() {
    const query = this.getQuery();
    if (Object.prototype.hasOwnProperty.call(query, 'deletedAt')) return;
    this.where({ deletedAt: null });
  };

  schema.pre(/^find/, addActiveFilter);
  schema.pre('countDocuments', addActiveFilter);
};

// Server-built operators must be trusted: the global sanitizeFilter rewrites untrusted
// { $ne: null } into { $eq: { $ne: null } }, which matches nothing.
const removedOnly = () => mongoose.trusted({ $ne: null });
const includeRemoved = () => mongoose.trusted({ $exists: true });

const removedRecordFilter = (deleted) =>
  String(deleted) === 'true' ? { deletedAt: removedOnly() } : {};

export { excludeRemovedRecords, includeRemoved, removedOnly, removedRecordFilter };
