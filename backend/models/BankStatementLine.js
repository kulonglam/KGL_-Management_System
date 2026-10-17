import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';

const bankStatementLineSchema = new mongoose.Schema(
  {
    branch: createBranchSchemaField(),
    statementDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    description: { type: String, default: '', maxlength: 300 },
    amountUgx: { type: Number, required: true, min: 1 },
    direction: { type: String, enum: ['in', 'out'], required: true },
    matchedRefType: { type: String, default: '' },
    matchedRefId: { type: String, default: '' },
    matchedAt: { type: Date, default: null },
    importedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

bankStatementLineSchema.index({ branch: 1, statementDate: 1 });
bankStatementLineSchema.index({ matchedRefId: 1 });

export default mongoose.model('BankStatementLine', bankStatementLineSchema);
