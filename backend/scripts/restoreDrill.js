import os from 'node:os';
import path from 'node:path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { backupDatabase, rehearseRestore } from '../services/databaseSnapshot.js';

dotenv.config();

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

const directory = path.join(os.tmpdir(), `kgl-restore-drill-${Date.now()}`);

try {
  await mongoose.connect(process.env.MONGODB_URI);
  await backupDatabase(directory);
  const rehearsal = await rehearseRestore(directory);
  const documents = rehearsal.collections.reduce((sum, entry) => sum + entry.count, 0);
  console.log(`Restore rehearsal passed for ${rehearsal.collections.length} collections (${documents} documents).`);
  console.log('This checks the snapshot files. The host backup is still the copy used to recover the live database.');
  await mongoose.disconnect();
} catch (error) {
  console.error(`Restore rehearsal failed: ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
}
