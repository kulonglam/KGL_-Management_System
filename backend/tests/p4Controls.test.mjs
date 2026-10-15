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
import CreditSale from '../models/CreditSale.js';
import TrustedBuyer from '../models/TrustedBuyer.js';
import MessageOutbox from '../models/MessageOutbox.js';
import StockMovement from '../models/StockMovement.js';
import Supplier from '../models/Supplier.js';
import User from '../models/User.js';
import { approveWriteOff } from '../services/creditWriteOffService.js';
import { migrateNationalIds } from '../services/ninMigrationService.js';
import {
  backfillDocumentMovements,
  backfillProcurementSuppliers,
  findLedgerBalanceMismatches
} from '../services/backfillService.js';
import { reconcileStockBalances } from '../services/stockBalanceService.js';
import { blindIndex } from '../utils/fieldEncryption.js';
import { businessDateKey, businessDayRange } from '../utils/businessTime.js';

let memoryServer;
let app;
let manager;
let director;
let otherDirector;
let managerToken;
let directorToken;
let buyerId;
let legacyBuyerId;
let creditSaleId;

const BUYER_NIN = 'CM900000000001';
const dataOf = (response) => response.body?.data ?? response.body;
const daysAgoKey = (days) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

const signAccessToken = (user, jti) =>
  jwt.sign({ id: String(user._id), tokenVersion: 0, typ: 'access', jti }, process.env.JWT_SECRET, {
    expiresIn: '1h',
    ...getJwtClaimOptions()
  });

const asManager = (req) => req.set('Authorization', `Bearer ${managerToken}`);
const asDirector = (req) => req.set('Authorization', `Bearer ${directorToken}`);

before(
  async () => {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      process.env.JWT_SECRET = 'integration-test-jwt-secret-32chars-min';
    }
    process.env.NODE_ENV = 'test';
    process.env.NIN_ENCRYPTION_KEY = 'a'.repeat(64);
    // Production enables sanitizeFilter; run these flows the same way.
    mongoose.set('sanitizeFilter', true);
    setBranchCache(['Maganjo', 'Matugga']);
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());
    await TrustedBuyer.createIndexes();
    app = createApp();

    const password = await bcrypt.hash('Karibu@2026!', 10);
    director = await User.create({ name: 'P4 Director', username: 'dir_p4', password, role: 'director' });
    otherDirector = await User.create({ name: 'P4 Director Two', username: 'dir2_p4', password, role: 'director' });
    manager = await User.create({
      name: 'P4 Manager',
      username: 'mgr_p4',
      password,
      role: 'manager',
      branch: 'Maganjo'
    });
    directorToken = signAccessToken(director, 'p4-dir');
    managerToken = signAccessToken(manager, 'p4-mgr');

    await PriceSetting.create({ branch: 'Maganjo', produceType: 'Beans', produceName: '', priceUgx: 10000 });
    await Procurement.create({
      produceName: 'Red Beans',
      produceType: 'Beans',
      sourceType: 'company',
      dateReceived: new Date(`${daysAgoKey(10)}T00:00:00.000Z`),
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
  mongoose.set('sanitizeFilter', false);
  delete process.env.NIN_ENCRYPTION_KEY;
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
});

test('business time follows Africa/Kampala day boundaries', () => {
  assert.equal(businessDateKey(new Date('2026-10-15T22:30:00.000Z')), '2026-10-16');
  assert.equal(businessDateKey(new Date('2026-10-15T20:30:00.000Z')), '2026-10-15');
  const range = businessDayRange('2026-10-16');
  assert.equal(range.start.toISOString(), '2026-10-15T21:00:00.000Z');
  assert.equal(range.end.toISOString(), '2026-10-16T20:59:59.999Z');
});

test('national IDs are encrypted at rest and readable through the API', { timeout: 60_000 }, async () => {
  const created = await asManager(request(app).post('/api/v1/trusted-buyers')).send({
    name: 'Encrypted Buyer',
    nationalId: BUYER_NIN.toLowerCase(),
    location: 'Kampala',
    contact: '0700333444',
    email: 'Buyer@Example.com'
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const buyer = dataOf(created);
  buyerId = buyer._id;
  assert.equal(buyer.nationalId, BUYER_NIN);
  assert.equal(buyer.email, 'buyer@example.com');
  assert.equal(buyer.nationalIdHash, undefined);

  const raw = await TrustedBuyer.collection.findOne({ _id: new mongoose.Types.ObjectId(buyerId) });
  assert.match(raw.nationalId, /^enc:v1:/);
  assert.equal(raw.nationalIdHash, blindIndex(BUYER_NIN));

  const duplicate = await asManager(request(app).post('/api/v1/trusted-buyers')).send({
    name: 'Same Person',
    nationalId: BUYER_NIN,
    location: 'Kampala',
    contact: '0700333445'
  });
  assert.equal(duplicate.status, 400);

  const search = await asManager(request(app).get('/api/v1/trusted-buyers')).query({ search: BUYER_NIN });
  assert.equal(search.status, 200);
  const rows = dataOf(search);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].nationalId, BUYER_NIN);
  assert.equal(rows[0].nationalIdHash, undefined);
});

test('credit sale copies the NIN encrypted and shows a 90%-limit-ready balance', { timeout: 60_000 }, async () => {
  const created = await asManager(request(app).post('/api/v1/credit-sales')).send({
    trustedBuyerId: buyerId,
    dueDate: daysAgoKey(-30),
    dateOfDispatch: daysAgoKey(5),
    produceName: 'Red Beans',
    produceType: 'Beans',
    tonnageKg: 2
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const sale = dataOf(created);
  creditSaleId = sale._id;
  assert.equal(sale.nationalId, BUYER_NIN);
  const raw = await CreditSale.collection.findOne({ _id: new mongoose.Types.ObjectId(creditSaleId) });
  assert.match(raw.nationalId, /^enc:v1:/);

  const list = await asManager(request(app).get('/api/v1/trusted-buyers'));
  const listed = dataOf(list).find((row) => row._id === buyerId);
  assert.equal(listed.outstandingUgx, sale.amountDueUgx);
});

test('migration encrypts legacy plaintext NINs and is idempotent', { timeout: 60_000 }, async () => {
  const { insertedId } = await TrustedBuyer.collection.insertOne({
    name: 'Legacy Buyer',
    nationalId: 'CF900000000002',
    location: 'Gulu',
    contact: '0700555666',
    branch: 'Maganjo',
    recordedBy: manager._id,
    creditLimitUgx: null,
    deletedAt: null
  });
  legacyBuyerId = insertedId;
  const found = await TrustedBuyer.findOne({ nationalId: 'CF900000000002' }).lean();
  assert.equal(String(found._id), String(insertedId));

  const first = await migrateNationalIds();
  assert.ok(first.trustedBuyers.updated >= 1);
  const raw = await TrustedBuyer.collection.findOne({ _id: insertedId });
  assert.match(raw.nationalId, /^enc:v1:/);
  const decrypted = await TrustedBuyer.findById(insertedId).lean();
  assert.equal(decrypted.nationalId, 'CF900000000002');

  const second = await migrateNationalIds();
  assert.equal(second.trustedBuyers.updated, 0);
  assert.equal(second.creditSales.updated, 0);
});

test('write-off needs a different approver and books bad debt in the GL', { timeout: 60_000 }, async () => {
  const repaid = await asManager(request(app).post(`/api/v1/credit-sales/${creditSaleId}/repay`)).send({
    amountUgx: 5000
  });
  assert.equal(repaid.status, 200, JSON.stringify(repaid.body));

  const requested = await asManager(request(app).post(`/api/v1/credit-sales/${creditSaleId}/write-off`)).send({
    reason: 'Buyer relocated, unreachable'
  });
  assert.equal(requested.status, 202, JSON.stringify(requested.body));
  assert.equal(dataOf(requested).writeOff.status, 'pending');

  const again = await asManager(request(app).post(`/api/v1/credit-sales/${creditSaleId}/write-off`)).send({
    reason: 'Second request'
  });
  assert.equal(again.status, 409);

  const managerApprove = await asManager(request(app).post(`/api/v1/finance/write-offs/${creditSaleId}/approve`));
  assert.equal(managerApprove.status, 403);

  const pending = await asManager(request(app).get('/api/v1/finance/write-offs'));
  assert.equal(pending.status, 200);
  assert.equal(dataOf(pending).length, 1);

  const approved = await asDirector(request(app).post(`/api/v1/finance/write-offs/${creditSaleId}/approve`)).send({
    note: 'Approved after call log review'
  });
  assert.equal(approved.status, 200, JSON.stringify(approved.body));
  const sale = dataOf(approved);
  assert.equal(sale.balanceUgx, 0);
  assert.equal(sale.writtenOffUgx, sale.amountDueUgx - 5000);
  assert.equal(sale.writeOff.status, 'approved');

  // Date-only `to` (as the UI sends) must include events timestamped later the same business day.
  const gl = await asDirector(request(app).get('/api/v1/finance/gl-export')).query({
    from: daysAgoKey(30),
    to: businessDateKey()
  });
  assert.equal(gl.status, 200, JSON.stringify(gl.body));
  const payload = dataOf(gl);
  const writeOffLines = payload.lines.filter((line) => line.eventType === 'credit_writeoff');
  assert.equal(writeOffLines.length, 2);
  assert.equal(writeOffLines[0].account, '6100');
  assert.ok(payload.lines.some((line) => line.eventType === 'credit_sale'));
  assert.ok(payload.lines.some((line) => line.eventType === 'procurement'));
  assert.equal(payload.totals.balanced, true);
});

test('the requester of a write-off cannot approve it', { timeout: 60_000 }, async () => {
  const sale = await CreditSale.create({
    buyerName: 'Legacy Buyer',
    nationalId: 'CF900000000002',
    location: 'Gulu',
    contact: '0700555666',
    amountDueUgx: 10000,
    salesAgentName: 'P4 Manager',
    dueDate: new Date(`${daysAgoKey(-10)}T00:00:00.000Z`),
    produceName: 'Red Beans',
    produceType: 'Beans',
    tonnageKg: 1,
    dateOfDispatch: new Date(`${daysAgoKey(1)}T00:00:00.000Z`),
    branch: 'Maganjo',
    recordedBy: manager._id,
    trustedBuyer: legacyBuyerId,
    writeOff: {
      status: 'pending',
      requestedAmountUgx: 10000,
      reason: 'Director-raised request',
      requestedBy: director._id,
      requestedAt: new Date()
    }
  });
  await assert.rejects(
    approveWriteOff({ actorUser: director, creditSaleId: sale._id }),
    (error) => error.statusCode === 403
  );
  const ok = await approveWriteOff({ actorUser: otherDirector, creditSaleId: sale._id });
  assert.equal(ok.amountUgx, 10000);
});

test('customer statement as JSON, PDF and email', { timeout: 60_000 }, async () => {
  const json = await asManager(request(app).get(`/api/v1/finance/statements/${buyerId}`));
  assert.equal(json.status, 200, JSON.stringify(json.body));
  const statement = dataOf(json);
  assert.deepEqual(
    statement.lines.map((line) => line.type),
    ['dispatch', 'payment', 'write_off']
  );
  assert.equal(statement.closingBalanceUgx, 0);
  assert.equal(statement.lines[0].debitUgx, statement.lines[0].balanceUgx);

  const pdf = await asManager(request(app).get(`/api/v1/finance/statements/${buyerId}`))
    .query({ format: 'pdf' })
    .buffer(true)
    .parse((res, done) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => done(null, Buffer.concat(chunks)));
    });
  assert.equal(pdf.status, 200);
  assert.match(pdf.headers['content-type'], /application\/pdf/);
  assert.equal(pdf.body.subarray(0, 5).toString(), '%PDF-');

  const emailed = await asManager(request(app).post(`/api/v1/finance/statements/${buyerId}/email`)).send({});
  assert.equal(emailed.status, 202, JSON.stringify(emailed.body));
  assert.equal(dataOf(emailed).to, 'buyer@example.com');
  const message = await MessageOutbox.findOne({ relatedType: 'statement', relatedId: buyerId }).lean();
  assert.ok(message);
  assert.match(message.body, /Closing balance/);
});

test('directors can list all users to pick a data-export subject', { timeout: 60_000 }, async () => {
  const listed = await asDirector(request(app).get('/api/v1/auth/users'));
  assert.equal(listed.status, 200, JSON.stringify(listed.body));
  const rows = dataOf(listed);
  assert.ok(rows.some((row) => String(row._id) === String(manager._id)));
  assert.ok(rows.every((row) => row.password === undefined && row.mfaSecret === undefined));
});

test('personal-data export is director-only and excludes secrets', { timeout: 60_000 }, async () => {
  const forbidden = await asManager(request(app).get(`/api/v1/finance/personal-data/trusted-buyers/${buyerId}`));
  assert.equal(forbidden.status, 403);

  const buyerExport = await asDirector(request(app).get(`/api/v1/finance/personal-data/trusted-buyers/${buyerId}`));
  assert.equal(buyerExport.status, 200, JSON.stringify(buyerExport.body));
  const buyerData = dataOf(buyerExport);
  assert.equal(buyerData.profile.nationalId, BUYER_NIN);
  assert.equal(buyerData.creditSales.length, 1);
  assert.equal(buyerData.creditSales[0].nationalId, BUYER_NIN);
  assert.ok(buyerData.messages.length >= 1);

  const userExport = await asDirector(request(app).get(`/api/v1/finance/personal-data/users/${manager._id}`));
  assert.equal(userExport.status, 200);
  const userData = dataOf(userExport);
  assert.equal(userData.profile.username, 'mgr_p4');
  assert.equal(userData.profile.password, undefined);
  assert.equal(userData.profile.mfaSecret, undefined);
  assert.ok(userData.recordsCreated.creditSales.length >= 1);
});

test('closed periods return 423 until reopened; restore works under sanitizeFilter', { timeout: 60_000 }, async () => {
  const oldSale = await asManager(request(app).post('/api/v1/sales')).send({
    produceName: 'Red Beans',
    produceType: 'Beans',
    tonnageKg: 1,
    buyerName: 'Walk In',
    date: daysAgoKey(4),
    time: '10:00'
  });
  assert.equal(oldSale.status, 201, JSON.stringify(oldSale.body));
  const oldSaleId = dataOf(oldSale)._id;

  const managerLock = await asManager(request(app).put('/api/v1/finance/period-locks')).send({
    lockedThrough: daysAgoKey(2)
  });
  assert.equal(managerLock.status, 403);

  const lock = await asDirector(request(app).put('/api/v1/finance/period-locks')).send({
    scope: 'ALL',
    lockedThrough: daysAgoKey(2),
    note: 'Month end'
  });
  assert.equal(lock.status, 200, JSON.stringify(lock.body));

  const backdated = await asManager(request(app).post('/api/v1/sales')).send({
    produceName: 'Red Beans',
    produceType: 'Beans',
    tonnageKg: 1,
    buyerName: 'Late Entry',
    date: daysAgoKey(3),
    time: '11:00'
  });
  assert.equal(backdated.status, 423);
  assert.match(backdated.body.message || backdated.body.error?.message || '', /closed through/);

  const removeLocked = await asManager(request(app).delete(`/api/v1/sales/${oldSaleId}`));
  assert.equal(removeLocked.status, 423);

  const todaySale = await asManager(request(app).post('/api/v1/sales')).send({
    produceName: 'Red Beans',
    produceType: 'Beans',
    tonnageKg: 1,
    buyerName: 'Today Buyer',
    date: businessDateKey(),
    time: '12:00'
  });
  assert.equal(todaySale.status, 201, JSON.stringify(todaySale.body));

  const reopen = await asDirector(request(app).put('/api/v1/finance/period-locks')).send({ lockedThrough: null });
  assert.equal(reopen.status, 200);

  const removed = await asManager(request(app).delete(`/api/v1/sales/${oldSaleId}`));
  assert.equal(removed.status, 200, JSON.stringify(removed.body));
  const removedList = await asManager(request(app).get('/api/v1/sales')).query({ deleted: 'true' });
  assert.ok(dataOf(removedList).some((row) => row._id === oldSaleId));
  const restored = await asManager(request(app).post(`/api/v1/sales/${oldSaleId}/restore`));
  assert.equal(restored.status, 200, JSON.stringify(restored.body));
});

test('partner API keys: scoped, branch-bound, shown once, revocable', { timeout: 60_000 }, async () => {
  const createdAll = await asDirector(request(app).post('/api/v1/platform/api-keys')).send({
    name: 'BI dashboard',
    scopes: ['stock:read', 'sales:read']
  });
  assert.equal(createdAll.status, 201, JSON.stringify(createdAll.body));
  const allKey = dataOf(createdAll);
  assert.match(allKey.key, /^kgl_[A-Za-z0-9]{10}_/);
  assert.equal(allKey.keyHash, undefined);

  const list = await asDirector(request(app).get('/api/v1/platform/api-keys'));
  assert.equal(list.status, 200);
  assert.equal(dataOf(list)[0].key, undefined);
  assert.equal(dataOf(list)[0].keyHash, undefined);

  const noKey = await request(app).get('/api/v1/partner/stock');
  assert.equal(noKey.status, 401);
  const badKey = await request(app).get('/api/v1/partner/stock').set('X-API-Key', `${allKey.key}x`);
  assert.equal(badKey.status, 401);

  const stock = await request(app).get('/api/v1/partner/stock').set('X-API-Key', allKey.key);
  assert.equal(stock.status, 200, JSON.stringify(stock.body));
  assert.ok(dataOf(stock).items.some((row) => row.branch === 'Maganjo'));

  const sales = await request(app).get('/api/v1/partner/sales').set('X-API-Key', allKey.key);
  assert.equal(sales.status, 200);
  assert.ok(dataOf(sales).items.length >= 1);
  assert.equal(dataOf(sales).items[0].buyerName, undefined);

  const wrongScope = await request(app).get('/api/v1/partner/procurements').set('X-API-Key', allKey.key);
  assert.equal(wrongScope.status, 403);

  const createdBranch = await asDirector(request(app).post('/api/v1/platform/api-keys')).send({
    name: 'Matugga only',
    scopes: ['stock:read'],
    branch: 'Matugga',
    expiresAt: businessDateKey()
  });
  assert.equal(createdBranch.status, 201, JSON.stringify(createdBranch.body));
  const branchKey = dataOf(createdBranch);
  assert.equal(new Date(branchKey.expiresAt).getTime(), businessDayRange(businessDateKey()).end.getTime());
  const branchStock = await request(app)
    .get('/api/v1/partner/stock')
    .query({ branch: 'Maganjo' })
    .set('X-API-Key', branchKey.key);
  assert.equal(branchStock.status, 200);
  assert.equal(dataOf(branchStock).items.length, 0);

  const revoked = await asDirector(request(app).post(`/api/v1/platform/api-keys/${allKey._id}/revoke`));
  assert.equal(revoked.status, 200);
  assert.equal(dataOf(revoked).status, 'revoked');
  const afterRevoke = await request(app).get('/api/v1/partner/stock').set('X-API-Key', allKey.key);
  assert.equal(afterRevoke.status, 401);
});

test('stocktake count sheet hides system quantities by default', { timeout: 60_000 }, async () => {
  const started = await asManager(request(app).post('/api/v1/inventory/stocktakes')).send({ note: 'Cycle count' });
  assert.equal(started.status, 201, JSON.stringify(started.body));
  const sessionId = dataOf(started)._id;

  const blind = await asManager(request(app).get(`/api/v1/inventory/stocktakes/${sessionId}/count-sheet`));
  assert.equal(blind.status, 200);
  assert.match(blind.headers['content-type'], /text\/csv/);
  const [, header, firstRow] = blind.text.trim().split('\n');
  assert.equal(header, '#,produceName,produceType,countedKg,countedBy,notes');
  assert.match(firstRow, /^1,Red Beans,Beans,,,$/);

  const open = await asManager(request(app).get(`/api/v1/inventory/stocktakes/${sessionId}/count-sheet`)).query({
    blind: 'false'
  });
  assert.match(open.text.split('\n')[1], /systemKg/);
});

test('backfills link suppliers and complete the movement ledger', { timeout: 60_000 }, async () => {
  const { insertedId } = await Procurement.collection.insertOne({
    produceName: 'Red Beans',
    produceType: 'Beans',
    sourceType: 'company',
    dateReceived: new Date(`${daysAgoKey(60)}T00:00:00.000Z`),
    timeReceived: '08:00',
    tonnageKg: 700,
    costUgx: 5000000,
    dealerName: 'Old  Dealer',
    dealerContact: '0700999888',
    branch: 'Maganjo',
    recordedBy: manager._id,
    sellingPrice: 10000,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const suppliers = await backfillProcurementSuppliers();
  assert.ok(suppliers.procurementsUpdated >= 1, JSON.stringify(suppliers));
  const linked = await Procurement.collection.findOne({ _id: insertedId });
  const supplier = await Supplier.findById(linked.supplier).lean();
  assert.equal(supplier.name, 'Old Dealer');

  const movements = await backfillDocumentMovements();
  assert.ok(movements.movementsWritten >= 1, JSON.stringify(movements));
  const row = await StockMovement.findOne({ refId: insertedId }).lean();
  assert.equal(row.qtyKg, 700);
  assert.equal(row.type, 'procurement_in');

  const rerun = await backfillDocumentMovements();
  assert.equal(rerun.movementsWritten, 0);

  await reconcileStockBalances();
  assert.deepEqual(await findLedgerBalanceMismatches(), []);
});
