import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { sendSmtpEmail, sendSmsWebhook } from '../services/messageService.js';

test('sendSmsWebhook reports not configured when SMS_WEBHOOK_URL is empty', async () => {
  const previous = process.env.SMS_WEBHOOK_URL;
  process.env.SMS_WEBHOOK_URL = '';
  const result = await sendSmsWebhook({ to: '0700111222', subject: 'Hi', body: 'Test' });
  assert.equal(result.delivered, false);
  assert.equal(result.reason, 'sms_not_configured');
  process.env.SMS_WEBHOOK_URL = previous;
});

test('sendSmsWebhook posts JSON to the configured webhook', async () => {
  const previousUrl = process.env.SMS_WEBHOOK_URL;
  const previousToken = process.env.SMS_WEBHOOK_TOKEN;
  process.env.SMS_WEBHOOK_URL = 'https://sms.example.test/send';
  process.env.SMS_WEBHOOK_TOKEN = 'secret-token';

  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200 };
  };

  try {
    const result = await sendSmsWebhook({ to: '0700111222', subject: 'Due', body: 'Pay now' });
    assert.equal(result.delivered, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://sms.example.test/send');
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[0].options.headers.Authorization, 'Bearer secret-token');
    assert.match(calls[0].options.body, /0700111222/);
  } finally {
    globalThis.fetch = originalFetch;
    process.env.SMS_WEBHOOK_URL = previousUrl;
    process.env.SMS_WEBHOOK_TOKEN = previousToken;
  }
});

test('sendSmtpEmail delivers when an SMTP server is configured', async () => {
  const received = [];
  const server = net.createServer((socket) => {
    socket.write('220 ready\r\n');
    let buffer = '';
    let collecting = false;
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      if (collecting) {
        if (buffer.includes('\r\n.\r\n')) {
          received.push(buffer);
          collecting = false;
          buffer = '';
          socket.write('250 queued\r\n');
        }
        return;
      }
      const lines = buffer.split('\r\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('EHLO')) socket.write('250 hello\r\n');
        else if (line.startsWith('STARTTLS')) socket.write('454 tls unavailable\r\n');
        else if (line.startsWith('MAIL FROM')) socket.write('250 ok\r\n');
        else if (line.startsWith('RCPT TO')) socket.write('250 ok\r\n');
        else if (line === 'DATA') {
          collecting = true;
          socket.write('354 go\r\n');
        } else if (line === 'QUIT') socket.write('221 bye\r\n');
        else socket.write('250 ok\r\n');
      }
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const previous = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    from: process.env.SMTP_FROM,
    secure: process.env.SMTP_SECURE,
    user: process.env.SMTP_USER
  };
  process.env.SMTP_HOST = '127.0.0.1';
  process.env.SMTP_PORT = String(server.address().port);
  process.env.SMTP_FROM = 'books@karibu.test';
  process.env.SMTP_SECURE = 'false';
  delete process.env.SMTP_USER;
  try {
    const result = await sendSmtpEmail({ to: 'buyer@karibu.test', subject: 'Statement', body: 'Hello from KGL' });
    assert.equal(result.delivered, true);
    assert.equal(received.some((row) => row.includes('Hello from KGL')), true);
  } finally {
    server.close();
    process.env.SMTP_HOST = previous.host;
    process.env.SMTP_PORT = previous.port;
    process.env.SMTP_FROM = previous.from;
    process.env.SMTP_SECURE = previous.secure;
    if (previous.user === undefined) delete process.env.SMTP_USER;
    else process.env.SMTP_USER = previous.user;
  }
});
