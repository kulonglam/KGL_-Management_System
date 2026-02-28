import test from 'node:test';
import assert from 'node:assert/strict';
import { validationResult } from 'express-validator';
import {
  procurementCreateValidation,
  saleCreateValidation,
  creditSaleCreateValidation,
  trustedBuyerCreateValidation
} from '../validators/requestValidators.js';

const runValidation = async ({ rules, body = {}, params = {}, query = {} }) => {
  const req = { body, params, query };

  for (const rule of rules) {
    await rule.run(req);
  }

  return validationResult(req).array().map((entry) => ({
    field: entry.path,
    message: entry.msg
  }));
};

const hasFieldError = (errors, field) => errors.some((entry) => entry.field === field);

const oneDayMs = 24 * 60 * 60 * 1000;
const tomorrowIso = new Date(Date.now() + oneDayMs).toISOString().split('T')[0];
const yesterdayIso = new Date(Date.now() - oneDayMs).toISOString().split('T')[0];

const validProcurementPayload = () => ({
  produceName: 'Beans A1',
  produceType: 'Beans',
  sourceType: 'company',
  dateReceived: '2026-02-27',
  timeReceived: '08:30',
  tonnageKg: 500,
  costUgx: 15000,
  sellingPrice: 18000,
  dealerName: 'Dealer 1',
  dealerContact: '+256700000001'
});

const validSalePayload = () => ({
  produceName: 'Beans A1',
  produceType: 'Beans',
  tonnageKg: 5,
  buyerName: 'Buyer 1',
  date: '2026-02-27',
  time: '10:15'
});

const validCreditSalePayload = () => ({
  trustedBuyerId: '507f1f77bcf86cd799439011',
  dueDate: tomorrowIso,
  dateOfDispatch: '2026-02-27',
  produceName: 'Beans A1',
  produceType: 'Beans',
  tonnageKg: 5
});

const validTrustedBuyerPayload = () => ({
  name: 'Buyer 12',
  nationalId: 'CF120000000000',
  location: 'Kampala 1',
  contact: '+256700000001'
});

test('procurement validation accepts a valid strict payload', async () => {
  const errors = await runValidation({
    rules: procurementCreateValidation,
    body: validProcurementPayload()
  });

  assert.equal(errors.length, 0);
});

test('procurement validation rejects missing sellingPrice', async () => {
  const payload = validProcurementPayload();
  delete payload.sellingPrice;

  const errors = await runValidation({
    rules: procurementCreateValidation,
    body: payload
  });

  assert.equal(hasFieldError(errors, 'sellingPrice'), true);
});

test('procurement validation rejects invalid dealer contact', async () => {
  const payload = validProcurementPayload();
  payload.dealerContact = '12345';

  const errors = await runValidation({
    rules: procurementCreateValidation,
    body: payload
  });

  assert.equal(hasFieldError(errors, 'dealerContact'), true);
});

test('procurement validation enforces individual minimum tonnage', async () => {
  const payload = validProcurementPayload();
  payload.sourceType = 'individual';
  payload.tonnageKg = 500;

  const errors = await runValidation({
    rules: procurementCreateValidation,
    body: payload
  });

  assert.equal(hasFieldError(errors, 'tonnageKg'), true);
});

test('sale validation accepts a valid strict payload', async () => {
  const errors = await runValidation({
    rules: saleCreateValidation,
    body: validSalePayload()
  });

  assert.equal(errors.length, 0);
});

test('sale validation rejects invalid buyer name', async () => {
  const payload = validSalePayload();
  payload.buyerName = 'Buyer#1';

  const errors = await runValidation({
    rules: saleCreateValidation,
    body: payload
  });

  assert.equal(hasFieldError(errors, 'buyerName'), true);
});

test('sale validation rejects missing transaction date', async () => {
  const payload = validSalePayload();
  payload.date = '';

  const errors = await runValidation({
    rules: saleCreateValidation,
    body: payload
  });

  assert.equal(hasFieldError(errors, 'date'), true);
});

test('credit sale validation accepts a valid strict payload', async () => {
  const errors = await runValidation({
    rules: creditSaleCreateValidation,
    body: validCreditSalePayload()
  });

  assert.equal(errors.length, 0);
});

test('credit sale validation rejects past due date', async () => {
  const payload = validCreditSalePayload();
  payload.dueDate = yesterdayIso;

  const errors = await runValidation({
    rules: creditSaleCreateValidation,
    body: payload
  });

  assert.equal(hasFieldError(errors, 'dueDate'), true);
});

test('credit sale validation rejects missing produceType', async () => {
  const payload = validCreditSalePayload();
  payload.produceType = '';

  const errors = await runValidation({
    rules: creditSaleCreateValidation,
    body: payload
  });

  assert.equal(hasFieldError(errors, 'produceType'), true);
});

test('trusted buyer validation accepts a valid strict payload', async () => {
  const errors = await runValidation({
    rules: trustedBuyerCreateValidation,
    body: validTrustedBuyerPayload()
  });

  assert.equal(errors.length, 0);
});

test('trusted buyer validation rejects invalid NIN and contact', async () => {
  const payload = validTrustedBuyerPayload();
  payload.nationalId = 'AB123';
  payload.contact = '07000';

  const errors = await runValidation({
    rules: trustedBuyerCreateValidation,
    body: payload
  });

  assert.equal(hasFieldError(errors, 'nationalId'), true);
  assert.equal(hasFieldError(errors, 'contact'), true);
});
