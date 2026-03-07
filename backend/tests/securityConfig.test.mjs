import test from 'node:test';
import assert from 'node:assert/strict';
import { getJwtClaimOptions, parseAllowedOrigins } from '../config/security.js';

test('parseAllowedOrigins normalizes and deduplicates configured origins', () => {
  const origins = parseAllowedOrigins(
    'https://app.example.com, https://app.example.com , http://localhost:5173',
    { fallbackOrigins: [] }
  );

  assert.deepEqual(origins, ['https://app.example.com', 'http://localhost:5173']);
});

test('parseAllowedOrigins rejects wildcard origins', () => {
  assert.throws(
    () => parseAllowedOrigins('*', { fallbackOrigins: [] }),
    /Wildcard ALLOWED_ORIGINS is not allowed/
  );
});

test('getJwtClaimOptions returns configured issuer and audience', () => {
  const originalIssuer = process.env.JWT_ISSUER;
  const originalAudience = process.env.JWT_AUDIENCE;

  process.env.JWT_ISSUER = 'karibu-api';
  process.env.JWT_AUDIENCE = 'karibu-web';

  try {
    assert.deepEqual(getJwtClaimOptions(), {
      issuer: 'karibu-api',
      audience: 'karibu-web'
    });
  } finally {
    if (originalIssuer === undefined) {
      delete process.env.JWT_ISSUER;
    } else {
      process.env.JWT_ISSUER = originalIssuer;
    }

    if (originalAudience === undefined) {
      delete process.env.JWT_AUDIENCE;
    } else {
      process.env.JWT_AUDIENCE = originalAudience;
    }
  }
});
