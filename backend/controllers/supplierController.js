import Supplier from '../models/Supplier.js';
import { normalizeSupplierName } from '../services/supplierService.js';
import { normalizeSourceType } from '../utils/produceNormalization.js';
import { normalizeLocalPhone } from '../utils/phoneNumber.js';
import { parsePagination, buildPaginationMeta, applyListLimit } from '../utils/pagination.js';
import { removedOnly, removedRecordFilter } from '../utils/softDelete.js';
import { buildSearchFilter, resolveSort } from '../utils/listQuery.js';
import { forwardControllerError } from '../utils/httpError.js';
import { recordAudit } from '../services/auditService.js';

const listSuppliers = async (req, res, next) => {
  try {
    const filter = { branch: req.user.branch };
    Object.assign(filter, buildSearchFilter(req.query.search, ['name', 'contact', 'sourceType']));
    Object.assign(filter, removedRecordFilter(req.query.deleted));
    if (String(req.query.active) === 'true') {
      filter.isActive = true;
    }

    const pagination = parsePagination(req.query);
    const sort = resolveSort(
      req.query.sort,
      {
        name_asc: { name: 1 },
        name_desc: { name: -1 },
        recent: { createdAt: -1 }
      },
      { name: 1 }
    );
    const query = Supplier.find(filter).sort(sort).lean();
    applyListLimit(query, pagination);
    const items = await query;

    if (!pagination.enabled) {
      return res.json(items);
    }

    const total = await Supplier.countDocuments(filter);
    return res.json({
      items,
      pagination: buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total })
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const name = normalizeSupplierName(req.body.name);
    const contact = normalizeLocalPhone(req.body.contact);
    const sourceType = normalizeSourceType(req.body.sourceType || 'company');

    const duplicate = await Supplier.findOne({
      branch: req.user.branch,
      name,
      contact
    });
    if (duplicate) {
      return res.status(400).json({ message: 'Supplier already exists for this branch' });
    }

    const supplier = await Supplier.create({
      name,
      contact,
      sourceType,
      branch: req.user.branch,
      recordedBy: req.user._id
    });

    await recordAudit({
      actor: req.user,
      action: 'create',
      entityType: 'supplier',
      entityId: supplier._id,
      branch: supplier.branch,
      metadata: { name: supplier.name, contact: supplier.contact }
    });

    res.status(201).json(supplier);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier || supplier.branch !== req.user.branch) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    if (req.body.name !== undefined) supplier.name = normalizeSupplierName(req.body.name);
    if (req.body.contact !== undefined) supplier.contact = normalizeLocalPhone(req.body.contact);
    if (req.body.sourceType !== undefined) {
      supplier.sourceType = normalizeSourceType(req.body.sourceType);
    }
    if (req.body.isActive !== undefined) supplier.isActive = Boolean(req.body.isActive);

    const saved = await supplier.save();
    await recordAudit({
      actor: req.user,
      action: 'update',
      entityType: 'supplier',
      entityId: saved._id,
      branch: saved.branch,
      metadata: { name: saved.name, isActive: saved.isActive }
    });
    res.json(saved);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier || supplier.branch !== req.user.branch) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    supplier.deletedAt = new Date();
    supplier.isActive = false;
    await supplier.save();
    await recordAudit({
      actor: req.user,
      action: 'delete',
      entityType: 'supplier',
      entityId: supplier._id,
      branch: supplier.branch,
      metadata: { name: supplier.name }
    });
    res.json({ message: 'Supplier removed. You can restore it from removed records.' });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const restoreSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({
      _id: req.params.id,
      deletedAt: removedOnly(),
      branch: req.user.branch
    });
    if (!supplier) {
      return res.status(404).json({ message: 'Removed supplier not found' });
    }
    supplier.deletedAt = null;
    supplier.isActive = true;
    const saved = await supplier.save();
    await recordAudit({
      actor: req.user,
      action: 'update',
      entityType: 'supplier',
      entityId: saved._id,
      branch: saved.branch,
      metadata: { restored: true, name: saved.name }
    });
    res.json(saved);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

export { listSuppliers, createSupplier, updateSupplier, deleteSupplier, restoreSupplier };
