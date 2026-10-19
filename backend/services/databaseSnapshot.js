// Writes and restores a JSON snapshot of the operational collections.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { isProduction } from '../config/security.js';
import { allowAppendOnlyNativeWrite } from '../utils/appendOnly.js';
import '../models/AuditLog.js';
import '../models/Branch.js';
import '../models/CreditSale.js';
import '../models/MessageOutbox.js';
import '../models/PriceHistory.js';
import '../models/PriceSetting.js';
import '../models/Procurement.js';
import '../models/Sale.js';
import '../models/StockLock.js';
import '../models/StockNotification.js';
import '../models/TrustedBuyer.js';
import '../models/User.js';
import '../models/Supplier.js';
import '../models/StockMovement.js';
import '../models/StockBalance.js';
import '../models/StockTransfer.js';
import '../models/StockAdjustment.js';
import '../models/StocktakeSession.js';
import '../models/StockLot.js';
import '../models/TaxInvoice.js';
import '../models/TaxConfig.js';
import '../models/InvoiceSequence.js';
import '../models/CashUpSession.js';
import '../models/GlAccount.js';
import '../models/GlAccountMapping.js';
import '../models/GlJournalLine.js';
import '../models/PeriodLock.js';
import '../models/RetentionPolicy.js';
import '../models/ApiKey.js';
import '../models/WebhookSubscription.js';
import '../models/WebhookDelivery.js';
import '../models/PurchaseOrder.js';
import '../models/GoodsReceipt.js';
import '../models/BankStatementLine.js';
import '../models/QueuedJob.js';
import '../models/LegalEntity.js';
import '../models/ExchangeRate.js';
import '../models/ProductBarcode.js';
import '../models/operationsModels.js';

const { EJSON } = mongoose.mongo.BSON;

const SNAPSHOT_MODELS = [
  'User',
  'Branch',
  'PriceSetting',
  'Procurement',
  'Sale',
  'CreditSale',
  'TrustedBuyer',
  'Supplier',
  'StockNotification',
  'StockLock',
  'StockMovement',
  'StockBalance',
  'StockTransfer',
  'StockAdjustment',
  'StocktakeSession',
  'StockLot',
  'PriceHistory',
  'AuditLog',
  'MessageOutbox',
  'TaxInvoice',
  'TaxConfig',
  'InvoiceSequence',
  'CashUpSession',
  'GlAccount',
  'GlAccountMapping',
  'GlJournalLine',
  'PeriodLock',
  'RetentionPolicy',
  'ApiKey',
  'WebhookSubscription',
  'WebhookDelivery',
  'PurchaseOrder',
  'GoodsReceipt',
  'BankStatementLine',
  'QueuedJob',
  'LegalEntity',
  'ExchangeRate',
  'ProductBarcode',
  'Employee',
  'Attendance',
  'LeaveRequest',
  'PayRun',
  'SupplierBill',
  'VendorPayment',
  'WarehouseBin',
  'BinStock',
  'PickList',
  'WeighTicket',
  'FiscalDocument',
  'FixedAsset',
  'Vehicle',
  'Trip',
  'FuelLog',
  'BudgetLine',
  'RestoreDrill',
  'LeaderLease'
];

// A portable snapshot must not carry credentials. Restored users need a password reset.
const REDACTED_FIELDS = {
  User: ['password', 'recoveryCodeHashes', 'mfaSecret', 'mfaPendingSecret', 'previousRefreshJti'],
  ApiKey: ['keyHash'],
  TrustedBuyer: ['portalPasswordHash']
};

const redactDocument = (modelName, doc) => {
  const fields = REDACTED_FIELDS[modelName];
  if (!fields) return doc;
  const copy = { ...doc };
  for (const field of fields) {
    if (field in copy) copy[field] = field === 'recoveryCodeHashes' ? [] : '';
  }
  return copy;
};

const backupDatabase = async (directory) => {
  await mkdir(directory, { recursive: true });
  const manifest = {
    createdAt: new Date().toISOString(),
    collections: []
  };

  for (const name of SNAPSHOT_MODELS) {
    const docs = (await mongoose.model(name).collection.find({}).toArray()).map((doc) =>
      redactDocument(name, doc)
    );
    const file = `${name}.json`;
    await writeFile(path.join(directory, file), EJSON.stringify(docs));
    manifest.collections.push({ model: name, file, count: docs.length });
  }

  await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
};

const safeBackupFileName = (name) => {
  const fileName = String(name || '');
  if (!fileName || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    throw new Error('Backup file name is not safe');
  }
  return fileName;
};

const readBackupPayload = async (directory) => {
  const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
  const files = { 'manifest.json': JSON.stringify(manifest) };
  for (const entry of manifest.collections || []) {
    const fileName = safeBackupFileName(entry.file);
    files[fileName] = await readFile(path.join(directory, fileName), 'utf8');
  }
  return { manifest, files };
};

const materializeBackup = async (payload, directory) => {
  if (!payload || typeof payload !== 'object' || !payload.files || !payload.files['manifest.json']) {
    throw new Error('Uploaded backup is missing its manifest');
  }
  await mkdir(directory, { recursive: true });
  for (const [name, contents] of Object.entries(payload.files)) {
    const fileName = safeBackupFileName(name);
    await writeFile(path.join(directory, fileName), String(contents));
  }
};

// Copy a snapshot off this machine. Production refuses to finish without that copy.
const publishBackup = async (directory, fetchImpl = globalThis.fetch) => {
  const url = String(process.env.BACKUP_UPLOAD_URL || '').trim();
  if (!url) {
    if (isProduction()) {
      throw new Error('BACKUP_UPLOAD_URL is required in production so the snapshot leaves this machine');
    }
    return { published: false };
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('BACKUP_UPLOAD_URL must be an https URL');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('BACKUP_UPLOAD_URL must be an https URL');
  }

  const payload = await readBackupPayload(directory);
  const headers = { 'Content-Type': 'application/json' };
  const token = String(process.env.BACKUP_UPLOAD_TOKEN || '').trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetchImpl(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload)
  });
  if (!response?.ok) {
    throw new Error(`Backup upload failed with status ${response?.status || 'unknown'}`);
  }
  return { published: true };
};

const restoreDatabase = async (directory) => {
  const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
  if (!Array.isArray(manifest.collections) || manifest.collections.length === 0) {
    throw new Error('Backup manifest is missing collections');
  }

  await allowAppendOnlyNativeWrite(async () => {
    for (const entry of manifest.collections) {
      if (!SNAPSHOT_MODELS.includes(entry.model)) {
        throw new Error(`Backup manifest names an unknown collection: ${entry.model}`);
      }
      const docs = EJSON.parse(await readFile(path.join(directory, entry.file), 'utf8'));
      const collection = mongoose.model(entry.model).collection;
      await collection.deleteMany({});
      if (Array.isArray(docs) && docs.length > 0) {
        await collection.insertMany(docs);
      }
    }
  });

  const { rebuildStockBalances } = await import('./stockBalanceService.js');
  await rebuildStockBalances();

  return manifest;
};

const rehearseRestoreDatabase = async (directory) => {
  const rehearsal = await rehearseRestore(directory);
  const liveDb = mongoose.connection?.db;
  const client = mongoose.connection?.getClient?.();
  if (!liveDb || !client) throw new Error('Database is not connected');

  const liveName = liveDb.databaseName;
  const scratchName = `kgl_restore_drill_${Date.now()}`;
  if (!scratchName.startsWith('kgl_restore_drill_') || scratchName === liveName) {
    throw new Error('Refusing to restore into the live database');
  }

  const userCollection = mongoose.model('User').collection.collectionName;
  const liveUsersBefore = await liveDb.collection(userCollection).countDocuments();
  const scratch = client.db(scratchName);
  try {
    const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
    for (const entry of manifest.collections) {
      const docs = EJSON.parse(await readFile(path.join(directory, entry.file), 'utf8'));
      const collectionName = mongoose.model(entry.model).collection.collectionName;
      if (docs.length > 0) await scratch.collection(collectionName).insertMany(docs, { ordered: true });
      const restored = await scratch.collection(collectionName).countDocuments();
      if (restored !== entry.count) {
        throw new Error(`${entry.model} scratch restore count does not match the manifest`);
      }
    }
  } finally {
    await scratch.dropDatabase();
  }

  const liveUsersAfter = await liveDb.collection(userCollection).countDocuments();
  if (liveUsersAfter !== liveUsersBefore) {
    throw new Error('Restore drill changed the live database');
  }
  return rehearsal;
};

const rehearseRestore = async (directory) => {
  const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
  if (!Array.isArray(manifest.collections) || manifest.collections.length === 0) {
    throw new Error('Backup manifest is missing collections');
  }
  const collections = [];
  for (const entry of manifest.collections) {
    if (!SNAPSHOT_MODELS.includes(entry.model)) {
      throw new Error(`Backup manifest names an unknown collection: ${entry.model}`);
    }
    const docs = EJSON.parse(await readFile(path.join(directory, entry.file), 'utf8'));
    if (!Array.isArray(docs) || docs.length !== entry.count) {
      throw new Error(`${entry.model} snapshot count does not match the manifest`);
    }
    if (entry.model === 'User' && docs.some((user) => user.password || user.mfaSecret)) {
      throw new Error('User snapshot still contains a password or MFA secret');
    }
    if (entry.model === 'TrustedBuyer' && docs.some((buyer) => buyer.portalPasswordHash)) {
      throw new Error('Trusted buyer snapshot still contains a portal password');
    }
    collections.push({ model: entry.model, count: docs.length });
  }
  return { ok: true, collections };
};

export {
  SNAPSHOT_MODELS,
  backupDatabase,
  materializeBackup,
  publishBackup,
  rehearseRestore,
  rehearseRestoreDatabase,
  restoreDatabase
};
