import os from 'node:os';
import crypto from 'node:crypto';
import InstancePresence from '../models/InstancePresence.js';
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

export { startInstancePresence, stopInstancePresence, listLiveInstances, beat };
