import net from 'node:net';
import tls from 'node:tls';
import logger from '../utils/logger.js';
import { safeEquals } from '../config/security.js';
import MessageOutbox from '../models/MessageOutbox.js';

const readSmtpReply = (socket) =>
  new Promise((resolve, reject) => {
    let buffer = '';
    const onData = (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split(/\r?\n/).filter((line) => line.length > 0);
      const last = lines[lines.length - 1];
      if (last && /^\d{3} /.test(last)) {
        cleanup();
        resolve({ code: Number(last.slice(0, 3)), text: buffer });
      }
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const onTimeout = () => {
      cleanup();
      reject(new Error('SMTP timeout'));
    };
    const cleanup = () => {
      socket.off('data', onData);
      socket.off('error', onError);
      socket.off('timeout', onTimeout);
    };
    socket.on('data', onData);
    socket.once('error', onError);
    socket.once('timeout', onTimeout);
  });

const writeSmtp = async (socket, command) => {
  await new Promise((resolve, reject) => {
    socket.write(`${command}\r\n`, 'utf8', (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
  return readSmtpReply(socket);
};

const expectSmtp = (reply, allowed) => {
  if (!allowed.includes(reply.code)) {
    throw new Error(`SMTP ${reply.code}: ${String(reply.text || '').trim()}`);
  }
  return reply;
};

const upgradeToTls = (socket, host) =>
  new Promise((resolve, reject) => {
    const secure = tls.connect(
      { socket, host, servername: host, timeout: 8000 },
      () => resolve(secure)
    );
    secure.once('error', reject);
  });

const dotStuff = (value) =>
  String(value || '')
    .replace(/\r?\n/g, '\r\n')
    .split('\r\n')
    .map((line) => (line.startsWith('.') ? `.${line}` : line))
    .join('\r\n');

const wrapBase64 = (value) => String(value || '').replace(/\s+/g, '').replace(/.{1,76}/g, '$&\r\n');

const buildEmailSource = ({ from, to, subject, body, attachmentName = '', attachmentBase64 = '' }) => {
  const safeSubject = String(subject || '').replace(/[\r\n]+/g, ' ');
  const text = dotStuff(body);
  if (!attachmentBase64) {
    return `From: ${from}\r\nTo: ${to}\r\nSubject: ${safeSubject}\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${text}\r\n.`;
  }
  const boundary = `kgl_${Date.now()}`;
  const filename = String(attachmentName || 'statement.pdf').replace(/["\r\n]/g, '');
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${safeSubject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    text,
    '',
    `--${boundary}`,
    `Content-Type: application/pdf; name="${filename}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${filename}"`,
    '',
    wrapBase64(attachmentBase64).trimEnd(),
    '',
    `--${boundary}--`,
    '.'
  ].join('\r\n');
};

const sendSmtpEmail = async ({ to, subject, body, attachmentName = '', attachmentBase64 = '' }) => {
  const host = String(process.env.SMTP_HOST || '').trim();
  const from = String(process.env.SMTP_FROM || '').trim();
  if (!host || !from) {
    return { delivered: false, reason: 'smtp_not_configured' };
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
  const username = String(process.env.SMTP_USER || '').trim();
  const password = String(process.env.SMTP_PASS || '');
  const timeoutMs = Number(process.env.SMTP_TIMEOUT_MS || 8000);

  let socket;
  if (secure) {
    socket = tls.connect({ host, port, servername: host, timeout: timeoutMs });
    socket.setTimeout(timeoutMs);
    await new Promise((resolve, reject) => {
      socket.once('secureConnect', resolve);
      socket.once('error', reject);
      socket.once('timeout', () => reject(new Error('SMTP timeout')));
    });
  } else {
    socket = net.createConnection({ host, port });
    socket.setTimeout(timeoutMs);
    await new Promise((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('error', reject);
      socket.once('timeout', () => reject(new Error('SMTP timeout')));
    });
  }

  try {

    expectSmtp(await readSmtpReply(socket), [220]);
    expectSmtp(await writeSmtp(socket, `EHLO karibu-groceries`), [250]);

    if (!secure) {
      const startTlsReply = await writeSmtp(socket, 'STARTTLS');
      if (startTlsReply.code === 220) {
        socket = await upgradeToTls(socket, host);
        socket.setTimeout(timeoutMs);
        expectSmtp(await writeSmtp(socket, `EHLO karibu-groceries`), [250]);
      }
    }

    if (username) {
      expectSmtp(await writeSmtp(socket, 'AUTH LOGIN'), [334]);
      expectSmtp(await writeSmtp(socket, Buffer.from(username, 'utf8').toString('base64')), [334]);
      expectSmtp(await writeSmtp(socket, Buffer.from(password, 'utf8').toString('base64')), [235]);
    }

    expectSmtp(await writeSmtp(socket, `MAIL FROM:<${from}>`), [250]);
    expectSmtp(await writeSmtp(socket, `RCPT TO:<${to}>`), [250, 251]);
    expectSmtp(await writeSmtp(socket, 'DATA'), [354]);
    const payload = buildEmailSource({ from, to, subject, body, attachmentName, attachmentBase64 });
    expectSmtp(await writeSmtp(socket, payload), [250]);
    await writeSmtp(socket, 'QUIT');
    return { delivered: true };
  } finally {
    socket.end();
  }
};

const sendSmsWebhook = async ({ to, subject, body }) => {
  const url = String(process.env.SMS_WEBHOOK_URL || '').trim();
  if (!url) {
    return { delivered: false, reason: 'sms_not_configured' };
  }
  if (!/^https?:\/\//i.test(url)) {
    return { delivered: false, reason: 'sms_webhook_invalid' };
  }

  const headers = { 'Content-Type': 'application/json' };
  const token = String(process.env.SMS_WEBHOOK_TOKEN || '').trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ to, subject, body, channel: 'sms' })
  });

  if (!response.ok) {
    throw new Error(`SMS webhook HTTP ${response.status}`);
  }
  let providerMessageId = '';
  try {
    const payload = await response.json();
    providerMessageId = String(payload?.messageId || payload?.id || '');
  } catch {
    providerMessageId = '';
  }
  return { delivered: true, providerMessageId };
};

const queueMessage = async ({
  channel,
  to,
  subject = '',
  body,
  relatedType = '',
  relatedId = '',
  branch = '',
  recipientUserId = '',
  attachmentName = '',
  attachmentBase64 = ''
}) => {
  const message = await MessageOutbox.create({
    channel,
    to,
    subject,
    body,
    relatedType,
    relatedId: relatedId ? String(relatedId) : '',
    branch,
    status: 'queued',
    providerMessageId: '',
    attachmentName,
    attachmentBase64
  });
  if (recipientUserId) {
    const User = (await import('../models/User.js')).default;
    const recipient = await User.findById(recipientUserId).select('notifyEmail notifySms notifyInApp').lean();
    const allowed =
      !recipient ||
      (channel === 'email' && recipient.notifyEmail !== false) ||
      (channel === 'sms' && recipient.notifySms !== false) ||
      (channel === 'in_app' && recipient.notifyInApp !== false);
    if (!allowed) {
      message.status = 'failed';
      message.errorMessage = 'recipient_opted_out';
      await message.save();
      return message;
    }
  }

  return deliverOutboxMessage(message);
};

const deliverOutboxMessage = async (message) => {
  try {
    if (message.channel === 'email') {
      const result = await sendSmtpEmail({
        to: message.to,
        subject: message.subject,
        body: message.body,
        attachmentName: message.attachmentName,
        attachmentBase64: message.attachmentBase64
      });
      message.status = result.delivered ? 'sent' : 'queued';
      message.sentAt = result.delivered ? new Date() : null;
      message.errorMessage = result.delivered ? '' : result.reason || '';
    } else if (message.channel === 'sms') {
      const result = await sendSmsWebhook({ to: message.to, subject: message.subject, body: message.body });
      message.status = result.delivered ? 'sent' : 'queued';
      message.sentAt = result.delivered ? new Date() : null;
      message.providerMessageId = result.providerMessageId || '';
      message.errorMessage = result.delivered ? '' : result.reason || '';
    } else {
      message.status = 'sent';
      message.sentAt = new Date();
    }
    await message.save();
  } catch (error) {
    message.status = 'failed';
    message.errorMessage = error.message;
    await message.save();
    logger.warn('message.delivery.failed', { channel: message.channel, to: message.to, message: error.message });
  }

  return message;
};

const retryOutboxMessage = async (id) => {
  const message = await MessageOutbox.findById(id);
  if (!message) {
    const error = new Error('Message not found');
    error.statusCode = 404;
    throw error;
  }
  message.status = 'queued';
  message.errorMessage = '';
  return deliverOutboxMessage(message);
};

const recordDeliveryReceipt = async ({ providerMessageId, token }) => {
  const expected = String(process.env.SMS_RECEIPT_TOKEN || '').trim();
  if (!expected || !safeEquals(token, expected)) {
    const error = new Error('Not authorized');
    error.statusCode = 401;
    throw error;
  }
  const message = await MessageOutbox.findOne({ providerMessageId: String(providerMessageId || '') });
  if (!message) {
    const error = new Error('Message not found');
    error.statusCode = 404;
    throw error;
  }
  message.deliveredAt = new Date();
  message.status = 'sent';
  await message.save();
  return message.toObject();
};

const listOutbox = async ({ status, channel }) => {
  const filter = {};
  if (status) filter.status = status;
  if (channel) filter.channel = channel;
  return MessageOutbox.find(filter).select('-attachmentBase64').sort({ createdAt: -1 }).limit(200).lean();
};

export { buildEmailSource, listOutbox, queueMessage, recordDeliveryReceipt, retryOutboxMessage, sendSmtpEmail, sendSmsWebhook };
