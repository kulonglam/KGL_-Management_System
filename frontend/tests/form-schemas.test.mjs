import test from 'node:test';
import assert from 'node:assert/strict';
import { validateValues } from '../src/utils/formValidation.js';
import {
  procurementValidationSchema,
  salesValidationSchema,
  trustedBuyerValidationSchema
} from '../src/utils/formSchemas.js';
import { validatePriceTarget } from '../src/utils/pricing/priceManagement.js';

test('sales validation uses the shared buyer-name minimum-length message', () => {
  const result = validateValues(
    {
      produceName: 'Beans',
      tonnageKg: 10,
      buyerName: 'L',
      date: '2026-03-09',
      time: '12:30'
    },
    salesValidationSchema
  );

  assert.equal(result.errors.buyerName, 'Buyer Name must be at least 2 characters.');
});

test('procurement validation uses the shared local phone message', () => {
  const result = validateValues(
    {
      produceName: 'Groundnuts',
      produceType: 'Groundnuts',
      sourceType: 'company',
      dateReceived: '2026-03-09',
      timeReceived: '12:30',
      tonnageKg: 500,
      costUgx: 10000,
      sellingPrice: 12000,
      dealerName: 'KGL Dealer',
      dealerContact: '075'
    },
    procurementValidationSchema
  );

  assert.equal(result.errors.dealerContact, 'Dealer Contact must use the 07XXXXXXXX format.');
});

test('trusted-buyer validation uses the shared NIN message', () => {
  const result = validateValues(
    {
      name: 'Karibu Buyer',
      nationalId: '12345',
      location: 'Matugga',
      contact: '0701234567'
    },
    trustedBuyerValidationSchema
  );

  assert.equal(result.errors.nationalId, 'National ID must be a valid NIN.');
});

test('price management validation uses the shared produce-type required message', () => {
  const error = validatePriceTarget({
    produceName: 'Red Beans',
    produceType: '',
    priceUgx: 36000
  });

  assert.equal(error, 'Produce Type is required.');
});

test('price management validation uses the shared price minimum message', () => {
  const error = validatePriceTarget({
    produceName: 'Red Beans',
    produceType: 'Beans',
    priceUgx: 9000
  });

  assert.equal(error, 'Price per kg (UGX) must be at least 10000.');
});
