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
import PriceSetting from '../models/PriceSetting.js';
import Procurement from '../models/Procurement.js';
import StockBalance from '../models/StockBalance.js';
import StockMovement from '../models/StockMovement.js';
import User from '../models/User.js';
import { setBranchCache } from '../config/branches.js';

let memoryServer;
let app;
let maganjoManager;
let matuggaManager;
let maganjoToken;
let matuggaToken;

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
    process.env.ADJUST_APPROVAL_KG = '500';
    setBranchCache(['Maganjo', 'Matugga']);
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());
    app = createApp();

    const password = await bcrypt.hash('Karibu@2026!', 10);
    maganjoManager = await User.create({
      name: 'P1 Maganjo Manager',
      username: 'mgr_p1_mag',
      password,
      role: 'manager',
      branch: 'Maganjo'
    });
    matuggaManager = await User.create({
      name: 'P1 Matugga Manager',
      username: 'mgr_p1_mat',
      password,
      role: 'manager',
      branch: 'Matugga'
    });
    maganjoToken = signAccessToken(maganjoManager, 'p1-mag');
    matuggaToken = signAccessToken(matuggaManager, 'p1-mat');

    await PriceSetting.create({
      branch: 'Maganjo',
      produceType: 'Beans',
      produceName: '',
      priceUgx: 12000
    });

    await Procurement.create({
      produceName: 'Red Beans',
      produceType: 'Beans',
      sourceType: 'company',
      dateReceived: new Date(),
      timeReceived: '09:00',
      tonnageKg: 5000,
      costUgx: 50000000,
      dealerName: 'Seed Supplier',
      dealerContact: '0700111222',
      branch: 'Maganjo',
      recordedBy: maganjoManager._id,
      sellingPrice: 12000
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

test('adjustment writes ledger and updates on-hand', { timeout: 60_000 }, async () => {
  const before = await StockBalance.findOne({
    branch: 'Maganjo',
    produceName: 'Red Beans',
    produceType: 'Beans'
  }).lean();
  assert.ok(before);
  const beforeKg = Number(before.onHandKg);

  const created = await request(app)
    .post('/api/v1/inventory/adjustments')
    .set('Authorization', `Bearer ${maganjoToken}`)
    .send({
      produceName: 'Red Beans',
      produceType: 'Beans',
      deltaKg: -50,
      reasonCode: 'damage',
      note: 'Damp bags discarded after inspection'
    });
  assert.equal(created.status, 201);
  assert.equal(dataOf(created).status, 'applied');

  const after = await StockBalance.findOne({
    branch: 'Maganjo',
    produceName: 'Red Beans',
    produceType: 'Beans'
  }).lean();
  assert.equal(Number(after.onHandKg), beforeKg - 50);

  const movement = await StockMovement.findOne({
    type: 'adjustment',
    refId: dataOf(created)._id
  }).lean();
  assert.ok(movement);
  assert.equal(movement.qtyKg, -50);
});

test('large adjustment requires second-party approval', { timeout: 60_000 }, async () => {
  const pending = await request(app)
    .post('/api/v1/inventory/adjustments')
    .set('Authorization', `Bearer ${maganjoToken}`)
    .send({
      produceName: 'Red Beans',
      produceType: 'Beans',
      deltaKg: -600,
      reasonCode: 'shrinkage',
      note: 'Warehouse variance pending dual control'
    });
  assert.equal(pending.status, 201);
  assert.equal(dataOf(pending).status, 'pending');

  const selfApprove = await request(app)
    .post(`/api/v1/inventory/adjustments/${dataOf(pending)._id}/approve`)
    .set('Authorization', `Bearer ${maganjoToken}`);
  assert.equal(selfApprove.status, 403);

  // Same-branch second manager for maker-checker.
  const approver = await User.create({
    name: 'P1 Approver',
    username: 'mgr_p1_appr',
    password: await bcrypt.hash('Karibu@2026!', 10),
    role: 'manager',
    branch: 'Maganjo'
  });
  const approverToken = signAccessToken(approver, 'p1-appr');

  const approved = await request(app)
    .post(`/api/v1/inventory/adjustments/${dataOf(pending)._id}/approve`)
    .set('Authorization', `Bearer ${approverToken}`);
  assert.equal(approved.status, 200);
  assert.equal(dataOf(approved).status, 'applied');
});

test('transfer ship and receive move stock across branches', { timeout: 60_000 }, async () => {
  const draft = await request(app)
    .post('/api/v1/inventory/transfers')
    .set('Authorization', `Bearer ${maganjoToken}`)
    .send({
      toBranch: 'Matugga',
      note: 'Weekly restock',
      lines: [{ produceName: 'Red Beans', produceType: 'Beans', tonnageKg: 400 }]
    });
  assert.equal(draft.status, 201);
  assert.equal(dataOf(draft).status, 'draft');
  const transferId = dataOf(draft)._id;

  const shipped = await request(app)
    .post(`/api/v1/inventory/transfers/${transferId}/ship`)
    .set('Authorization', `Bearer ${maganjoToken}`);
  assert.equal(shipped.status, 200);
  assert.equal(dataOf(shipped).status, 'in_transit');

  const outMovement = await StockMovement.findOne({
    type: 'transfer_out',
    refId: transferId,
    branch: 'Maganjo'
  }).lean();
  assert.ok(outMovement);
  assert.equal(outMovement.qtyKg, -400);

  const received = await request(app)
    .post(`/api/v1/inventory/transfers/${transferId}/receive`)
    .set('Authorization', `Bearer ${matuggaToken}`);
  assert.equal(received.status, 200);
  assert.equal(dataOf(received).status, 'received');

  const matuggaBalance = await StockBalance.findOne({
    branch: 'Matugga',
    produceName: 'Red Beans',
    produceType: 'Beans'
  }).lean();
  assert.ok(matuggaBalance);
  assert.equal(Number(matuggaBalance.onHandKg), 400);

  // Reconcile must retain transfer effects (inventory overview path).
  const inventory = await request(app)
    .get('/api/v1/inventory')
    .set('Authorization', `Bearer ${matuggaToken}`);
  assert.equal(inventory.status, 200);
  const rows = dataOf(inventory).inventory || [];
  const beans = rows.find((row) => row.produceName === 'Red Beans' && row.produceType === 'Beans');
  assert.ok(beans);
  assert.equal(Number(beans.totalTonnageKg), 400);
});

test('stocktake posts variance to ledger', { timeout: 60_000 }, async () => {
  const sessionRes = await request(app)
    .post('/api/v1/inventory/stocktakes')
    .set('Authorization', `Bearer ${maganjoToken}`)
    .send({ note: 'Cycle count' });
  assert.equal(sessionRes.status, 201);
  const session = dataOf(sessionRes);
  assert.equal(session.status, 'draft');
  assert.ok(session.lines.length > 0);

  const line = session.lines.find((row) => row.produceName === 'Red Beans');
  assert.ok(line);
  const counted = Number(line.systemKg) - 25;

  const updated = await request(app)
    .put(`/api/v1/inventory/stocktakes/${session._id}`)
    .set('Authorization', `Bearer ${maganjoToken}`)
    .send({
      lines: [
        {
          produceName: line.produceName,
          produceType: line.produceType,
          countedKg: counted
        }
      ]
    });
  assert.equal(updated.status, 200);

  const posted = await request(app)
    .post(`/api/v1/inventory/stocktakes/${session._id}/post`)
    .set('Authorization', `Bearer ${maganjoToken}`);
  assert.equal(posted.status, 200);
  assert.equal(dataOf(posted).status, 'posted');

  const movement = await StockMovement.findOne({
    type: 'stocktake',
    refId: session._id,
    produceName: 'Red Beans'
  }).lean();
  assert.ok(movement);
  assert.equal(movement.qtyKg, -25);
});

test('movement ledger list is branch-scoped for managers', { timeout: 60_000 }, async () => {
  const listed = await request(app)
    .get('/api/v1/inventory/movements?page=1&limit=50')
    .set('Authorization', `Bearer ${maganjoToken}`);
  assert.equal(listed.status, 200);
  const items = asList(dataOf(listed));
  assert.ok(items.length > 0);
  assert.ok(items.every((row) => row.branch === 'Maganjo'));
});

const asList = (payload) => (Array.isArray(payload) ? payload : payload.items || []);
