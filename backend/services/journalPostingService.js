import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';
import Procurement from '../models/Procurement.js';
import GlJournalLine from '../models/GlJournalLine.js';
import { includeRemoved } from '../utils/softDelete.js';
import { getTaxConfig } from './taxConfigService.js';
import {
  ensureDefaultMappings,
  linesForSale,
  linesForCredit,
  linesForProcurement
} from './glExportService.js';

const upsertJournalLines = async (lines) => {
  let posted = 0;
  for (const line of lines) {
    if (!line.lineKey) continue;
    try {
      const result = await GlJournalLine.updateOne(
        { lineKey: line.lineKey },
        { $setOnInsert: { ...line, date: new Date(line.date) } },
        { upsert: true }
      );
      posted += result.upsertedCount || 0;
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }
  }
  return { posted, examined: lines.length };
};

const postRefJournal = async (refType, refId) => {
  const mappings = await ensureDefaultMappings();
  const tax = await getTaxConfig();
  if (refType === 'sale') {
    const sale = await Sale.findOne({ _id: refId, deletedAt: includeRemoved() }).lean();
    if (!sale) return { posted: 0, examined: 0 };
    return upsertJournalLines(linesForSale(sale, mappings, tax));
  }
  if (refType === 'creditSale') {
    const credit = await CreditSale.findById(refId).lean();
    if (!credit) return { posted: 0, examined: 0 };
    return upsertJournalLines(linesForCredit(credit, mappings, tax));
  }
  if (refType === 'procurement') {
    const row = await Procurement.findById(refId).lean();
    if (!row || row.deletedAt) return { posted: 0, examined: 0 };
    return upsertJournalLines(linesForProcurement(row, mappings));
  }
  return { posted: 0, examined: 0 };
};

// Books the document now. If that fails, the same posting is queued and the sale still stands.
const rememberJournal = async (refType, refId) => {
  try {
    return await postRefJournal(refType, refId);
  } catch (error) {
    const { enqueue, JOB_NAMES } = await import('./jobQueueService.js');
    await enqueue(JOB_NAMES.JOURNAL_POST, { refType, refId: String(refId) }).catch(() => {});
    return { posted: 0, deferred: true, message: error.message };
  }
};

export { postRefJournal, rememberJournal, upsertJournalLines };
