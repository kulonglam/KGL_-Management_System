# Karibu Groceries LTD - Frontend

Vue 3 + Vite frontend for Karibu Groceries LTD Management System.

## Prerequisites
- Node.js 16+
- Backend API running at `http://localhost:5000`

## Setup
```bash
cd frontend
npm install
```

Copy `.env.example` to `.env`.

Example:
```env
VITE_API_URL=/api/v1
```

## Run
```bash
npm run dev
```

App URL: `http://localhost:5173`

## Build and Preview
```bash
npm run build
npm run preview
```

## Role-Based UX
- Director: cross-branch analytics only
- Manager: full branch operations and administration
- Sales agent: sales workflows with role-limited actions

## Seeded Login Credentials
All seeded users use password `Karibu@2026!`.

- Director: `orban`
- Managers: `kulong` (Maganjo), `lam` (Matugga)
- Sales agents: `wuol`, `makhol` (Maganjo), `nyar`, `chuol` (Matugga)

## Quality Commands
```bash
npm run lint
npm test
```

## Related Docs
- Root README: `../README.md`
- User guide: `../USER_MANUAL.md`
- Database schema: `../DATABASE_SCHEMA.md`
- Demo script: `../DEMO_WALKTHROUGH.md`
