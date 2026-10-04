import { isProduction } from '../config/security.js';

const REFRESH_COOKIE_NAME = 'kgl_refresh';

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
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
};

const setRefreshCookie = (res, token) => {
  if (typeof res.cookie === 'function') {
    res.cookie(REFRESH_COOKIE_NAME, token, getRefreshCookieOptions());
  }
};

const clearRefreshCookie = (res) => {
  if (typeof res.clearCookie === 'function') {
    res.clearCookie(REFRESH_COOKIE_NAME, { ...getRefreshCookieOptions(), maxAge: 0 });
  }
};

const readRefreshCookie = (req) => parseCookieValue(req.headers?.cookie, REFRESH_COOKIE_NAME);

export { REFRESH_COOKIE_NAME, clearRefreshCookie, readRefreshCookie, setRefreshCookie };
