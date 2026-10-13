import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { configureMemoryServerBinary } from './support/mongoBinary.mjs';
import createApp from '../app.js';
import { getJwtClaimOptions } from '../config/security.js';
import CreditSale from '../models/CreditSale.js';
import Procurement from '../models/Procurement.js';
import Sale from '../models/Sale.js';
import TrustedBuyer from '../models/TrustedBuyer.js';
import User from '../models/User.js';

configureMemoryServerBinary();

let memoryServer;

const signAccessToken = (user) =>
  jwt.sign(
    { id: String(user._id), tokenVersion: 0, typ: 'access', jti: `dashboard-${user.username}` },
    process.env.JWT_SECRET,
    { expiresIn: '1h', ...getJwtClaimOptions() }
  );

before(
  async () => {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      process.env.JWT_SECRET = 'integration-test-jwt-secret-32chars-min';
    }
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());
    mongoose.set('sanitizeFilter', true);
  },
  { timeout: 120_000 }
);

after(async () => {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
});

test('dashboard summaries count every sale without paging', { timeout: 60_000 }, async () => {
  const app = createApp();
  const manager = await User.create({
    name: 'Kulong',
    username: 'kulong-dashboard',
    password: 'hashed-password',
    role: 'manager',
    branch: 'Maganjo'
  });
  const agent = await User.create({
    name: 'Wuol',
    username: 'wuol-dashboard',
    password: 'hashed-password',
    role: 'sales_agent',
    branch: 'Maganjo'
  });
  const director = await User.create({
    name: 'Mr Orban',
    username: 'orban-dashboard',
    password: 'hashed-password',
    role: 'director',
    canViewCrossBranchTotals: true
  });
  const buyer = await TrustedBuyer.create({
    name: 'Marys Restaurant',
    nationalId: 'CM123456789012',
    location: 'Maganjo',
    contact: '0700123456',
    branch: 'Maganjo',
    recordedBy: manager._id
  });

  const now = new Date();
  await Sale.insertMany(
    Array.from({ length: 201 }, () => ({
      produceName: 'Red Beans',
      produceType: 'Beans',
      tonnageKg: 1,
      amountPaidUgx: 10000,
      buyerName: 'Walk In',
      salesAgentName: 'Wuol',
      date: now,
      time: '10:00',
      branch: 'Maganjo',
      recordedBy: manager._id
    }))
  );
  await CreditSale.create({
    buyerName: 'Marys Restaurant',
    nationalId: 'CM123456789012',
    location: 'Maganjo',
    contact: '0700123456',
    amountDueUgx: 20000,
    amountPaidUgx: 5000,
    balanceUgx: 15000,
    salesAgentName: 'Wuol',
    dueDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    produceName: 'Red Beans',
    produceType: 'Beans',
    tonnageKg: 2,
    dateOfDispatch: now,
    branch: 'Maganjo',
    recordedBy: agent._id,
    trustedBuyer: buyer._id,
    isPaid: false
  });
  await Procurement.create({
    produceName: 'Red Beans',
    produceType: 'Beans',
    sourceType: 'company',
    dateReceived: now,
    timeReceived: '09:00',
    tonnageKg: 100,
    costUgx: 800000,
    dealerName: 'Maganjo Farm',
    dealerContact: '0700123456',
    branch: 'Maganjo',
    sellingPrice: 35000,
    recordedBy: manager._id
  });

  const managerResponse = await request(app)
    .get('/api/v1/sales/dashboard')
    .query({ period: 'weekly' })
    .set('Authorization', `Bearer ${signAccessToken(manager)}`);
  assert.equal(managerResponse.status, 200, JSON.stringify(managerResponse.body));
  assert.equal(managerResponse.body.data.stats.cashCount, 201);
  assert.equal(managerResponse.body.data.stats.cashSales, 2010000);
  assert.equal(managerResponse.body.data.stats.creditCount, 1);
  assert.equal(managerResponse.body.data.stats.creditSales, 20000);
  assert.equal(managerResponse.body.data.creditCollection.outstanding, 15000);
  assert.equal(managerResponse.body.data.stats.procurementCount, 1);
  assert.equal(managerResponse.body.data.topProducts[0].name, 'Red Beans');
  assert.equal(managerResponse.body.data.topProducts[0].totalKg, 203);

  const agentResponse = await request(app)
    .get('/api/v1/sales/agent-dashboard')
    .set('Authorization', `Bearer ${signAccessToken(agent)}`);
  assert.equal(agentResponse.status, 200, JSON.stringify(agentResponse.body));
  assert.equal(agentResponse.body.data.creditCount, 1);
  assert.equal(agentResponse.body.data.overdueCount, 1);
  assert.equal(agentResponse.body.data.cashCount, 0);

  const directorResponse = await request(app)
    .get('/api/v1/sales/aggregation')
    .query({ period: 'weekly', branch: 'Maganjo' })
    .set('Authorization', `Bearer ${signAccessToken(director)}`);
  assert.equal(directorResponse.status, 200, JSON.stringify(directorResponse.body));
  assert.equal(directorResponse.body.data.report.salesCount, 201);
  assert.equal(directorResponse.body.data.branchTotals.Maganjo.cash, 2010000);
});
