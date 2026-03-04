const WEAK_SECRET_HINTS = [
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
  const nodeEnv = process.env.NODE_ENV || 'development';
  const mongodbUri = String(process.env.MONGODB_URI || '').trim();
  const jwtSecret = String(process.env.JWT_SECRET || '').trim();
  const allowedOrigins = String(process.env.ALLOWED_ORIGINS || '').trim();

  assertCondition(mongodbUri.length > 0, 'MONGODB_URI is required');
  assertCondition(jwtSecret.length >= 32, 'JWT_SECRET must be at least 32 characters');
  assertCondition(
    !WEAK_SECRET_HINTS.some((hint) => jwtSecret.toLowerCase().includes(hint)),
    'JWT_SECRET appears weak/default. Use a high-entropy random secret.'
  );

  if (nodeEnv === 'production') {
    assertCondition(
      allowedOrigins.length > 0,
      'ALLOWED_ORIGINS must be set in production (comma-separated list)'
    );
  }
};

export { validateEnv };
