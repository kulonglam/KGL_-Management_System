import mongoose from 'mongoose';
import LegalEntity from '../models/LegalEntity.js';
import Branch from '../models/Branch.js';
import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';
import { roundUgx } from '../utils/money.js';

const HOME_NAME = 'Karibu Groceries LTD';

const ensureHomeEntity = async () => {
  let home = await LegalEntity.findOne({ name: HOME_NAME });
  if (!home) {
    home = await LegalEntity.create({
      name: HOME_NAME,
      baseCurrency: 'UGX',
      address: 'Uganda'
    });
  }
  await Branch.updateMany({ legalEntity: null }, { $set: { legalEntity: home._id } });
  return home;
};

const listEntities = async () => {
  await ensureHomeEntity();
  const entities = await LegalEntity.find({}).sort({ name: 1 }).lean();
  const branches = await Branch.find({}).select('name isActive legalEntity').lean();
  return entities.map((entity) => ({
    ...entity,
    branches: branches
      .filter((branch) => String(branch.legalEntity || '') === String(entity._id))
      .map((branch) => ({ id: String(branch._id), name: branch.name, isActive: branch.isActive }))
  }));
};

const createEntity = async ({ name, tin, address, baseCurrency }) => {
  const saved = await LegalEntity.create({
    name: String(name || '').trim(),
    tin: String(tin || '').trim(),
    address: String(address || '').trim(),
    baseCurrency: String(baseCurrency || 'UGX').trim().toUpperCase() || 'UGX'
  });
  return saved.toObject();
};

const assignBranch = async ({ entityId, branchId }) => {
  if (!mongoose.isValidObjectId(entityId) || !mongoose.isValidObjectId(branchId)) {
    const error = new Error('entity and branch ids are required');
    error.statusCode = 400;
    throw error;
  }
  const entity = await LegalEntity.findById(entityId);
  const branch = await Branch.findById(branchId);
  if (!entity || !branch) {
    const error = new Error('Company or branch not found');
    error.statusCode = 404;
    throw error;
  }
  branch.legalEntity = entity._id;
  await branch.save();
  return { entityId: String(entity._id), branchId: String(branch._id), branch: branch.name };
};

const consolidateEntity = async (entityId) => {
  const entity = await LegalEntity.findById(entityId).lean();
  if (!entity) {
    const error = new Error('Company not found');
    error.statusCode = 404;
    throw error;
  }
  const branches = await Branch.find({ legalEntity: entity._id }).select('name').lean();
  const names = branches.map((branch) => branch.name);
  if (names.length === 0) {
    return {
      entity: entity.name,
      baseCurrency: entity.baseCurrency || 'UGX',
      branches: [],
      cashSalesUgx: 0,
      openReceivablesUgx: 0
    };
  }
  const [sales, credit] = await Promise.all([
    Sale.aggregate([
      { $match: { branch: { $in: names }, voidedAt: null, deletedAt: null } },
      { $group: { _id: null, amountUgx: { $sum: '$amountPaidUgx' } } }
    ]),
    CreditSale.aggregate([
      { $match: { branch: { $in: names }, voidedAt: null, deletedAt: null, balanceUgx: { $gt: 0 } } },
      { $group: { _id: null, amountUgx: { $sum: '$balanceUgx' } } }
    ])
  ]);
  return {
    entity: entity.name,
    baseCurrency: entity.baseCurrency || 'UGX',
    branches: names,
    cashSalesUgx: roundUgx(sales[0]?.amountUgx || 0),
    openReceivablesUgx: roundUgx(credit[0]?.amountUgx || 0)
  };
};

export { ensureHomeEntity, listEntities, createEntity, assignBranch, consolidateEntity };
