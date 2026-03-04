# Karibu Groceries LTD - Backend API

Node.js/Express/MongoDB backend for Karibu Groceries LTD Management System.

## Prerequisites
- Node.js 16+
- MongoDB 5+

## Setup
```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and update values as needed.

Example defaults:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/karibu_groceries
JWT_SECRET=replace_with_secure_secret
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
```

## Run
```bash
# development
npm run dev

# production
npm start
```

API base URL: `http://localhost:5000`

## Seed Data
Warning: this clears existing seed-related collections before inserting sample data.

```bash
node seedData.js
```

Seeded password for all users: `Karibu@2026!`

To update passwords for users that already exist in your database:

```bash
npm run reset:passwords -- --password=Karibu@2026!
```

- Director: `orban`
- Managers: `managerA` (Maganjo), `managerB` (Matugga)
- Sales agents: `agent1A`, `agent2A` (Maganjo), `agent1B`, `agent2B` (Matugga)

## Health and Ops Endpoints
- `GET /healthz`
- `GET /readyz`
- `GET /api-docs` (Swagger UI)

## API Route Groups
- `POST /api/auth/*`
- `GET|POST|PUT|DELETE /api/procurement/*`
- `GET|POST|DELETE /api/sales/*`
- `GET|POST|PUT|DELETE /api/credit-sales/*`
- `GET|POST /api/inventory/*`
- `GET|POST|PUT|DELETE /api/trusted-buyers/*`
- `GET|POST|PUT|DELETE /api/prices/*`
- `GET|PUT /api/notifications/*`

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
