// Validates required environment configuration so the server fails fast on invalid setup.

import { getJwtClaimOptions, parseAllowedOrigins, shouldEnableSwagger } from './security.js';
import { isValidTimeZone } from '../utils/businessTime.js';
import { parseNinKey } from '../utils/fieldEncryption.js';

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

  const oidcIssuer = String(process.env.OIDC_ISSUER || '').trim();
  const oidcClientId = String(process.env.OIDC_CLIENT_ID || '').trim();
  const oidcClientSecret = String(process.env.OIDC_CLIENT_SECRET || '').trim();
  const oidcRedirect = String(process.env.OIDC_REDIRECT_URI || '').trim();
  const oidcAny = Boolean(oidcIssuer || oidcClientId || oidcClientSecret || oidcRedirect);
  if (oidcAny) {
    assertCondition(
      Boolean(oidcIssuer && oidcClientId && oidcClientSecret && oidcRedirect),
      'OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, and OIDC_REDIRECT_URI must all be set together'
    );
    for (const name of ['OIDC_ISSUER', 'OIDC_REDIRECT_URI', 'OIDC_FRONTEND_REDIRECT']) {
      const value = String(process.env[name] || '').trim();
      if (!value) continue;
      assertCondition(URL.canParse(value), `${name} must be an absolute URL`);
    }
  }

  const businessTz = String(process.env.BUSINESS_TIMEZONE || '').trim();
  if (businessTz) {
    assertCondition(isValidTimeZone(businessTz), 'BUSINESS_TIMEZONE must be a valid IANA time zone');
  }

  const ninKey = String(process.env.NIN_ENCRYPTION_KEY || '').trim();
  if (ninKey) {
    assertCondition(
      parseNinKey(ninKey) !== null,
      'NIN_ENCRYPTION_KEY must be 32 bytes as 64 hex characters or base64'
    );
  } else if (nodeEnv === 'production') {
    assertCondition(false, 'NIN_ENCRYPTION_KEY is required in production');
  }
};

export { validateEnv };
