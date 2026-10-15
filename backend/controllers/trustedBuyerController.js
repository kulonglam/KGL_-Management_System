// Coordinates request handling: reads HTTP input, invokes domain services, and returns response payloads.

import TrustedBuyer from '../models/TrustedBuyer.js';
import CreditSale from '../models/CreditSale.js';
import { roundUgx } from '../utils/money.js';
import {
  normalizeText,
  normalizeNationalId,
  findDuplicateTrustedBuyer
} from '../services/trustedBuyerService.js';
import { parsePagination, buildPaginationMeta, applyListLimit } from '../utils/pagination.js';
import { removedOnly, removedRecordFilter } from '../utils/softDelete.js';
import { deniesBranchAccess } from '../utils/branchAccess.js';
import { buildSearchFilter, resolveSort } from '../utils/listQuery.js';
import { forwardControllerError } from '../utils/httpError.js';
import { appendNationalIdSearch } from '../utils/fieldEncryption.js';

const normalizeEmail = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

// Aggregations bypass the soft-delete find hook, so removed/voided credits are excluded explicitly.
const attachOutstandingBalances = async (buyers) => {
  if (buyers.length === 0) return buyers;
  const totals = await CreditSale.aggregate([
    {
      $match: {
        trustedBuyer: { $in: buyers.map((buyer) => buyer._id) },
        deletedAt: null,
        voidedAt: null,
        balanceUgx: { $gt: 0 }
      }
    },
    { $group: { _id: '$trustedBuyer', outstandingUgx: { $sum: '$balanceUgx' } } }
  ]);
  const byBuyer = new Map(totals.map((row) => [String(row._id), roundUgx(row.outstandingUgx)]));
  return buyers.map((buyer) => ({ ...buyer, outstandingUgx: byBuyer.get(String(buyer._id)) || 0 }));
};

// GET /api/trusted-buyers: list trusted buyers visible to requester scope with optional pagination.
const getTrustedBuyers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role !== 'director') {
      filter.branch = req.user.branch;
    }

    Object.assign(
      filter,
      appendNationalIdSearch(
        buildSearchFilter(req.query.search, ['name', 'location', 'contact']),
        req.query.search
      )
    );
    Object.assign(filter, removedRecordFilter(req.query.deleted));

    const pagination = parsePagination(req.query);
    const sort = resolveSort(req.query.sort, {
      name_asc: { name: 1 },
      name_desc: { name: -1 },
      recent: { createdAt: -1 }
    }, { createdAt: -1 });
    const buyersQuery = TrustedBuyer.find(filter).sort(sort).lean();
    applyListLimit(buyersQuery, pagination);

    const buyers = await attachOutstandingBalances(await buyersQuery);
    if (!pagination.enabled) {
      return res.json(buyers);
    }

    const total = await TrustedBuyer.countDocuments(filter);
    const uniqueLocations = (await TrustedBuyer.distinct('location', filter)).filter(Boolean).length;

    return res.json({
      items: buyers,
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total
      }),
      summary: {
        uniqueLocations
      }
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// POST /api/trusted-buyers: create one trusted buyer after branch-unique NIN duplication checks.
const createTrustedBuyer = async (req, res, next) => {
  try {
    const { name, nationalId, location, contact } = req.body;
    const sanitizedName = normalizeText(name);
    const sanitizedLocation = normalizeText(location);
    const sanitizedContact = normalizeText(contact);
    const normalizedNationalId = normalizeNationalId(nationalId);

    const existing = await findDuplicateTrustedBuyer({
      branch: req.user.branch,
      nationalId: normalizedNationalId
    });

    if (existing) {
      return res.status(400).json({ message: 'Trusted buyer already exists for this branch' });
    }

    const creditLimitRaw = req.body.creditLimitUgx;
    const creditLimitUgx =
      creditLimitRaw === undefined || creditLimitRaw === null || creditLimitRaw === ''
        ? null
        : Number(creditLimitRaw);

    const buyer = await TrustedBuyer.create({
      name: sanitizedName,
      nationalId: normalizedNationalId,
      location: sanitizedLocation,
      contact: sanitizedContact,
      email: normalizeEmail(req.body.email),
      branch: req.user.branch,
      recordedBy: req.user._id,
      creditLimitUgx: Number.isFinite(creditLimitUgx) ? creditLimitUgx : null
    });

    res.status(201).json(buyer);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// PUT /api/trusted-buyers/:id: update one trusted buyer with branch and duplicate-NIN safeguards.
const updateTrustedBuyer = async (req, res, next) => {
  try {
    const buyer = await TrustedBuyer.findById(req.params.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Trusted buyer not found' });
    }
    if (buyer.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }
    const { name, nationalId, location, contact } = req.body;
    if (nationalId && normalizeNationalId(nationalId) !== buyer.nationalId) {
      const existing = await findDuplicateTrustedBuyer({
        branch: req.user.branch,
        nationalId,
        excludeId: buyer._id
      });
      if (existing) {
        return res.status(400).json({ message: 'Trusted buyer already exists for this branch' });
      }
      buyer.nationalId = normalizeNationalId(nationalId);
    }
    if (name !== undefined) buyer.name = normalizeText(name);
    if (location !== undefined) buyer.location = normalizeText(location);
    if (contact !== undefined) buyer.contact = normalizeText(contact);
    if (req.body.email !== undefined) buyer.email = normalizeEmail(req.body.email);
    if (Object.prototype.hasOwnProperty.call(req.body, 'creditLimitUgx')) {
      const creditLimitRaw = req.body.creditLimitUgx;
      buyer.creditLimitUgx =
        creditLimitRaw === undefined || creditLimitRaw === null || creditLimitRaw === ''
          ? null
          : Number(creditLimitRaw);
    }

    const updated = await buyer.save();
    res.json(updated);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

// DELETE /api/trusted-buyers/:id: delete one trusted buyer after branch ownership validation.
const deleteTrustedBuyer = async (req, res, next) => {
  try {
    const buyer = await TrustedBuyer.findById(req.params.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Trusted buyer not found' });
    }
    if (buyer.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }
    buyer.deletedAt = new Date();
    await buyer.save();
    res.json({ message: 'Trusted buyer removed. You can restore this buyer from removed records.' });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};
const restoreTrustedBuyer = async (req, res, next) => {
  try {
    const buyer = await TrustedBuyer.findOne({ _id: req.params.id, deletedAt: removedOnly() });
    if (!buyer) {
      return res.status(404).json({ message: 'Removed trusted buyer not found' });
    }
    if (deniesBranchAccess(req.user, buyer.branch)) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }
    buyer.deletedAt = null;
    const restored = await buyer.save();
    res.json(restored);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

export { getTrustedBuyers, createTrustedBuyer, updateTrustedBuyer, deleteTrustedBuyer, restoreTrustedBuyer };