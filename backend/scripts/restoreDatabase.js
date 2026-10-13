import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { isProduction } from '../config/security.js';
import { materializeBackup, restoreDatabase } from '../services/databaseSnapshot.js';

dotenv.config();

let directory = process.argv[2];

if (!directory) {
  console.error('Usage: npm run restore -- <backup-directory-or-json>');
  process.exit(1);
}

if (process.env.CONFIRM_DATABASE_RESTORE !== 'yes') {
  console.error('Set CONFIRM_DATABASE_RESTORE=yes to replace the current database with a backup.');
  process.exit(1);
}

if (isProduction() && process.env.ALLOW_PRODUCTION_RESTORE !== 'true') {
  console.error('Refusing to restore a production database. Set ALLOW_PRODUCTION_RESTORE=true for a deliberate restore.');
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  if (directory.toLowerCase().endsWith('.json')) {
    const payload = JSON.parse(await readFile(directory, 'utf8'));
    const extracted = await mkdtemp(path.join(tmpdir(), 'kgl-restore-'));
    await materializeBackup(payload, extracted);
    directory = extracted;
  }
  const manifest = await restoreDatabase(directory);
  console.log(`Restored ${manifest.collections.length} collections from ${directory}`);
  await mongoose.disconnect();
} catch (error) {
  console.error(`Restore failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
}
