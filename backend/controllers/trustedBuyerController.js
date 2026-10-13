// Coordinates request handling: reads HTTP input, invokes domain services, and returns response payloads.

import TrustedBuyer from '../models/TrustedBuyer.js';
import {
  normalizeText,
  normalizeNationalId,
  findDuplicateTrustedBuyer
} from '../services/trustedBuyerService.js';
import { parsePagination, buildPaginationMeta, applyListLimit } from '../utils/pagination.js';
import { removedRecordFilter } from '../utils/softDelete.js';
import { buildSearchFilter, resolveSort } from '../utils/listQuery.js';
import { forwardControllerError } from '../utils/httpError.js';

// GET /api/trusted-buyers: list trusted buyers visible to requester scope with optional pagination.
const getTrustedBuyers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role !== 'director') {
      filter.branch = req.user.branch;
    }

    Object.assign(filter, buildSearchFilter(req.query.search, ['name', 'nationalId', 'location', 'contact']));
    Object.assign(filter, removedRecordFilter(req.query.deleted));

    const pagination = parsePagination(req.query);
    const sort = resolveSort(req.query.sort, {
      name_asc: { name: 1 },
      name_desc: { name: -1 },
      recent: { createdAt: -1 }
    }, { createdAt: -1 });
    const buyersQuery = TrustedBuyer.find(filter).sort(sort).lean();
    applyListLimit(buyersQuery, pagination);

    const buyers = await buyersQuery;
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

    const buyer = await TrustedBuyer.create({
      name: sanitizedName,
      nationalId: normalizedNationalId,
      location: sanitizedLocation,
      contact: sanitizedContact,
      branch: req.user.branch,
      recordedBy: req.user._id
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
    const buyer = await TrustedBuyer.findOne({ _id: req.params.id, deletedAt: { $ne: null } });
    if (!buyer) {
      return res.status(404).json({ message: 'Removed trusted buyer not found' });
    }
    if (buyer.branch !== req.user.branch && req.user.role !== 'director') {
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