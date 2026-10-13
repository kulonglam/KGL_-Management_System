import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import createApp from '../app.js';
import { getJwtClaimOptions } from '../config/security.js';
import CreditSale from '../models/CreditSale.js';
import MessageOutbox from '../models/MessageOutbox.js';
import PriceSetting from '../models/PriceSetting.js';
import TrustedBuyer from '../models/TrustedBuyer.js';
import User from '../models/User.js';
import { notifyOverdueCreditSales } from '../services/overdueCreditNotifier.js';

const installedMongod = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';
if (!process.env.MONGOMS_SYSTEM_BINARY && existsSync(installedMongod)) {
  process.env.MONGOMS_SYSTEM_BINARY = installedMongod;
  process.env.MONGOMS_SYSTEM_BINARY_VERSION_CHECK = 'false';
}

let memoryServer;

const signAccessToken = (user) =>
  jwt.sign(
    { id: String(user._id), tokenVersion: 0, typ: 'access', jti: `credit-${user.username}` },
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
  if (memoryServer) {
    await memoryServer.stop();
  }
});

test(
  'credit repayment refuses an over-balance payment, lists overdue sales, and notifies once',
  { timeout: 60_000 },
  async () => {
    const app = createApp();
    const manager = await User.create({
      name: 'Credit Manager',
      username: 'credit-manager',
      password: 'not-used-for-this-request',
      role: 'manager',
      branch: 'Maganjo'
    });
    const agent = await User.create({
      name: 'Credit Agent',
      username: 'credit-agent',
      password: 'not-used-for-this-request',
      role: 'sales_agent',
      branch: 'Maganjo'
    });
    const managerToken = signAccessToken(manager);
    const agentToken = signAccessToken(agent);

    await PriceSetting.create({
      branch: 'Maganjo',
      produceType: 'Grain Maize',
      priceUgx: 20000
    });
    const procurementResponse = await request(app)
      .post('/api/v1/procurement')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        produceName: 'White Maize',
        produceType: 'Grain Maize',
        sourceType: 'company',
        dateReceived: '2026-03-06',
        timeReceived: '09:00',
        tonnageKg: 200,
        costUgx: 2000000,
        dealerName: 'Maganjo Farm',
        dealerContact: '0700123456'
      });
    assert.equal(procurementResponse.status, 201, JSON.stringify(procurementResponse.body));

    const currentBuyer = await TrustedBuyer.create({
      name: 'Current Buyer',
      nationalId: 'CM900000000001',
      location: 'Maganjo',
      contact: '0700111222',
      branch: 'Maganjo',
      recordedBy: manager._id
    });
    const overdueBuyer = await TrustedBuyer.create({
      name: 'Overdue Buyer',
      nationalId: 'CM900000000002',
      location: 'Maganjo',
      contact: '0700111333',
      branch: 'Maganjo',
      recordedBy: manager._id
    });

    const currentSale = await request(app)
      .post('/api/v1/credit-sales')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        trustedBuyerId: String(currentBuyer._id),
        produceName: 'White Maize',
        produceType: 'Grain Maize',
        tonnageKg: 1,
        dueDate: '2099-06-01',
        dateOfDispatch: '2026-03-08'
      });
    assert.equal(currentSale.status, 201, JSON.stringify(currentSale.body));
    const currentId = currentSale.body.data._id;
    const amountDue = currentSale.body.data.balanceUgx;
    assert.equal(amountDue, 20000);

    const partial = await request(app)
      .post(`/api/v1/credit-sales/${currentId}/repay`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ amountUgx: 5000, paidAt: '2026-03-09T10:00:00.000Z' });
    assert.equal(partial.status, 200, JSON.stringify(partial.body));
    assert.equal(partial.body.data.balanceUgx, 15000);
    assert.equal(partial.body.data.isPaid, false);

    const overpay = await request(app)
      .post(`/api/v1/credit-sales/${currentId}/repay`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ amountUgx: 15001, paidAt: '2026-03-09T11:00:00.000Z' });
    assert.equal(overpay.status, 409, JSON.stringify(overpay.body));
    assert.match(overpay.body.error.message, /exceeds current balance/i);
    const unchanged = await CreditSale.findById(currentId).lean();
    assert.equal(unchanged.balanceUgx, 15000);
    assert.equal(unchanged.payments.length, 1);

    const payoff = await request(app)
      .post(`/api/v1/credit-sales/${currentId}/repay`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ amountUgx: 15000, paidAt: '2026-03-09T12:00:00.000Z' });
    assert.equal(payoff.status, 200, JSON.stringify(payoff.body));
    assert.equal(payoff.body.data.balanceUgx, 0);
    assert.equal(payoff.body.data.isPaid, true);

    const blockedDelete = await request(app)
      .delete(`/api/v1/credit-sales/${currentId}`)
      .set('Authorization', `Bearer ${managerToken}`);
    assert.equal(blockedDelete.status, 400, JSON.stringify(blockedDelete.body));
    assert.match(blockedDelete.body.error.message, /repayments/i);

    const overdueSale = await request(app)
      .post('/api/v1/credit-sales')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        trustedBuyerId: String(overdueBuyer._id),
        produceName: 'White Maize',
        produceType: 'Grain Maize',
        tonnageKg: 1,
        dueDate: '2020-01-01',
        dateOfDispatch: '2026-03-08'
      });
    assert.equal(overdueSale.status, 201, JSON.stringify(overdueSale.body));
    const overdueId = overdueSale.body.data._id;

    const agentRepay = await request(app)
      .post(`/api/v1/credit-sales/${overdueId}/repay`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ amountUgx: 1000, paidAt: '2026-03-10T10:00:00.000Z' });
    assert.equal(agentRepay.status, 403, JSON.stringify(agentRepay.body));

    const overdueList = await request(app)
      .get('/api/v1/credit-sales')
      .query({ status: 'overdue', page: 1, limit: 20 })
      .set('Authorization', `Bearer ${managerToken}`);
    assert.equal(overdueList.status, 200, JSON.stringify(overdueList.body));
    assert.deepEqual(
      overdueList.body.data.items.map((item) => item._id),
      [overdueId]
    );
    assert.equal(overdueList.body.data.summary.overdueCount, 1);
    assert.equal(overdueList.body.data.summary.paidCount, 1);
    assert.equal(overdueList.body.data.summary.outstandingCount, 0);
    assert.equal(overdueList.body.data.summary.outstandingBalance, 20000);

    const firstNotice = await notifyOverdueCreditSales();
    assert.equal(firstNotice.notified, 1);
    const noticed = await CreditSale.findById(overdueId).lean();
    assert.ok(noticed.lastOverdueNoticeAt);

    const messages = await MessageOutbox.find({ relatedId: String(overdueId) }).lean();
    assert.equal(messages.length, 2);
    assert.ok(messages.some((message) => message.channel === 'in_app' && message.to === 'credit-manager'));
    assert.ok(messages.some((message) => message.channel === 'sms' && message.to === '0700111333'));

    const secondNotice = await notifyOverdueCreditSales();
    assert.equal(secondNotice.notified, 0);
    const messagesAfter = await MessageOutbox.countDocuments({ relatedId: String(overdueId) });
    assert.equal(messagesAfter, 2);
  }
);
