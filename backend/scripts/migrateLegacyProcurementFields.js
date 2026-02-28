import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const VALID_SOURCE_TYPES = new Set(['individual', 'company', 'kgl_farm']);

// Handle normalize source type.
const normalizeSourceType = (sourceType) => {
  if (sourceType === 'own_farm') return 'kgl_farm';
  return sourceType;
};

// Handle format unknown record warning.
const formatUnknownRecordWarning = ({ id, produceName, produceType, sourceType }) =>
  `[skip] ${id} unresolved fields produceName="${produceName}" produceType="${produceType}" sourceType="${sourceType}"`;

// Handle migrate legacy procurement fields.
const migrateLegacyProcurementFields = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const collection = mongoose.connection.collection('procurements');
  const procurements = await collection.find({}).sort({ createdAt: -1 }).toArray();
  let scanned = 0;
  let updated = 0;
  let skipped = 0;
  const operations = [];

  for (const procurement of procurements) {
    scanned += 1;

    const nextProduceName = procurement.produceName || procurement.name || '';
    const nextProduceType = procurement.produceType || procurement.type || '';
    const nextSourceType = normalizeSourceType(procurement.sourceType);

    if (
      !nextProduceName ||
      !nextProduceType ||
      !nextSourceType ||
      !VALID_SOURCE_TYPES.has(nextSourceType)
    ) {
      skipped += 1;
      console.warn(
        formatUnknownRecordWarning({
          id: procurement._id,
          produceName: nextProduceName,
          produceType: nextProduceType,
          sourceType: nextSourceType
        })
      );
      continue;
    }

    const requiresUpdate =
      procurement.produceName !== nextProduceName ||
      procurement.produceType !== nextProduceType ||
      procurement.sourceType !== nextSourceType;

    if (!requiresUpdate) {
      skipped += 1;
      continue;
    }

    operations.push({
      updateOne: {
        filter: { _id: procurement._id },
        update: {
          $set: {
            produceName: nextProduceName,
            produceType: nextProduceType,
            sourceType: nextSourceType
          }
        }
      }
    });
    updated += 1;
  }

  if (operations.length > 0) {
    await collection.bulkWrite(operations, { ordered: false });
  }

  console.log(`Scanned: ${scanned}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
};

try {
  await migrateLegacyProcurementFields();
  process.exitCode = 0;
} catch (error) {
  console.error(`Migration failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
