# QA Rehearsal Checklist (Table Format)

Project: KGL Management System  
Date: __________  
Tester: __________  
Build/Branch: __________  

Status Key: `PASS / FAIL / N/A`  

| ID | Area | Test Scenario | Expected Result | Status | Notes |
|---|---|---|---|---|---|
| A-01 | Preconditions | Test users exist (director, managers, sales agents) | All required users can authenticate |  |  |
| A-02 | Preconditions | Trusted buyers seeded by branch | Buyer list available for branch workflows |  |  |
| A-03 | Preconditions | Inventory seeded (low stock + out of stock + same name/different type) | Data supports edge-case testing |  |  |
| AUTH-01 | Auth | Login as director with valid credentials | Login succeeds and correct dashboard access |  |  |
| AUTH-02 | Auth | Login as manager with valid credentials | Login succeeds and manager pages accessible |  |  |
| AUTH-03 | Auth | Login as sales agent with valid credentials | Login succeeds and sales-agent pages accessible |  |  |
| AUTH-04 | Auth | Login with invalid credentials | Clear error shown, no session created |  |  |
| AUTH-05 | Auth | Open protected route without token | Redirect/block with unauthorized behavior |  |  |
| AUTH-06 | Auth | Logout and reopen protected route | Access denied after logout |  |  |
| AUTH-07 | Auth | Refresh browser after login | Session persists and app remains stable |  |  |
| RBAC-01 | RBAC | Sales agent opens manager-only page | Route blocked/redirected |  |  |
| RBAC-02 | RBAC | Manager opens director dashboard | Route blocked/redirected |  |  |
| RBAC-03 | RBAC | Director opens cross-branch dashboard | Access granted and data visible |  |  |
| UI-01 | Global UI | Sidebar/menu visibility by role | Only authorized menu items are shown |  |  |
| UI-02 | Global UI | Loading spinner during API requests | Spinner appears and clears correctly |  |  |
| UI-03 | Global UI | Success/error alerts | Correct message and reset behavior |  |  |
| PROF-01 | Profile | Update profile name | Save succeeds and value persists |  |  |
| PROF-02 | Profile | Update username to unique value | Save succeeds |  |  |
| PROF-03 | Profile | Update username to duplicate value | Request rejected with clear message |  |  |
| PROF-04 | Profile | Change password | Update succeeds and next login works |  |  |
| PRC-01 | Procurement | Create valid procurement | Record created successfully |  |  |
| PRC-02 | Procurement | `sourceType=individual`, tonnage below 1000 | Validation error shown and save blocked |  |  |
| PRC-03 | Procurement | `sourceType=individual`, tonnage >= 1000 | Save succeeds |  |  |
| PRC-04 | Procurement | Invalid dealer contact format | Validation error shown and save blocked |  |  |
| PRC-05 | Procurement | Managed price exists for selected type | Selling price auto-filled and locked |  |  |
| PRC-06 | Procurement | No managed price for selected type, missing selling price | Save blocked with clear error |  |  |
| PRC-07 | Procurement Records | Edit procurement entry | Update succeeds and list refreshes |  |  |
| PRC-08 | Procurement Records | Delete procurement entry | Delete succeeds and row is removed |  |  |
| SALES-01 | Cash Sales | Create cash sale with valid stock | Sale saved successfully |  |  |
| SALES-02 | Cash Sales | Submit tonnage above available stock | Save blocked with insufficient stock message |  |  |
| SALES-03 | Cash Sales | Select same produce name with different type | Correct type is bound and used in request |  |  |
| SALES-04 | Cash Sales | Review modal submit flow | Modal opens, confirms, and saves correctly |  |  |
| CR-01 | Credit Sales | Create valid credit sale | Credit sale saved successfully |  |  |
| CR-02 | Credit Sales | Due date in the past | Validation error and save blocked |  |  |
| CR-03 | Credit Sales | Missing trusted buyer | Validation error and save blocked |  |  |
| CR-04 | Credit Sales | Tonnage above stock | Validation error and save blocked |  |  |
| CR-05 | Credit Sales | Same name/different type selection | Correct produce type sent and saved |  |  |
| CR-06 | Credit Sales | Create second credit while buyer has outstanding balance | Operation blocked with business-rule message |  |  |
| CRP-01 | Credit Repayment | Partial repayment | `amountPaid` increases, `balance` decreases |  |  |
| CRP-02 | Credit Repayment | Full repayment | `balance` becomes 0 and `isPaid=true` |  |  |
| CRP-03 | Credit Repayment | Overpayment attempt | Request rejected with clear error |  |  |
| CRP-04 | Credit Repayment | Repayment history | Payment entry added to payment history |  |  |
| CRP-05 | Credit Payment Status | Mark credit as paid | Status updates correctly |  |  |
| CRP-06 | Credit Payment Status | Mark unpaid after repayments exist | Request rejected (state consistency guard) |  |  |
| INV-01 | Inventory | Inventory updates after procurement/sales/credit actions | Totals reflect latest operations |  |  |
| INV-02 | Inventory | Low stock display | Items below threshold shown correctly |  |  |
| INV-03 | Inventory | Out-of-stock display | Zero/negative stock items shown correctly |  |  |
| INV-04 | Inventory | Stock check API from UI | Availability result matches actual stock |  |  |
| TB-01 | Trusted Buyers | Create trusted buyer valid data | Save succeeds |  |  |
| TB-02 | Trusted Buyers | Invalid NIN | Validation error shown |  |  |
| TB-03 | Trusted Buyers | Invalid phone/contact | Validation error shown |  |  |
| TB-04 | Trusted Buyers | Duplicate NIN in same branch | Save blocked with duplicate message |  |  |
| TB-05 | Trusted Buyers | Update trusted buyer | Update succeeds |  |  |
| TB-06 | Trusted Buyers | Delete trusted buyer | Delete succeeds |  |  |
| PRICE-01 | Price Management | Load price table | Managed/inferred/unset rows render |  |  |
| PRICE-02 | Price Management | Create price for produce type | Create succeeds |  |  |
| PRICE-03 | Price Management | Duplicate produce type price | Request rejected with clear message |  |  |
| PRICE-04 | Price Management | Update price | Update succeeds and reflects in table |  |  |
| PRICE-05 | Price Management | Delete price | Delete succeeds |  |  |
| PRICE-06 | Price + Procurement | Change managed price then open procurement form | Form reflects price lock/update behavior |  |  |
| USER-01 | Users | Create sales agent (within limits) | Create succeeds |  |  |
| USER-02 | Users | Exceed role limits | Request rejected with role-limit message |  |  |
| USER-03 | Users | Update user role/branch (allowed case) | Update succeeds |  |  |
| USER-04 | Users | Update user with duplicate username | Request rejected with duplicate username message |  |  |
| USER-05 | Users | Attempt self-delete | Request blocked with clear error |  |  |
| USER-06 | Users | Delete another eligible user | Delete succeeds |  |  |
| NOTIF-01 | Notifications | Trigger out-of-stock condition | Notification appears |  |  |
| NOTIF-02 | Notifications | Unread filter | Only unread shown when enabled |  |  |
| NOTIF-03 | Notifications | Mark as read | Notification read state persists |  |  |
| DIR-01 | Director Dashboard | Load dashboard | Dashboard loads with no errors |  |  |
| DIR-02 | Director Dashboard | Change period filter | Charts/tables update correctly |  |  |
| DIR-03 | Director Dashboard | Change branch filter | Branch totals and trends update |  |  |
| DIR-04 | Director Dashboard | Export CSV | Downloaded file opens with valid data |  |  |
| DIR-05 | Director Dashboard | Export Excel | Downloaded file opens with valid data |  |  |
| DIR-06 | Director Dashboard | Export PDF/Print | Print/export flow works without crash |  |  |
| MGR-01 | Manager Dashboard | Load dashboard | Cards/charts load without runtime errors |  |  |
| MGR-02 | Manager Dashboard | Credit card wording | Displays transaction wording consistently |  |  |
| MGR-03 | Manager Dashboard | Alerts | Low-stock and out-of-stock alerts accurate |  |  |
| MGR-04 | Manager Dashboard | Exports | CSV/Excel/PDF export actions work |  |  |
| AGT-01 | Sales Agent Dashboard | Load today's summary | Correct daily metrics shown |  |  |
| AGT-02 | Sales Agent Dashboard | No-data day | No-data state shown correctly |  |  |
| AGT-03 | Sales Agent Dashboard | Daily totals accuracy | Totals match current-day records |  |  |
| NEG-01 | Resilience | Submit invalid payload from UI | Graceful error, no crash |  |  |
| NEG-02 | Resilience | Simulate network delay/failure | UI handles errors and recovers |  |  |
| NEG-03 | Resilience | Refresh during modal/form flow | App remains stable after reload |  |  |
| NEG-04 | Concurrency | Two-tab repayment conflict test | Second stale action fails safely |  |  |
| REG-01 | Regression | Full manager flow (procure -> sell -> credit -> repay) | End-to-end flow completes correctly |  |  |
| REG-02 | Regression | Full sales-agent flow (allowed operations only) | End-to-end flow completes with RBAC enforcement |  |  |
| REG-03 | Regression | Full director flow (analytics + exports) | End-to-end flow completes correctly |  |  |
| REG-04 | Regression | Browser console check on key pages | No blocking errors/exceptions |  |  |

---

## Final Summary

- Total PASS: ______  
- Total FAIL: ______  
- Total N/A: ______  
- Critical Defects: ________________________________________________  
- Retest Required: [ ] Yes [ ] No  
- Sign-off: __________________________
