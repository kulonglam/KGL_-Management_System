import Procurement from '../models/Procurement.js';
import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';
import StockBalance from '../models/StockBalance.js';
import StockMovement from '../models/StockMovement.js';
import { appendStockMovement, sumMovementsByBucket } from './stockMovementService.js';
import { findOrCreateSupplier, normalizeSupplierName } from './supplierService.js';
import { normalizeLocalPhone } from '../utils/phoneNumber.js';
import { normalizeProduceName, normalizeProduceType } from '../utils/produceNormalization.js';
import { markBalancesDirty } from './stockBalanceService.js';

const BACKFILL_NOTE = 'Backfill: pre-ledger history';

const DOCUMENT_SOURCES = [
  { model: Procurement, kind: 'procurement', direction: 1 },
  { model: Sale, kind: 'sale', direction: -1 },
  { model: CreditSale, kind: 'credit', direction: -1 }
];

const bucketOf = (row) => ({
  branch: String(row.branch || '').trim(),
  produceName: String(normalizeProduceName(row.produceName || '') || '').trim(),
  produceType: String(normalizeProduceType(row.produceType || '') || '').trim()
});

const keyOf = (bucket) => `${bucket.branch}::${bucket.produceName}::${bucket.produceType}`;

const movementTypeFor = (kind, qtyKg) => {
  if (kind === 'procurement') return qtyKg > 0 ? 'procurement_in' : 'procurement_out';
  if (qtyKg > 0) return 'void_in';
  return kind === 'credit' ? 'credit_out' : 'sale_out';
};

// Link procurements that predate the supplier master to a Supplier row per branch/name/contact.
const backfillProcurementSuppliers = async ({ dryRun = false } = {}) => {
  const rows = await Procurement.collection
    .find(
      { supplier: null },
      { projection: { branch: 1, dealerName: 1, dealerContact: 1, sourceType: 1, recordedBy: 1 } }
    )
    .toArray();

  const groups = new Map();
  for (const row of rows) {
    const name = normalizeSupplierName(row.dealerName);
    const contact = normalizeLocalPhone(row.dealerContact);
    const key = `${row.branch}::${name.toLowerCase()}::${contact}`;
    const group = groups.get(key) || { branch: row.branch, name, contact, row, ids: [] };
    group.ids.push(row._id);
    groups.set(key, group);
  }

  const summary = { scanned: rows.length, suppliersLinked: 0, procurementsUpdated: 0, skipped: [] };
  for (const group of groups.values()) {
    if (dryRun) {
      summary.suppliersLinked += 1;
      summary.procurementsUpdated += group.ids.length;
      continue;
    }
    try {
      const supplier = await findOrCreateSupplier({
        branch: group.branch,
        name: group.name,
        contact: group.contact,
        sourceType: group.row.sourceType,
        recordedBy: group.row.recordedBy
      });
      const result = await Procurement.collection.updateMany(
        { _id: { $in: group.ids } },
        { $set: { supplier: supplier._id } }
      );
      summary.suppliersLinked += 1;
      summary.procurementsUpdated += result.modifiedCount;
    } catch (error) {
      summary.skipped.push({
        branch: group.branch,
        dealerName: group.name,
        procurements: group.ids.length,
        reason: error.message
      });
    }
  }
  return summary;
};

// Write the movement rows each procurement/sale/credit sale would have produced had the
// ledger existed. Differences are computed per bucket, so documents edited after the ledger
// went live only receive the missing opening amount.
const backfillDocumentMovements = async ({ dryRun = false } = {}) => {
  const summary = { scanned: 0, movementsWritten: 0, byKind: {} };

  for (const { model, kind, direction } of DOCUMENT_SOURCES) {
    const [documents, existing] = await Promise.all([
      model.collection
        .find(
          {},
          { projection: { branch: 1, produceName: 1, produceType: 1, tonnageKg: 1, deletedAt: 1 } }
        )
        .toArray(),
      StockMovement.aggregate([
        { $match: { refType: kind, refId: { $ne: null } } },
        {
          $group: {
            _id: {
              refId: '$refId',
              branch: '$branch',
              produceName: '$produceName',
              produceType: '$produceType'
            },
            qtyKg: { $sum: '$qtyKg' }
          }
        }
      ])
    ]);

    const recordedByDocument = new Map();
    for (const row of existing) {
      const id = String(row._id.refId);
      const buckets = recordedByDocument.get(id) || new Map();
      const bucket = bucketOf(row._id);
      const key = keyOf(bucket);
      const current = buckets.get(key) || { bucket, qtyKg: 0 };
      current.qtyKg += Number(row.qtyKg || 0);
      buckets.set(key, current);
      recordedByDocument.set(id, buckets);
    }

    let written = 0;
    for (const document of documents) {
      summary.scanned += 1;
      const expected = new Map();
      const tonnage = Number(document.tonnageKg || 0);
      if (!document.deletedAt && tonnage > 0) {
        const bucket = bucketOf(document);
        expected.set(keyOf(bucket), { bucket, qtyKg: direction * tonnage });
      }
      const recorded = recordedByDocument.get(String(document._id)) || new Map();
      const keys = new Set([...expected.keys(), ...recorded.keys()]);

      for (const key of keys) {
        const target = expected.get(key);
        const actual = recorded.get(key);
        const diff = Number(target?.qtyKg || 0) - Number(actual?.qtyKg || 0);
        if (Math.abs(diff) < 0.001) continue;
        const bucket = (target || actual).bucket;
        if (!bucket.branch || !bucket.produceName || !bucket.produceType) continue;
        written += 1;
        if (dryRun) continue;
        await appendStockMovement({
          type: movementTypeFor(kind, diff),
          ...bucket,
          qtyKg: diff,
          refType: kind,
          refId: document._id,
          note: BACKFILL_NOTE,
          applyBalance: false
        });
      }
    }
    summary.byKind[kind] = { documents: documents.length, movements: written };
    summary.movementsWritten += written;
  }
  if (!dryRun && summary.movementsWritten > 0) markBalancesDirty();
  return summary;
};

// Compare stored balances against the movement ledger; empty list means fully reconciled.
const findLedgerBalanceMismatches = async () => {
  const [sums, balances] = await Promise.all([sumMovementsByBucket(), StockBalance.find({}).lean()]);
  const ledger = new Map(sums.map((row) => [keyOf(bucketOf(row._id)), Number(row.qtyKg || 0)]));
  const mismatches = [];
  for (const balance of balances) {
    const key = keyOf(bucketOf(balance));
    const ledgerKg = ledger.get(key) || 0;
    ledger.delete(key);
    if (Math.abs(ledgerKg - Number(balance.onHandKg || 0)) >= 0.001) {
      mismatches.push({ ...bucketOf(balance), onHandKg: balance.onHandKg, ledgerKg });
    }
  }
  for (const [key, ledgerKg] of ledger) {
    if (Math.abs(ledgerKg) < 0.001) continue;
    const [branch, produceName, produceType] = key.split('::');
    mismatches.push({ branch, produceName, produceType, onHandKg: 0, ledgerKg });
  }
  return mismatches;
};

export { backfillDocumentMovements, backfillProcurementSuppliers, findLedgerBalanceMismatches };
