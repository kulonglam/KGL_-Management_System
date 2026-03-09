// Coordinates request handling: reads HTTP input, invokes domain services, and returns response payloads.

import TrustedBuyer from '../models/TrustedBuyer.js';
import {
  normalizeText,
  normalizeNationalId,
  findDuplicateTrustedBuyer
} from '../services/trustedBuyerService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

// GET /api/trusted-buyers: list trusted buyers visible to requester scope with optional pagination.
const getTrustedBuyers = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'director') {
      filter.branch = req.user.branch;
    }

    const pagination = parsePagination(req.query);
    const buyersQuery = TrustedBuyer.find(filter).sort({ createdAt: -1 }).lean();

    if (pagination.enabled) {
      buyersQuery.skip(pagination.skip).limit(pagination.limit);
    }

    const buyers = await buyersQuery;
    if (!pagination.enabled) {
      return res.json(buyers);
    }

    const total = await TrustedBuyer.countDocuments(filter);

    return res.json({
      items: buyers,
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total
      })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/trusted-buyers: create one trusted buyer after branch-unique NIN duplication checks.
const createTrustedBuyer = async (req, res) => {
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
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/trusted-buyers/:id: update one trusted buyer with branch and duplicate-NIN safeguards.
const updateTrustedBuyer = async (req, res) => {
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
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/trusted-buyers/:id: delete one trusted buyer after branch ownership validation.
const deleteTrustedBuyer = async (req, res) => {
  try {
    const buyer = await TrustedBuyer.findById(req.params.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Trusted buyer not found' });
    }
    if (buyer.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }
    await buyer.deleteOne();
    res.json({ message: 'Trusted buyer deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export { getTrustedBuyers, createTrustedBuyer, updateTrustedBuyer, deleteTrustedBuyer };