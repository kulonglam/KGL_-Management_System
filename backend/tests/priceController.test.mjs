import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import PriceSetting from '../models/PriceSetting.js';
import Procurement from '../models/Procurement.js';
import {
  getPrices,
  getPriceById,
  createPrice,
  updatePrice,
  deletePrice
} from '../controllers/priceController.js';

// Create res.
const createRes = () => {
  // Configure response.
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  return response;
};

// Configure originals.
const originals = {
  priceFind: PriceSetting.find,
  priceFindOne: PriceSetting.findOne,
  priceCreate: PriceSetting.create,
  priceFindById: PriceSetting.findById,
  procurementFind: Procurement.find,
  procurementUpdateMany: Procurement.updateMany
};

afterEach(() => {
  PriceSetting.find = originals.priceFind;
  PriceSetting.findOne = originals.priceFindOne;
  PriceSetting.create = originals.priceCreate;
  PriceSetting.findById = originals.priceFindById;
  Procurement.find = originals.procurementFind;
  Procurement.updateMany = originals.procurementUpdateMany;
});

test('getPrices returns managed, inferred, and unset rows for all produce types', async () => {
  PriceSetting.find = () => ({
    sort: async () => [{ _id: 'ps1', produceType: 'Beans', priceUgx: 36000 }]
  });
  Procurement.find = () => ({
    sort: async () => [{ produceType: 'Grain Maize', sellingPrice: 28000 }]
  });

  const req = { user: { branch: 'Maganjo' } };
  const res = createRes();

  await getPrices(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(Array.isArray(res.body), true);
  assert.equal(res.body.length, 5);

  const beans = res.body.find((row) => row.produceType === 'Beans');
  const maize = res.body.find((row) => row.produceType === 'Grain Maize');
  const soy = res.body.find((row) => row.produceType === 'Soybeans');

  assert.equal(beans.source, 'managed');
  assert.equal(beans.priceUgx, 36000);
  assert.equal(beans._id, 'ps1');

  assert.equal(maize.source, 'inferred');
  assert.equal(maize.priceUgx, 28000);
  assert.equal(maize._id, null);

  assert.equal(soy.source, 'unset');
  assert.equal(soy.priceUgx, null);
});

test('createPrice creates a new managed price and syncs procurements', async () => {
  PriceSetting.findOne = async () => null;
  PriceSetting.create = async (payload) => ({ _id: 'new1', ...payload });
  Procurement.updateMany = async () => ({ modifiedCount: 3 });

  // Configure req.
  const req = {
    user: { branch: 'Maganjo' },
    body: { produceType: 'Beans', priceUgx: 40000 }
  };
  const res = createRes();

  await createPrice(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.setting._id, 'new1');
  assert.equal(res.body.setting.produceType, 'Beans');
  assert.equal(res.body.setting.priceUgx, 40000);
  assert.equal(res.body.updatedProcurements, 3);
});

test('createPrice rejects duplicate produce type in same branch', async () => {
  PriceSetting.findOne = async () => ({ _id: 'existing' });

  // Configure req.
  const req = {
    user: { branch: 'Maganjo' },
    body: { produceType: 'Beans', priceUgx: 40000 }
  };
  const res = createRes();

  await createPrice(req, res);

  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /already exists/i);
});

test('getPriceById returns setting for same branch and blocks other branches', async () => {
  PriceSetting.findById = async () => ({
    _id: 'ps2',
    branch: 'Maganjo',
    produceType: 'Soybeans',
    priceUgx: 30000
  });

  const okReq = { user: { branch: 'Maganjo' }, params: { id: 'ps2' } };
  const okRes = createRes();
  await getPriceById(okReq, okRes);
  assert.equal(okRes.statusCode, 200);
  assert.equal(okRes.body._id, 'ps2');

  const denyReq = { user: { branch: 'Matugga' }, params: { id: 'ps2' } };
  const denyRes = createRes();
  await getPriceById(denyReq, denyRes);
  assert.equal(denyRes.statusCode, 403);
});

test('updatePrice updates existing price and syncs procurements', async () => {
  // Set ting.
  const setting = {
    _id: 'ps3',
    branch: 'Maganjo',
    produceType: 'Beans',
    priceUgx: 35000,
    async save() {
      return this;
    }
  };

  PriceSetting.findById = async () => setting;
  PriceSetting.findOne = async () => null;
  Procurement.updateMany = async () => ({ modifiedCount: 4 });

  // Configure req.
  const req = {
    user: { branch: 'Maganjo' },
    params: { id: 'ps3' },
    body: { priceUgx: 42000 }
  };
  const res = createRes();

  await updatePrice(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.setting.priceUgx, 42000);
  assert.equal(res.body.updatedProcurements, 4);
});

test('deletePrice deletes setting in same branch', async () => {
  // Set ting.
  const setting = {
    _id: 'ps4',
    branch: 'Maganjo',
    async deleteOne() {}
  };
  PriceSetting.findById = async () => setting;

  // Configure req.
  const req = {
    user: { branch: 'Maganjo' },
    params: { id: 'ps4' }
  };
  const res = createRes();

  await deletePrice(req, res);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.message, /deleted/i);
});
