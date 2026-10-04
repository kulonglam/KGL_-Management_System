import test from 'node:test';
import assert from 'node:assert/strict';
import { sendSmsWebhook } from '../services/messageService.js';

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
