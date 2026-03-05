/**
 * Defines mongoose persistence schema, field constraints, and indexes for this domain entity.
 * File: backend/models/StockLock.js
 */

import mongoose from 'mongoose';

// Define stock lock schema.
const stockLockSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true
    },
    ownerId: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

stockLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('StockLock', stockLockSchema);





