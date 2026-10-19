import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { convertToUgx } from '../utils/currencyMath.js';
import { journalLineKey, linesForSale } from '../services/glExportService.js';
import { buildEmailSource } from '../services/messageService.js';
import { rehearseRestore } from '../services/databaseSnapshot.js';
import { netPayUgx, payeUgx } from '../utils/payrollMath.js';

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

test('foreign tender is stored on the cash side of the journal', () => {
  const mappings = new Map([
    ['cash_sale', { debitAccount: '1000', creditAccount: '4000' }]
  ]);
  const lines = linesForSale(
    {
      _id: 'sale1',
      paymentMethod: 'cash',
      amountPaidUgx: 37000,
      produceName: 'Beans',
      branch: 'Maganjo',
      date: '2026-10-19',
      currency: 'USD',
      foreignAmount: 10,
      fxRateToUgx: 3700
    },
    mappings,
    { vatRatePercent: 0 }
  );
  const debit = lines.find((line) => line.debitUgx > 0);
  assert.equal(debit.currency, 'USD');
  assert.equal(debit.foreignAmount, 10);
  assert.equal(debit.account, '1000');
});

test('a backup rehearsal rejects a snapshot that still has a password', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'kgl-drill-'));
  await writeFile(path.join(directory, 'User.json'), JSON.stringify([{ username: 'a', password: 'secret' }]));
  await writeFile(
    path.join(directory, 'manifest.json'),
    JSON.stringify({ collections: [{ model: 'User', file: 'User.json', count: 1 }] })
  );
  await assert.rejects(() => rehearseRestore(directory), /password/);
});

test('resident PAYE and NSSF follow the Uganda bands', () => {
  assert.equal(payeUgx(235000), 0);
  assert.equal(payeUgx(335000), 10000);
  assert.equal(payeUgx(410000), 25000);
  assert.equal(payeUgx(10000000), 2902000);
  assert.equal(payeUgx(10000001), 2902000);
  const pay = netPayUgx(1000000);
  assert.equal(pay.employeeUgx, 50000);
  assert.equal(pay.employerUgx, 100000);
  assert.equal(pay.payeUgx, 187000);
  assert.equal(pay.netUgx, 763000);
});
