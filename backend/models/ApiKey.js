import mongoose from 'mongoose';

const API_KEY_SCOPES = ['stock:read', 'sales:read', 'procurement:read', 'prices:read'];

// Only a SHA-256 of the secret is stored; the full key is shown once at creation.
const apiKeySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    prefix: { type: String, required: true, unique: true },
    keyHash: { type: String, required: true },
    scopes: {
      type: [{ type: String, enum: API_KEY_SCOPES }],
      validate: { validator: (value) => Array.isArray(value) && value.length > 0, message: 'At least one scope is required' }
    },
    // Empty string = every branch.
    branch: { type: String, default: '' },
    expiresAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lastUsedAt: { type: Date, default: null },
    lastUsedIp: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

apiKeySchema.index({ revokedAt: 1, createdAt: -1 });

export { API_KEY_SCOPES };
export default mongoose.model('ApiKey', apiKeySchema);
