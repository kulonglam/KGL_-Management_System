# Karibu Groceries LTD Management System

Karibu Groceries LTD Management System is a full-stack web application for managing procurement, branch stock, cash sales, credit sales, trusted buyers, pricing, and executive reporting for Karibu Groceries LTD.

## Project Summary

The system replaces manual record-keeping in black books with a web-based platform that supports:

- branch-level procurement recording
- stock-aware cash sales
- trusted-buyer credit sales and repayment tracking
- price management by branch
- role-based access for director, manager, and sales agent
- dashboard reporting and export

## Core Features

1. **Procurement and inventory control**
   - managers record procurements
   - inventory is computed from procurements minus sales movements
   - low-stock and out-of-stock notifications are generated
2. **Cash and credit sales management**
   - only available stock can be sold
   - prices are manager-controlled and auto-applied
   - credit sales are separated from normal sales and support repayments
3. **Role-based dashboards and governance controls**
   - managers operate within their branch
   - sales agents handle selling only
   - the director sees aggregate cross-branch reporting only

## Architecture

- **Frontend:** Vue 3, Vite, Pinia, Vue Router, Bootstrap 5
- **Backend:** Node.js, Express, REST API
- **Database:** MongoDB with Mongoose models
- **Testing:** Node test runner, Vitest, Supertest

This is a three-tier client-server application:

```text
Vue Frontend -> Express API -> MongoDB
```

## Submission Deliverables Mapping

| Required Deliverable | Repository Artifact |
|---|---|
| Fully functional web application with all three core features | `frontend/` and `backend/` |
| Complete source code with comments and documentation | Source under `frontend/` and `backend/`, plus the documents listed below |
| Database schema and sample data | `DATABASE_SCHEMA.md`, `backend/models/`, `backend/seedData.js` |
| User guide / README | `README.md` and `USER_MANUAL.md` |
| Live demonstration or recorded walkthrough | `DEMO_WALKTHROUGH.md` and your final live demo or video link |

## Repository Structure

- `frontend/` - Vue single-page application
- `backend/` - Express API, services, validators, models, tests
- `README.md` - project overview and setup
- `USER_MANUAL.md` - end-user guide by role
- `DATABASE_SCHEMA.md` - database schema and seed data summary
- `DEMO_WALKTHROUGH.md` - suggested presentation and recording flow
- `RENDER_DEPLOYMENT.md` - deployment guide for Render
- `render.yaml` - Render blueprint

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
```

Copy `backend/.env.example` to `backend/.env`, then update values if required.

```bash
npm run seed
npm run dev
```

Backend default URL: `http://localhost:5000`

### 2. Frontend Setup

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
- Manager (Maganjo): `kulong`
- Manager (Matugga): `lam`
- Sales Agent (Maganjo): `agent1A`, `agent2A`
- Sales Agent (Matugga): `agent1B`, `agent2B`

## Related Documents

- [USER_MANUAL.md](./USER_MANUAL.md)
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- [DEMO_WALKTHROUGH.md](./DEMO_WALKTHROUGH.md)
- [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
- [backend/README.md](./backend/README.md)

## Quality Checks

Run these before final submission or deployment:

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

## Demo / Walkthrough

Use [DEMO_WALKTHROUGH.md](./DEMO_WALKTHROUGH.md) as the script for:

- live presentation
- recorded walkthrough
- viva or panel demonstration

Before submission, replace the placeholder in `DEMO_WALKTHROUGH.md` with your final video or live demo link.

## Deployment

The project includes a Render blueprint:

- `render.yaml`
- `RENDER_DEPLOYMENT.md`

## Final Submission Note

The source code and written documentation are included in this repository. The remaining manual submission item is the final live demonstration or recorded walkthrough link.
