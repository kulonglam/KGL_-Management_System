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
import MessageOutbox from '../models/MessageOutbox.js';
import PriceSetting from '../models/PriceSetting.js';
import Procurement from '../models/Procurement.js';
import Sale from '../models/Sale.js';
import Supplier from '../models/Supplier.js';
import TrustedBuyer from '../models/TrustedBuyer.js';
import User from '../models/User.js';
import { queueMessage } from '../services/messageService.js';

let memoryServer;
let app;
let manager;
let managerToken;

const dataOf = (response) => response.body?.data ?? response.body;

const signAccessToken = (user) => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    process.env.JWT_SECRET = 'integration-test-jwt-secret-32chars-min';
  }
  return jwt.sign(
    { id: String(user._id), tokenVersion: 0, typ: 'access', jti: 'p0-features' },
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
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());
    app = createApp();

    manager = await User.create({
      name: 'P0 Manager',
      username: 'mgr_p0',
      password: await bcrypt.hash('Karibu@2026!', 10),
      role: 'manager',
      branch: 'Maganjo'
    });
    managerToken = signAccessToken(manager);

    await PriceSetting.create({
      branch: 'Maganjo',
      produceType: 'Beans',
      produceName: '',
      priceUgx: 12000
    });
    await PriceSetting.create({
      branch: 'Maganjo',
      produceType: 'Grain Maize',
      produceName: '',
      priceUgx: 15000
    });
  },
  { timeout: 120_000 }
);

after(async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
});

test('supplier master create and list', { timeout: 60_000 }, async () => {
  const created = await request(app)
    .post('/api/v1/suppliers')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({ name: 'Lam Traders', contact: '0700111222', sourceType: 'company' });
  assert.equal(created.status, 201);
  assert.equal(dataOf(created).name, 'Lam Traders');

  const listed = await request(app)
    .get('/api/v1/suppliers?page=1&limit=20')
    .set('Authorization', `Bearer ${managerToken}`);
  assert.equal(listed.status, 200);
  const payload = dataOf(listed);
  const rows = Array.isArray(payload) ? payload : payload.items;
  assert.ok(rows.some((row) => row.name === 'Lam Traders'));
});

test('procurement soft-delete and restore', { timeout: 60_000 }, async () => {
  const supplier = await Supplier.create({
    name: 'Central Grain',
    contact: '0700333444',
    sourceType: 'company',
    branch: 'Maganjo',
    recordedBy: manager._id
  });

  const created = await request(app)
    .post('/api/v1/procurement')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      produceName: 'Red Beans',
      produceType: 'Beans',
      sourceType: 'company',
      dateReceived: new Date().toISOString(),
      timeReceived: '10:00',
      tonnageKg: 2000,
      costUgx: 20000000,
      dealerName: supplier.name,
      dealerContact: supplier.contact,
      supplierId: String(supplier._id)
    });
  assert.equal(created.status, 201);
  const procurementId = dataOf(created)._id;
  assert.ok(procurementId);

  const removed = await request(app)
    .delete(`/api/v1/procurement/${procurementId}`)
    .set('Authorization', `Bearer ${managerToken}`);
  assert.equal(removed.status, 200);

  assert.equal(await Procurement.findById(procurementId), null);
  assert.ok(await Procurement.findOne({ _id: procurementId, deletedAt: { $ne: null } }));

  const restored = await request(app)
    .post(`/api/v1/procurement/${procurementId}/restore`)
    .set('Authorization', `Bearer ${managerToken}`);
  assert.equal(restored.status, 200);
  assert.equal(dataOf(restored).deletedAt, null);
});

test('cash sale void returns stock and blocks restore', { timeout: 60_000 }, async () => {
  await Procurement.create({
    produceName: 'Red Beans',
    produceType: 'Beans',
    sourceType: 'company',
    dateReceived: new Date(),
    timeReceived: '09:00',
    tonnageKg: 5000,
    costUgx: 50000000,
    dealerName: 'Central Grain',
    dealerContact: '0700333444',
    branch: 'Maganjo',
    sellingPrice: 12000,
    recordedBy: manager._id
  });

  const saleRes = await request(app)
    .post('/api/v1/sales')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      produceName: 'Red Beans',
      produceType: 'Beans',
      tonnageKg: 100,
      buyerName: 'Walk In Buyer',
      date: new Date().toISOString().slice(0, 10),
      time: '11:00'
    });
  assert.equal(saleRes.status, 201);
  const saleId = dataOf(saleRes)._id;

  const voided = await request(app)
    .post(`/api/v1/sales/${saleId}/void`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({ reason: 'Entered against wrong buyer' });
  assert.equal(voided.status, 200);

  const sale = await Sale.findOne({ _id: saleId, deletedAt: { $ne: null } });
  assert.ok(sale?.voidedAt);

  const restore = await request(app)
    .post(`/api/v1/sales/${saleId}/restore`)
    .set('Authorization', `Bearer ${managerToken}`);
  assert.equal(restore.status, 400);
});

test('credit limit blocks over-limit credit sale', { timeout: 60_000 }, async () => {
  const buyer = await TrustedBuyer.create({
    name: 'Limit Buyer',
    nationalId: 'CM123456789099',
    location: 'Kampala',
    contact: '0700555666',
    branch: 'Maganjo',
    recordedBy: manager._id,
    creditLimitUgx: 10000
  });

  await Procurement.create({
    produceName: 'White Maize',
    produceType: 'Grain Maize',
    sourceType: 'company',
    dateReceived: new Date(),
    timeReceived: '08:00',
    tonnageKg: 5000,
    costUgx: 40000000,
    dealerName: 'Central Grain',
    dealerContact: '0700333444',
    branch: 'Maganjo',
    sellingPrice: 15000,
    recordedBy: manager._id
  });

  const credit = await request(app)
    .post('/api/v1/credit-sales')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      trustedBuyerId: String(buyer._id),
      produceName: 'White Maize',
      produceType: 'Grain Maize',
      tonnageKg: 2,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      dateOfDispatch: new Date().toISOString().slice(0, 10)
    });
  assert.equal(credit.status, 409);
});

test('inbox lists and acknowledges in-app messages', { timeout: 60_000 }, async () => {
  await queueMessage({
    channel: 'in_app',
    to: manager.username,
    subject: 'Overdue credit sale',
    body: 'Buyer has an overdue balance.',
    relatedType: 'credit_sale',
    relatedId: new mongoose.Types.ObjectId().toString(),
    branch: 'Maganjo'
  });

  const listed = await request(app)
    .get('/api/v1/messages?unread=true&page=1&limit=20')
    .set('Authorization', `Bearer ${managerToken}`);
  assert.equal(listed.status, 200);
  const payload = dataOf(listed);
  const items = Array.isArray(payload) ? payload : payload.items;
  assert.ok(items.length >= 1);

  const messageId = items[0]._id;
  const marked = await request(app)
    .put(`/api/v1/messages/${messageId}/read`)
    .set('Authorization', `Bearer ${managerToken}`);
  assert.equal(marked.status, 200);

  const stored = await MessageOutbox.findById(messageId);
  assert.ok(stored.readAt);
});
