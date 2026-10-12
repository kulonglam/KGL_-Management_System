import { isProduction } from '../config/security.js';

const REFRESH_COOKIE_NAME = 'kgl_refresh';
const REFRESH_COOKIE_PATH = '/api';
const LEGACY_REFRESH_COOKIE_PATH = '/api/auth';

const parseCookieValue = (cookieHeader, name) => {
  if (!cookieHeader) return '';
  const parts = String(cookieHeader).split(';');
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      return decodeURIComponent(rest.join('=') || '');
    }
  }
  return '';
};

const getRefreshCookieOptions = () => {
  const crossSite = String(process.env.COOKIE_SAMESITE || '').toLowerCase() === 'none' || isProduction();
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true' || isProduction() || crossSite,
    sameSite: crossSite ? 'none' : 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
};

const sameSiteDirective = (sameSite) => {
  const value = String(sameSite || 'lax').toLowerCase();
  if (value === 'none') return 'None';
  if (value === 'strict') return 'Strict';
  return 'Lax';
};

const serializeRefreshCookie = (token, options) => {
  const parts = [
    `${REFRESH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Path=${options.path}`,
    `Max-Age=${Math.max(Math.floor(Number(options.maxAge) / 1000), 0)}`,
    `SameSite=${sameSiteDirective(options.sameSite)}`
  ];
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
};

const writeSetCookie = (res, serialized) => {
  if (typeof res.append === 'function') {
    res.append('Set-Cookie', serialized);
    return;
  }
  if (typeof res.setHeader === 'function') {
    const current = typeof res.getHeader === 'function' ? res.getHeader('Set-Cookie') : undefined;
    const next = current ? [].concat(current, serialized) : serialized;
    res.setHeader('Set-Cookie', next);
  }
};

const setRefreshCookie = (res, token) => {
  const options = getRefreshCookieOptions();
  if (typeof res.cookie === 'function' && typeof res.append !== 'function') {
    res.cookie(REFRESH_COOKIE_NAME, token, options);
    if (typeof res.clearCookie === 'function') {
      res.clearCookie(REFRESH_COOKIE_NAME, {
        ...options,
        path: LEGACY_REFRESH_COOKIE_PATH,
        maxAge: 0
      });
    }
    return;
  }

  writeSetCookie(res, serializeRefreshCookie(token, options));
  writeSetCookie(
    res,
    serializeRefreshCookie('', { ...options, path: LEGACY_REFRESH_COOKIE_PATH, maxAge: 0 })
  );
};

const clearRefreshCookie = (res) => {
  const options = { ...getRefreshCookieOptions(), maxAge: 0 };
  if (typeof res.clearCookie === 'function' && typeof res.append !== 'function') {
    res.clearCookie(REFRESH_COOKIE_NAME, options);
    res.clearCookie(REFRESH_COOKIE_NAME, { ...options, path: LEGACY_REFRESH_COOKIE_PATH });
    return;
  }

  writeSetCookie(res, serializeRefreshCookie('', options));
  writeSetCookie(res, serializeRefreshCookie('', { ...options, path: LEGACY_REFRESH_COOKIE_PATH }));
};

const readRefreshCookie = (req) => parseCookieValue(req.headers?.cookie, REFRESH_COOKIE_NAME);

export { REFRESH_COOKIE_NAME, clearRefreshCookie, readRefreshCookie, setRefreshCookie };
