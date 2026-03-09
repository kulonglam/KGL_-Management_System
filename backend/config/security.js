/**
 * Centralizes production-facing security configuration: allowed origins, JWT claims, and docs access.
 * File: backend/config/security.js
 */

import { timingSafeEqual } from 'node:crypto';

const FALLBACK_ALLOWED_ORIGINS = ['http://localhost:5173'];

const normalizeText = (value) => String(value || '').trim();

const getNodeEnv = () => normalizeText(process.env.NODE_ENV) || 'development';

const isProduction = () => getNodeEnv() === 'production';

const normalizeOrigin = (origin) => {
  const value = normalizeText(origin);
  if (!value) return '';

  if (value === '*') {
    throw new Error('Wildcard ALLOWED_ORIGINS is not allowed');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`Invalid origin URL: ${value}`);
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error(`Origin must use http or https: ${value}`);
  }

  return parsedUrl.origin;
};

const parseAllowedOrigins = (rawValue, options = {}) => {
  const { fallbackOrigins = FALLBACK_ALLOWED_ORIGINS } = options;
  const raw = normalizeText(rawValue);
  const values = raw
    ? raw.split(',').map((entry) => normalizeOrigin(entry)).filter(Boolean)
    : [];

  if (values.length > 0) {
    return [...new Set(values)];
  }

  return [...fallbackOrigins];
};

const getAllowedOrigins = () =>
  parseAllowedOrigins(process.env.ALLOWED_ORIGINS, {
    fallbackOrigins: FALLBACK_ALLOWED_ORIGINS
  });

const getJwtAlgorithms = () =>
  normalizeText(process.env.JWT_ALLOWED_ALGS || 'HS256')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const getJwtClaimOptions = () => {
  const issuer = normalizeText(process.env.JWT_ISSUER);
  const audience = normalizeText(process.env.JWT_AUDIENCE);
  const options = {};

  if (issuer) {
    options.issuer = issuer;
  }

  if (audience) {
    options.audience = audience;
  }

  return options;
};

const shouldEnableSwagger = () =>
  process.env.ENABLE_SWAGGER === 'true' ||
  (getNodeEnv() !== 'production' && process.env.ENABLE_SWAGGER !== 'false');

const getSwaggerCredentials = () => ({
  username: normalizeText(process.env.SWAGGER_USERNAME),
  password: normalizeText(process.env.SWAGGER_PASSWORD)
});

const safeEquals = (left, right) => {
  const leftValue = String(left || '');
  const rightValue = String(right || '');
  const leftBuffer = Buffer.from(leftValue);
  const rightBuffer = Buffer.from(rightValue);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

export {
  getAllowedOrigins,
  getJwtAlgorithms,
  getJwtClaimOptions,
  getSwaggerCredentials,
  isProduction,
  parseAllowedOrigins,
  safeEquals,
  shouldEnableSwagger
};
