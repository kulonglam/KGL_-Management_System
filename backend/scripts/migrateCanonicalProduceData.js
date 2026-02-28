import dotenv from 'dotenv';
import mongoose from 'mongoose';
import {
  normalizeProduceName,
  normalizeProduceNameKey,
  normalizeProduceType,
  normalizeSourceType
} from '../utils/produceNormalization.js';

dotenv.config();

// Build stable map key for branch + produce name.
const buildBranchNameKey = ({ branch, produceName }) =>
  `${String(branch || '').trim()}::${normalizeProduceNameKey(produceName)}`;

// Handle infer produce type from procurement map.
const inferProduceType = (branchTypeMap, { branch, produceName }) => {
  const key = buildBranchNameKey({ branch, produceName });
  const typeSet = branchTypeMap.get(key);
  if (!typeSet || typeSet.size !== 1) return '';
  return Array.from(typeSet)[0];
};

// Handle update statistics.
const updateStats = (stats, { scanned = 0, updated = 0, unresolved = 0 }) => {
  stats.scanned += scanned;
  stats.updated += updated;
  stats.unresolved += unresolved;
};

const migrateCanonicalProduceData = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const procurementCollection = mongoose.connection.collection('procurements');
  const salesCollection = mongoose.connection.collection('sales');
  const creditSalesCollection = mongoose.connection.collection('creditsales');
  const notificationsCollection = mongoose.connection.collection('stocknotifications');

  const stats = {
    procurement: { scanned: 0, updated: 0, unresolved: 0 },
    sales: { scanned: 0, updated: 0, unresolved: 0 },
    creditSales: { scanned: 0, updated: 0, unresolved: 0 },
    notifications: { scanned: 0, updated: 0, unresolved: 0 }
  };

  const branchTypeMap = new Map();

  // 1) Canonicalize procurement data and build lookup map for type inference.
  {
    const rows = await procurementCollection.find({}).toArray();
    const ops = [];

    rows.forEach((row) => {
      const produceName = normalizeProduceName(row.produceName || row.name || '');
      const produceType = normalizeProduceType(row.produceType || row.type || '');
      const sourceType = normalizeSourceType(row.sourceType);

      const requiresUpdate =
        row.produceName !== produceName ||
        row.produceType !== produceType ||
        row.sourceType !== sourceType;

      if (produceName && produceType) {
        const key = buildBranchNameKey({ branch: row.branch, produceName });
        if (!branchTypeMap.has(key)) branchTypeMap.set(key, new Set());
        branchTypeMap.get(key).add(produceType);
      } else {
        stats.procurement.unresolved += 1;
      }

      if (requiresUpdate) {
        ops.push({
          updateOne: {
            filter: { _id: row._id },
            update: {
              $set: {
                produceName,
                produceType,
                sourceType
              }
            }
          }
        });
      }
    });

    if (ops.length > 0) {
      await procurementCollection.bulkWrite(ops, { ordered: false });
    }

    updateStats(stats.procurement, {
      scanned: rows.length,
      updated: ops.length
    });
  }

  // 2) Canonicalize sales data and backfill missing produceType when unambiguous.
  {
    const rows = await salesCollection.find({}).toArray();
    const ops = [];

    rows.forEach((row) => {
      const produceName = normalizeProduceName(row.produceName || '');
      let produceType = normalizeProduceType(row.produceType || '');

      if (!produceType && produceName) {
        produceType = inferProduceType(branchTypeMap, {
          branch: row.branch,
          produceName
        });
        if (!produceType) {
          stats.sales.unresolved += 1;
        }
      }

      const requiresUpdate = row.produceName !== produceName || row.produceType !== produceType;
      if (requiresUpdate) {
        ops.push({
          updateOne: {
            filter: { _id: row._id },
            update: {
              $set: {
                produceName,
                ...(produceType ? { produceType } : {})
              }
            }
          }
        });
      }
    });

    if (ops.length > 0) {
      await salesCollection.bulkWrite(ops, { ordered: false });
    }

    updateStats(stats.sales, {
      scanned: rows.length,
      updated: ops.length
    });
  }

  // 3) Canonicalize credit sales data.
  {
    const rows = await creditSalesCollection.find({}).toArray();
    const ops = [];

    rows.forEach((row) => {
      const produceName = normalizeProduceName(row.produceName || '');
      const produceType = normalizeProduceType(row.produceType || '');
      if (!produceName || !produceType) {
        stats.creditSales.unresolved += 1;
      }

      if (row.produceName !== produceName || row.produceType !== produceType) {
        ops.push({
          updateOne: {
            filter: { _id: row._id },
            update: {
              $set: {
                produceName,
                produceType
              }
            }
          }
        });
      }
    });

    if (ops.length > 0) {
      await creditSalesCollection.bulkWrite(ops, { ordered: false });
    }

    updateStats(stats.creditSales, {
      scanned: rows.length,
      updated: ops.length
    });
  }

  // 4) Canonicalize stock notifications data.
  {
    const rows = await notificationsCollection.find({}).toArray();
    const ops = [];

    rows.forEach((row) => {
      const produceName = normalizeProduceName(row.produceName || '');
      const produceType = normalizeProduceType(row.produceType || '');
      if (!produceName || !produceType) {
        stats.notifications.unresolved += 1;
      }

      const message = `${produceName} (${produceType}) is out of stock in ${row.branch}.`;
      if (
        row.produceName !== produceName ||
        row.produceType !== produceType ||
        row.message !== message
      ) {
        ops.push({
          updateOne: {
            filter: { _id: row._id },
            update: {
              $set: {
                produceName,
                produceType,
                message
              }
            }
          }
        });
      }
    });

    if (ops.length > 0) {
      await notificationsCollection.bulkWrite(ops, { ordered: false });
    }

    updateStats(stats.notifications, {
      scanned: rows.length,
      updated: ops.length
    });
  }

  console.log('Canonical migration summary:');
  console.log(JSON.stringify(stats, null, 2));
};

try {
  await migrateCanonicalProduceData();
  process.exitCode = 0;
} catch (error) {
  console.error(`Canonical produce migration failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
