// Supplies shared utility helpers used across multiple backend modules.
 
// Parse pagination.
const parsePagination = (query = {}) => {
  const hasPaginationInput = query.page !== undefined || query.limit !== undefined;
  if (!hasPaginationInput) {
    return {
      enabled: false,
      page: 1,
      limit: null,
      skip: 0
    };
  }

  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);

  return {
    enabled: true,
    page,
    limit,
    skip: (page - 1) * limit
  };
};

// Handle build pagination meta.
const buildPaginationMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1)
});

export { parsePagination, buildPaginationMeta };