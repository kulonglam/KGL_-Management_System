import path from 'node:path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { backupDatabase } from '../services/databaseSnapshot.js';

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
  console.log(`Backup written to ${directory} (${total} documents)`);
  await mongoose.disconnect();
} catch (error) {
  console.error(`Backup failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
}
