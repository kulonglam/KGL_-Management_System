import Branch from '../models/Branch.js';
import Procurement from '../models/Procurement.js';
import { trustedQuery } from '../utils/listQuery.js';
import { roundUgx } from '../utils/money.js';
import { upsertJournalLines } from './journalPostingService.js';

const costPerKg = async (branch, produceName, produceType) => {
  const row = await Procurement.findOne({ branch, produceName, produceType, deletedAt: null })
    .sort({ createdAt: -1 })
    .select('costUgx tonnageKg')
    .lean();
  if (!row || !(row.tonnageKg > 0)) return 0;
  return Number(row.costUgx) / Number(row.tonnageKg);
};

// A transfer inside one company moves inventory and then eliminates to zero at group level.
const postSameCompanyTransfer = async (transfer) => {
  const branches = await Branch.find({
    name: trustedQuery({ $in: [transfer.fromBranch, transfer.toBranch] })
  })
    .select('name legalEntity')
    .lean();
  if (branches.length !== 2) return { posted: 0, examined: 0 };
  const [left, right] = branches;
  if (!left.legalEntity || String(left.legalEntity) !== String(right.legalEntity)) {
    return { posted: 0, examined: 0 };
  }

  const lines = [];
  for (const line of transfer.lines) {
    const amount = roundUgx((await costPerKg(transfer.fromBranch, line.produceName, line.produceType)) * line.tonnageKg);
    if (!amount) continue;
    const shared = {
      date: transfer.receivedAt || new Date(),
      eventType: 'intercompany_transfer',
      refType: 'transfer',
      refId: String(transfer._id),
      memo: `${line.produceName} ${transfer.fromBranch} to ${transfer.toBranch}`,
      currency: 'UGX',
      foreignAmount: 0,
      fxRateToUgx: 1
    };
    const key = `intercompany|${transfer._id}|${line.produceName}|${line.produceType}`;
    lines.push({
      ...shared,
      branch: transfer.toBranch,
      account: '1200',
      debitUgx: amount,
      creditUgx: 0,
      lineKey: `${key}|in`
    });
    lines.push({
      ...shared,
      branch: transfer.fromBranch,
      account: '1200',
      debitUgx: 0,
      creditUgx: amount,
      lineKey: `${key}|out`
    });
  }
  return upsertJournalLines(lines);
};

export { postSameCompanyTransfer };
