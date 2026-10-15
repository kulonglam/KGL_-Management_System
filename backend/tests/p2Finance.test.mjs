import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { configureMemoryServerBinary } from './support/mongoBinary.mjs';

configureMemoryServerBinary();

import createApp from '../app.js';
import { getJwtClaimOptions } from '../config/security.js';
import { setBranchCache } from '../config/branches.js';
import PriceSetting from '../models/PriceSetting.js';
import Procurement from '../models/Procurement.js';
import Sale from '../models/Sale.js';
import TaxInvoice from '../models/TaxInvoice.js';
import User from '../models/User.js';

let memoryServer;
let app;
let manager;
let director;
let managerToken;
let directorToken;
let saleId;

const dataOf = (response) => response.body?.data ?? response.body;

const signAccessToken = (user, jti) => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    process.env.JWT_SECRET = 'integration-test-jwt-secret-32chars-min';
  }
  return jwt.sign(
    { id: String(user._id), tokenVersion: 0, typ: 'access', jti },
    process.env.JWT_SECRET,
    { expiresIn: '1h', ...getJwtClaimOptions() }
  );
};

before(
  async () => {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      process.env.JWT_SECRET = 'integration-test-jwt-secret-32chars-min';
    }
    process.env.NODE_ENV = 'test';
    setBranchCache(['Maganjo', 'Matugga']);
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());
    app = createApp();

    const password = await bcrypt.hash('Karibu@2026!', 10);
    director = await User.create({
      name: 'P2 Director',
      username: 'dir_p2',
      password,
      role: 'director',
      canViewCrossBranchTotals: true
    });
    manager = await User.create({
      name: 'P2 Manager',
      username: 'mgr_p2',
      password,
      role: 'manager',
      branch: 'Maganjo'
    });
    directorToken = signAccessToken(director, 'p2-dir');
    managerToken = signAccessToken(manager, 'p2-mgr');

    await PriceSetting.create({
      branch: 'Maganjo',
      produceType: 'Beans',
      produceName: '',
      priceUgx: 10000
    });

    await Procurement.create({
      produceName: 'Red Beans',
      produceType: 'Beans',
      sourceType: 'company',
      dateReceived: new Date(),
      timeReceived: '09:00',
      tonnageKg: 5000,
      costUgx: 40000000,
      dealerName: 'Seed Supplier',
      dealerContact: '0700111222',
      branch: 'Maganjo',
      recordedBy: manager._id,
      sellingPrice: 10000
    });
  },
  { timeout: 120_000 }
);

after(async () => {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
});

test('cash sale stores payment method and issues tax invoice', { timeout: 60_000 }, async () => {
  const today = new Date().toISOString().slice(0, 10);
  const created = await request(app)
    .post('/api/v1/sales')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      produceName: 'Red Beans',
      produceType: 'Beans',
      tonnageKg: 2,
      buyerName: 'Cash Buyer',
      date: today,
      time: '10:15',
      paymentMethod: 'momo',
      tenderAmountUgx: 20000
    });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const sale = dataOf(created);
  assert.equal(sale.paymentMethod, 'momo');
  assert.equal(sale.tenderAmountUgx, 20000);
  assert.ok(sale.invoice?.invoiceNumber);
  assert.match(sale.invoice.invoiceNumber, /^INV-MAGANJO-\d{4}-\d{5}$/);
  saleId = sale._id;

  const stored = await Sale.findById(saleId).lean();
  assert.equal(stored.paymentMethod, 'momo');

  const invoice = await TaxInvoice.findOne({ sale: saleId, documentType: 'tax_invoice' }).lean();
  assert.ok(invoice);
  assert.equal(invoice.grossUgx, sale.amountPaidUgx);
});

test('cash-up close requires variance note when till mismatches', { timeout: 60_000 }, async () => {
  const today = new Date().toISOString().slice(0, 10);
  const opened = await request(app)
    .post('/api/v1/finance/cash-up/open')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({ businessDate: today, branch: 'Maganjo' });
  assert.equal(opened.status, 200, JSON.stringify(opened.body));
  const session = dataOf(opened);
  assert.equal(session.status, 'open');
  assert.ok(session.systemTotals.momoUgx >= 20000);

  const badClose = await request(app)
    .post(`/api/v1/finance/cash-up/${session._id}/close`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      countedTotals: { cashUgx: 0, momoUgx: 0, bankUgx: 0 },
      varianceNote: 'x'
    });
  assert.equal(badClose.status, 400);

  const closed = await request(app)
    .post(`/api/v1/finance/cash-up/${session._id}/close`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      countedTotals: {
        cashUgx: session.systemTotals.cashUgx,
        momoUgx: session.systemTotals.momoUgx,
        bankUgx: session.systemTotals.bankUgx
      }
    });
  assert.equal(closed.status, 200, JSON.stringify(closed.body));
  assert.equal(dataOf(closed).status, 'closed');
  assert.equal(dataOf(closed).varianceUgx, 0);
});

test('director can update tax config used by new invoices only', { timeout: 60_000 }, async () => {
  const updated = await request(app)
    .put('/api/v1/finance/tax-config')
    .set('Authorization', `Bearer ${directorToken}`)
    .send({ tin: '100200300', vatRatePercent: 18, companyName: 'Karibu Groceries LTD' });
  assert.equal(updated.status, 200);
  assert.equal(dataOf(updated).tin, '100200300');

  const forbidden = await request(app)
    .put('/api/v1/finance/tax-config')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({ tin: '999' });
  assert.equal(forbidden.status, 403);
});

test('GL export is balanced for the date range', { timeout: 60_000 }, async () => {
  const today = new Date().toISOString().slice(0, 10);
  const exported = await request(app)
    .get(`/api/v1/finance/gl-export?from=${today}&to=${today}`)
    .set('Authorization', `Bearer ${managerToken}`);
  assert.equal(exported.status, 200, JSON.stringify(exported.body));
  const payload = dataOf(exported);
  assert.ok(payload.lines.length > 0);
  assert.equal(payload.totals.balanced, true);
  assert.equal(payload.totals.debitUgx, payload.totals.creditUgx);
});

test('void sale creates credit note linked to original invoice', { timeout: 60_000 }, async () => {
  const voided = await request(app)
    .post(`/api/v1/sales/${saleId}/void`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({ reason: 'Customer returned the produce bags' });
  assert.equal(voided.status, 200, JSON.stringify(voided.body));
  const creditNote = dataOf(voided).creditNote;
  assert.ok(creditNote?.invoiceNumber);
  assert.equal(creditNote.documentType, 'credit_note');
  assert.ok(creditNote.grossUgx < 0);

  const original = await TaxInvoice.findOne({ sale: saleId, documentType: 'tax_invoice' }).lean();
  assert.equal(String(creditNote.relatedInvoice), String(original._id));
});

test('retention audit pack downloads as zip', { timeout: 60_000 }, async () => {
  const pack = await request(app)
    .get('/api/v1/finance/retention/audit-pack')
    .set('Authorization', `Bearer ${directorToken}`)
    .buffer(true)
    .parse((res, callback) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => callback(null, Buffer.concat(chunks)));
    });
  assert.equal(pack.status, 200);
  assert.match(String(pack.headers['content-type']), /zip/);
  const bytes = Buffer.isBuffer(pack.body) ? pack.body : Buffer.from(pack.body || []);
  assert.ok(bytes.length > 4);
  assert.equal(bytes.readUInt32LE(0), 0x04034b50);
});

test('retention job runs for director', { timeout: 60_000 }, async () => {
  const ran = await request(app)
    .post('/api/v1/finance/retention/run')
    .set('Authorization', `Bearer ${directorToken}`);
  assert.equal(ran.status, 200, JSON.stringify(ran.body));
  assert.ok(dataOf(ran).summary);
});
