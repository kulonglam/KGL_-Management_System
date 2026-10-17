import test from 'node:test';
import assert from 'node:assert/strict';
import { convertToUgx } from '../utils/currencyMath.js';
import { journalLineKey } from '../services/glExportService.js';
import { buildEmailSource } from '../services/messageService.js';

test('foreign money converts to whole Uganda shillings', () => {
  assert.equal(convertToUgx(10, 3700), 37000);
  assert.equal(convertToUgx(10.5, 3700), 38850);
  assert.throws(() => convertToUgx(-1, 3700), /non-negative/);
});

test('a journal line key stays the same for the same event', () => {
  const first = journalLineKey({
    eventType: 'cash_sale',
    refType: 'sale',
    refId: 'abc',
    keySuffix: 'net',
    side: 'debit',
    account: '1000'
  });
  const second = journalLineKey({
    eventType: 'cash_sale',
    refType: 'sale',
    refId: 'abc',
    keySuffix: 'net',
    side: 'debit',
    account: '1000'
  });
  assert.equal(first, second);
  assert.equal(first, 'cash_sale|sale|abc|net|debit|1000');
});

test('a statement email can carry a PDF attachment', () => {
  const source = buildEmailSource({
    from: 'books@karibu.test',
    to: 'buyer@example.com',
    subject: 'Statement',
    body: 'Please see the attached statement.',
    attachmentName: 'statement.pdf',
    attachmentBase64: Buffer.from('pdf').toString('base64')
  });
  assert.match(source, /multipart\/mixed/);
  assert.match(source, /application\/pdf/);
  assert.match(source, /filename="statement.pdf"/);
});
