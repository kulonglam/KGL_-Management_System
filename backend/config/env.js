// Validates required environment configuration so the server fails fast on invalid setup.

import { getJwtClaimOptions, parseAllowedOrigins, shouldEnableSwagger } from './security.js';

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
  const swaggerUsername = String(process.env.SWAGGER_USERNAME || '').trim();
  const swaggerPassword = String(process.env.SWAGGER_PASSWORD || '').trim();
  const jwtClaimOptions = getJwtClaimOptions();

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
    assertCondition(parseAllowedOrigins(allowedOrigins, { fallbackOrigins: [] }).length > 0,
      'ALLOWED_ORIGINS must contain valid http/https origins in production');
    assertCondition(
      String(jwtClaimOptions.issuer || '').length > 0,
      'JWT_ISSUER must be set in production'
    );
    assertCondition(
      String(jwtClaimOptions.audience || '').length > 0,
      'JWT_AUDIENCE must be set in production'
    );

    if (shouldEnableSwagger()) {
      assertCondition(swaggerUsername.length >= 3,
        'SWAGGER_USERNAME must be set when Swagger is enabled in production');
      assertCondition(swaggerPassword.length >= 12,
        'SWAGGER_PASSWORD must be at least 12 characters when Swagger is enabled in production');
    }
  }
};

export { validateEnv };
