const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSearchFilter = (search, fields = []) => {
  const query = String(search || '').trim();
  if (!query || fields.length === 0) {
    return {};
  }

  return {
    $or: fields.map((field) => ({
      [field]: { $regex: escapeRegex(query), $options: 'i' }
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

export { buildSearchFilter, startOfToday, resolveSort };
