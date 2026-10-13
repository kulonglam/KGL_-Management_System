import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { configureMemoryServerBinary } from './support/mongoBinary.mjs';
import createApp from '../app.js';
import { getJwtClaimOptions } from '../config/security.js';
import PriceHistory from '../models/PriceHistory.js';
import PriceSetting from '../models/PriceSetting.js';
import User from '../models/User.js';
import { APPEND_ONLY_MESSAGE } from '../utils/appendOnly.js';

configureMemoryServerBinary();

let memoryServer;

const signAccessToken = (user) =>
  jwt.sign(
    { id: String(user._id), tokenVersion: 0, typ: 'access', jti: `stock-price-${user.username}` },
    process.env.JWT_SECRET,
    { expiresIn: '1h', ...getJwtClaimOptions() }
  );

const stockKg = (body) => {
  const bucket = body.data.inventory.find(
    (item) => item.produceName === 'Soybeans' && item.branch === 'Maganjo'
  );
  return bucket ? bucket.totalTonnageKg : 0;
};

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

test(
  'procurement minimums, cash stock, and price history hold under the database',
  { timeout: 60_000 },
  async () => {
    const app = createApp();
    const manager = await User.create({
      name: 'Stock Manager',
      username: 'stock-price-manager',
      password: 'not-used-for-this-request',
      role: 'manager',
      branch: 'Maganjo'
    });
    const agent = await User.create({
      name: 'Stock Agent',
      username: 'stock-price-agent',
      password: 'not-used-for-this-request',
      role: 'sales_agent',
      branch: 'Maganjo'
    });
    const token = signAccessToken(manager);
    const agentToken = signAccessToken(agent);

    const price = await PriceSetting.create({
      branch: 'Maganjo',
      produceType: 'Soybeans',
      priceUgx: 20000
    });

    const agentProcurement = await request(app)
      .post('/api/v1/procurement')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({
        produceName: 'SoyBeans',
        produceType: 'Soybeans',
        sourceType: 'company',
        dateReceived: '2026-03-06',
        timeReceived: '09:00',
        tonnageKg: 200,
        costUgx: 2000000,
        dealerName: 'Maganjo Farm',
        dealerContact: '0700123456'
      });
    assert.equal(agentProcurement.status, 403, JSON.stringify(agentProcurement.body));

    const shortIndividual = await request(app)
      .post('/api/v1/procurement')
      .set('Authorization', `Bearer ${token}`)
      .send({
        produceName: 'SoyBeans',
        produceType: 'Soybeans',
        sourceType: 'individual',
        dateReceived: '2026-03-06',
        timeReceived: '09:00',
        tonnageKg: 500,
        costUgx: 2000000,
        dealerName: 'Farm Dealer',
        dealerContact: '0700123456'
      });
    assert.equal(shortIndividual.status, 400, JSON.stringify(shortIndividual.body));

    const procurement = await request(app)
      .post('/api/v1/procurement')
      .set('Authorization', `Bearer ${token}`)
      .send({
        produceName: 'SoyBeans',
        produceType: 'Soybeans',
        sourceType: 'company',
        dateReceived: '2026-03-06',
        timeReceived: '09:00',
        tonnageKg: 200,
        costUgx: 2000000,
        dealerName: 'Maganjo Farm',
        dealerContact: '0700123456'
      });
    assert.equal(procurement.status, 201, JSON.stringify(procurement.body));

    const readStock = async () => {
      const response = await request(app).get('/api/v1/inventory').set('Authorization', `Bearer ${token}`);
      assert.equal(response.status, 200, JSON.stringify(response.body));
      return stockKg(response.body);
    };
    assert.equal(await readStock(), 200);

    const oversell = await request(app)
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        produceName: 'SoyBeans',
        produceType: 'Soybeans',
        tonnageKg: 250,
        buyerName: 'Marys Restaurant',
        date: '2026-03-07',
        time: '10:00'
      });
    assert.equal(oversell.status, 400, JSON.stringify(oversell.body));
    assert.match(oversell.body.error.message, /Insufficient stock/);
    assert.equal(await readStock(), 200);

    const sale = await request(app)
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        produceName: 'SoyBeans',
        produceType: 'Soybeans',
        tonnageKg: 50,
        buyerName: 'Marys Restaurant',
        date: '2026-03-07',
        time: '10:00'
      });
    assert.equal(sale.status, 201, JSON.stringify(sale.body));
    assert.equal(sale.body.data.amountPaidUgx, 1000000);
    assert.equal(await readStock(), 150);

    const deleted = await request(app)
      .delete(`/api/v1/sales/${sale.body.data._id}`)
      .set('Authorization', `Bearer ${token}`);
    assert.equal(deleted.status, 200, JSON.stringify(deleted.body));
    assert.equal(await readStock(), 200);

    const priceUpdate = await request(app)
      .put(`/api/v1/prices/${price._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ priceUgx: 30000 });
    assert.equal(priceUpdate.status, 200, JSON.stringify(priceUpdate.body));

    const history = await request(app)
      .get(`/api/v1/prices/${price._id}/history`)
      .set('Authorization', `Bearer ${token}`);
    assert.equal(history.status, 200, JSON.stringify(history.body));
    const updateRow = history.body.data.find((entry) => entry.action === 'update');
    assert.equal(updateRow.previousPriceUgx, 20000);
    assert.equal(updateRow.nextPriceUgx, 30000);

    const repriced = await request(app)
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        produceName: 'SoyBeans',
        produceType: 'Soybeans',
        tonnageKg: 10,
        buyerName: 'Marys Restaurant',
        date: '2026-03-08',
        time: '11:00'
      });
    assert.equal(repriced.status, 201, JSON.stringify(repriced.body));
    assert.equal(repriced.body.data.amountPaidUgx, 300000);
    assert.equal(await readStock(), 190);

    const historyRow = await PriceHistory.findOne({ priceSettingId: price._id, action: 'update' });
    await assert.rejects(
      () => PriceHistory.updateOne({ _id: historyRow._id }, { $set: { nextPriceUgx: 45000 } }),
      new RegExp(APPEND_ONLY_MESSAGE)
    );
    await assert.rejects(
      () => PriceHistory.collection.updateOne({ _id: historyRow._id }, { $set: { nextPriceUgx: 45000 } }),
      new RegExp(APPEND_ONLY_MESSAGE)
    );
    const stored = await PriceHistory.findById(historyRow._id).lean();
    assert.equal(stored.nextPriceUgx, 30000);
  }
);
