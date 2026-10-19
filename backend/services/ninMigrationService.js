import TrustedBuyer from '../models/TrustedBuyer.js';
import CreditSale from '../models/CreditSale.js';
import {
  blindIndex,
  decryptField,
  encryptField,
  encryptWithMaster,
  indexWithMaster,
  isEncryptedValue,
  nationalIdLast4Hash,
  isFieldEncryptionEnabled,
  normalizeNin
} from '../utils/fieldEncryption.js';

const LEGACY_INDEX = 'nationalId_1_branch_1';

const migrateCollection = async (model, { dryRun }) => {
  const summary = { scanned: 0, updated: 0, undecryptable: 0 };
  const cursor = model.collection.find(
    { nationalId: { $type: 'string' } },
    { projection: { nationalId: 1, nationalIdHash: 1, nationalIdLast4Hash: 1 } }
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
    const last4Hash = nationalIdLast4Hash(normalized);
    const needsEncrypt = isFieldEncryptionEnabled() && !isEncryptedValue(row.nationalId);
    if (!needsEncrypt && row.nationalIdHash === hash && row.nationalIdLast4Hash === last4Hash) continue;
    summary.updated += 1;
    if (dryRun) continue;
    await model.collection.updateOne(
      { _id: row._id },
      {
        $set: {
          nationalId: needsEncrypt ? encryptField(normalized) : row.nationalId,
          nationalIdHash: hash,
          nationalIdLast4Hash: last4Hash
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

// Re-encrypt with NIN_ENCRYPTION_KEY_NEXT. Swap the env value to the new key only after this finishes.
const rotateNationalIds = async ({ dryRun = false } = {}) => {
  const nextKey = String(process.env.NIN_ENCRYPTION_KEY_NEXT || '').trim();
  if (!nextKey || !indexWithMaster('CM000000000000', nextKey)) {
    throw Object.assign(new Error('NIN_ENCRYPTION_KEY_NEXT must be a 32-byte key'), { statusCode: 400 });
  }
  const rotateCollection = async (model) => {
    const summary = { scanned: 0, rotated: 0, skipped: 0 };
    const cursor = model.collection.find({ nationalId: { $type: 'string' } }, { projection: { nationalId: 1 } });
    for await (const row of cursor) {
      summary.scanned += 1;
      const plain = decryptField(row.nationalId);
      if (!plain || isEncryptedValue(plain)) {
        summary.skipped += 1;
        continue;
      }
      summary.rotated += 1;
      if (dryRun) continue;
      await model.collection.updateOne(
        { _id: row._id },
        {
          $set: {
            nationalId: encryptWithMaster(normalizeNin(plain), nextKey),
            nationalIdHash: indexWithMaster(plain, nextKey),
            nationalIdLast4Hash: nationalIdLast4Hash(plain, nextKey)
          }
        }
      );
    }
    return summary;
  };
  return {
    trustedBuyers: await rotateCollection(TrustedBuyer),
    creditSales: await rotateCollection(CreditSale)
  };
};

export { migrateNationalIds, rotateNationalIds };
