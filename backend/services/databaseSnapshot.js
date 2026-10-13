// Writes and restores a JSON snapshot of the operational collections.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
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

const { EJSON } = mongoose.mongo.BSON;

const SNAPSHOT_MODELS = [
  'User',
  'Branch',
  'PriceSetting',
  'Procurement',
  'Sale',
  'CreditSale',
  'TrustedBuyer',
  'StockNotification',
  'StockLock',
  'PriceHistory',
  'AuditLog',
  'MessageOutbox'
];

const backupDatabase = async (directory) => {
  await mkdir(directory, { recursive: true });
  const manifest = {
    createdAt: new Date().toISOString(),
    collections: []
  };

  for (const name of SNAPSHOT_MODELS) {
    const docs = await mongoose.model(name).collection.find({}).toArray();
    const file = `${name}.json`;
    await writeFile(path.join(directory, file), EJSON.stringify(docs));
    manifest.collections.push({ model: name, file, count: docs.length });
  }

  await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
};

const restoreDatabase = async (directory) => {
  const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
  if (!Array.isArray(manifest.collections) || manifest.collections.length === 0) {
    throw new Error('Backup manifest is missing collections');
  }

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

  return manifest;
};

export { SNAPSHOT_MODELS, backupDatabase, restoreDatabase };
