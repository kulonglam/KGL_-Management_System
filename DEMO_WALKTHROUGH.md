# DEMO_WALKTHROUGH.md

## Demo Goal
Show that the system delivers the three required core features end-to-end:
1. Procurement and inventory control
2. Cash and credit sales management
3. Role-based dashboards and governance controls

Suggested demo duration: 10 to 15 minutes.

## Pre-Demo Setup

### 1) Start backend
```bash
cd backend
npm install
npm run seed
npm run dev
```

### 2) Start frontend
```bash
cd frontend
npm install
npm run dev
```

### 3) Open app
- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/healthz`

## Demo Credentials
All accounts use the seeded password (default): `Karibu@2026!`

- Director: `orban`
- Manager (Maganjo): `kulong`
- Manager (Matugga): `lam`
- Sales agents: `agent1A`, `agent2A`, `agent1B`, `agent2B`

## Recommended Demo Flow

### Part A: Role and Access Control (2 min)
1. Login as `agent1A`.
2. Show allowed pages (sales, inventory views).
3. Attempt restricted manager action (for example price management or user management) and show denial.
4. Logout.

Expected outcome:
- Sales agent is blocked from manager-only routes/actions.

### Part B: Procurement and Inventory Control (3 to 4 min)
1. Login as manager `kulong`.
2. Open Procurement form and create a valid procurement record.
3. Show strict validation quickly:
   - Invalid dealer contact (reject)
   - Individual source with tonnage under 1000 kg (reject)
4. Save a valid procurement and show it appears in records.
5. Open Inventory dashboard and show stock updated.

Expected outcome:
- Only manager can record procurement.
- Inventory increases after procurement.
- Form validation enforces business rules.

### Part C: Cash Sales Flow (2 to 3 min)
1. Stay as manager or switch to `agent1A`.
2. Open Sales form and record a cash sale for in-stock produce.
3. Show stock-aware behavior:
   - Try quantity above available stock (reject)
   - Submit valid quantity (success)
4. Show sales record list and updated inventory balance.

Expected outcome:
- Only in-stock produce can be sold.
- Tonnage reduces after sale.

### Part D: Credit Sales and Trusted Buyers (2 to 3 min)
1. Open Trusted Buyers and add/edit a buyer.
2. Show strict Uganda NIN validation (`CM/CF` + 12 digits).
3. Create a credit sale for that buyer.
4. Record a repayment on an existing credit sale.
5. Show due amount/balance changes and paid/unpaid status.

Expected outcome:
- Credit sales are recorded separately.
- NIN and contact validation are strict.
- Repayment updates balance correctly.

### Part E: Director Aggregation View (1 to 2 min)
1. Logout and login as `orban` (director).
2. Open director dashboard/aggregation view.
3. Show cross-branch totals and trends only (no branch-level editing).

Expected outcome:
- Only director with required permission can view cross-branch aggregates.
- Executive view shows totals/analytics.

## What to Narrate During Recording
- Mention each business rule as you trigger it.
- Call out validation feedback clearly.
- State which role is currently logged in and why that matters.

## Submission Artifact
Attach one of the following to your final submission:
- Live demo URL and meeting recording link, or
- Uploaded video link (YouTube/Loom/Drive)

Include the final link here:
- Demo Link: `<PASTE_FINAL_DEMO_LINK_HERE>`

## Quick Acceptance Checklist
- [ ] Procurement created by manager only
- [ ] Stock updates after procurement and sales
- [ ] Out-of-stock/over-sell prevention demonstrated
- [ ] Credit sale and repayment demonstrated
- [ ] Strict NIN validation demonstrated
- [ ] Director aggregate-only view demonstrated
- [ ] Role restrictions demonstrated
