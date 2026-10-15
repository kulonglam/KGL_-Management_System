import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { migrateNationalIds } from '../services/ninMigrationService.js';

dotenv.config();

// Usage: npm run encrypt-nin -- [--dry-run]
const dryRun = process.argv.includes('--dry-run');

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}
if (!process.env.NIN_ENCRYPTION_KEY) {
  console.warn('NIN_ENCRYPTION_KEY is not set: only blind indexes will be computed, values stay plaintext.');
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await migrateNationalIds({ dryRun });
  console.log(`National ID migration${dryRun ? ' (dry run)' : ''}:`, JSON.stringify(result, null, 2));
  if (result.trustedBuyers.undecryptable || result.creditSales.undecryptable) {
    console.warn('Some values could not be decrypted with the current key and were left unchanged.');
  }
  await mongoose.disconnect();
} catch (error) {
  console.error(`National ID migration failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
}
