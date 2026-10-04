import CreditSale from '../models/CreditSale.js';
import User from '../models/User.js';
import { queueMessage } from './messageService.js';
import { startOfToday, trustedQuery } from '../utils/listQuery.js';
import logger from '../utils/logger.js';

const NOTICE_COOLDOWN_MS = Number(process.env.OVERDUE_NOTICE_COOLDOWN_MS || 24 * 60 * 60 * 1000);
const SCAN_LIMIT = Number(process.env.OVERDUE_SCAN_LIMIT || 100);

const notifyOverdueCreditSales = async () => {
  const dueBefore = startOfToday();
  const staleBefore = new Date(Date.now() - NOTICE_COOLDOWN_MS);
  const overdueItems = await CreditSale.find({
    isPaid: false,
    balanceUgx: trustedQuery({ $gt: 0 }),
    dueDate: trustedQuery({ $lt: dueBefore }),
    $or: [
      { lastOverdueNoticeAt: null },
      { lastOverdueNoticeAt: trustedQuery({ $lte: staleBefore }) }
    ]
  })
    .sort({ dueDate: 1 })
    .limit(SCAN_LIMIT)
    .lean();

  if (overdueItems.length === 0) {
    return { notified: 0 };
  }

  const branchNames = [...new Set(overdueItems.map((item) => item.branch).filter(Boolean))];
  const managers = await User.find({
    role: 'manager',
    branch: trustedQuery({ $in: branchNames })
  })
    .select('username branch')
    .lean();

  let notified = 0;
  for (const item of overdueItems) {
    const balance = Math.round(Number(item.balanceUgx || 0));
    const body = `${item.buyerName} has an overdue balance of ${balance} UGX.`;
    const branchManagers = managers.filter((user) => user.branch === item.branch);

    await Promise.all([
      ...branchManagers.map((manager) =>
        queueMessage({
          channel: 'in_app',
          to: manager.username,
          subject: 'Overdue credit sale',
          body,
          relatedType: 'credit_sale',
          relatedId: item._id,
          branch: item.branch
        })
      ),
      item.contact
        ? queueMessage({
            channel: 'sms',
            to: item.contact,
            subject: 'Overdue credit sale',
            body,
            relatedType: 'credit_sale',
            relatedId: item._id,
            branch: item.branch
          })
        : Promise.resolve()
    ]);

    await CreditSale.updateOne({ _id: item._id }, { $set: { lastOverdueNoticeAt: new Date() } });
    notified += 1;
  }

  logger.info('credit.overdue.notified', { count: notified });
  return { notified };
};

const startOverdueCreditNotifier = () => {
  if (process.env.NODE_ENV === 'test') {
    return null;
  }
  const intervalMs = Number(process.env.OVERDUE_SCAN_INTERVAL_MS || 15 * 60 * 1000);
  const run = () => {
    notifyOverdueCreditSales().catch((error) => {
      logger.warn('credit.overdue.scan_failed', { message: error.message });
    });
  };
  run();
  const timer = setInterval(run, intervalMs);
  timer.unref?.();
  return timer;
};

const stopOverdueCreditNotifier = (timer) => {
  if (timer) {
    clearInterval(timer);
  }
};

export { notifyOverdueCreditSales, startOverdueCreditNotifier, stopOverdueCreditNotifier };
