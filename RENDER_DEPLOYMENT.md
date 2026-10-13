# Render Deployment Guide

This repository deploys to Render through `render.yaml`:
- `kgl-backend` as a Node web service
- `kgl-frontend` as a static site

Docker is not required for this deployment setup.

## 1. Prerequisites
- Push this repo to GitHub or GitLab.
- Have a MongoDB connection string ready.

## 2. Create Services on Render
1. In Render, click **New +** -> **Blueprint**.
2. Select this repository.
3. Render will detect `render.yaml` and propose both services.

## 3. Required Backend Environment Variables
In `kgl-backend`, confirm these values:
- `MONGODB_URI` = your production database URI
- `JWT_SECRET` = high-entropy secret
- `JWT_ISSUER` = your backend Render URL, for example `https://kgl-backend.onrender.com`
- `JWT_AUDIENCE` = `karibu-groceries-api`
- `ALLOWED_ORIGINS` = your frontend Render URL, for example `https://kgl-frontend.onrender.com`
- `ENABLE_SWAGGER` = `false` in production unless you explicitly want docs enabled

If you enable Swagger in production, also set:
- `SWAGGER_USERNAME`
- `SWAGGER_PASSWORD`

If your real service URLs differ from the defaults in `render.yaml`, update:
- backend `JWT_ISSUER`
- backend `ALLOWED_ORIGINS`
- frontend `VITE_API_URL` (use `https://<backend-host>/api/v1`)

## 4. Seed Fresh Data
After backend deploy succeeds:

Using Render shell:
```bash
node seedData.js
```

Or from your local machine against the same database:
```bash
cd backend
npm install
node seedData.js
```

## 5. Health And Login Check
- Backend readiness: `https://<your-backend-url>/readyz` (returns 503 until MongoDB is connected)
- Frontend: open your Render frontend URL
- Seeded users:
  - Director: `orban`
  - Managers: `kulong`, `lam`
  - Sales agents: `wuol`, `makhol`, `nyar`, `chuol`
- Password: from `SEED_DEFAULT_PASSWORD` env var if set, otherwise `Karibu@2026!`
- Production seed is refused unless `ALLOW_PRODUCTION_SEED=true` and `SEED_DEFAULT_PASSWORD` is not the documented demo password. Every seed writes a snapshot before it clears data. In production that snapshot must also be copied to `BACKUP_UPLOAD_URL` (https). A local folder alone stops the seed before any collection is cleared.
- `kgl-backup` is a Render cron. It runs `npm run backup` every day at 02:15 UTC. Set `MONGODB_URI` and `BACKUP_UPLOAD_URL` on that cron. `BACKUP_UPLOAD_TOKEN` is sent as a bearer token when it is set. The cron fails when the copy does not leave the machine. Render bills the cron after the blueprint is applied.
- Restore a downloaded copy with `CONFIRM_DATABASE_RESTORE=yes npm run restore -- <backup-directory-or-json>` from `backend`. In production also set `ALLOW_PRODUCTION_RESTORE=true`.

## 6. Common Deploy Failure
If Render crashes with:

```text
JWT_ISSUER must be set in production
```

the backend is missing one or more required production env vars. Re-check:
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `ALLOWED_ORIGINS`
- `MONGODB_URI`
- `JWT_SECRET`
