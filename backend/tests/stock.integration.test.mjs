import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Use a locally installed mongod when present so the suite does not download an archive.
const installedMongod = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';
if (!process.env.MONGOMS_SYSTEM_BINARY && existsSync(installedMongod)) {
  process.env.MONGOMS_SYSTEM_BINARY = installedMongod;
  process.env.MONGOMS_SYSTEM_BINARY_VERSION_CHECK = 'false';
}

import createApp from '../app.js';
import { getJwtClaimOptions } from '../config/security.js';
import Procurement from '../models/Procurement.js';
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
});
