// Coordinates request handling: reads HTTP input, invokes domain services, and returns response payloads.
 

import Procurement from '../models/Procurement.js';
import { syncStockLevelNotifications } from '../services/stockNotificationService.js';
import {
  resolveSellingPriceDetails,
  canManagerAccessBranch
} from '../services/procurementService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { buildSearchFilter, resolveSort } from '../utils/listQuery.js';
import {
  assertProcurementKeepsStockNonNegative,
  calculateInventoryByFilter,
  getBucketTonnage
} from '../services/inventoryService.js';
import { withStockLock } from '../services/stockLockService.js';
import { recordAudit } from '../services/auditService.js';
import {
  normalizeProduceName,
  normalizeProduceType,
  normalizeSourceType
} from '../utils/produceNormalization.js';

// Normalize legacy procurement field aliases to canonical produce/source fields before response output.
const normalizeProcurementPayload = (record) => {
  if (!record || typeof record !== 'object') return record;

  const produceName = normalizeProduceName(record.produceName || record.name || '');
  const produceType = normalizeProduceType(record.produceType || record.type || '');

  return {
    ...record,
    produceName,
    produceType,
    sourceType: normalizeSourceType(record.sourceType)
  };
};

// GET /api/procurement: return branch procurement history with optional pagination support.
const getAllProcurement = async (req, res) => {
  try {
    const filter = {};

    // If user is manager, filter by branch
    if (req.user.role === 'manager') {
      filter.branch = req.user.branch;
    }

    Object.assign(
      filter,
      buildSearchFilter(req.query.search, ['produceName', 'produceType', 'dealerName', 'sourceType', 'branch'])
    );
    if (req.query.produceType && req.query.produceType !== 'all') {
      filter.produceType = req.query.produceType;
    }

    const pagination = parsePagination(req.query);
    const sort = resolveSort(req.query.sort, {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      tonnage_desc: { tonnageKg: -1 },
      cost_desc: { costUgx: -1 },
      dealer_asc: { dealerName: 1 }
    });
    const procurementsQuery = Procurement.find(filter)
      .populate('recordedBy', 'name')
      .sort(sort)
      .lean();

    if (pagination.enabled) {
      procurementsQuery.skip(pagination.skip).limit(pagination.limit);
    }

    const procurements = (await procurementsQuery).map(normalizeProcurementPayload);
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

// POST /api/procurement: create a procurement record using managed price resolution and canonicalized fields.
const createProcurement = async (req, res) => {
  try {
    const {
      produceName: rawProduceName,
      produceType: rawProduceType,
      sourceType,
      dateReceived,
      timeReceived,
      tonnageKg,
      costUgx,
      dealerName,
      dealerContact
    } = req.body;

    const priceResolution = await resolveSellingPriceDetails({
      branch: req.user.branch,
      produceName: normalizeProduceName(rawProduceName),
      produceType: normalizeProduceType(rawProduceType)
    });
    const produceName = priceResolution.produceName;
    const produceType = priceResolution.produceType;

    const procurement = await Procurement.create({
      produceName,
      produceType,
      sourceType: normalizeSourceType(sourceType),
      dateReceived,
      timeReceived,
      tonnageKg,
      costUgx,
      dealerName,
      dealerContact,
      branch: req.user.branch,
      sellingPrice: priceResolution.priceUgx,
      recordedBy: req.user._id
    });

    const snapshot = await calculateInventoryByFilter({ branch: req.user.branch });
    await syncStockLevelNotifications({
      branch: req.user.branch,
      produceName,
      produceType,
      remainingStock: getBucketTonnage(snapshot, produceName, produceType, req.user.branch)
    });
    await recordAudit({
      actor: req.user,
      action: 'create',
      entityType: 'procurement',
      entityId: procurement._id,
      branch: req.user.branch,
      metadata: { produceName, produceType, tonnageKg: procurement.tonnageKg }
    });

    res.status(201).json(procurement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/procurement/:id: return one procurement record after branch access validation.
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

    res.json(normalizeProcurementPayload(procurement.toObject()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/procurement/:id: update allowed procurement fields and keep canonical legacy compatibility.
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

    const currentProduceName = procurement.produceName || procurement.name || '';
    const currentProduceType = procurement.produceType || procurement.type || '';
    const priceResolution = await resolveSellingPriceDetails({
      branch: procurement.branch,
      produceName: normalizeProduceName(req.body.produceName || currentProduceName),
      produceType: normalizeProduceType(req.body.produceType || currentProduceType)
    });

    const allowedUpdateFields = [
      'produceName',
      'produceType',
      'sourceType',
      'dateReceived',
      'timeReceived',
      'tonnageKg',
      'costUgx',
      'dealerName',
      'dealerContact'
    ];
    const fieldsToApply = {};
    allowedUpdateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        fieldsToApply[field] = req.body[field];
      }
    });

    if (Object.keys(fieldsToApply).length === 0) {
      return res.status(400).json({ message: 'No updatable fields provided' });
    }

    const updatePayload = {
      ...fieldsToApply,
      sourceType: normalizeSourceType(fieldsToApply.sourceType || procurement.sourceType),
      sellingPrice: priceResolution.priceUgx,
      branch: procurement.branch
    };

    // Backfill legacy records on update so future reads are clean.
    if (!updatePayload.produceName && currentProduceName) {
      updatePayload.produceName = priceResolution.produceName || normalizeProduceName(currentProduceName);
    } else {
      updatePayload.produceName = priceResolution.produceName || normalizeProduceName(updatePayload.produceName);
    }
    if (!updatePayload.produceType && currentProduceType) {
      updatePayload.produceType = priceResolution.produceType || normalizeProduceType(currentProduceType);
    } else {
      updatePayload.produceType = priceResolution.produceType || normalizeProduceType(updatePayload.produceType);
    }

    const nextProduceName = updatePayload.produceName;
    const nextProduceType = updatePayload.produceType;
    const nextTonnageKg =
      fieldsToApply.tonnageKg !== undefined ? Number(fieldsToApply.tonnageKg) : Number(procurement.tonnageKg);

    const updatedProcurement = await withStockLock(
      {
        branch: procurement.branch,
        produceName: nextProduceName,
        produceType: nextProduceType
      },
      async () => {
        const snapshot = await calculateInventoryByFilter({ branch: procurement.branch });
        assertProcurementKeepsStockNonNegative({
          snapshot,
          branch: procurement.branch,
          previousProduceName: currentProduceName,
          previousProduceType: currentProduceType,
          previousTonnageKg: Number(procurement.tonnageKg || 0),
          nextProduceName,
          nextProduceType,
          nextTonnageKg
        });

        const saved = await Procurement.findByIdAndUpdate(req.params.id, updatePayload, {
          new: true,
          runValidators: true
        });

        const afterSnapshot = await calculateInventoryByFilter({ branch: procurement.branch });
        await syncStockLevelNotifications({
          branch: procurement.branch,
          produceName: saved.produceName || saved.name,
          produceType: saved.produceType || saved.type,
          remainingStock: getBucketTonnage(
            afterSnapshot,
            saved.produceName || saved.name,
            saved.produceType || saved.type,
            procurement.branch
          )
        });

        if (
          normalizeProduceName(currentProduceName) !== normalizeProduceName(saved.produceName || '') ||
          normalizeProduceType(currentProduceType) !== normalizeProduceType(saved.produceType || '')
        ) {
          await syncStockLevelNotifications({
            branch: procurement.branch,
            produceName: currentProduceName,
            produceType: currentProduceType,
            remainingStock: getBucketTonnage(
              afterSnapshot,
              currentProduceName,
              currentProduceType,
              procurement.branch
            )
          });
        }

        return saved;
      }
    );

    await recordAudit({
      actor: req.user,
      action: 'update',
      entityType: 'procurement',
      entityId: updatedProcurement._id,
      branch: procurement.branch,
      metadata: { produceName: nextProduceName, produceType: nextProduceType, tonnageKg: nextTonnageKg }
    });

    res.json(normalizeProcurementPayload(updatedProcurement.toObject()));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/procurement/:id: remove one procurement record after branch ownership checks.
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

    await withStockLock(
      {
        branch: procurement.branch,
        produceName: procurement.produceName,
        produceType: procurement.produceType
      },
      async () => {
        const snapshot = await calculateInventoryByFilter({ branch: procurement.branch });
        assertProcurementKeepsStockNonNegative({
          snapshot,
          branch: procurement.branch,
          previousProduceName: procurement.produceName,
          previousProduceType: procurement.produceType,
          previousTonnageKg: Number(procurement.tonnageKg || 0),
          nextProduceName: procurement.produceName,
          nextProduceType: procurement.produceType,
          nextTonnageKg: 0
        });

        await procurement.deleteOne();

        const afterSnapshot = await calculateInventoryByFilter({ branch: procurement.branch });
        await syncStockLevelNotifications({
          branch: procurement.branch,
          produceName: procurement.produceName,
          produceType: procurement.produceType,
          remainingStock: getBucketTonnage(
            afterSnapshot,
            procurement.produceName,
            procurement.produceType,
            procurement.branch
          )
        });
      }
    );

    await recordAudit({
      actor: req.user,
      action: 'delete',
      entityType: 'procurement',
      entityId: procurement._id,
      branch: procurement.branch,
      metadata: {
        produceName: procurement.produceName,
        produceType: procurement.produceType,
        tonnageKg: procurement.tonnageKg
      }
    });

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





