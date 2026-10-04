export const asListPayload = (data) => {
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: 1,
      totalPages: 1,
      summary: null
    };
  }

  if (data && Array.isArray(data.items)) {
    return {
      items: data.items,
      total: data.pagination?.total ?? data.items.length,
      page: data.pagination?.page ?? 1,
      totalPages: data.pagination?.totalPages ?? 1,
      summary: data.summary || null
    };
  }

  return { items: [], total: 0, page: 1, totalPages: 1, summary: null };
};
