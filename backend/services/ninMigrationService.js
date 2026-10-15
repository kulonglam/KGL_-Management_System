import TrustedBuyer from '../models/TrustedBuyer.js';
import CreditSale from '../models/CreditSale.js';
import {
  blindIndex,
  decryptField,
  encryptField,
  isEncryptedValue,
  isFieldEncryptionEnabled,
  normalizeNin
} from '../utils/fieldEncryption.js';

const LEGACY_INDEX = 'nationalId_1_branch_1';

const migrateCollection = async (model, { dryRun }) => {
  const summary = { scanned: 0, updated: 0, undecryptable: 0 };
  const cursor = model.collection.find(
    { nationalId: { $type: 'string' } },
    { projection: { nationalId: 1, nationalIdHash: 1 } }
  );
  for await (const row of cursor) {
    summary.scanned += 1;
    const plain = decryptField(row.nationalId);
    if (isEncryptedValue(plain)) {
      summary.undecryptable += 1;
      continue;
    }
    const normalized = normalizeNin(plain);
    const hash = blindIndex(normalized);
    const needsEncrypt = isFieldEncryptionEnabled() && !isEncryptedValue(row.nationalId);
    if (!needsEncrypt && row.nationalIdHash === hash) continue;
    summary.updated += 1;
    if (dryRun) continue;
    await model.collection.updateOne(
      { _id: row._id },
      {
        $set: {
          nationalId: needsEncrypt ? encryptField(normalized) : row.nationalId,
          nationalIdHash: hash
        }
      }
    );
  }
  return summary;
};

// Encrypt plaintext NINs, (re)compute blind indexes, and swap the plaintext unique index
// for the hash-based one. Safe to re-run.
const migrateNationalIds = async ({ dryRun = false } = {}) => {
  const result = {
    encryptionEnabled: isFieldEncryptionEnabled(),
    trustedBuyers: await migrateCollection(TrustedBuyer, { dryRun }),
    creditSales: await migrateCollection(CreditSale, { dryRun }),
    droppedLegacyIndex: false
  };
  if (!dryRun) {
    const indexes = await TrustedBuyer.collection.indexes().catch(() => []);
    if (indexes.some((index) => index.name === LEGACY_INDEX)) {
      await TrustedBuyer.collection.dropIndex(LEGACY_INDEX);
      result.droppedLegacyIndex = true;
    }
    await TrustedBuyer.createIndexes();
    await CreditSale.createIndexes();
  }
  return result;
};

export { migrateNationalIds };
