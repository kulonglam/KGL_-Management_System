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
import { APPEND_ONLY_MESSAGE } from '../utils/appendOnly.js';
import AuditLog from '../models/AuditLog.js';
import CreditSale from '../models/CreditSale.js';
import PriceHistory from '../models/PriceHistory.js';
import PriceSetting from '../models/PriceSetting.js';
import Procurement from '../models/Procurement.js';
import TrustedBuyer from '../models/TrustedBuyer.js';
import User from '../models/User.js';

const PROCURED_KG = 5000;
const SOLD_KG = 900;
const REMAINING_KG = PROCURED_KG - SOLD_KG;

let memoryServer;

const signAccessToken = (user) => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    process.env.JWT_SECRET = 'integration-test-jwt-secret-32chars-min';
  }

  return jwt.sign(
    { id: String(user._id), tokenVersion: 0, typ: 'access', jti: 'stock-integration' },
    process.env.JWT_SECRET,
    { expiresIn: '1h', ...getJwtClaimOptions() }
  );
};

before(
  async () => {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      process.env.JWT_SECRET = 'integration-test-jwt-secret-32chars-min';
    }
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());
  },
  { timeout: 120_000 }
);

after(async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
});

test('a recorded sale reduces the procurement stock bucket', { timeout: 60_000 }, async () => {
  const app = createApp();
  const manager = await User.create({
    name: 'Kulong',
    username: 'kulong-stock',
    password: 'not-used-for-this-request',
    role: 'manager',
    branch: 'Maganjo'
  });

  await Procurement.create({
    produceName: 'Red Beans',
    produceType: 'Beans',
    sourceType: 'company',
    dateReceived: new Date('2026-03-06T00:00:00.000Z'),
    timeReceived: '09:00',
    tonnageKg: PROCURED_KG,
    costUgx: 15000000,
    dealerName: 'Maganjo Farm',
    dealerContact: '0700123456',
    branch: 'Maganjo',
    sellingPrice: 35000,
    recordedBy: manager._id
  });

  const token = signAccessToken(manager);
  const saleResponse = await request(app)
    .post('/api/v1/sales')
    .set('Authorization', `Bearer ${token}`)
    .send({
      produceName: 'Red Beans',
      produceType: 'Beans',
      tonnageKg: SOLD_KG,
      buyerName: 'Marys Restaurant',
      date: '2026-03-07',
      time: '10:00'
    });

  assert.equal(saleResponse.status, 201, JSON.stringify(saleResponse.body));
  assert.equal(saleResponse.body.data.tonnageKg, SOLD_KG);

  const inventoryResponse = await request(app)
    .get('/api/v1/inventory')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(inventoryResponse.status, 200, JSON.stringify(inventoryResponse.body));
  const bucket = inventoryResponse.body.data.inventory.find(
    (item) => item.produceName === 'Red Beans' && item.branch === 'Maganjo'
  );
  assert.ok(bucket, 'Red Beans stock bucket should still exist after the sale');
  assert.equal(bucket.totalTonnageKg, REMAINING_KG);

  const auditResponse = await request(app)
    .get('/api/v1/audit-logs')
    .query({ page: 1, limit: 20 })
    .set('Authorization', `Bearer ${token}`);
  assert.equal(auditResponse.status, 200, JSON.stringify(auditResponse.body));
  const saleAudit = auditResponse.body.data.items.find(
    (item) => item.entityType === 'sale' && item.action === 'create'
  );
  assert.equal(saleAudit.metadata.tonnageKg, SOLD_KG);
  assert.equal(saleAudit.metadata.produceName, 'Red Beans');
});

const cookieHeader = (response) => {
  const raw = response.headers['set-cookie'];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.filter(Boolean).map((entry) => String(entry).split(';')[0]).join('; ');
};

test('login refresh, procurement, cash rejection, and credit repayment use the database', { timeout: 60_000 }, async () => {
  const app = createApp();
  const password = 'Karibu@2026!';
  const manager = await User.create({
    name: 'Amina',
    username: 'amina-flow',
    password: await bcrypt.hash(password, 4),
    role: 'manager',
    branch: 'Maganjo'
  });

  const loginResponse = await request(app)
    .post('/api/v1/auth/login')
    .send({ username: 'amina-flow', password });
  assert.equal(loginResponse.status, 200, JSON.stringify(loginResponse.body));
  assert.ok(loginResponse.body.data.token);

  const refreshResponse = await request(app)
    .post('/api/v1/auth/refresh')
    .set('Cookie', cookieHeader(loginResponse));
  assert.equal(refreshResponse.status, 200, JSON.stringify(refreshResponse.body));
  assert.ok(refreshResponse.body.data.token);
  const token = refreshResponse.body.data.token;

  const unknownSale = await request(app)
    .post('/api/v1/sales')
    .set('Authorization', `Bearer ${token}`)
    .send({
      produceName: 'Missing Produce',
      produceType: 'Soybeans',
      tonnageKg: 10,
      buyerName: 'Walk In Buyer',
      date: '2026-03-08',
      time: '11:00'
    });
  assert.equal(unknownSale.status, 400, JSON.stringify(unknownSale.body));

  await PriceSetting.create({
    branch: 'Maganjo',
    produceType: 'Cow peas',
    priceUgx: 20000
  });
  const procurementResponse = await request(app)
    .post('/api/v1/procurement')
    .set('Authorization', `Bearer ${token}`)
    .send({
      produceName: 'Cow Peas',
      produceType: 'Cow peas',
      sourceType: 'company',
      dateReceived: '2026-03-06',
      timeReceived: '09:00',
      tonnageKg: 1000,
      costUgx: 8000000,
      dealerName: 'Maganjo Farm',
      dealerContact: '0700123456'
    });
  assert.equal(procurementResponse.status, 201, JSON.stringify(procurementResponse.body));

  const stockResponse = await request(app)
    .get('/api/v1/inventory')
    .set('Authorization', `Bearer ${token}`);
  const cowPeas = stockResponse.body.data.inventory.find(
    (item) => item.produceName === 'Cow Peas' && item.branch === 'Maganjo'
  );
  assert.equal(cowPeas.totalTonnageKg, 1000);

  const buyer = await TrustedBuyer.create({
    name: 'Marys Restaurant',
    nationalId: 'CM123456789012',
    location: 'Maganjo',
    contact: '0700123456',
    branch: 'Maganjo',
    recordedBy: manager._id
  });
  const creditResponse = await request(app)
    .post('/api/v1/credit-sales')
    .set('Authorization', `Bearer ${token}`)
    .send({
      trustedBuyerId: String(buyer._id),
      produceName: 'Cow Peas',
      produceType: 'Cow peas',
      tonnageKg: 100,
      dueDate: '2026-04-01',
      dateOfDispatch: '2026-03-08'
    });
  assert.equal(creditResponse.status, 201, JSON.stringify(creditResponse.body));
  const creditId = creditResponse.body.data._id;
  const amountDue = creditResponse.body.data.balanceUgx;

  const repayResponse = await request(app)
    .post(`/api/v1/credit-sales/${creditId}/repay`)
    .set('Authorization', `Bearer ${token}`)
    .send({ amountUgx: 500000, paidAt: '2026-03-09T10:00:00.000Z' });
  assert.equal(repayResponse.status, 200, JSON.stringify(repayResponse.body));
  assert.equal(repayResponse.body.data.balanceUgx, amountDue - 500000);

  const stored = await CreditSale.findById(creditId).lean();
  assert.equal(stored.balanceUgx, amountDue - 500000);

  const history = await PriceHistory.create({
    branch: 'Maganjo',
    priceSettingId: new mongoose.Types.ObjectId(),
    action: 'create',
    nextProduceType: 'Cow peas',
    nextPriceUgx: 20000,
    changedBy: manager._id
  });
  await assert.rejects(
    () => PriceHistory.updateOne({ _id: history._id }, { $set: { nextPriceUgx: 25000 } }),
    new RegExp(APPEND_ONLY_MESSAGE)
  );
  await assert.rejects(
    () => AuditLog.deleteMany({}),
    new RegExp(APPEND_ONLY_MESSAGE)
  );
});
