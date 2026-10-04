// Defines mongoose persistence schema, field constraints, and indexes for this domain entity.

import mongoose from 'mongoose';
import { createBranchSchemaField } from '../config/branches.js';

// Define user schema.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, match: /^[A-Za-z0-9\s.]+$/ },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: '' },
    role: { type: String, enum: ['director', 'manager', 'sales_agent'], required: true },
    branch: {
      ...createBranchSchemaField({ required: false }),
      required() {
        return this.role !== 'director';
      }
    },
    canViewCrossBranchTotals: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0, min: 0 },
    refreshTokenVersion: { type: Number, default: 0, min: 0 },
    loginAttempts: { type: Number, default: 0, min: 0 },
    lockUntil: { type: Date, default: null },
    recoveryCodeHashes: { type: [String], default: [] },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: '' },
    mfaPendingSecret: { type: String, default: '' }
  },
  {
    timestamps: true
  }
);

userSchema.index({ branch: 1, role: 1 });
userSchema.index({ username: 1, lockUntil: 1 });

export default mongoose.model('User', userSchema);