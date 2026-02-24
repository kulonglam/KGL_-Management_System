import TrustedBuyer from '../models/TrustedBuyer.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

const normalizeText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');

// @desc    Get all trusted buyers
// @route   GET /api/trusted-buyers
// @access  Private (Manager, Sales Agent)
const getTrustedBuyers = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'director') {
      filter.branch = req.user.branch;
    }

    const pagination = parsePagination(req.query);
    const buyersQuery = TrustedBuyer.find(filter)
      .sort({ createdAt: -1 })
      .lean();

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

const createTrustedBuyer = async (req, res) => {
  try {
    const { name, nationalId, location, contact } = req.body;
    const sanitizedName = normalizeText(name);
    const sanitizedLocation = normalizeText(location);
    const sanitizedContact = normalizeText(contact);

    const existing = await TrustedBuyer.findOne({
      nationalId: nationalId.toUpperCase(),
      branch: req.user.branch
    });

    if (existing) {
      return res.status(400).json({ message: 'Trusted buyer already exists for this branch' });
    }

    const buyer = await TrustedBuyer.create({
      name: sanitizedName,
      nationalId: nationalId.toUpperCase(),
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

    if (nationalId && nationalId.toUpperCase() !== buyer.nationalId) {
      const existing = await TrustedBuyer.findOne({
        nationalId: nationalId.toUpperCase(),
        branch: req.user.branch
      });
      if (existing) {
        return res.status(400).json({ message: 'Trusted buyer already exists for this branch' });
      }
      buyer.nationalId = nationalId.toUpperCase();
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

// @desc    Delete trusted buyer
// @route   DELETE /api/trusted-buyers/:id
// @access  Private (Manager only)
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

export {
  getTrustedBuyers,
  createTrustedBuyer,
  updateTrustedBuyer,
  deleteTrustedBuyer
};
