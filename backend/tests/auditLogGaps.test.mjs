import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import createApp from '../app.js';
import { getJwtClaimOptions } from '../config/security.js';
import AuditLog from '../models/AuditLog.js';
import PriceSetting from '../models/PriceSetting.js';
import User from '../models/User.js';

const installedMongod = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';
if (!process.env.MONGOMS_SYSTEM_BINARY && existsSync(installedMongod)) {
  process.env.MONGOMS_SYSTEM_BINARY = installedMongod;
  process.env.MONGOMS_SYSTEM_BINARY_VERSION_CHECK = 'false';
}

let memoryServer;

const signAccessToken = (user) =>
  jwt.sign(
    { id: String(user._id), tokenVersion: 0, typ: 'access', jti: `audit-${user.username}` },
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
  'a deleted sale keeps its audit facts, and a blank missing row still explains itself',
  { timeout: 60_000 },
  async () => {
    const app = createApp();
    const manager = await User.create({
      name: 'Audit Manager',
      username: 'audit-manager',
      password: 'not-used-for-this-request',
      role: 'manager',
      branch: 'Maganjo'
    });
    const otherManager = await User.create({
      name: 'Matugga Manager',
      username: 'audit-matugga',
      password: 'not-used-for-this-request',
      role: 'manager',
      branch: 'Matugga'
    });
    const agent = await User.create({
      name: 'Audit Agent',
      username: 'audit-agent',
      password: 'not-used-for-this-request',
      role: 'sales_agent',
      branch: 'Maganjo'
    });
    const token = signAccessToken(manager);

    await PriceSetting.create({
      branch: 'Maganjo',
      produceType: 'Grain Maize',
      priceUgx: 20000
    });
    const procurementResponse = await request(app)
      .post('/api/v1/procurement')
      .set('Authorization', `Bearer ${token}`)
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
    const procurementId = procurementResponse.body.data._id;

    const saleResponse = await request(app)
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        produceName: 'White Maize',
        produceType: 'Grain Maize',
        tonnageKg: 10,
        buyerName: 'Marys Restaurant',
        date: '2026-03-07',
        time: '10:00'
      });
    assert.equal(saleResponse.status, 201, JSON.stringify(saleResponse.body));
    const saleId = saleResponse.body.data._id;

    const deleteSale = await request(app)
      .delete(`/api/v1/sales/${saleId}`)
      .set('Authorization', `Bearer ${token}`);
    assert.equal(deleteSale.status, 200, JSON.stringify(deleteSale.body));

    const deleteProcurement = await request(app)
      .delete(`/api/v1/procurement/${procurementId}`)
      .set('Authorization', `Bearer ${token}`);
    assert.equal(deleteProcurement.status, 200, JSON.stringify(deleteProcurement.body));

    await AuditLog.create({
      actorName: 'Old Manager',
      actorRole: 'manager',
      action: 'create',
      entityType: 'sale',
      entityId: '507f1f77bcf86cd799439099',
      branch: 'Maganjo',
      metadata: {}
    });

    const logs = await request(app)
      .get('/api/v1/audit-logs')
      .query({ page: 1, limit: 20 })
      .set('Authorization', `Bearer ${token}`);
    assert.equal(logs.status, 200, JSON.stringify(logs.body));
    const items = logs.body.data.items;

    const saleRows = items.filter((item) => item.entityId === saleId);
    assert.equal(saleRows.length, 2);
    for (const row of saleRows) {
      assert.equal(row.metadata.produceName, 'White Maize');
      assert.equal(row.metadata.tonnageKg, 10);
      assert.equal(row.metadata.buyerName, 'Marys Restaurant');
      assert.equal(row.metadata.amountPaidUgx, 200000);
      assert.equal(row.detailsNote, undefined);
    }

    const procurementDelete = items.find(
      (item) => item.entityId === procurementId && item.action === 'delete'
    );
    assert.equal(procurementDelete.metadata.produceName, 'White Maize');
    assert.equal(procurementDelete.metadata.tonnageKg, 200);
    assert.equal(procurementDelete.metadata.costUgx, 2000000);
    assert.equal(procurementDelete.metadata.sellingPrice, 20000);
    assert.equal(procurementDelete.metadata.dealerName, 'Maganjo Farm');
    assert.equal(procurementDelete.detailsNote, undefined);

    const legacy = items.find((item) => item.entityId === '507f1f77bcf86cd799439099');
    assert.equal(legacy.detailsNote, 'The original record is no longer available.');

    const otherLogs = await request(app)
      .get('/api/v1/audit-logs')
      .query({ page: 1, limit: 20 })
      .set('Authorization', `Bearer ${signAccessToken(otherManager)}`);
    assert.equal(otherLogs.status, 200, JSON.stringify(otherLogs.body));
    assert.equal(
      otherLogs.body.data.items.some((item) => item.branch === 'Maganjo'),
      false
    );

    const agentLogs = await request(app)
      .get('/api/v1/audit-logs')
      .query({ page: 1, limit: 20 })
      .set('Authorization', `Bearer ${signAccessToken(agent)}`);
    assert.equal(agentLogs.status, 403, JSON.stringify(agentLogs.body));
  }
);
