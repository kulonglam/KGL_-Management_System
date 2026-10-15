import PeriodLock from '../models/PeriodLock.js';
import { calendarDateKey } from '../utils/businessTime.js';
import { trustedQuery } from '../utils/listQuery.js';
import { getRegisteredBranches } from '../config/branches.js';

const ALL_SCOPE = 'ALL';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const createServiceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const listPeriodLocks = () => PeriodLock.find({}).sort({ scope: 1 }).populate('updatedBy', 'name').lean();

const effectiveLockDate = async (branch) => {
  const scopes = branch ? [ALL_SCOPE, branch] : [ALL_SCOPE];
  const locks = await PeriodLock.find({ scope: trustedQuery({ $in: scopes }) }).lean();
  return locks.reduce(
    (latest, lock) => (lock.lockedThrough && (!latest || lock.lockedThrough > latest) ? lock.lockedThrough : latest),
    null
  );
};

// Throws 423 when any of the given calendar dates falls inside a closed period for the branch.
const assertPeriodOpen = async ({ branch, dates = [] }) => {
  const keys = dates.map((value) => (value ? calendarDateKey(value) : null)).filter(Boolean);
  if (keys.length === 0) return;
  const lockedThrough = await effectiveLockDate(branch);
  if (!lockedThrough) return;
  const earliest = keys.sort()[0];
  if (earliest <= lockedThrough) {
    throw createServiceError(
      423,
      `The books are closed through ${lockedThrough}${branch ? ` for ${branch}` : ''}. Ask a director to reopen the period.`
    );
  }
};

const setPeriodLock = async ({ actorUser, scope, lockedThrough, note }) => {
  const resolvedScope = String(scope || ALL_SCOPE).trim();
  if (resolvedScope !== ALL_SCOPE && !getRegisteredBranches().includes(resolvedScope)) {
    throw createServiceError(400, 'scope must be ALL or a registered branch');
  }
  if (lockedThrough !== null && !ISO_DATE.test(String(lockedThrough || ''))) {
    throw createServiceError(400, 'lockedThrough must be YYYY-MM-DD or null to reopen');
  }
  const previous = await PeriodLock.findOne({ scope: resolvedScope }).lean();
  const lock = await PeriodLock.findOneAndUpdate(
    { scope: resolvedScope },
    {
      $set: {
        lockedThrough: lockedThrough || null,
        note: String(note || '').trim().slice(0, 500),
        updatedBy: actorUser._id
      }
    },
    { upsert: true, new: true, runValidators: true }
  ).lean();
  return { lock, previousLockedThrough: previous?.lockedThrough || null };
};

export { ALL_SCOPE, assertPeriodOpen, effectiveLockDate, listPeriodLocks, setPeriodLock };
