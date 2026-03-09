# Demo Walkthrough

## Demo Goal

Use this walkthrough to demonstrate that the system satisfies the three required core features:

1. procurement and inventory control
2. cash and credit sales management
3. role-based dashboards and governance controls

Suggested duration: **10 to 15 minutes**

## Pre-Demo Setup

### Backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Open the App

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/healthz`

## Demo Credentials

All seeded accounts use password `Karibu@2026!`.

- Director: `orban`
- Manager (Maganjo): `kulong`
- Manager (Matugga): `lam`
- Sales Agents: `agent1A`, `agent2A`, `agent1B`, `agent2B`

## Recommended Demo Script

### Part A. Role-Based Access Control

Goal: prove that users only see what their role allows.

Steps:

1. Log in as `agent1A`.
2. Show the sales-agent sidebar.
3. Confirm that procurement, users, and price management are not available.
4. Try to open a manager-only page directly and show that access is blocked.
5. Log out.

What to say:

- "Sales agents can record sales, but they cannot record procurement or manage users."

### Part B. Manager Procurement and Inventory

Goal: prove that managers control stock entry and inventory increases after procurement.

Steps:

1. Log in as `kulong`.
2. Open `Price Management` briefly and show that manager-set prices exist.
3. Go to `Procurement`.
4. Enter an invalid dealer contact and show validation.
5. If source type is `individual`, enter tonnage below `1000 kg` and show rejection.
6. Enter a valid procurement and save it.
7. Open `Procurement Records` and show the new record.
8. Open `Inventory` and show the stock increase.

What to say:

- "Only managers can record procurement."
- "The system validates tonnage, price, dealer details, and contact format."
- "Inventory is updated immediately after procurement."

### Part C. Cash Sale Flow

Goal: prove that sales depend on available stock and reduce tonnage.

Steps:

1. Stay logged in as manager or switch to `agent1A`.
2. Open `Sales`.
3. Select a produce item from available stock.
4. Enter a quantity larger than available stock and show rejection.
5. Enter a valid quantity.
6. Show that the amount is auto-calculated.
7. Click `Review Sale`, then save the sale.
8. Open `Sales Records` and `Inventory` to show the reduced stock.

What to say:

- "Only in-stock products can be sold."
- "The amount is determined by the manager-set price."
- "Stock is reduced only after confirmation."

### Part D. Credit Sales and Trusted Buyers

Goal: prove that trusted buyers and deferred payment rules are enforced.

Steps:

1. Open `Trusted Buyers`.
2. Add or edit a trusted buyer.
3. Show NIN validation and local phone validation.
4. Open `Credit Sales`.
5. Select a trusted buyer and create a credit sale.
6. Open `Credit Sales Records`.
7. Record a repayment as manager.
8. Show the updated balance and payment status.

What to say:

- "Credit sales are stored separately from normal sales."
- "The buyer must be trusted and belong to the branch."
- "A buyer cannot take new credit if a previous balance is still unpaid."

### Part E. Director Dashboard

Goal: prove that the director sees aggregate reporting only.

Steps:

1. Log out and sign in as `orban`.
2. Open the director dashboard.
3. Change period and branch filters.
4. Show aggregate cards, trends, and charts.
5. Export one report.

What to say:

- "The director sees totals and trends across branches."
- "The director does not use branch transaction-entry pages."

## Short Viva Summary

If asked to summarize quickly, say:

"This demo shows the three core features required by the project: procurement and inventory control, cash and credit sales management, and role-based access with executive reporting. Managers handle stock entry and pricing, sales agents handle selling, and the director views cross-branch aggregates only."

## Recording Tips

- State the active user role before each section.
- Mention the business rule while triggering it.
- Keep the demo moving; avoid filling every form from scratch if sample data already exists.
- If using a recorded walkthrough, keep it under 15 minutes.

## Final Submission Item

Replace the placeholder below with your real live-demo or video link before submission.

- Demo Link: `<PASTE_FINAL_DEMO_LINK_HERE>`

## Final Checklist

- [ ] manager-only procurement demonstrated
- [ ] inventory increases after procurement
- [ ] stock-aware cash sale demonstrated
- [ ] inventory decreases after sale
- [ ] trusted buyer validation demonstrated
- [ ] credit sale and repayment demonstrated
- [ ] role restrictions demonstrated
- [ ] director aggregate-only dashboard demonstrated
- [ ] final video or live demo link added
