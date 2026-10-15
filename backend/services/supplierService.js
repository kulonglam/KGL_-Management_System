import Supplier from '../models/Supplier.js';
import { normalizeSourceType } from '../utils/produceNormalization.js';
import { normalizeLocalPhone } from '../utils/phoneNumber.js';

const normalizeSupplierName = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const findOrCreateSupplier = async ({
  branch,
  name,
  contact,
  sourceType = 'company',
  recordedBy,
  supplierId
}) => {
  if (supplierId) {
    const existing = await Supplier.findOne({ _id: supplierId, branch });
    if (!existing || !existing.isActive) {
      const error = new Error('Supplier not found for this branch');
      error.statusCode = 400;
      throw error;
    }
    return existing;
  }

  const normalizedName = normalizeSupplierName(name);
  const normalizedContact = normalizeLocalPhone(contact);
  if (!normalizedName || !normalizedContact) {
    const error = new Error('Supplier name and contact are required');
    error.statusCode = 400;
    throw error;
  }

  const matched = await Supplier.findOne({
    branch,
    name: normalizedName,
    contact: normalizedContact
  });
  if (matched) {
    if (!matched.isActive) {
      matched.isActive = true;
      await matched.save();
    }
    return matched;
  }

  return Supplier.create({
    name: normalizedName,
    contact: normalizedContact,
    sourceType: normalizeSourceType(sourceType || 'company'),
    branch,
    recordedBy
  });
};

export { findOrCreateSupplier, normalizeSupplierName };
