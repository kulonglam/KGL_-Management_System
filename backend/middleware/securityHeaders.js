const getAllowedConnectSources = () => {
  const fallback = ['http://localhost:5173'];
  const raw = process.env.ALLOWED_ORIGINS || '';
  const parsed = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : fallback;
};

const buildCspValue = () => {
  const connectSources = ["'self'", ...getAllowedConnectSources()].join(' ');
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    `connect-src ${connectSources}`
  ].join('; ');
};

// Apply hardening headers for browser clients.
const securityHeaders = (req, res, next) => {
  res.setHeader('Content-Security-Policy', buildCspValue());
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

export { securityHeaders };
