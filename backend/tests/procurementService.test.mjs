import test from 'node:test';
import assert from 'node:assert/strict';
import PriceSetting from '../models/PriceSetting.js';
import {
  resolveSellingPrice,
  resolveSellingPriceDetails
} from '../services/procurementService.js';

const originalFind = PriceSetting.find;

test.afterEach(() => {
  PriceSetting.find = originalFind;
});

test('resolveSellingPrice falls back to a legacy blank-string type-default row', async () => {
  PriceSetting.find = () => ({
    lean: async () => [
      {
        branch: 'Maganjo',
        produceType: 'Beans',
        produceName: '',
        priceUgx: 36000
      }
    ]
  });

  const price = await resolveSellingPrice({
    branch: 'Maganjo',
    produceName: 'Yellow Beans',
    produceType: 'Beans'
  });

  assert.equal(price, 36000);
});

test('resolveSellingPrice matches produce-specific prices despite harmless spacing differences', async () => {
  PriceSetting.find = () => ({
    lean: async () => [
      {
        branch: 'Maganjo',
        produceType: 'Soybeans',
        produceName: 'Soybeans Grade1',
        priceUgx: 45000
      }
    ]
  });

  const resolution = await resolveSellingPriceDetails({
    branch: 'Maganjo',
    produceName: 'Soybeans Grade 1',
    produceType: 'Soybeans'
  });

  assert.equal(resolution.priceUgx, 45000);
  assert.equal(resolution.produceName, 'Soybeans Grade1');
  assert.equal(resolution.scope, 'specific');
});

test('resolveSellingPrice accepts legacy groundnut type rows after type normalization', async () => {
  PriceSetting.find = () => ({
    lean: async () => [
      {
        branch: 'Maganjo',
        produceType: 'G-nuts',
        produceName: 'Ground Nuts',
        priceUgx: 55000
      }
    ]
  });

  const resolution = await resolveSellingPriceDetails({
    branch: 'Maganjo',
    produceName: 'Ground Nuts',
    produceType: 'Groundnuts'
  });

  assert.equal(resolution.priceUgx, 55000);
  assert.equal(resolution.produceName, 'Groundnuts');
  assert.equal(resolution.produceType, 'Groundnuts');
});

test('resolveSellingPrice reports the exact missing target and available branch prices', async () => {
  PriceSetting.find = () => ({
    lean: async () => [
      {
        branch: 'Maganjo',
        produceType: 'Beans',
        produceName: 'Red Beans',
        priceUgx: 37000
      },
      {
        branch: 'Maganjo',
        produceType: 'Beans',
        produceName: 'Yellow Beans',
        priceUgx: 36000
      }
    ]
  });

  await assert.rejects(
    () =>
      resolveSellingPrice({
        branch: 'Maganjo',
        produceName: 'Beans',
        produceType: 'Beans'
      }),
    /No manager price found for Beans \(Beans\) in Maganjo\. Available Beans prices in this branch: Red Beans, Yellow Beans\./
  );
});
