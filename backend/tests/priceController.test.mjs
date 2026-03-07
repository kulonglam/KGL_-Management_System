import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import PriceSetting from '../models/PriceSetting.js';
import Procurement from '../models/Procurement.js';
import PriceHistory from '../models/PriceHistory.js';
import {
  getPrices,
  getPriceHistory,
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
  priceDistinct: PriceSetting.distinct,
  priceFindOne: PriceSetting.findOne,
  priceCreate: PriceSetting.create,
  priceFindById: PriceSetting.findById,
  historyCreate: PriceHistory.create,
  historyFind: PriceHistory.find,
  procurementFind: Procurement.find,
  procurementUpdateMany: Procurement.updateMany
};

afterEach(() => {
  PriceSetting.find = originals.priceFind;
  PriceSetting.distinct = originals.priceDistinct;
  PriceSetting.findOne = originals.priceFindOne;
  PriceSetting.create = originals.priceCreate;
  PriceSetting.findById = originals.priceFindById;
  PriceHistory.create = originals.historyCreate;
  PriceHistory.find = originals.historyFind;
  Procurement.find = originals.procurementFind;
  Procurement.updateMany = originals.procurementUpdateMany;
});

test('getPrices returns managed and inferred rows for produce-specific pricing', async () => {
  PriceSetting.find = () => ({
    sort: async () => [
      { _id: 'ps1', produceType: 'Beans', priceUgx: 36000 },
      { _id: 'ps2', produceName: 'Red Beans', produceType: 'Beans', priceUgx: 41000 }
    ]
  });
  Procurement.find = () => ({
    sort: async () => [
      { produceName: 'Yellow Beans', produceType: 'Beans', sellingPrice: 39000 }
    ]
  });

  const req = { user: { branch: 'Maganjo' } };
  const res = createRes();

  await getPrices(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(Array.isArray(res.body), true);
  assert.equal(res.body.length, 3);

  const beansDefault = res.body.find((row) => row.produceType === 'Beans' && !row.produceName);
  const redBeans = res.body.find(
    (row) => row.produceType === 'Beans' && row.produceName === 'Red Beans'
  );
  const yellowBeans = res.body.find(
    (row) => row.produceType === 'Beans' && row.produceName === 'Yellow Beans'
  );

  assert.equal(beansDefault.source, 'managed');
  assert.equal(beansDefault.priceUgx, 36000);
  assert.equal(beansDefault.scope, 'type_default');
  assert.equal(beansDefault._id, 'ps1');

  assert.equal(redBeans.source, 'managed');
  assert.equal(redBeans.priceUgx, 41000);
  assert.equal(redBeans.scope, 'specific');
  assert.equal(redBeans._id, 'ps2');

  assert.equal(yellowBeans.source, 'inferred');
  assert.equal(yellowBeans.priceUgx, 39000);
  assert.equal(yellowBeans.scope, 'specific');
  assert.equal(yellowBeans._id, null);
});

test('createPrice creates a produce-specific managed price and syncs matching procurements', async () => {
  PriceSetting.findOne = async () => null;
  PriceSetting.create = async (payload) => ({ _id: 'new1', ...payload });
  let recordedHistory = null;
  PriceHistory.create = async (payload) => {
    recordedHistory = payload;
    return payload;
  };
  Procurement.updateMany = async () => ({ modifiedCount: 3 });

  // Configure req.
  const req = {
    user: { _id: 'manager-1', branch: 'Maganjo' },
    body: { produceName: 'Red Beans', produceType: 'Beans', priceUgx: 40000 }
  };
  const res = createRes();

  await createPrice(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.setting._id, 'new1');
  assert.equal(res.body.setting.produceName, 'Red Beans');
  assert.equal(res.body.setting.produceType, 'Beans');
  assert.equal(res.body.setting.priceUgx, 40000);
  assert.equal(res.body.updatedProcurements, 3);
  assert.equal(recordedHistory.action, 'create');
  assert.equal(recordedHistory.nextProduceName, 'Red Beans');
  assert.equal(recordedHistory.nextPriceUgx, 40000);
});

test('createPrice rejects duplicate produce setting in same branch', async () => {
  PriceSetting.findOne = async () => ({ _id: 'existing' });

  // Configure req.
  const req = {
    user: { branch: 'Maganjo' },
    body: { produceName: 'Red Beans', produceType: 'Beans', priceUgx: 40000 }
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
    produceName: 'Soy Mix',
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

test('getPriceHistory returns audit rows for same-branch price setting', async () => {
  PriceSetting.findById = async () => ({
    _id: 'ps2',
    branch: 'Maganjo',
    produceName: 'Red Beans',
    produceType: 'Beans',
    priceUgx: 35000
  });
  PriceHistory.find = () => ({
    populate() {
      return this;
    },
    sort() {
      return this;
    },
    lean: async () => [
      {
        action: 'update',
        previousPriceUgx: 35000,
        nextPriceUgx: 36000,
        changedBy: { name: 'Kulong' }
      }
    ]
  });

  const req = {
    user: { branch: 'Maganjo' },
    params: { id: 'ps2' }
  };
  const res = createRes();

  await getPriceHistory(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(Array.isArray(res.body), true);
  assert.equal(res.body[0].action, 'update');
  assert.equal(res.body[0].nextPriceUgx, 36000);
});

test('updatePrice updates existing price and syncs procurements', async () => {
  // Set ting.
  const setting = {
    _id: 'ps3',
    branch: 'Maganjo',
    produceName: 'Red Beans',
    produceType: 'Beans',
    priceUgx: 35000,
    async save() {
      return this;
    }
  };

  PriceSetting.findById = async () => setting;
  PriceSetting.findOne = async () => null;
  let recordedHistory = null;
  PriceHistory.create = async (payload) => {
    recordedHistory = payload;
    return payload;
  };
  Procurement.updateMany = async () => ({ modifiedCount: 4 });

  // Configure req.
  const req = {
    user: { _id: 'manager-1', branch: 'Maganjo' },
    params: { id: 'ps3' },
    body: { priceUgx: 42000 }
  };
  const res = createRes();

  await updatePrice(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.setting.produceName, 'Red Beans');
  assert.equal(res.body.setting.priceUgx, 42000);
  assert.equal(res.body.updatedProcurements, 4);
  assert.equal(recordedHistory.action, 'update');
  assert.equal(recordedHistory.previousPriceUgx, 35000);
  assert.equal(recordedHistory.nextPriceUgx, 42000);
});

test('deletePrice deletes setting in same branch', async () => {
  // Set ting.
  const setting = {
    _id: 'ps4',
    branch: 'Maganjo',
    produceName: 'Beans A',
    produceType: 'Beans',
    priceUgx: 31000,
    async deleteOne() {}
  };
  PriceSetting.findById = async () => setting;
  let recordedHistory = null;
  PriceHistory.create = async (payload) => {
    recordedHistory = payload;
    return payload;
  };

  // Configure req.
  const req = {
    user: { _id: 'manager-1', branch: 'Maganjo' },
    params: { id: 'ps4' }
  };
  const res = createRes();

  await deletePrice(req, res);

  assert.equal(res.statusCode, 200);
  assert.match(res.body.message, /deleted/i);
  assert.equal(recordedHistory.action, 'delete');
  assert.equal(recordedHistory.previousPriceUgx, 31000);
  assert.equal(recordedHistory.nextPriceUgx, undefined);
});
