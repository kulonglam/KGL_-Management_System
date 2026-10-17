import crypto from 'node:crypto';
import mongoose from 'mongoose';
import JobSchedule from '../models/JobSchedule.js';
import QueuedJob from '../models/QueuedJob.js';
import logger from '../utils/logger.js';

const handlers = new Map();
const inProcessQueue = [];
const retryTimers = new Set();
const recentJobs = [];
const RECENT_JOB_LIMIT = 50;
const DAY_MS = 24 * 60 * 60 * 1000;
let draining = false;
let redisMode = false;
let bullQueue = null;
let bullWorker = null;
let schedulerTimers = [];
let started = false;
let handlersReady = false;

const JOB_NAMES = {
  OVERDUE_SCAN: 'credit.overdue.scan',
  RETENTION_RUN: 'retention.run',
  WEEKLY_REPORT: 'reports.director.weekly',
  WEBHOOK_DELIVER: 'webhook.deliver',
  INVOICE_ISSUE: 'invoice.issue',
  JOURNAL_POST: 'journal.post'
};

const readNumberEnv = (name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value) || value < min || value > max) return fallback;
  return value;
};

const getRetryBaseMs = () => readNumberEnv('JOB_RETRY_BASE_MS', 2000, { min: 1 });

const defaultAttemptsFor = (jobName) =>
  jobName === JOB_NAMES.WEBHOOK_DELIVER
    ? readNumberEnv('WEBHOOK_MAX_ATTEMPTS', 5, { min: 1, max: 20 })
    : readNumberEnv('JOB_MAX_ATTEMPTS', 3, { min: 1, max: 20 });

// Schedules are evaluated against a persisted lastRunAt so restarts and multiple
// instances do not re-run jobs; weekly slots are expressed in UTC.
const getScheduleDefinitions = () => [
  {
    jobName: JOB_NAMES.OVERDUE_SCAN,
    kind: 'interval',
    intervalMs: readNumberEnv('OVERDUE_SCAN_INTERVAL_MS', 15 * 60 * 1000, { min: 1000 })
  },
  {
    jobName: JOB_NAMES.RETENTION_RUN,
    kind: 'weekly',
    utcDay: readNumberEnv('RETENTION_JOB_UTC_DAY', 0, { max: 6 }),
    utcHour: readNumberEnv('RETENTION_JOB_UTC_HOUR', 0, { max: 23 })
  },
  {
    jobName: JOB_NAMES.WEEKLY_REPORT,
    kind: 'weekly',
    utcDay: readNumberEnv('WEEKLY_REPORT_UTC_DAY', 1, { max: 6 }),
    utcHour: readNumberEnv('WEEKLY_REPORT_UTC_HOUR', 4, { max: 23 })
  }
];

const latestWeeklySlot = (now, utcDay, utcHour) => {
  const slot = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), utcHour, 0, 0, 0)
  );
  const dayDiff = (now.getUTCDay() - utcDay + 7) % 7;
  slot.setTime(slot.getTime() - dayDiff * DAY_MS);
  if (slot > now) slot.setTime(slot.getTime() - 7 * DAY_MS);
  return slot;
};

const nextRunAt = (definition, lastRunAt, now = new Date()) => {
  if (definition.kind === 'interval') {
    return lastRunAt ? new Date(new Date(lastRunAt).getTime() + definition.intervalMs) : now;
  }
  const latest = latestWeeklySlot(now, definition.utcDay, definition.utcHour);
  if (!lastRunAt || new Date(lastRunAt) < latest) return latest;
  return new Date(latest.getTime() + 7 * DAY_MS);
};

const isDue = (definition, lastRunAt, now) => nextRunAt(definition, lastRunAt, now) <= now;

const registerHandler = (jobName, handler) => {
  handlers.set(jobName, handler);
};

const recordJobHistory = (entry) => {
  recentJobs.unshift(entry);
  if (recentJobs.length > RECENT_JOB_LIMIT) recentJobs.length = RECENT_JOB_LIMIT;
};

const markScheduleOutcome = async (jobName, data, error) => {
  if (!data?.scheduledAt) return;
  try {
    await JobSchedule.updateOne(
      { jobName },
      error
        ? { $set: { lastStatus: 'failed', lastError: String(error.message || error).slice(0, 500) } }
        : { $set: { lastStatus: 'completed', lastError: '', lastCompletedAt: new Date() } }
    );
  } catch (updateError) {
    logger.warn('jobs.schedule_status_failed', { jobName, message: updateError.message });
  }
};

const executeJob = async (meta, data) => {
  const handler = handlers.get(meta.name);
  if (!handler) throw new Error(`No handler for job ${meta.name}`);
  const startedAt = new Date();
  logger.info('jobs.start', { jobName: meta.name, jobId: meta.id, attempt: meta.attempt, backend: meta.backend });
  try {
    const result = await handler(data || {}, meta);
    recordJobHistory({ ...meta, status: 'completed', startedAt, finishedAt: new Date(), error: '' });
    logger.info('jobs.complete', { jobName: meta.name, jobId: meta.id, backend: meta.backend });
    await markScheduleOutcome(meta.name, data, null);
    return result;
  } catch (error) {
    const finalAttempt = meta.attempt >= meta.maxAttempts;
    recordJobHistory({
      ...meta,
      status: finalAttempt ? 'failed' : 'retrying',
      startedAt,
      finishedAt: new Date(),
      error: String(error.message || error).slice(0, 300)
    });
    logger.warn('jobs.failed', {
      jobName: meta.name,
      jobId: meta.id,
      attempt: meta.attempt,
      finalAttempt,
      message: error.message,
      backend: meta.backend
    });
    if (finalAttempt) await markScheduleOutcome(meta.name, data, error);
    throw error;
  }
};

const scheduleRetry = (job) => {
  const delay = job.backoffMs * 2 ** (job.attempt - 1);
  const timer = setTimeout(() => {
    retryTimers.delete(timer);
    inProcessQueue.push({ ...job, attempt: job.attempt + 1 });
    drainInProcess().catch(() => {});
  }, delay);
  timer.unref?.();
  retryTimers.add(timer);
};

const drainInProcess = async () => {
  if (draining) return;
  draining = true;
  try {
    while (inProcessQueue.length > 0) {
      const job = inProcessQueue.shift();
      const meta = {
        id: job.id,
        name: job.name,
        attempt: job.attempt,
        maxAttempts: job.maxAttempts,
        backend: 'in_process'
      };
      try {
        const result = await executeJob(meta, job.data);
        await rememberJob(job, 'completed');
        job.resolve?.(result);
      } catch (error) {
        if (job.attempt < job.maxAttempts) {
          const delay = job.backoffMs * 2 ** (job.attempt - 1);
          await rememberJob({ ...job, attempt: job.attempt + 1 }, 'retrying', {
            runAfter: new Date(Date.now() + delay),
            lastError: error.message
          });
          scheduleRetry(job);
        } else {
          await rememberJob(job, 'failed', { lastError: error.message });
          job.reject?.(error);
        }
      }
    }
  } finally {
    draining = false;
  }
};

const rememberJob = async (job, status, extra = {}) => {
  if (mongoose.connection.readyState !== 1) return;
  try {
    await QueuedJob.updateOne(
      { jobId: job.id },
      {
        $set: {
          name: job.name,
          data: job.data || {},
          attempt: job.attempt,
          maxAttempts: job.maxAttempts,
          backoffMs: job.backoffMs,
          status,
          runAfter: extra.runAfter || new Date(),
          lastError: String(extra.lastError || '').slice(0, 500)
        }
      },
      { upsert: true }
    );
  } catch (error) {
    logger.warn('jobs.persist_failed', { jobId: job.id, message: error.message });
  }
};

const enqueueInProcess = (jobName, data = {}, options = {}) => {
  const id = options.jobId || crypto.randomUUID();
  let resolve;
  let reject;
  const done = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  inProcessQueue.push({
    id,
    name: jobName,
    data,
    maxAttempts: options.attempts || defaultAttemptsFor(jobName),
    backoffMs: options.backoffMs || getRetryBaseMs(),
    attempt: options.attempt || 1,
    resolve,
    reject
  });
  const queued = inProcessQueue[inProcessQueue.length - 1];
  rememberJob(queued, 'queued').catch(() => {});
  setImmediate(() => {
    drainInProcess().catch(() => {});
  });
  if (options.wait) {
    return done.then((result) => ({ id, result }));
  }
  done.catch(() => {});
  return Promise.resolve({ id });
};

const startRedisBackend = async () => {
  const redisUrl = String(process.env.REDIS_URL || '').trim();
  if (!redisUrl) return false;

  try {
    const { Queue, Worker } = await import('bullmq');
    const connection = { url: redisUrl };
    bullQueue = new Queue('kgl-platform', { connection });
    bullWorker = new Worker(
      'kgl-platform',
      async (job) =>
        executeJob(
          {
            id: String(job.id),
            name: job.name,
            attempt: Number(job.attemptsMade || 0) + 1,
            maxAttempts: Number(job.opts?.attempts || 1),
            backend: 'redis'
          },
          job.data
        ),
      { connection }
    );
    redisMode = true;
    logger.info('jobs.backend', { mode: 'redis' });
    return true;
  } catch (error) {
    logger.warn('jobs.redis_unavailable', { message: error.message });
    redisMode = false;
    bullQueue = null;
    bullWorker = null;
    return false;
  }
};

const registerDefaultHandlers = async () => {
  if (handlersReady) return;
  const { notifyOverdueCreditSales } = await import('./overdueCreditNotifier.js');
  const { runRetentionJob } = await import('./retentionService.js');
  const { deliverWebhookJob } = await import('./webhookService.js');
  const { runDirectorWeeklyReport } = await import('./scheduledReportService.js');

  registerHandler(JOB_NAMES.OVERDUE_SCAN, async () => notifyOverdueCreditSales());
  registerHandler(JOB_NAMES.RETENTION_RUN, async () => runRetentionJob({}));
  registerHandler(JOB_NAMES.WEBHOOK_DELIVER, async (data, meta) => deliverWebhookJob(data, meta));
  registerHandler(JOB_NAMES.WEEKLY_REPORT, async () => runDirectorWeeklyReport());
  registerHandler(JOB_NAMES.INVOICE_ISSUE, async (data) => {
    const { issueTaxInvoiceForSale } = await import('./invoiceService.js');
    const Sale = (await import('../models/Sale.js')).default;
    const User = (await import('../models/User.js')).default;
    const sale = await Sale.findById(data.saleId);
    const actorUser = await User.findById(data.actorId);
    if (!sale || !actorUser) return { skipped: true };
    return issueTaxInvoiceForSale({ actorUser, sale });
  });
  registerHandler(JOB_NAMES.JOURNAL_POST, async (data) => {
    const { postRefJournal } = await import('./journalPostingService.js');
    return postRefJournal(data.refType, data.refId);
  });
  handlersReady = true;
};

const enqueue = async (jobName, data = {}, options = {}) => {
  await registerDefaultHandlers();
  if (redisMode && bullQueue) {
    const job = await bullQueue.add(jobName, data, {
      jobId: options.jobId,
      attempts: options.attempts || defaultAttemptsFor(jobName),
      backoff: { type: 'exponential', delay: options.backoffMs || getRetryBaseMs() },
      removeOnComplete: 100,
      removeOnFail: 200
    });
    if (options.wait) {
      const { QueueEvents } = await import('bullmq');
      const events = new QueueEvents('kgl-platform', { connection: { url: process.env.REDIS_URL } });
      try {
        const result = await job.waitUntilFinished(events, options.waitTimeoutMs || 60000);
        return { id: String(job.id), result };
      } finally {
        await events.close();
      }
    }
    return { id: String(job.id) };
  }
  return enqueueInProcess(jobName, data, options);
};

const ensureScheduleDocument = async (definition, now) => {
  try {
    await JobSchedule.updateOne(
      { jobName: definition.jobName },
      // Weekly jobs start counting from deployment so a fresh install does not fire immediately.
      { $setOnInsert: { jobName: definition.jobName, lastRunAt: definition.kind === 'weekly' ? now : null } },
      { upsert: true }
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
  return JobSchedule.findOne({ jobName: definition.jobName }).lean();
};

const runSchedulerTick = async (now = new Date()) => {
  const enqueued = [];
  for (const definition of getScheduleDefinitions()) {
    try {
      const schedule = await ensureScheduleDocument(definition, now);
      if (!schedule || !isDue(definition, schedule.lastRunAt, now)) continue;
      const claimed = await JobSchedule.findOneAndUpdate(
        { _id: schedule._id, lastRunAt: schedule.lastRunAt },
        { $set: { lastRunAt: now, lastStatus: 'queued' }, $inc: { runCount: 1 } },
        { new: true }
      );
      if (!claimed) continue;
      await enqueue(definition.jobName, { scheduledAt: now.toISOString() });
      enqueued.push(definition.jobName);
    } catch (error) {
      logger.warn('jobs.schedule_tick_failed', { jobName: definition.jobName, message: error.message });
    }
  }
  return enqueued;
};

const startSchedulers = () => {
  if (process.env.NODE_ENV === 'test' || process.env.JOB_SCHEDULER_DISABLED === 'true') return;
  const tickMs = readNumberEnv('JOB_SCHEDULER_TICK_MS', 60 * 1000, { min: 1000 });
  const tick = () => {
    runSchedulerTick().catch((error) => {
      logger.warn('jobs.schedule_tick_failed', { message: error.message });
    });
  };
  const initial = setTimeout(tick, 5000);
  initial.unref?.();
  const timer = setInterval(tick, tickMs);
  timer.unref?.();
  schedulerTimers.push(initial, timer);
};

const startJobInfrastructure = async () => {
  if (started) return { mode: redisMode ? 'redis' : 'in_process' };
  await registerDefaultHandlers();
  const usedRedis = await startRedisBackend();
  if (!usedRedis) {
    logger.info('jobs.backend', { mode: 'in_process' });
    if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState === 1) {
      const due = await QueuedJob.find({
        status: { $in: ['queued', 'retrying'] },
        runAfter: { $lte: new Date() }
      })
        .limit(100)
        .lean();
      for (const doc of due) {
        enqueueInProcess(doc.name, doc.data, {
          jobId: doc.jobId,
          attempts: doc.maxAttempts,
          backoffMs: doc.backoffMs,
          attempt: doc.attempt
        });
      }
    }
  }
  startSchedulers();
  started = true;
  return { mode: redisMode ? 'redis' : 'in_process' };
};

const stopJobInfrastructure = async () => {
  for (const timer of schedulerTimers) {
    clearTimeout(timer);
    clearInterval(timer);
  }
  schedulerTimers = [];
  for (const timer of retryTimers) clearTimeout(timer);
  retryTimers.clear();
  if (bullWorker) {
    await bullWorker.close();
    bullWorker = null;
  }
  if (bullQueue) {
    await bullQueue.close();
    bullQueue = null;
  }
  redisMode = false;
  started = false;
};

const listJobSchedules = async (now = new Date()) => {
  const definitions = getScheduleDefinitions();
  const docs = await JobSchedule.find({
    jobName: { $in: definitions.map((definition) => definition.jobName) }
  }).lean();
  const byName = new Map(docs.map((doc) => [doc.jobName, doc]));
  return definitions.map((definition) => {
    const doc = byName.get(definition.jobName) || null;
    return {
      jobName: definition.jobName,
      kind: definition.kind,
      intervalMs: definition.intervalMs || null,
      utcDay: definition.utcDay ?? null,
      utcHour: definition.utcHour ?? null,
      lastRunAt: doc?.lastRunAt || null,
      lastCompletedAt: doc?.lastCompletedAt || null,
      lastStatus: doc?.lastStatus || 'never',
      lastError: doc?.lastError || '',
      runCount: doc?.runCount || 0,
      nextRunAt: doc ? nextRunAt(definition, doc.lastRunAt, now) : null
    };
  });
};

const getJobQueueStatus = () => ({
  started,
  mode: redisMode ? 'redis' : 'in_process',
  schedulerEnabled: process.env.NODE_ENV !== 'test' && process.env.JOB_SCHEDULER_DISABLED !== 'true',
  pendingInProcess: inProcessQueue.length,
  pendingRetries: retryTimers.size,
  handlers: [...handlers.keys()],
  recentJobs: recentJobs.slice(0, 20)
});

export {
  JOB_NAMES,
  registerHandler,
  enqueue,
  runSchedulerTick,
  listJobSchedules,
  nextRunAt,
  startJobInfrastructure,
  stopJobInfrastructure,
  getJobQueueStatus
};
