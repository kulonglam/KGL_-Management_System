import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import net from 'node:net';
import mongoose from 'mongoose';
import WebhookSubscription, { WEBHOOK_EVENTS } from '../models/WebhookSubscription.js';
import WebhookDelivery from '../models/WebhookDelivery.js';
import { isProduction } from '../config/security.js';
import logger from '../utils/logger.js';

const enqueueWebhookJob = async (data) => {
  const { enqueue, JOB_NAMES } = await import('./jobQueueService.js');
  return enqueue(JOB_NAMES.WEBHOOK_DELIVER, data);
};

const createServiceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const signPayload = (secret, body) =>
  crypto.createHmac('sha256', secret).update(body).digest('hex');

const blockedIpv4 = new net.BlockList();
[
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4]
].forEach(([address, prefix]) => blockedIpv4.addSubnet(address, prefix, 'ipv4'));

const blockedIpv6 = new net.BlockList();
[
  ['::', 128],
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8]
].forEach(([address, prefix]) => blockedIpv6.addSubnet(address, prefix, 'ipv6'));

const isPrivateAddress = (address) => {
  const value = String(address || '').toLowerCase();
  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return blockedIpv4.check(mapped[1], 'ipv4');
  const family = net.isIP(value);
  if (family === 4) return blockedIpv4.check(value, 'ipv4');
  if (family === 6) return blockedIpv6.check(value, 'ipv6');
  return true;
};

const allowPrivateTargets = () => {
  const flag = String(process.env.WEBHOOK_ALLOW_PRIVATE_TARGETS || '').toLowerCase();
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return !isProduction();
};

const requireHttpsTargets = () => {
  const flag = String(process.env.WEBHOOK_REQUIRE_HTTPS || '').toLowerCase();
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return isProduction();
};

// DNS is re-checked at delivery time as well, so a hostname that later resolves
// to an internal address is still refused.
const assertSafeWebhookTarget = async (targetUrl) => {
  let parsed;
  try {
    parsed = new URL(String(targetUrl || '').trim());
  } catch {
    throw createServiceError(400, 'targetUrl must be a valid URL');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw createServiceError(400, 'targetUrl must be an http(s) URL');
  }
  if (requireHttpsTargets() && parsed.protocol !== 'https:') {
    throw createServiceError(400, 'targetUrl must use https');
  }
  if (parsed.username || parsed.password) {
    throw createServiceError(400, 'targetUrl must not embed credentials');
  }
  if (allowPrivateTargets()) return parsed;

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '');
  let addresses;
  if (net.isIP(hostname)) {
    addresses = [hostname];
  } else {
    try {
      addresses = (await dns.lookup(hostname, { all: true, verbatim: true })).map((entry) => entry.address);
    } catch {
      throw createServiceError(400, 'targetUrl host could not be resolved');
    }
  }
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw createServiceError(400, 'targetUrl must resolve to a public address');
  }
  return parsed;
};

const toPublicSubscription = (subscription, { revealSecret = false } = {}) => {
  const raw =
    typeof subscription?.toObject === 'function' ? subscription.toObject() : { ...(subscription || {}) };
  const secret = String(raw.secret || '');
  delete raw.secret;
  return {
    ...raw,
    secretPreview: secret ? `${secret.slice(0, 4)}…${secret.slice(-2)}` : '',
    ...(revealSecret ? { secret } : {})
  };
};

const validateEvents = (events) => {
  if (!Array.isArray(events) || events.length === 0) {
    throw createServiceError(400, 'events must be a non-empty array');
  }
  if (!events.every((event) => WEBHOOK_EVENTS.includes(event))) {
    throw createServiceError(400, `events must be one of: ${WEBHOOK_EVENTS.join(', ')}`);
  }
  return [...new Set(events)];
};

const listSubscriptions = async () => {
  const rows = await WebhookSubscription.find({}).sort({ createdAt: -1 }).lean();
  return rows.map((row) => toPublicSubscription(row));
};

const createSubscription = async ({ actorUser, payload }) => {
  const name = String(payload.name || '').trim().slice(0, 120);
  const targetUrl = String(payload.targetUrl || '').trim();
  if (!name || !targetUrl) throw createServiceError(400, 'name and targetUrl are required');
  await assertSafeWebhookTarget(targetUrl);
  const events = validateEvents(payload.events === undefined ? ['sale.created'] : payload.events);
  const secret = String(payload.secret || '').trim() || crypto.randomBytes(24).toString('hex');

  const subscription = await WebhookSubscription.create({
    name,
    targetUrl,
    secret,
    events,
    isActive: payload.isActive !== false,
    createdBy: actorUser?._id || null
  });
  return toPublicSubscription(subscription, { revealSecret: true });
};

const updateSubscription = async ({ subscriptionId, payload }) => {
  const sub = await WebhookSubscription.findById(subscriptionId);
  if (!sub) throw createServiceError(404, 'Webhook subscription not found');
  if (payload.name !== undefined) sub.name = String(payload.name).trim().slice(0, 120);
  if (payload.targetUrl !== undefined) {
    const targetUrl = String(payload.targetUrl).trim();
    await assertSafeWebhookTarget(targetUrl);
    sub.targetUrl = targetUrl;
  }
  if (payload.events !== undefined) sub.events = validateEvents(payload.events);
  if (payload.isActive !== undefined) sub.isActive = Boolean(payload.isActive);
  const rotated = Boolean(payload.rotateSecret);
  if (rotated) sub.secret = crypto.randomBytes(24).toString('hex');
  await sub.save();
  return toPublicSubscription(sub, { revealSecret: rotated });
};

const deleteSubscription = async (subscriptionId) => {
  const sub = await WebhookSubscription.findByIdAndDelete(subscriptionId);
  if (!sub) throw createServiceError(404, 'Webhook subscription not found');
  return { deleted: true };
};

const emitDomainEvent = async (event, payload = {}) => {
  if (!WEBHOOK_EVENTS.includes(event)) {
    logger.warn('webhooks.unknown_event', { event });
    return { queued: 0 };
  }
  const subs = await WebhookSubscription.find({ isActive: true, events: event }).lean();
  let queued = 0;
  for (const sub of subs) {
    const delivery = await WebhookDelivery.create({
      subscription: sub._id,
      event,
      payload,
      status: 'queued'
    });
    await enqueueWebhookJob({
      deliveryId: String(delivery._id),
      subscriptionId: String(sub._id)
    });
    queued += 1;
  }
  return { queued };
};

const deliverWebhookJob = async ({ deliveryId }, meta = {}) => {
  const delivery = await WebhookDelivery.findById(deliveryId);
  if (!delivery) return { skipped: true };
  if (delivery.status === 'delivered') return { skipped: true, alreadyDelivered: true };
  const sub = await WebhookSubscription.findById(delivery.subscription);
  if (!sub || !sub.isActive) {
    delivery.status = 'failed';
    delivery.error = 'Subscription inactive or missing';
    await delivery.save();
    return { skipped: true };
  }

  const finalAttempt = Number(meta.attempt || 1) >= Number(meta.maxAttempts || 1);
  const body = JSON.stringify({
    id: String(delivery._id),
    event: delivery.event,
    createdAt: delivery.createdAt,
    data: delivery.payload
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = signPayload(sub.secret, `${timestamp}.${body}`);
  delivery.attemptCount += 1;

  const recordFailure = async (message) => {
    delivery.status = finalAttempt ? 'failed' : 'retrying';
    delivery.error = String(message).slice(0, 500);
    sub.lastError = delivery.error;
    await delivery.save();
    await sub.save();
  };

  try {
    await assertSafeWebhookTarget(sub.targetUrl);
    const response = await fetch(sub.targetUrl, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'KGL-Webhooks/1.0',
        'X-KGL-Event': delivery.event,
        'X-KGL-Signature': `sha256=${signature}`,
        'X-KGL-Delivery': String(delivery._id),
        'X-KGL-Timestamp': timestamp
      },
      body,
      signal: AbortSignal.timeout(Number(process.env.WEBHOOK_TIMEOUT_MS || 10000))
    });
    const text = await response.text().catch(() => '');
    delivery.statusCode = response.status;
    delivery.responseBody = String(text || '').slice(0, 1000);
    sub.lastStatusCode = response.status;
    sub.lastDeliveredAt = new Date();

    if (!response.ok) {
      const message = `HTTP ${response.status}`;
      await recordFailure(message);
      throw createServiceError(502, message);
    }
    delivery.status = 'delivered';
    delivery.deliveredAt = new Date();
    delivery.error = '';
    sub.lastError = '';
    await delivery.save();
    await sub.save();
    return { delivered: true, statusCode: response.status };
  } catch (error) {
    if (error.statusCode !== 502) await recordFailure(error.message || error);
    throw error;
  }
};

const redeliverWebhook = async (deliveryId) => {
  if (!mongoose.isValidObjectId(deliveryId)) throw createServiceError(400, 'Invalid delivery id');
  const original = await WebhookDelivery.findById(deliveryId).lean();
  if (!original) throw createServiceError(404, 'Webhook delivery not found');
  const sub = await WebhookSubscription.findById(original.subscription).lean();
  if (!sub) throw createServiceError(404, 'Webhook subscription not found');
  if (!sub.isActive) throw createServiceError(409, 'Webhook subscription is paused');
  const delivery = await WebhookDelivery.create({
    subscription: original.subscription,
    event: original.event,
    payload: original.payload,
    status: 'queued'
  });
  await enqueueWebhookJob({ deliveryId: String(delivery._id), subscriptionId: String(sub._id) });
  return delivery.toObject();
};

const listDeliveries = async ({ limit = 50, status, subscriptionId } = {}) => {
  const filter = {};
  if (status) filter.status = status;
  if (subscriptionId && mongoose.isValidObjectId(subscriptionId)) filter.subscription = subscriptionId;
  return WebhookDelivery.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(Number(limit) || 50, 1), 200))
    .populate('subscription', 'name targetUrl')
    .lean();
};

export {
  WEBHOOK_EVENTS,
  assertSafeWebhookTarget,
  isPrivateAddress,
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  emitDomainEvent,
  deliverWebhookJob,
  redeliverWebhook,
  listDeliveries,
  signPayload
};
