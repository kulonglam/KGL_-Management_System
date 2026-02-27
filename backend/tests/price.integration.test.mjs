import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import createApp from '../app.js';
import User from '../models/User.js';
import PriceSetting from '../models/PriceSetting.js';
import Procurement from '../models/Procurement.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// Initialize app.
const app = createApp();

// Configure originals.
const originals = {
  userFindById: User.findById,
  priceFind: PriceSetting.find,
  priceFindOne: PriceSetting.findOne,
  priceCreate: PriceSetting.create,
  priceFindById: PriceSetting.findById,
  procurementFind: Procurement.find,
  procurementUpdateMany: Procurement.updateMany
};

afterEach(() => {
  User.findById = originals.userFindById;
  PriceSetting.find = originals.priceFind;
  PriceSetting.findOne = originals.priceFindOne;
  PriceSetting.create = originals.priceCreate;
  PriceSetting.findById = originals.priceFindById;
  Procurement.find = originals.procurementFind;
  Procurement.updateMany = originals.procurementUpdateMany;
});

// Set authenticated user.
const setAuthenticatedUser = (user) => {
  User.findById = () => ({
    select: async () => user
  });
};

// Handle auth header for.
const authHeaderFor = (userId = 'u1') => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
  return `Bearer ${token}`;
};

test('manager can get price list', async () => {
  setAuthenticatedUser({
    _id: 'manager-1',
    role: 'manager',
    branch: 'Maganjo',
    name: 'ManagerA'
  });

  PriceSetting.find = () => ({
    sort: async () => [{ _id: 'p1', produceType: 'Beans', priceUgx: 37000 }]
  });
  Procurement.find = () => ({
    sort: async () => [{ produceType: 'Grain Maize', sellingPrice: 28000 }]
  });

  const response = await request(app)
    .get('/api/prices')
    .set('Authorization', authHeaderFor('manager-1'));

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(Array.isArray(response.body.data), true);
  assert.equal(response.body.data.length, 5);

  const beans = response.body.data.find((entry) => entry.produceType === 'Beans');
  assert.equal(beans.source, 'managed');
});

test('manager can create price', async () => {
  setAuthenticatedUser({
    _id: 'manager-1',
    role: 'manager',
    branch: 'Maganjo',
    name: 'ManagerA'
  });

  PriceSetting.findOne = async () => null;
  PriceSetting.create = async (payload) => ({ _id: 'new-price', ...payload });
  Procurement.updateMany = async () => ({ modifiedCount: 2 });

  const response = await request(app)
    .post('/api/prices')
    .set('Authorization', authHeaderFor('manager-1'))
    .send({
      produceType: 'Beans',
      priceUgx: 42000
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.setting._id, 'new-price');
  assert.equal(response.body.data.setting.produceType, 'Beans');
  assert.equal(response.body.data.setting.priceUgx, 42000);
  assert.equal(response.body.data.updatedProcurements, 2);
});

test('manager can update price', async () => {
  setAuthenticatedUser({
    _id: 'manager-1',
    role: 'manager',
    branch: 'Maganjo',
    name: 'ManagerA'
  });

  // Set ting.
  const setting = {
    _id: '65f44c553f02d6f0bbad3f8f',
    branch: 'Maganjo',
    produceType: 'Beans',
    priceUgx: 35000,
    async save() {
      return this;
    }
  };

  PriceSetting.findById = async () => setting;
  Procurement.updateMany = async () => ({ modifiedCount: 4 });

  const response = await request(app)
    .put('/api/prices/65f44c553f02d6f0bbad3f8f')
    .set('Authorization', authHeaderFor('manager-1'))
    .send({
      priceUgx: 39000
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.setting._id, '65f44c553f02d6f0bbad3f8f');
  assert.equal(response.body.data.setting.priceUgx, 39000);
  assert.equal(response.body.data.updatedProcurements, 4);
});

test('manager can get and delete price by id', async () => {
  setAuthenticatedUser({
    _id: 'manager-1',
    role: 'manager',
    branch: 'Maganjo',
    name: 'ManagerA'
  });

  let deleted = false;
  // Set ting.
  const setting = {
    _id: '65f44c553f02d6f0bbad3f90',
    branch: 'Maganjo',
    produceType: 'Soybeans',
    priceUgx: 31000,
    async deleteOne() {
      deleted = true;
    }
  };

  PriceSetting.findById = async () => setting;

  const getResponse = await request(app)
    .get('/api/prices/65f44c553f02d6f0bbad3f90')
    .set('Authorization', authHeaderFor('manager-1'));

  assert.equal(getResponse.status, 200);
  assert.equal(getResponse.body.success, true);
  assert.equal(getResponse.body.data._id, '65f44c553f02d6f0bbad3f90');

  const deleteResponse = await request(app)
    .delete('/api/prices/65f44c553f02d6f0bbad3f90')
    .set('Authorization', authHeaderFor('manager-1'));

  assert.equal(deleteResponse.status, 200);
  assert.equal(deleteResponse.body.success, true);
  assert.match(deleteResponse.body.data.message, /deleted/i);
  assert.equal(deleted, true);
});

test('sales agent cannot access price routes', async () => {
  setAuthenticatedUser({
    _id: 'agent-1',
    role: 'sales_agent',
    branch: 'Maganjo',
    name: 'Agent1A'
  });

  const response = await request(app)
    .get('/api/prices')
    .set('Authorization', authHeaderFor('agent-1'));

  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
  assert.match(response.body.error.message, /not authorized/i);
});
