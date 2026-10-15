import dotenv from 'dotenv';
import mongoose from 'mongoose';
import {
  backfillDocumentMovements,
  backfillProcurementSuppliers,
  findLedgerBalanceMismatches
} from '../services/backfillService.js';
import { reconcileStockBalances } from '../services/stockBalanceService.js';

dotenv.config();

// Usage: npm run backfill -- [--dry-run] [--suppliers-only | --movements-only]
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const runSuppliers = !args.has('--movements-only');
const runMovements = !args.has('--suppliers-only');

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  if (runSuppliers) {
    const suppliers = await backfillProcurementSuppliers({ dryRun });
    console.log(`Suppliers${dryRun ? ' (dry run)' : ''}:`, JSON.stringify(suppliers, null, 2));
  }
  if (runMovements) {
    const movements = await backfillDocumentMovements({ dryRun });
    console.log(`Movements${dryRun ? ' (dry run)' : ''}:`, JSON.stringify(movements, null, 2));
    if (!dryRun) await reconcileStockBalances();
    const mismatches = await findLedgerBalanceMismatches();
    if (mismatches.length) {
      console.warn(`${mismatches.length} bucket(s) where balance differs from the ledger:`);
      console.table(mismatches);
    } else {
      console.log('Every stock balance equals the sum of its movements.');
    }
  }
  await mongoose.disconnect();
} catch (error) {
  console.error(`Backfill failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
}
