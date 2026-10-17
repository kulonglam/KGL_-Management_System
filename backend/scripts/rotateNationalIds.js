import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { rotateNationalIds } from '../services/ninMigrationService.js';

dotenv.config();

const dryRun = process.argv.includes('--dry-run');

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await rotateNationalIds({ dryRun });
  console.log(`National ID rotation${dryRun ? ' (dry run)' : ''}:`, JSON.stringify(result, null, 2));
  if (!dryRun) {
    console.log('Set NIN_ENCRYPTION_KEY to the value of NIN_ENCRYPTION_KEY_NEXT, then remove NIN_ENCRYPTION_KEY_NEXT.');
  }
  await mongoose.disconnect();
} catch (error) {
  console.error(`National ID rotation failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
}
