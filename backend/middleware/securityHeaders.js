/**
 * Applies defensive HTTP response headers for browser-facing API traffic.
 * File: backend/middleware/securityHeaders.js
 */

const getAllowedConnectSources = () => {
  // Local frontend origin used when ALLOWED_ORIGINS is not provided.
  const fallback = ['http://localhost:5173'];
  const raw = process.env.ALLOWED_ORIGINS || '';
  // Parse comma-separated CORS origins into trimmed CSP connect-src entries.
  const parsed = raw.split(',').map((origin) => origin.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : fallback;
};

const buildCspValue = () => {
  // Allow API/XHR/WebSocket connections only to self + configured client origins.
  const connectSources = ["'self'", ...getAllowedConnectSources()].join(' ');
  return [
    // Restrict all unspecified resource types to same-origin by default.
    "default-src 'self'",
    // Prevent attackers from changing document base URL for relative-path rewrites.
    "base-uri 'self'",
    // Disallow embedding in iframes to mitigate clickjacking.
    "frame-ancestors 'none'",
    // Block legacy plugin content such as Flash/Silverlight.
    "object-src 'none'",
    // Permit trusted images plus inline data/blob URLs used by previews.
    "img-src 'self' data: blob:",
    // Keep inline styles enabled for current UI stack compatibility.
    "style-src 'self' 'unsafe-inline'",
    // Only execute scripts served from same origin.
    "script-src 'self'",
    // Explicitly list endpoints the frontend can connect to.
    `connect-src ${connectSources}`
  ].join('; ');
};

// Apply security headers to every response before request handlers continue.
const securityHeaders = (req, res, next) => {
  // Central CSP policy controlling allowed content sources.
  res.setHeader('Content-Security-Policy', buildCspValue());
  // Prevent MIME-type sniffing.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Block page framing.
  res.setHeader('X-Frame-Options', 'DENY');
  // Disable DNS prefetch hints.
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  // Prevent Adobe cross-domain policy files from being honored.
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  // Limit referrer leakage on cross-origin requests.
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Disable powerful browser APIs not needed by this app.
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  // Isolate browsing context from cross-origin opener relationships.
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  // Restrict loading of resources by other origins.
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  if (process.env.NODE_ENV === 'production') {
    // Enforce HTTPS for one year (plus subdomains) in production deployments.
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

export { securityHeaders };
