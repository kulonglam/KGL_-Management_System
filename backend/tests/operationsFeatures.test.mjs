/** Payroll, warehouse, assets, fleet, budgets, portal, fiscal filing, and procurement journals. */
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
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
import Procurement from '../models/Procurement.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import PriceSetting from '../models/PriceSetting.js';
import Sale from '../models/Sale.js';
import TrustedBuyer from '../models/TrustedBuyer.js';
import GlJournalLine from '../models/GlJournalLine.js';
import { postRefJournal } from '../services/journalPostingService.js';
import { queueFiscalDocument } from '../services/operationsService.js';
import { netPayUgx } from '../utils/payrollMath.js';

let memoryServer;
let app;
let director;
let manager;
let directorToken;
let managerToken;
let supplier;

const dataOf = (response) => response.body?.data ?? response.body;
const sign = (user, jti) =>
  jwt.sign({ id: String(user._id), tokenVersion: 0, typ: 'access', jti }, process.env.JWT_SECRET, {
    expiresIn: '1h',
    ...getJwtClaimOptions()
  });
const as = (token) => (req) => req.set('Authorization', `Bearer ${token}`);

before(async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    process.env.JWT_SECRET = 'integration-test-jwt-secret-32chars-min';
  }
  process.env.NODE_ENV = 'test';
  process.env.NIN_ENCRYPTION_KEY = 'c'.repeat(64);
  delete process.env.EFRIS_BASE_URL;
  delete process.env.EFRIS_API_KEY;
  mongoose.set('sanitizeFilter', true);
  setBranchCache(['Maganjo']);
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());
  app = createApp();
  const password = await bcrypt.hash('Karibu@2026!', 4);
  director = await User.create({
    name: 'Ops Director',
    username: 'ops_dir',
    password,
    role: 'director'
  });
  manager = await User.create({
    name: 'Ops Manager',
    username: 'ops_mgr',
    password,
    role: 'manager',
    branch: 'Maganjo'
  });
  directorToken = sign(director, 'ops-dir');
  managerToken = sign(manager, 'ops-mgr');
  supplier = await Supplier.create({
    name: 'Ops Supplies',
    contact: '0700000091',
    sourceType: 'company',
    branch: 'Maganjo',
    recordedBy: manager._id
  });
  await PriceSetting.create({ branch: 'Maganjo', produceType: 'Beans', produceName: 'Red Beans', priceUgx: 12000 });
}, { timeout: 120_000 });

after(async () => {
  mongoose.set('sanitizeFilter', false);
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
});

test('operations features are exercised against MongoDB', { timeout: 180000 }, async (t) => {
await t.test('a director cannot create or receive a purchase order', async () => {
  const created = await as(directorToken)(request(app).post('/api/v1/procurement/orders')).send({
    supplierId: String(supplier._id),
    lines: [{ produceName: 'Red Beans', produceType: 'Beans', orderedKg: 200, unitCostUgx: 8000 }]
  });
  assert.equal(created.status, 403);
  const receipt = await as(directorToken)(request(app).post('/api/v1/procurement/receipts')).send({
    supplierId: String(supplier._id),
    produceName: 'Red Beans',
    produceType: 'Beans',
    tonnageKg: 200,
    unitCostUgx: 8000
  });
  assert.equal(receipt.status, 403);
});

await t.test('editing or removing a procurement rewrites the accounts payable journal', async () => {
  const row = await Procurement.create({
    produceName: 'Red Beans',
    produceType: 'Beans',
    sourceType: 'company',
    dateReceived: new Date('2026-10-01T00:00:00.000Z'),
    timeReceived: '09:00',
    tonnageKg: 200,
    costUgx: 200000,
    dealerName: 'Ops Supplies',
    dealerContact: '0700000091',
    branch: 'Maganjo',
    recordedBy: manager._id,
    sellingPrice: 12000,
    supplier: supplier._id
  });
  await postRefJournal('procurement', row._id);
  const before = await GlJournalLine.find({ refType: 'procurement', refId: String(row._id) }).lean();
  assert.equal(before.reduce((sum, line) => sum + line.debitUgx, 0), 200000);

  const updated = await as(managerToken)(request(app).put(`/api/v1/procurement/${row._id}`)).send({ costUgx: 350000 });
  assert.equal(updated.status, 200, JSON.stringify(updated.body));
  const after = await GlJournalLine.find({ refType: 'procurement', refId: String(row._id) }).lean();
  assert.equal(after.reduce((sum, line) => sum + line.debitUgx, 0), 350000);
  assert.equal(after.reduce((sum, line) => sum + line.creditUgx, 0), 350000);

  const removed = await as(managerToken)(request(app).delete(`/api/v1/procurement/${row._id}`));
  assert.equal(removed.status, 200, JSON.stringify(removed.body));
  assert.equal(await GlJournalLine.countDocuments({ refType: 'procurement', refId: String(row._id) }), 0);
});

await t.test('payroll, bills, bins, assets, fleet, and budgets post through the API', async () => {
  const employee = await as(directorToken)(request(app).post('/api/v1/operations/employees')).send({
    name: 'Amina Okello',
    branch: 'Maganjo',
    grossSalaryUgx: 300000
  });
  assert.equal(employee.status, 200, JSON.stringify(employee.body));
  const payroll = await as(directorToken)(request(app).post('/api/v1/operations/payroll')).send({
    month: '2026-10',
    branch: 'Maganjo'
  });
  assert.equal(payroll.status, 200, JSON.stringify(payroll.body));
  const pay = netPayUgx(300000);
  const salaries = await GlJournalLine.findOne({ eventType: 'payroll', account: '6300' }).lean();
  assert.equal(salaries.debitUgx, 300000 + pay.employerUgx);

  const order = await PurchaseOrder.create({
    branch: 'Maganjo',
    supplier: supplier._id,
    status: 'received',
    lines: [{ produceName: 'Red Beans', produceType: 'Beans', orderedKg: 200, unitCostUgx: 8000, receivedKg: 200 }],
    createdBy: manager._id
  });
  const receipt = await Procurement.create({
    produceName: 'Red Beans',
    produceType: 'Beans',
    sourceType: 'company',
    dateReceived: new Date('2026-10-02T00:00:00.000Z'),
    timeReceived: '10:00',
    tonnageKg: 200,
    costUgx: 1600000,
    dealerName: 'Ops Supplies',
    dealerContact: '0700000091',
    branch: 'Maganjo',
    recordedBy: manager._id,
    sellingPrice: 12000,
    supplier: supplier._id,
    purchaseOrder: order._id
  });
  await postRefJournal('procurement', receipt._id);
  const apBefore = await GlJournalLine.countDocuments({ refType: 'procurement', account: '2000' });
  const bill = await as(managerToken)(request(app).post('/api/v1/operations/bills')).send({
    supplierId: String(supplier._id),
    purchaseOrderId: String(order._id)
  });
  assert.equal(bill.status, 200, JSON.stringify(bill.body));
  assert.equal(dataOf(bill).billsAp, false);
  assert.equal(dataOf(bill).amountUgx, 1600000);
  assert.equal(await GlJournalLine.countDocuments({ refType: 'procurement', account: '2000' }), apBefore);

  const bin = await as(managerToken)(request(app).post('/api/v1/operations/bins')).send({
    code: 'A-01',
    branch: 'Maganjo'
  });
  assert.equal(bin.status, 200, JSON.stringify(bin.body));
  const placed = await as(managerToken)(request(app).post('/api/v1/operations/putaway')).send({
    binId: dataOf(bin)._id,
    produceName: 'Red Beans',
    produceType: 'Beans',
    qtyKg: 50
  });
  assert.equal(placed.status, 200, JSON.stringify(placed.body));

  const sale = await Sale.create({
    produceName: 'Red Beans',
    produceType: 'Beans',
    tonnageKg: 10,
    amountPaidUgx: 120000,
    paymentMethod: 'cash',
    buyerName: 'Walk In',
    salesAgentName: 'Ops Manager',
    date: new Date('2026-10-03T00:00:00.000Z'),
    time: '11:00',
    branch: 'Maganjo',
    recordedBy: manager._id
  });
  const pick = await as(managerToken)(request(app).post('/api/v1/operations/pick-lists')).send({ saleId: String(sale._id) });
  assert.equal(pick.status, 200, JSON.stringify(pick.body));
  assert.equal(dataOf(pick).qtyKg, 10);

  const asset = await as(directorToken)(request(app).post('/api/v1/operations/assets')).send({
    name: 'Store scale',
    branch: 'Maganjo',
    costUgx: 120000,
    lifeMonths: 12,
    acquiredOn: '2026-01-15'
  });
  assert.equal(asset.status, 200, JSON.stringify(asset.body));
  const depreciation = await as(directorToken)(request(app).post('/api/v1/operations/depreciation')).send({
    month: '2026-02',
    branch: 'Maganjo'
  });
  assert.equal(depreciation.status, 200, JSON.stringify(depreciation.body));
  const depreciationLine = await GlJournalLine.findOne({ eventType: 'depreciation', account: '6200' }).lean();
  assert.equal(depreciationLine.debitUgx, 10000);

  const vehicle = await as(managerToken)(request(app).post('/api/v1/operations/vehicles')).send({
    plate: 'UAA 101A',
    branch: 'Maganjo'
  });
  assert.equal(vehicle.status, 200, JSON.stringify(vehicle.body));
  const trip = await as(managerToken)(request(app).post('/api/v1/operations/trips')).send({
    vehicleId: dataOf(vehicle)._id,
    fromPlace: 'Maganjo',
    toPlace: 'Matugga',
    km: 18,
    travelledOn: '2026-10-04'
  });
  assert.equal(trip.status, 200, JSON.stringify(trip.body));
  const fuel = await as(managerToken)(request(app).post('/api/v1/operations/fuel')).send({
    vehicleId: dataOf(vehicle)._id,
    litres: 20,
    amountUgx: 140000,
    filledOn: '2026-10-04'
  });
  assert.equal(fuel.status, 200, JSON.stringify(fuel.body));
  const fuelLine = await GlJournalLine.findOne({ eventType: 'fuel', account: '6400' }).lean();
  assert.equal(fuelLine.debitUgx, 140000);

  const budget = await as(directorToken)(request(app).post('/api/v1/operations/budgets')).send({
    branch: 'Maganjo',
    account: '6400',
    month: '2026-10',
    amountUgx: 200000
  });
  assert.equal(budget.status, 200, JSON.stringify(budget.body));
  const variance = await as(directorToken)(request(app).get('/api/v1/operations/budgets/variance?month=2026-10&branch=Maganjo'));
  assert.equal(variance.status, 200, JSON.stringify(variance.body));
  const fuelBudget = dataOf(variance).find((line) => line.account === '6400');
  assert.equal(fuelBudget.varianceUgx, 60000);
});

await t.test('a buyer can sign in to the portal and a restore drill uses a scratch database', async () => {
  const buyer = await TrustedBuyer.create({
    name: 'Aciro Buyer',
    nationalId: 'CM123456789012',
    location: 'Maganjo',
    contact: '0700000092',
    branch: 'Maganjo',
    recordedBy: manager._id
  });
  const access = await as(managerToken)(request(app).post('/api/v1/operations/portal-access')).send({
    buyerId: String(buyer._id),
    password: 'PortalPass1'
  });
  assert.equal(access.status, 200, JSON.stringify(access.body));
  const login = await request(app).post('/api/v1/portal/login').send({ contact: '0700000092', password: 'PortalPass1' });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  const home = await request(app)
    .get('/api/v1/portal/home')
    .set('Authorization', `Bearer ${dataOf(login).token}`);
  assert.equal(home.status, 200, JSON.stringify(home.body));
  assert.equal(dataOf(home).buyer.name, 'Aciro Buyer');

  const usersBefore = await User.countDocuments();
  const drill = await as(directorToken)(request(app).post('/api/v1/operations/restore-drills'));
  assert.equal(drill.status, 200, JSON.stringify(drill.body));
  assert.match(dataOf(drill).note, /scratch database/);
  assert.equal(await User.countDocuments(), usersBefore);
});

await t.test('EFRIS stores a fiscal code when configured and stays not configured without keys', async () => {
  const missing = await queueFiscalDocument({ invoiceNumber: 'INV-NONE', branch: 'Maganjo', grossUgx: 50000 });
  assert.equal(missing.status, 'not_configured');
  assert.equal(missing.fiscalCode || '', '');

  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ fiscalCode: 'EFRIS-100' }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  process.env.EFRIS_BASE_URL = `http://127.0.0.1:${port}`;
  process.env.EFRIS_API_KEY = 'test-efris-key';
  try {
    const filed = await queueFiscalDocument({ invoiceNumber: 'INV-FILED', branch: 'Maganjo', grossUgx: 80000 });
    assert.equal(filed.status, 'accepted');
    assert.equal(filed.fiscalCode, 'EFRIS-100');
  } finally {
    delete process.env.EFRIS_BASE_URL;
    delete process.env.EFRIS_API_KEY;
    await new Promise((resolve) => server.close(resolve));
  }
});
});
