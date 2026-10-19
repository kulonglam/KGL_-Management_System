import os from 'node:os';
import crypto from 'node:crypto';
import InstancePresence from '../models/InstancePresence.js';
import { LeaderLease } from '../models/operationsModels.js';
import { trustedQuery } from '../utils/listQuery.js';

const instanceId = crypto.randomUUID();
const startedAt = new Date();
let timer = null;

const beat = async () => {
  const now = new Date();
  await InstancePresence.updateOne(
    { instanceId },
    {
      $set: { pid: process.pid, hostname: os.hostname(), lastSeenAt: now },
      $setOnInsert: { instanceId, startedAt }
    },
    { upsert: true }
  );
};

const startInstancePresence = () => {
  if (timer || process.env.NODE_ENV === 'test') return;
  beat().catch(() => {});
  timer = setInterval(() => {
    beat().catch(() => {});
  }, 25000);
  timer.unref?.();
};

const stopInstancePresence = async () => {
  if (timer) clearInterval(timer);
  timer = null;
  if (process.env.NODE_ENV === 'test') return;
  await InstancePresence.deleteOne({ instanceId }).catch(() => {});
};

const listLiveInstances = async () => {
  const cutoff = new Date(Date.now() - 60000);
  return InstancePresence.find({ lastSeenAt: trustedQuery({ $gte: cutoff }) }).sort({ startedAt: 1 }).lean();
};

const claimLeadership = async (leaseMs = 90000) => {
  const now = new Date();
  const until = new Date(now.getTime() + leaseMs);
  try {
    const claimed = await LeaderLease.findOneAndUpdate(
      trustedQuery({
        key: 'scheduler',
        $or: [{ ownerId: instanceId }, { until: { $lte: now } }]
      }),
      { $set: { ownerId: instanceId, until, key: 'scheduler' } },
      { upsert: true, new: true }
    );
    return claimed?.ownerId === instanceId;
  } catch (error) {
    if (error?.code === 11000) return false;
    throw error;
  }
};

export { beat, claimLeadership, listLiveInstances, startInstancePresence, stopInstancePresence };
