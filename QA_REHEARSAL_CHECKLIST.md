# QA Rehearsal Checklist (Browser)

Project: KGL Management System  
Date: __________  
Tester: __________  
Build/Branch: __________  

Legend: `[ ] PASS` `[ ] FAIL` `[ ] N/A`  
Notes: ________________________________________________

---

## 1. Preconditions

[ ] PASS [ ] FAIL [ ] N/A - Test accounts exist: director, manager (both branches), sales agents (both branches)  
[ ] PASS [ ] FAIL [ ] N/A - Trusted buyers exist per branch  
[ ] PASS [ ] FAIL [ ] N/A - Inventory seeded with at least one low-stock and one out-of-stock scenario  
[ ] PASS [ ] FAIL [ ] N/A - Inventory seeded with same produce name across different produce types  

---

## 2. Authentication and Access Control

[ ] PASS [ ] FAIL [ ] N/A - Valid login works for director  
[ ] PASS [ ] FAIL [ ] N/A - Valid login works for manager  
[ ] PASS [ ] FAIL [ ] N/A - Valid login works for sales agent  
[ ] PASS [ ] FAIL [ ] N/A - Invalid login returns clear error  
[ ] PASS [ ] FAIL [ ] N/A - Protected route blocked when logged out  
[ ] PASS [ ] FAIL [ ] N/A - Sales agent cannot access manager-only pages  
[ ] PASS [ ] FAIL [ ] N/A - Manager cannot access director-only dashboard  
[ ] PASS [ ] FAIL [ ] N/A - Logout clears session and blocks protected routes  
[ ] PASS [ ] FAIL [ ] N/A - Session survives refresh when token exists  

---

## 3. Navigation and Global UI

[ ] PASS [ ] FAIL [ ] N/A - Role-based menu items render correctly  
[ ] PASS [ ] FAIL [ ] N/A - Profile/user info displays correctly in layout  
[ ] PASS [ ] FAIL [ ] N/A - Global loading states/spinners behave correctly  
[ ] PASS [ ] FAIL [ ] N/A - Alert banners (success/error) show and clear correctly  
[ ] PASS [ ] FAIL [ ] N/A - No broken route or blank page on refresh  

---

## 4. Profile

[ ] PASS [ ] FAIL [ ] N/A - Update profile name succeeds  
[ ] PASS [ ] FAIL [ ] N/A - Update username succeeds  
[ ] PASS [ ] FAIL [ ] N/A - Duplicate username update fails with clear message  
[ ] PASS [ ] FAIL [ ] N/A - Password update succeeds  

---

## 5. Procurement (Manager)

[ ] PASS [ ] FAIL [ ] N/A - Create procurement with valid data succeeds  
[ ] PASS [ ] FAIL [ ] N/A - Individual source with tonnage below 1000 is rejected  
[ ] PASS [ ] FAIL [ ] N/A - Individual source with tonnage >= 1000 is accepted  
[ ] PASS [ ] FAIL [ ] N/A - Invalid dealer contact is rejected  
[ ] PASS [ ] FAIL [ ] N/A - Managed price auto-locks selling price when configured  
[ ] PASS [ ] FAIL [ ] N/A - Without managed price, manual selling price is required  
[ ] PASS [ ] FAIL [ ] N/A - Procurement record appears in list after creation  
[ ] PASS [ ] FAIL [ ] N/A - Edit procurement record succeeds  
[ ] PASS [ ] FAIL [ ] N/A - Delete procurement record succeeds  

---

## 6. Cash Sales (Manager and Sales Agent)

[ ] PASS [ ] FAIL [ ] N/A - Create cash sale with valid stock succeeds  
[ ] PASS [ ] FAIL [ ] N/A - Sale with tonnage above available stock is rejected  
[ ] PASS [ ] FAIL [ ] N/A - Amount paid auto-calculates correctly from inventory price  
[ ] PASS [ ] FAIL [ ] N/A - Same-name multi-type produce uses correct selected type  
[ ] PASS [ ] FAIL [ ] N/A - Sale review modal flow works (open, back, confirm)  
[ ] PASS [ ] FAIL [ ] N/A - Sale appears in sales records/dashboard metrics  

---

## 7. Credit Sales (Manager and Sales Agent)

[ ] PASS [ ] FAIL [ ] N/A - Create credit sale with valid buyer and stock succeeds  
[ ] PASS [ ] FAIL [ ] N/A - Past due date is rejected  
[ ] PASS [ ] FAIL [ ] N/A - Missing trusted buyer is rejected  
[ ] PASS [ ] FAIL [ ] N/A - Stock over-request is rejected  
[ ] PASS [ ] FAIL [ ] N/A - Same-name multi-type produce uses correct selected type  
[ ] PASS [ ] FAIL [ ] N/A - Outstanding balance rule blocks new credit for same buyer  
[ ] PASS [ ] FAIL [ ] N/A - Credit sale appears in records after creation  

---

## 8. Credit Repayment and Payment Status (Manager)

[ ] PASS [ ] FAIL [ ] N/A - Partial repayment succeeds and balance decreases correctly  
[ ] PASS [ ] FAIL [ ] N/A - Full repayment marks sale as paid and balance becomes zero  
[ ] PASS [ ] FAIL [ ] N/A - Overpayment attempt is rejected  
[ ] PASS [ ] FAIL [ ] N/A - Payment history entry is added after repayment  
[ ] PASS [ ] FAIL [ ] N/A - Mark as paid action works  
[ ] PASS [ ] FAIL [ ] N/A - Mark as unpaid after repayments is rejected  
[ ] PASS [ ] FAIL [ ] N/A - Delete credit sale succeeds when allowed  

---

## 9. Inventory

[ ] PASS [ ] FAIL [ ] N/A - Inventory list updates after procurement/sales/credit actions  
[ ] PASS [ ] FAIL [ ] N/A - Low-stock items are shown correctly  
[ ] PASS [ ] FAIL [ ] N/A - Out-of-stock items are shown correctly  
[ ] PASS [ ] FAIL [ ] N/A - Total value and total weight look correct  
[ ] PASS [ ] FAIL [ ] N/A - Stock check API-driven result matches expected availability  

---

## 10. Trusted Buyers (Manager)

[ ] PASS [ ] FAIL [ ] N/A - Create trusted buyer with valid data succeeds  
[ ] PASS [ ] FAIL [ ] N/A - Invalid NIN is rejected  
[ ] PASS [ ] FAIL [ ] N/A - Invalid contact number is rejected  
[ ] PASS [ ] FAIL [ ] N/A - Duplicate NIN in same branch is rejected  
[ ] PASS [ ] FAIL [ ] N/A - Update trusted buyer succeeds  
[ ] PASS [ ] FAIL [ ] N/A - Delete trusted buyer succeeds  

---

## 11. Price Management (Manager)

[ ] PASS [ ] FAIL [ ] N/A - Price list loads (managed/inferred/unset rows)  
[ ] PASS [ ] FAIL [ ] N/A - Create price for produce type succeeds  
[ ] PASS [ ] FAIL [ ] N/A - Duplicate price for same produce type is rejected  
[ ] PASS [ ] FAIL [ ] N/A - Update price succeeds  
[ ] PASS [ ] FAIL [ ] N/A - Delete price succeeds  
[ ] PASS [ ] FAIL [ ] N/A - Procurement form follows price lock after updates  

---

## 12. User Management (Manager)

[ ] PASS [ ] FAIL [ ] N/A - Create user (sales agent) succeeds within role limits  
[ ] PASS [ ] FAIL [ ] N/A - Exceed role limits is rejected with clear message  
[ ] PASS [ ] FAIL [ ] N/A - Update user role/branch (allowed path) succeeds  
[ ] PASS [ ] FAIL [ ] N/A - Duplicate username on update is rejected  
[ ] PASS [ ] FAIL [ ] N/A - Self-delete is blocked  
[ ] PASS [ ] FAIL [ ] N/A - Delete another eligible user succeeds  

---

## 13. Notifications

[ ] PASS [ ] FAIL [ ] N/A - Out-of-stock notification appears when stock depletes  
[ ] PASS [ ] FAIL [ ] N/A - Unread filter works correctly  
[ ] PASS [ ] FAIL [ ] N/A - Mark notification as read succeeds and persists  

---

## 14. Dashboards and Reports

### Director Dashboard
[ ] PASS [ ] FAIL [ ] N/A - Director dashboard loads successfully  
[ ] PASS [ ] FAIL [ ] N/A - Period filter updates charts/tables  
[ ] PASS [ ] FAIL [ ] N/A - Branch filter updates cross-branch metrics  
[ ] PASS [ ] FAIL [ ] N/A - Export CSV works  
[ ] PASS [ ] FAIL [ ] N/A - Export Excel works  
[ ] PASS [ ] FAIL [ ] N/A - Export PDF/print flow works  

### Manager Dashboard
[ ] PASS [ ] FAIL [ ] N/A - Manager dashboard loads without runtime errors  
[ ] PASS [ ] FAIL [ ] N/A - Credit card wording/values are consistent (`transactions`)  
[ ] PASS [ ] FAIL [ ] N/A - Low-stock/out-of-stock alerts are accurate  
[ ] PASS [ ] FAIL [ ] N/A - Export actions work  

### Sales Agent Dashboard
[ ] PASS [ ] FAIL [ ] N/A - Today's summary loads correctly  
[ ] PASS [ ] FAIL [ ] N/A - No-data state shown when applicable  
[ ] PASS [ ] FAIL [ ] N/A - Totals match current-day sales and credit records  

---

## 15. Negative and Resilience Checks

[ ] PASS [ ] FAIL [ ] N/A - Invalid payloads show clean backend validation errors  
[ ] PASS [ ] FAIL [ ] N/A - Network delay/failure handled without UI crash  
[ ] PASS [ ] FAIL [ ] N/A - Refresh during modal/form does not break app state  
[ ] PASS [ ] FAIL [ ] N/A - Two-tab repayment race test handles conflicts safely  

---

## 16. Final Regression Sweep

[ ] PASS [ ] FAIL [ ] N/A - End-to-end manager flow: procurement -> sale -> credit -> repayment -> inventory  
[ ] PASS [ ] FAIL [ ] N/A - End-to-end sales-agent flow: sale + credit creation (role-limited actions only)  
[ ] PASS [ ] FAIL [ ] N/A - End-to-end director flow: analytics + exports  
[ ] PASS [ ] FAIL [ ] N/A - No console crashes in key pages after full sweep  

---

## Summary

Total PASS: ______  
Total FAIL: ______  
Total N/A: ______  

Critical Defects Found: ________________________________________________  
Retest Needed: [ ] Yes [ ] No  
Sign-off: __________________________
