/**
 * Validates required environment configuration so the server fails fast on invalid setup.
 * File: backend/config/env.js
 */

const WEAK_SECRET_HINTS = [
  // Block common placeholder/default secrets that are unsafe for JWT signing.
  'replace_with_secure_secret',
  'changeme',
  'change_me',
  'default',
  'secret',
  'password',
  'test-secret'
];

const assertCondition = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const validateEnv = () => {
  // Use development defaults for local runs when NODE_ENV is not explicitly set.
  const nodeEnv = process.env.NODE_ENV || 'development';
  const mongodbUri = String(process.env.MONGODB_URI || '').trim();
  const jwtSecret = String(process.env.JWT_SECRET || '').trim();
  const allowedOrigins = String(process.env.ALLOWED_ORIGINS || '').trim();

  // Backend cannot start without a database connection target.
  assertCondition(mongodbUri.length > 0, 'MONGODB_URI is required');
  // Enforce minimum entropy for token-signing secret.
  assertCondition(jwtSecret.length >= 32, 'JWT_SECRET must be at least 32 characters');
  assertCondition(
    // Reject secrets that still look like defaults even if length appears sufficient.
    !WEAK_SECRET_HINTS.some((hint) => jwtSecret.toLowerCase().includes(hint)),
    'JWT_SECRET appears weak/default. Use a high-entropy random secret.'
  );

  if (nodeEnv === 'production') {
    // Explicit CORS allowlist is mandatory in production deployments.
    assertCondition(
      allowedOrigins.length > 0,
      'ALLOWED_ORIGINS must be set in production (comma-separated list)'
    );
  }
};

export { validateEnv };
