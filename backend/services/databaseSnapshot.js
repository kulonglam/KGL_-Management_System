// Writes and restores a JSON snapshot of the operational collections.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { isProduction } from '../config/security.js';
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

export { SNAPSHOT_MODELS, backupDatabase, materializeBackup, publishBackup, restoreDatabase };
