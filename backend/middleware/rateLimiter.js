// Provides reusable Express middleware for auth, validation, security, logging, and response shaping.

import rateLimit from 'express-rate-limit';

const skipApiRateLimit = (req) => req.path === '/healthz' || req.path === '/readyz';

// Configure api limiter. Health probes stay outside the public quota.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX || 300),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipApiRateLimit
});

// Configure auth limiter.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Configure write limiter.
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.WRITE_RATE_LIMIT_MAX || 120),
  message: 'Too many write requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

export { apiLimiter, authLimiter, skipApiRateLimit, writeLimiter };