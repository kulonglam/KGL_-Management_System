import mongoose from 'mongoose';

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'income', 'expense'];

const DEFAULT_ACCOUNTS = [
  { code: '1000', name: 'Cash', type: 'asset' },
  { code: '1010', name: 'Mobile money', type: 'asset' },
  { code: '1020', name: 'Bank', type: 'asset' },
  { code: '1100', name: 'Accounts receivable', type: 'asset' },
  { code: '1200', name: 'Inventory', type: 'asset' },
  { code: '2000', name: 'Accounts payable', type: 'liability' },
  { code: '2100', name: 'VAT output', type: 'liability' },
  { code: '3000', name: 'Retained earnings', type: 'equity' },
  { code: '1500', name: 'Fixed assets', type: 'asset' },
  { code: '1600', name: 'Accumulated depreciation', type: 'asset' },
  { code: '4000', name: 'Sales', type: 'income' },
  { code: '2200', name: 'NSSF payable', type: 'liability' },
  { code: '2300', name: 'PAYE payable', type: 'liability' },
  { code: '5000', name: 'Purchases', type: 'expense' },
  { code: '6100', name: 'Bad debt', type: 'expense' },
  { code: '6200', name: 'Depreciation', type: 'expense' },
  { code: '6300', name: 'Salaries', type: 'expense' },
  { code: '6400', name: 'Fuel', type: 'expense' }
];

const glAccountSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, maxlength: 40 },
    name: { type: String, required: true, maxlength: 80 },
    type: { type: String, required: true, enum: ACCOUNT_TYPES },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export { ACCOUNT_TYPES, DEFAULT_ACCOUNTS };
export default mongoose.model('GlAccount', glAccountSchema);
