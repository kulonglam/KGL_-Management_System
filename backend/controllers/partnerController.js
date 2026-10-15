import StockBalance from '../models/StockBalance.js';
import Sale from '../models/Sale.js';
import Procurement from '../models/Procurement.js';
import PriceSetting from '../models/PriceSetting.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { buildDateRangeFilter } from '../utils/listQuery.js';
import { forwardControllerError } from '../utils/httpError.js';

// Branch-bound keys only ever see their branch; all-branch keys may narrow with ?branch=.
const scopedFilter = (req) => {
  if (req.apiKey.branch) return { branch: req.apiKey.branch };
  return req.query.branch ? { branch: String(req.query.branch) } : {};
};

const pagedList = async (req, res, model, filter, { sort, select }) => {
  const pagination = parsePagination({ page: req.query.page || 1, limit: req.query.limit || 100 });
  const [items, total] = await Promise.all([
    model.find(filter).select(select).sort(sort).skip(pagination.skip).limit(pagination.limit).lean(),
    model.countDocuments(filter)
  ]);
  return res.json({
    items,
    pagination: buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total })
  });
};

const withDateRange = (req, res, filter, field) => {
  const range = buildDateRangeFilter(req.query.from, req.query.to);
  if (range.error) {
    res.status(400).json({ message: range.error });
    return false;
  }
  if (range.filter) filter[field] = range.filter;
  return true;
};

const partnerMe = (req, res) =>
  res.json({
    name: req.apiKey.name,
    prefix: req.apiKey.prefix,
    scopes: req.apiKey.scopes,
    branch: req.apiKey.branch || null,
    expiresAt: req.apiKey.expiresAt
  });

const partnerStock = async (req, res, next) => {
  try {
    const items = await StockBalance.find(scopedFilter(req))
      .select('branch produceName produceType onHandKg sellingPrice updatedAt -_id')
      .sort({ branch: 1, produceName: 1 })
      .lean();
    res.json({ items });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// Buyer names, agents and contacts are deliberately left out of partner payloads.
const partnerSales = async (req, res, next) => {
  try {
    const filter = { ...scopedFilter(req), voidedAt: null };
    if (!withDateRange(req, res, filter, 'date')) return undefined;
    return await pagedList(req, res, Sale, filter, {
      sort: { date: -1, createdAt: -1 },
      select: 'branch date time produceName produceType tonnageKg amountPaidUgx paymentMethod createdAt'
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const partnerProcurements = async (req, res, next) => {
  try {
    const filter = scopedFilter(req);
    if (!withDateRange(req, res, filter, 'dateReceived')) return undefined;
    return await pagedList(req, res, Procurement, filter, {
      sort: { dateReceived: -1, createdAt: -1 },
      select: 'branch dateReceived produceName produceType sourceType tonnageKg costUgx sellingPrice supplier createdAt'
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const partnerPrices = async (req, res, next) => {
  try {
    const items = await PriceSetting.find(scopedFilter(req))
      .select('branch produceName produceType priceUgx updatedAt -_id')
      .sort({ branch: 1, produceType: 1 })
      .lean();
    res.json({ items });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

export { partnerMe, partnerPrices, partnerProcurements, partnerSales, partnerStock };
