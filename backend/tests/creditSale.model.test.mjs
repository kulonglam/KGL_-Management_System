import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import CreditSale from '../models/CreditSale.js';

// Handle base payload.
const basePayload = () => ({
  buyerName: 'Trusted Buyer',
  nationalId: 'CM123456789012',
  location: 'Kampala',
  contact: '+256700000000',
  amountDueUgx: 50000,
  amountPaidUgx: 0,
  balanceUgx: 50000,
  salesAgentName: 'Agent One',
  dueDate: new Date('2026-03-10'),
  produceName: 'Ground Nut Lot',
  tonnageKg: 120,
  dateOfDispatch: new Date('2026-02-22'),
  branch: 'Maganjo',
  recordedBy: new mongoose.Types.ObjectId(),
  trustedBuyer: new mongoose.Types.ObjectId()
});

test('CreditSale accepts legacy produceType aliases and stores canonical Groundnuts', () => {
  const doc = new CreditSale({
    ...basePayload(),
    produceType: 'G-nuts'
  });

  const error = doc.validateSync();
  assert.equal(error?.errors?.produceType, undefined);
  assert.equal(doc.produceType, 'Groundnuts');
});

test('CreditSale normalizes spacing variants to canonical Groundnuts', () => {
  const doc = new CreditSale({
    ...basePayload(),
    produceType: 'Ground nuts'
  });

  const error = doc.validateSync();
  assert.equal(error?.errors?.produceType, undefined);
  assert.equal(doc.produceType, 'Groundnuts');
});

test('CreditSale still rejects unsupported produceType values', () => {
  const doc = new CreditSale({
    ...basePayload(),
    produceType: 'Ground Nutz'
  });

  const error = doc.validateSync();
  assert.ok(error?.errors?.produceType);
});
