// Protects sensitive operational docs endpoints when they are exposed in production.


import { getSwaggerCredentials, isProduction, safeEquals } from '../config/security.js';

const decodeBasicAuth = (headerValue) => {
  if (!headerValue || !headerValue.startsWith('Basic ')) {
    return null;
  }

  const encoded = headerValue.slice('Basic '.length).trim();
  if (!encoded) {
    return null;
  }

  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex < 0) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1)
    };
  } catch {
    return null;
  }
};

const docsAuth = (req, res, next) => {
  const { username, password } = getSwaggerCredentials();
  const requireAuth = isProduction() || Boolean(username || password);

  if (!requireAuth) {
    return next();
  }

  const credentials = decodeBasicAuth(req.headers.authorization);
  if (
    credentials &&
    safeEquals(credentials.username, username) &&
    safeEquals(credentials.password, password)
  ) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Karibu API Docs"');
  return res.status(401).json({ message: 'Authentication required' });
};

export { docsAuth };