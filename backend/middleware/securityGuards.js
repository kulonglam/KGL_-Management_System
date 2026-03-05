// Provides reusable Express middleware for auth, validation, security, logging, and response shaping.
 //File: backend/middleware/securityGuards.js
 

const POLLUTION_BLOCKLIST = new Set(['__proto__', 'prototype', 'constructor']);

// Strip keys that can trigger NoSQL/operator injection or prototype pollution.
const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const sanitized = {};
  Object.entries(value).forEach(([key, entry]) => {
    if (
      POLLUTION_BLOCKLIST.has(key) ||
      key.startsWith('$') ||
      key.includes('.')
    ) {
      return;
    }

    sanitized[key] = sanitizeValue(entry);
  });

  return sanitized;
};

// Normalize incoming payloads before validators/controllers execute.
const sanitizeRequestPayload = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
};

// Reject repeated query keys (e.g. ?role=a&role=b) to avoid parameter pollution ambiguity.
const rejectParameterPollution = (req, res, next) => {
  const pollutedKeys = Object.entries(req.query || {})
    .filter(([, value]) => Array.isArray(value))
    .map(([key]) => key);

  if (pollutedKeys.length > 0) {
    return res.status(400).json({
      message: `Repeated query parameter is not allowed: ${pollutedKeys.join(', ')}`
    });
  }

  return next();
};

// Enforce HTTPS for production traffic.
const enforceHttpsInProduction = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  const isSecure = req.secure || forwardedProto === 'https';

  if (!isSecure) {
    return res.status(400).json({ message: 'HTTPS is required' });
  }

  return next();
};

export { sanitizeRequestPayload, rejectParameterPollution, enforceHttpsInProduction };





