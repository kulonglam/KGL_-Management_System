import Procurement from '../models/Procurement.js';
import { resolveOutOfStockNotification } from '../services/stockNotificationService.js';
import { resolveSellingPrice, canManagerAccessBranch } from '../services/procurementService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

// Retrieve all procurement.
const getAllProcurement = async (req, res) => {
  try {
    const filter = {};

    // If user is manager, filter by branch
    if (req.user.role === 'manager') {
      filter.branch = req.user.branch;
    }

    const pagination = parsePagination(req.query);
    const procurementsQuery = Procurement.find(filter)
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    if (pagination.enabled) {
      procurementsQuery.skip(pagination.skip).limit(pagination.limit);
    }

    const procurements = await procurementsQuery;
    if (!pagination.enabled) {
      return res.json(procurements);
    }

    const total = await Procurement.countDocuments(filter);

    return res.json({
      items: procurements,
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

// Create procurement.
const createProcurement = async (req, res) => {
  try {
    const {
      produceName,
      produceType,
      sourceType,
      dateReceived,
      timeReceived,
      tonnageKg,
      costUgx,
      dealerName,
      dealerContact
    } = req.body;

    const finalPrice = await resolveSellingPrice({
      branch: req.user.branch,
      produceType
    });

    const procurement = await Procurement.create({
      produceName,
      produceType,
      sourceType,
      dateReceived,
      timeReceived,
      tonnageKg,
      costUgx,
      dealerName,
      dealerContact,
      branch: req.user.branch,
      sellingPrice: finalPrice,
      recordedBy: req.user._id
    });

    await resolveOutOfStockNotification({
      branch: req.user.branch,
      produceName,
      produceType
    });

    res.status(201).json(procurement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Retrieve procurement by id.
const getProcurementById = async (req, res) => {
  try {
    const procurement = await Procurement.findById(req.params.id).populate('recordedBy', 'name');

    if (!procurement) {
      return res.status(404).json({ message: 'Procurement record not found' });
    }

    // Check if user has access to this branch
    if (!canManagerAccessBranch(req.user, procurement.branch)) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }

    res.json(procurement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update procurement.
const updateProcurement = async (req, res) => {
  try {
    const procurement = await Procurement.findById(req.params.id);

    if (!procurement) {
      return res.status(404).json({ message: 'Procurement record not found' });
    }

    // Check if user has access to this branch
    if (!canManagerAccessBranch(req.user, procurement.branch)) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }

    const nextProduceType = req.body.produceType || procurement.produceType;
    const finalPrice = await resolveSellingPrice({
      branch: procurement.branch,
      produceType: nextProduceType
    });

    const updatedProcurement = await Procurement.findByIdAndUpdate(
      req.params.id,
      { ...req.body, sellingPrice: finalPrice, branch: procurement.branch },
      { new: true, runValidators: true }
    );

    await resolveOutOfStockNotification({
      branch: procurement.branch,
      produceName: updatedProcurement.produceName,
      produceType: updatedProcurement.produceType
    });

    res.json(updatedProcurement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete procurement.
const deleteProcurement = async (req, res) => {
  try {
    const procurement = await Procurement.findById(req.params.id);

    if (!procurement) {
      return res.status(404).json({ message: 'Procurement record not found' });
    }

    // Check if user has access to this branch
    if (!canManagerAccessBranch(req.user, procurement.branch)) {
      return res.status(403).json({ message: 'Access denied to this branch data' });
    }

    await procurement.deleteOne();
    res.json({ message: 'Procurement record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  getAllProcurement,
  createProcurement,
  getProcurementById,
  updateProcurement,
  deleteProcurement
};
