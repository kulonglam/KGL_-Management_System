import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import createApp from '../app.js';
import User from '../models/User.js';
import Procurement from '../models/Procurement.js';
import Sale from '../models/Sale.js';
import CreditSale from '../models/CreditSale.js';
import StockLock from '../models/StockLock.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.STOCK_LOCK_WAIT_TIMEOUT_MS = '1';
process.env.STOCK_LOCK_RETRY_MS = '1';

const app = createApp();

const originals = {
  userFindById: User.findById,
  procurementFind: Procurement.find,
  saleFind: Sale.find,
  creditSaleFind: CreditSale.find,
  stockLockUpdateOne: StockLock.updateOne,
  stockLockFindOneAndUpdate: StockLock.findOneAndUpdate
};

afterEach(() => {
  User.findById = originals.userFindById;
  Procurement.find = originals.procurementFind;
  Sale.find = originals.saleFind;
  CreditSale.find = originals.creditSaleFind;
  StockLock.updateOne = originals.stockLockUpdateOne;
  StockLock.findOneAndUpdate = originals.stockLockFindOneAndUpdate;
});

const authHeaderFor = (userId = 'manager-1') => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
  return `Bearer ${token}`;
};

test('POST /api/sales returns standardized 423 payload when stock lock acquisition times out', async () => {
  User.findById = () => ({
    select: async () => ({
      _id: 'manager-1',
      name: 'ManagerA',
      role: 'manager',
      branch: 'Maganjo'
    })
  });

  Procurement.find = async () => [
    {
      name: 'Red Beans',
      type: 'Beans',
      branch: 'Maganjo',
      tonnageKg: 1000,
      sellingPrice: 35000
    }
  ];
  Sale.find = async () => [];
  CreditSale.find = async () => [];

  StockLock.updateOne = async () => ({ acknowledged: true, modifiedCount: 1 });
  StockLock.findOneAndUpdate = async () => null;

  const response = await request(app)
    .post('/api/sales')
    .set('Authorization', authHeaderFor('manager-1'))
    .send({
      produceName: 'Red Beans',
      produceType: 'Beans',
      tonnageKg: 100,
      buyerName: 'Buyer One',
      date: '2026-02-22',
      time: '10:00'
    });

  assert.equal(response.status, 423);
  assert.equal(response.body.success, false);
  assert.equal(response.body.data, null);
  assert.match(response.body.error.message, /currently being updated/i);
});
