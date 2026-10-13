import path from 'node:path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { backupDatabase, publishBackup } from '../services/databaseSnapshot.js';

dotenv.config();

const directory =
  process.argv[2] ||
  path.join(process.cwd(), 'backups', new Date().toISOString().replace(/[:.]/g, '-'));

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  const manifest = await backupDatabase(directory);
  const total = manifest.collections.reduce((sum, entry) => sum + entry.count, 0);
  const published = await publishBackup(directory);
  if (published.published) {
    console.log(`Backup copied off this machine (${total} documents)`);
  } else {
    console.log(`Backup written to ${directory} (${total} documents). It is still on this machine.`);
  }
  await mongoose.disconnect();
} catch (error) {
  console.error(`Backup failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
}
