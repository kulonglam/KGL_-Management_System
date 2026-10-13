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

const PAGE_SIZE = 200;
const MAX_PAGES = 50;

export const fetchAllPages = async (requestPage) => {
  const items = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await requestPage({ page, limit: PAGE_SIZE });
    const payload = asListPayload(response?.data);
    items.push(...payload.items);
    totalPages = Number(payload.totalPages) || 1;
    page += 1;
  } while (page <= totalPages && page <= MAX_PAGES);

  if (page <= totalPages) {
    throw new Error('The selected period has too many records to load.');
  }

  return items;
};
