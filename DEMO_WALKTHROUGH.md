# Demo Walkthrough Script

Use this script for either:
- a live demonstration session, or
- a recorded walkthrough video.

## Recording Metadata
- Presenter: ______________________
- Date: ___________________________
- Environment: Local / Staging / Production
- Demo Link (video or live URL): ______________________

## Target Duration
10 to 15 minutes.

## Pre-Demo Setup
1. Start backend API (`backend`, `npm run dev`).
2. Start frontend app (`frontend`, `npm run dev`).
3. Confirm MongoDB is running and data is seeded (`node seedData.js`).
4. Open app at `http://localhost:5173`.

## Demo Flow

### 1. Login and Role-Based Access (2 minutes)
- Login as `managerA`.
- Show manager sidebar options.
- Logout and login as `orban`.
- Show director-only aggregated dashboard view.

Expected outcome:
- Role permissions are clearly enforced in UI navigation and page access.

### 2. Price Management + Procurement (3 minutes)
- Login as `managerA`.
- Open Price Management and set/update one produce price.
- Open Procurement and create a valid procurement record.
- Mention validation rule: `individual` source requires at least 1000 kg.

Expected outcome:
- Manager can configure prices and record procurement with validation.

### 3. Cash Sale Flow (2 minutes)
- Login as a sales agent (`agent1A`).
- Create a cash sale.
- Show auto-calculated payment amount and success feedback.

Expected outcome:
- Sales agent records a sale; amount is derived from managed pricing.

### 4. Credit Sale + Repayment (3 minutes)
- Record a credit sale for an existing trusted buyer.
- Logout and login as manager.
- Open Credit Sales Records and perform partial repayment.
- Show updated balance and payment history.

Expected outcome:
- Credit lifecycle works end-to-end with balance tracking.

### 5. Inventory + Notifications (2 minutes)
- Open Inventory and show stock movement after transactions.
- Trigger or display out-of-stock notification state.
- Show manager acknowledgement action.

Expected outcome:
- Stock changes are visible and notification workflow is active.

### 6. Director Analytics and Export (2 minutes)
- Login as `orban`.
- Show cross-branch KPIs/charts.
- Export one report (CSV/Excel/PDF).

Expected outcome:
- Director sees only aggregated cross-branch data and export works.

## Optional Validation Clip
Include terminal output for:

```bash
# backend
cd backend
npm test

# frontend
cd frontend
npm test
```

## Completion Checklist
- [ ] Authentication and role boundaries demonstrated
- [ ] Procurement demonstrated
- [ ] Cash sale demonstrated
- [ ] Credit sale and repayment demonstrated
- [ ] Inventory/notification behavior demonstrated
- [ ] Director analytics/export demonstrated
- [ ] Demo link attached in metadata section
