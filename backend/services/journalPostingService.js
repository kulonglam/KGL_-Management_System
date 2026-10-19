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

const upsertJournalLines = async (lines, session) => {
  let posted = 0;
  const options = session ? { upsert: true, session } : { upsert: true };
  for (const line of lines) {
    if (!line.lineKey) continue;
    try {
      const result = await GlJournalLine.updateOne(
        { lineKey: line.lineKey },
        { $setOnInsert: { ...line, date: new Date(line.date) } },
        options
      );
      posted += result.upsertedCount || 0;
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }
  }
  return { posted, examined: lines.length };
};

const postDocumentJournal = async (refType, doc, session) => {
  const mappings = await ensureDefaultMappings();
  const tax = await getTaxConfig();
  if (refType === 'sale') return upsertJournalLines(linesForSale(doc, mappings, tax), session);
  if (refType === 'creditSale') return upsertJournalLines(linesForCredit(doc, mappings, tax), session);
  if (refType === 'procurement') return upsertJournalLines(linesForProcurement(doc, mappings), session);
  return { posted: 0, examined: 0 };
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

const deleteRefJournal = async (refType, refId) => {
  const result = await GlJournalLine.deleteMany({ refType, refId: String(refId) });
  return { deleted: result.deletedCount || 0 };
};

// Drop the previous lines, then book the document as it stands now.
const replaceRefJournal = async (refType, refId) => {
  await deleteRefJournal(refType, refId);
  return rememberJournal(refType, refId);
};

export { deleteRefJournal, postDocumentJournal, postRefJournal, rememberJournal, replaceRefJournal, upsertJournalLines };
