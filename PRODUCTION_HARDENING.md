# Production Hardening Guide

This document captures production-hardening controls implemented across five pillars.

## 1. Security
- Security headers middleware enabled (`backend/middleware/securityHeaders.js`).
- CORS is environment-driven via `ALLOWED_ORIGINS`.
- Body size limits are environment-driven via `REQUEST_BODY_LIMIT`.
- Layered rate limits:
  - Global API limiter
  - Strict auth limiter
  - Write-operation limiter
- Centralized request validation for API payloads (`backend/validators/requestValidators.js`).

## 2. Reliability
- Health probes:
  - `GET /healthz`
  - `GET /readyz`
- Graceful shutdown handlers for `SIGINT`/`SIGTERM`.
- Configurable server timeouts:
  - `SERVER_REQUEST_TIMEOUT_MS`
  - `SERVER_HEADERS_TIMEOUT_MS`
  - `SERVER_SHUTDOWN_TIMEOUT_MS`

## 3. Performance
- Optional pagination added for list endpoints using `page` and `limit`.
- `lean()` query usage on read-heavy endpoints.
- Additional MongoDB indexes for core query paths:
  - Procurement
  - Sales
  - Credit sales
  - Trusted buyers
  - Users

## 4. Observability
- Request correlation IDs (`X-Request-Id`) added to all requests.
- Structured JSON access logs with request timing.
- Error logs include request context and request ID.

## 5. Delivery / Operations
- CI pipeline (`.github/workflows/ci.yml`) for:
  - Backend lint + tests
  - Frontend lint + build
- Containerization:
  - `backend/Dockerfile`
  - `frontend/Dockerfile`
- Environment templates:
  - `backend/.env.example`
  - `frontend/.env.example`

## Environment Variables
Use `backend/.env.example` and `frontend/.env.example` as baseline.

## Operational Checklist
1. Set secure `JWT_SECRET` and CORS origins in production.
2. Run `npm run lint` and `npm test` in backend before deployment.
3. Deploy with health checks wired to `/healthz` and `/readyz`.
