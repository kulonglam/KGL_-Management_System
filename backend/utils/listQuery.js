import mongoose from 'mongoose';
import { startOfUtcDay } from './dateFormat.js';

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
      [field]: trustedQuery({ $regex: `^${escapeRegex(query)}`, $options: 'i' })
    }))
  };
};

const startOfToday = () => startOfUtcDay(new Date());

const resolveSort = (sortKey, sortMap = {}, fallback = { createdAt: -1 }) => {
  if (sortKey && sortMap[sortKey]) {
    return sortMap[sortKey];
  }
  return fallback;
};

// Inclusive from/to bounds for list queries. Blank bounds are omitted.
const buildDateRangeFilter = (fromValue, toValue) => {
  const bounds = {};

  if (fromValue !== undefined && fromValue !== null && String(fromValue).trim() !== '') {
    const from = new Date(fromValue);
    if (Number.isNaN(from.getTime())) {
      return { error: 'from must be a valid date' };
    }
    bounds.$gte = from;
  }

  if (toValue !== undefined && toValue !== null && String(toValue).trim() !== '') {
    const to = new Date(toValue);
    if (Number.isNaN(to.getTime())) {
      return { error: 'to must be a valid date' };
    }
    bounds.$lte = to;
  }

  if (!bounds.$gte && !bounds.$lte) {
    return { filter: null };
  }

  return { filter: trustedQuery(bounds) };
};

export { buildDateRangeFilter, buildSearchFilter, escapeRegex, startOfToday, resolveSort, trustedQuery };
