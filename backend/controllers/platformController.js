import {
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  listDeliveries,
  redeliverWebhook,
  WEBHOOK_EVENTS,
  emitDomainEvent
} from '../services/webhookService.js';
import {
  getJobQueueStatus,
  listJobSchedules,
  enqueue,
  JOB_NAMES
} from '../services/jobQueueService.js';
import { getOidcStatus } from '../services/oidcService.js';
import {
  buildDirectorWeeklyReport,
  runDirectorWeeklyReport
} from '../services/scheduledReportService.js';
import { recordAudit } from '../services/auditService.js';
import { createApiKey, listApiKeys, revokeApiKey } from '../services/apiKeyService.js';
import { forwardControllerError } from '../utils/httpError.js';

const MANUAL_JOB_NAMES = [JOB_NAMES.OVERDUE_SCAN, JOB_NAMES.RETENTION_RUN, JOB_NAMES.WEEKLY_REPORT];

const auditPlatformAction = (req, action, entityType, entityId, metadata = {}) =>
  recordAudit({
    actor: req.user,
    action,
    entityType,
    entityId,
    branch: req.user.branch || '',
    metadata
  });

const getPlatformStatus = async (_req, res, next) => {
  try {
    res.json({
      jobs: getJobQueueStatus(),
      schedules: await listJobSchedules(),
      manualJobs: MANUAL_JOB_NAMES,
      oidc: getOidcStatus(),
      webhookEvents: WEBHOOK_EVENTS
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const listWebhooksHandler = async (_req, res, next) => {
  try {
    res.json(await listSubscriptions());
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const createWebhookHandler = async (req, res, next) => {
  try {
    const sub = await createSubscription({ actorUser: req.user, payload: req.body });
    await auditPlatformAction(req, 'create', 'webhookSubscription', sub._id, {
      name: sub.name,
      events: sub.events
    });
    res.status(201).json(sub);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const updateWebhookHandler = async (req, res, next) => {
  try {
    const sub = await updateSubscription({ subscriptionId: req.params.id, payload: req.body });
    await auditPlatformAction(req, 'update', 'webhookSubscription', sub._id, {
      isActive: sub.isActive,
      events: sub.events,
      rotatedSecret: Boolean(req.body.rotateSecret)
    });
    res.json(sub);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const deleteWebhookHandler = async (req, res, next) => {
  try {
    const result = await deleteSubscription(req.params.id);
    await auditPlatformAction(req, 'delete', 'webhookSubscription', req.params.id);
    res.json(result);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const listWebhookDeliveriesHandler = async (req, res, next) => {
  try {
    res.json(
      await listDeliveries({
        limit: req.query.limit || 100,
        status: req.query.status,
        subscriptionId: req.query.subscriptionId
      })
    );
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const redeliverWebhookHandler = async (req, res, next) => {
  try {
    const delivery = await redeliverWebhook(req.params.id);
    await auditPlatformAction(req, 'create', 'webhookDelivery', delivery._id, {
      redeliveryOf: req.params.id,
      event: delivery.event
    });
    res.status(202).json(delivery);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const enqueueJobHandler = async (req, res, next) => {
  try {
    const jobName = String(req.body.jobName || '').trim();
    if (!MANUAL_JOB_NAMES.includes(jobName)) {
      return res
        .status(400)
        .json({ message: `jobName must be one of: ${MANUAL_JOB_NAMES.join(', ')}` });
    }
    await auditPlatformAction(req, 'create', 'job', null, { jobName, trigger: 'manual' });
    const result = await enqueue(jobName, {}, { wait: true, attempts: 1 });
    res.status(202).json({ jobName, ...result });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const previewWeeklyReportHandler = async (_req, res, next) => {
  try {
    const report = await buildDirectorWeeklyReport();
    res.json({
      subject: report.subject,
      body: report.body,
      window: report.window,
      stats: report.stats,
      recipients: report.directors.map((director) => ({
        username: director.username,
        hasEmail: Boolean(String(director.email || '').trim())
      }))
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const runWeeklyReportHandler = async (req, res, next) => {
  try {
    const result = await runDirectorWeeklyReport();
    await auditPlatformAction(req, 'create', 'report', null, {
      report: JOB_NAMES.WEEKLY_REPORT,
      emailed: result.emailed
    });
    res.json(result);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const testWebhookEmitHandler = async (req, res, next) => {
  try {
    const event = String(req.body.event || 'sale.created');
    const result = await emitDomainEvent(event, {
      test: true,
      triggeredBy: req.user.username,
      ...(req.body.payload && typeof req.body.payload === 'object' ? req.body.payload : {})
    });
    res.json({ event, ...result });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const listApiKeysHandler = async (_req, res, next) => {
  try {
    res.json(await listApiKeys());
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const createApiKeyHandler = async (req, res, next) => {
  try {
    const { apiKey, plaintextKey } = await createApiKey({
      actorUser: req.user,
      name: req.body.name,
      scopes: req.body.scopes,
      branch: req.body.branch,
      expiresAt: req.body.expiresAt
    });
    await recordAudit({
      actor: req.user,
      action: 'create',
      entityType: 'apiKey',
      entityId: apiKey._id,
      branch: apiKey.branch,
      metadata: { name: apiKey.name, prefix: apiKey.prefix, scopes: apiKey.scopes, expiresAt: apiKey.expiresAt }
    });
    res.status(201).json({ ...apiKey, key: plaintextKey });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

const revokeApiKeyHandler = async (req, res, next) => {
  try {
    const apiKey = await revokeApiKey({ actorUser: req.user, id: req.params.id });
    await recordAudit({
      actor: req.user,
      action: 'delete',
      entityType: 'apiKey',
      entityId: apiKey._id,
      branch: apiKey.branch,
      metadata: { name: apiKey.name, prefix: apiKey.prefix, revoked: true }
    });
    res.json(apiKey);
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
};

export {
  listApiKeysHandler,
  createApiKeyHandler,
  revokeApiKeyHandler,
  getPlatformStatus,
  listWebhooksHandler,
  createWebhookHandler,
  updateWebhookHandler,
  deleteWebhookHandler,
  listWebhookDeliveriesHandler,
  redeliverWebhookHandler,
  enqueueJobHandler,
  previewWeeklyReportHandler,
  runWeeklyReportHandler,
  testWebhookEmitHandler
};
