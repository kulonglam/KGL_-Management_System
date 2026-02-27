import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import CreditSale from '../models/CreditSale.js';

// Handle base payload.
const basePayload = () => ({
  buyerName: 'Trusted Buyer',
  nationalId: 'CM1234567890AB',
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

test('CreditSale accepts produceType with hyphen (G-nuts)', () => {
  const doc = new CreditSale({
    ...basePayload(),
    produceType: 'G-nuts'
  });

  const error = doc.validateSync();
  assert.equal(error?.errors?.produceType, undefined);
});

test('CreditSale normalizes unicode hyphen variants to canonical G-nuts', () => {
  const doc = new CreditSale({
    ...basePayload(),
    produceType: 'G‑nuts'
  });

  const error = doc.validateSync();
  assert.equal(error?.errors?.produceType, undefined);
  assert.equal(doc.produceType, 'G-nuts');
});

test('CreditSale still rejects unsupported produceType values', () => {
  const doc = new CreditSale({
    ...basePayload(),
    produceType: 'Groundnuts'
  });

  const error = doc.validateSync();
  assert.ok(error?.errors?.produceType);
});
