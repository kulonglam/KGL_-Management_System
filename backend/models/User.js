// Defines mongoose persistence schema, field constraints, and indexes for this domain entity.

import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';
import { excludeRemovedRecords } from '../utils/softDelete.js';

// Define user schema.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, match: /^[A-Za-z0-9\s.]+$/ },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, default: '', maxlength: 200 },
    profileImage: { type: String, default: '' },
    role: { type: String, enum: ['director', 'manager', 'sales_agent'], required: true },
    branch: {
      ...createBranchSchemaField({ required: false }),
      required() {
        return this.role !== 'director';
      }
    },
    authSource: { type: String, enum: ['local', 'oidc'], default: 'local' },
    oidcIssuer: { type: String, default: '' },
    oidcSubject: { type: String, default: '' },
    canViewCrossBranchTotals: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0, min: 0 },
    refreshTokenVersion: { type: Number, default: 0, min: 0 },
    refreshRotatedAt: { type: Date, default: null },
    previousRefreshJti: { type: String, default: '' },
    loginAttempts: { type: Number, default: 0, min: 0 },
    lockUntil: { type: Date, default: null },
    recoveryCodeHashes: { type: [String], default: [] },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: '' },
    mfaPendingSecret: { type: String, default: '' },
    mustChangePassword: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

userSchema.index({ branch: 1, role: 1 });
userSchema.index({ username: 1, lockUntil: 1 });
userSchema.index({ deletedAt: 1, branch: 1 });
userSchema.index({ oidcIssuer: 1, oidcSubject: 1 }, { sparse: true });
userSchema.index({ email: 1 }, { sparse: true });
excludeRemovedRecords(userSchema);

export default mongoose.model('User', userSchema);