# Karibu Groceries LTD Management System

Karibu Groceries LTD Management System is a full-stack web application for branch-level wholesale produce operations and executive reporting.

## Core Features
1. Procurement and inventory control
2. Cash and credit sales management
3. Role-based dashboards and governance controls

## Tech Stack
- Frontend: Vue 3, Vite, Bootstrap 5
- Backend: Node.js, Express, MongoDB, Mongoose
- Testing: Node test runner, Vitest, Supertest

## Repository Structure
- `frontend/` - Vue application
- `backend/` - Express API and MongoDB models
- `shared/` - shared assets/utilities
- `USER_MANUAL.md` - end-user guide
- `DATABASE_SCHEMA.md` - database schema and sample data reference
- `DEMO_WALKTHROUGH.md` - live/recorded demo script

## Quick Start
### 1. Backend
```bash
cd backend
npm install
```

Copy `backend/.env.example` to `backend/.env`, then update values if needed.

```bash
npm run seed
npm run dev
```

Backend default URL: `http://localhost:5000`

### 2. Frontend
```bash
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env`.

```bash
npm run dev
```

Frontend default URL: `http://localhost:5173`

## Seeded Login Credentials
All seeded users use password `Karibu@2026!`.

- Director: `orban`
- Managers: `kulong` (Maganjo), `lam` (Matugga)
- Sales agents: `agent1A`, `agent2A` (Maganjo), `agent1B`, `agent2B` (Matugga)

## Deploy on Render
Use the included Render blueprint and setup guide:
- `render.yaml`
- `RENDER_DEPLOYMENT.md`

## Quality Checks
Run these before submission/deployment:

```bash
# backend
cd backend
npm run lint
npm test

# frontend
cd frontend
npm run lint
npm test
```

## Required Deliverables Mapping
- Fully functional web application with three core features:
  - Implemented in `frontend/` and `backend/` with role-based workflows and tested endpoints/components.
- Complete source code with comments/documentation:
  - Source in `frontend/`, `backend/`, `shared/` plus technical docs in this repository.
- Database schema and sample data:
  - See `DATABASE_SCHEMA.md` and `backend/seedData.js`.
- User guide or README:
  - See `USER_MANUAL.md` (primary) and this `README.md`.
  
