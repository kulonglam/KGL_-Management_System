// Hide removed rows from ordinary finds. A query that already sets deletedAt is left alone
// so restore and the "show removed" list can still load those documents.

const excludeRemovedRecords = (schema) => {
  const addActiveFilter = function addActiveFilter() {
    const query = this.getQuery();
    if (Object.prototype.hasOwnProperty.call(query, 'deletedAt')) return;
    this.where({ deletedAt: null });
  };

  schema.pre(/^find/, addActiveFilter);
  schema.pre('countDocuments', addActiveFilter);
};

const removedRecordFilter = (deleted) =>
  String(deleted) === 'true' ? { deletedAt: { $ne: null } } : {};

export { excludeRemovedRecords, removedRecordFilter };
