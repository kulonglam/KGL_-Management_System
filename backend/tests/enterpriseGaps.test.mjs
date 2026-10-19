import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
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
import User from '../models/User.js';
import Supplier from '../models/Supplier.js';
import StockLot from '../models/StockLot.js';
import Procurement from '../models/Procurement.js';
import PriceSetting from '../models/PriceSetting.js';
import { backupDatabase } from '../services/databaseSnapshot.js';
import { businessDateKey } from '../utils/businessTime.js';

let memoryServer;
let app;
let directorToken;
let managerToken;
let auditorToken;
let supplierId;

const dataOf = (response) => response.body?.data ?? response.body;
const sign = (user, jti) =>
  jwt.sign({ id: String(user._id), tokenVersion: 0, typ: 'access', jti }, process.env.JWT_SECRET, {
    expiresIn: '1h',
    ...getJwtClaimOptions()
  });

before(async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    process.env.JWT_SECRET = 'integration-test-jwt-secret-32chars-min';
  }
  process.env.NODE_ENV = 'test';
  process.env.NIN_ENCRYPTION_KEY = 'b'.repeat(64);
  mongoose.set('sanitizeFilter', true);
  setBranchCache(['Maganjo']);
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());
  app = createApp();
  const password = await bcrypt.hash('Karibu@2026!', 4);
  const director = await User.create({
    name: 'Gap Director',
    username: 'gap_dir',
    password,
    role: 'director',
    mfaSecret: 'should-not-export'
  });
  const manager = await User.create({
    name: 'Gap Manager',
    username: 'gap_mgr',
    password,
    role: 'manager',
    branch: 'Maganjo'
  });
  const auditor = await User.create({
    name: 'Gap Auditor',
    username: 'gap_aud',
    password,
    role: 'auditor',
    branch: 'Maganjo'
  });
  directorToken = sign(director, 'gap-dir');
  managerToken = sign(manager, 'gap-mgr');
  auditorToken = sign(auditor, 'gap-aud');
  const supplier = await Supplier.create({
    name: 'Gap Supplies',
    contact: '0700000001',
    sourceType: 'company',
    branch: 'Maganjo',
    recordedBy: manager._id
  });
  supplierId = String(supplier._id);
  await PriceSetting.create({ branch: 'Maganjo', produceType: 'Beans', produceName: '', priceUgx: 10000 });
  await Procurement.create({
    produceName: 'Red Beans',
    produceType: 'Beans',
    sourceType: 'company',
    dateReceived: new Date(),
    timeReceived: '09:00',
    tonnageKg: 2000,
    costUgx: 10000000,
    dealerName: 'Gap Supplies',
    dealerContact: '0700000001',
    branch: 'Maganjo',
    recordedBy: manager._id,
    sellingPrice: 10000
  });
}, { timeout: 120_000 });

after(async () => {
  mongoose.set('sanitizeFilter', false);
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
});

const as = (token) => (req) => req.set('Authorization', `Bearer ${token}`);

test('backup snapshot redacts secrets and includes the stock ledger', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'kgl-backup-'));
  const manifest = await backupDatabase(directory);
  const names = manifest.collections.map((entry) => entry.model);
  assert.ok(names.includes('StockMovement'));
  assert.ok(names.includes('TaxInvoice'));
  assert.ok(names.includes('PurchaseOrder'));
  const users = JSON.parse(await readFile(path.join(directory, 'User.json'), 'utf8'));
  assert.equal(users[0].password, '');
  assert.equal(users.find((user) => user.username === 'gap_dir').mfaSecret, '');
});

test('an auditor can read aging but cannot post the journal', async () => {
  const aging = await as(auditorToken)(request(app).get('/api/v1/finance/aging'));
  assert.equal(aging.status, 200, JSON.stringify(aging.body));
  assert.equal(dataOf(aging).totalUgx, 0);
  const post = await as(auditorToken)(request(app).post('/api/v1/finance/gl-journal')).send({
    from: '2026-10-01',
    to: businessDateKey()
  });
  assert.equal(post.status, 403);
});

test('purchase orders need a second approver and then match receipts', async () => {
  const created = await as(managerToken)(request(app).post('/api/v1/procurement/orders')).send({
    supplierId,
    lines: [{ produceName: 'Red Beans', produceType: 'Beans', orderedKg: 500, unitCostUgx: 8000 }]
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const order = dataOf(created);
  const selfApprove = await as(managerToken)(request(app).post(`/api/v1/procurement/orders/${order._id}/approve`));
  assert.equal(selfApprove.status, 403);
  const approved = await as(directorToken)(request(app).post(`/api/v1/procurement/orders/${order._id}/approve`));
  assert.equal(approved.status, 200, JSON.stringify(approved.body));
  const received = await as(managerToken)(request(app).post(`/api/v1/procurement/orders/${order._id}/receive`)).send({
    lines: [{ produceName: 'Red Beans', produceType: 'Beans', receivedKg: 500 }]
  });
  assert.equal(received.status, 200, JSON.stringify(received.body));
  const match = await as(auditorToken)(request(app).get(`/api/v1/procurement/orders/${order._id}/match`));
  assert.equal(match.status, 200, JSON.stringify(match.body));
  assert.equal(dataOf(match).lines[0].receivedKg, 500);
  assert.equal(dataOf(match).lines[0].invoicedKg, 500);
  assert.equal(dataOf(match).matched, true);
});

test('expired lots cannot be sold', async () => {
  await StockLot.updateMany({}, { $set: { expiryDate: new Date('2020-01-01T00:00:00.000Z') } });
  await StockLot.create({
    branch: 'Maganjo',
    produceName: 'Red Beans',
    produceType: 'Beans',
    lotCode: 'OLD',
    expiryDate: new Date('2020-01-01T00:00:00.000Z'),
    qtyKg: 10000
  });
  const sale = await as(managerToken)(request(app).post('/api/v1/sales')).send({
    produceName: 'Red Beans',
    produceType: 'Beans',
    tonnageKg: 10,
    buyerName: 'Lot Buyer',
    date: businessDateKey(),
    time: '10:00'
  });
  assert.equal(sale.status, 409, JSON.stringify(sale.body));
});
