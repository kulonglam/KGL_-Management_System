import mongoose from 'mongoose';

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Mark server-built Mongo operators as trusted so sanitizeFilter does not
// rewrite { $gt: 0 } into { $eq: { $gt: 0 } } and then CastError.
const trustedQuery = (value) => mongoose.trusted(value);

const buildSearchFilter = (search, fields = []) => {
  const query = String(search || '').trim();
  if (!query || fields.length === 0) {
    return {};
  }

  return {
    $or: fields.map((field) => ({
      [field]: trustedQuery({ $regex: escapeRegex(query), $options: 'i' })
    }))
  };
};

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const resolveSort = (sortKey, sortMap = {}, fallback = { createdAt: -1 }) => {
  if (sortKey && sortMap[sortKey]) {
    return sortMap[sortKey];
  }
  return fallback;
};

export { buildSearchFilter, startOfToday, resolveSort, trustedQuery };
