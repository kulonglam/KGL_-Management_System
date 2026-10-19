import GlJournalLine from '../models/GlJournalLine.js';
import { ensureDefaultAccounts } from './glExportService.js';
import { upsertJournalLines } from './journalPostingService.js';
import { roundUgx } from '../utils/money.js';

const RETAINED_EARNINGS = '3000';

// Moves the remaining income and expense balances into retained earnings for the locked date.
const closePeriod = async ({ scope, lockedThrough }) => {
  if (!lockedThrough) return { posted: 0, examined: 0 };
  const accounts = await ensureDefaultAccounts();
  const closable = accounts.filter((account) => account.type === 'income' || account.type === 'expense');
  const codes = closable.map((account) => account.code);
  const end = new Date(`${lockedThrough}T23:59:59.999Z`);
  const refId = `${scope || 'ALL'}:${lockedThrough}`;
  const match = { account: { $in: codes }, date: { $lte: end }, refId: { $ne: refId } };
  if (scope && scope !== 'ALL') match.branch = scope;
  const rows = await GlJournalLine.aggregate([
    { $match: match },
    {
      $group: {
        _id: { branch: '$branch', account: '$account' },
        debitUgx: { $sum: '$debitUgx' },
        creditUgx: { $sum: '$creditUgx' }
      }
    }
  ]);

  await GlJournalLine.deleteMany({ eventType: 'period_close', refId });

  const lines = [];
  for (const row of rows) {
    const meta = closable.find((account) => account.code === row._id.account);
    if (!meta) continue;
    const natural = meta.type === 'income' ? row.creditUgx - row.debitUgx : row.debitUgx - row.creditUgx;
    const amount = roundUgx(Math.abs(natural));
    if (!amount) continue;
    const branch = row._id.branch || '';
    const key = `period_close|${refId}|${branch}|${meta.code}`;
    const shared = {
      date: end,
      branch,
      eventType: 'period_close',
      refType: 'period',
      refId,
      memo: `Close ${meta.name} through ${lockedThrough}`,
      currency: 'UGX',
      foreignAmount: 0,
      fxRateToUgx: 1
    };
    const incomeCredit = meta.type === 'income' ? natural > 0 : natural < 0;
    lines.push({
      ...shared,
      account: meta.code,
      debitUgx: incomeCredit ? amount : 0,
      creditUgx: incomeCredit ? 0 : amount,
      lineKey: `${key}|account`
    });
    lines.push({
      ...shared,
      account: RETAINED_EARNINGS,
      debitUgx: incomeCredit ? 0 : amount,
      creditUgx: incomeCredit ? amount : 0,
      lineKey: `${key}|retained`
    });
  }

  return upsertJournalLines(lines);
};

export { closePeriod };
