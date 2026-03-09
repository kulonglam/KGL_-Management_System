# Karibu Groceries LTD Management System - User Manual

Last Updated: 2026-03-09

## 1. Purpose

This manual explains how to use the Karibu Groceries LTD Management System for daily branch operations and executive monitoring.

The system supports:

- procurement recording
- cash sales recording
- credit sales and repayment tracking
- inventory monitoring
- branch price management
- trusted buyer management
- user management by branch
- role-based dashboards and reports

## 2. User Roles and Access

### Director

- Access: Director Dashboard, Profile
- Main use: view cross-branch totals, trends, and report exports
- Restriction: cannot record procurement, sales, credit sales, users, or prices

### Manager

- Access: manager dashboard, procurement, sales, credit sales, records, inventory, trusted buyers, users, price management, profile
- Main use: run branch operations and branch administration
- Restriction: can work only within own branch

### Sales Agent

- Access: sales dashboard, sales, credit sales, records, inventory, profile
- Main use: record branch sales and monitor personal branch activity
- Restriction: cannot record procurement, manage prices, manage users, or repay credit balances

## 3. Branches and Produce Types

### Branches

- Maganjo
- Matugga

### Produce Types

- Beans
- Grain Maize
- Cow peas
- Groundnuts
- Soybeans

## 4. Login and Logout

### Login

1. Open the application login page.
2. Enter your `username` and `password`.
3. Click `Sign In`.
4. The system redirects you to the correct dashboard based on your role.

Optional:

- `Remember username` stores only the username on the current device.

### Logout

1. Click `Logout` in the sidebar.
2. Confirm the action.
3. The system ends your local session and logs you out of the application.

## 5. Navigation Basics

- The sidebar displays only pages allowed for your role.
- The header shows branding and stock notifications where applicable.
- Managers and sales agents work at branch level.
- The director uses an aggregate reporting view only.

## 6. Manager Guide

### 6.1 Set Prices First

Path: `Price Management`

Before procurement or selling, the branch manager should configure selling prices.

Steps:

1. Open `Price Management`.
2. Select `Produce Type`.
3. Optionally enter `Produce Name` for a produce-specific price.
4. Enter `Price per kg (UGX)`.
5. Save the price row.

Notes:

- Minimum price is `10,000 UGX`.
- Blank `Produce Name` creates a type-default price.
- A filled `Produce Name` creates a specific override.
- Price changes are recorded in price history.

### 6.2 Record Procurement

Path: `Procurement`

Enter:

- produce name
- produce type
- source type (`individual`, `company`, `kgl_farm`)
- date received
- time received
- tonnage in kilograms
- cost in UGX
- dealer name
- dealer contact

Rules:

- produce name and dealer name must be alpha-numeric text
- produce type must be a valid produce type
- contact must use the `07XXXXXXXX` format
- tonnage must be at least `100 kg`
- if source is `individual`, tonnage must be at least `1000 kg`
- cost must be at least `10,000 UGX`
- selling price is controlled by the manager-set price

Expected result:

- procurement is saved
- branch inventory increases
- the record appears in procurement records

### 6.3 Record Cash Sale

Path: `Sales`

Steps:

1. Select available produce from inventory.
2. Enter tonnage.
3. Enter buyer name.
4. Confirm date, time, branch, and sales agent details.
5. Click `Review Sale`.
6. Confirm and save.

System behavior:

- amount paid is auto-calculated from the active selling price
- only available stock can be sold
- stock reduces after confirmation
- out-of-stock notification is generated when stock reaches zero

### 6.4 Record Credit Sale

Path: `Credit Sales`

Steps:

1. Select a trusted buyer.
2. Select produce and enter tonnage.
3. Enter due date and confirm dispatch date.
4. Review the transaction.
5. Save the credit sale.

System behavior:

- amount due is auto-calculated
- buyer must belong to the same branch
- buyer must not have an unpaid previous balance
- stock must be available
- credit sale is stored separately from normal sales

### 6.5 Manage Trusted Buyers

Path: `Trusted Buyers`

Required fields:

- buyer name
- national ID
- location
- contact

Validation rules:

- buyer name and location must be at least 2 characters
- national ID must follow Uganda NIN format: `CM` or `CF` + 12 digits
- contact must use `07XXXXXXXX`
- records are branch-specific

### 6.6 Monitor Inventory and Notifications

Path: `Inventory`

You can view:

- total items
- total weight
- total value
- low-stock count
- out-of-stock items

Thresholds:

- low stock: below `500 kg`
- out of stock: `0 kg`

Notifications:

- unread stock notifications appear in the header
- managers can acknowledge single notifications or all

### 6.7 Manage Branch Users

Path: `Users`

Managers can:

- create users for their branch
- edit users in their branch
- delete users in their branch

Staffing controls:

- maximum `1` manager per branch
- maximum `2` sales agents per branch
- the system prevents changes that would violate the minimum required staffing

### 6.8 Work with Records

#### Procurement Records

Path: `Procurement Records`

- refresh records
- edit records
- delete records

#### Sales Records

Path: `Sales Records`

- view paginated sales history
- refresh records

#### Credit Sales Records

Path: `Credit Sales Records`

- view balances, due dates, and payment status
- managers can record repayments

Repayment rules:

- repayment amount must be greater than `0`
- repayment cannot exceed current balance
- payment date must be valid
- balance reduces automatically
- status changes to `Paid` when the balance reaches `0`

### 6.9 Manager Dashboard and Exports

Path: `Manager Dashboard`

Features:

- KPI overview cards
- date-period filtering
- charts for sales, revenue, procurement, and credit performance
- export options for CSV, Excel, and PDF/print output

## 7. Sales Agent Guide

### 7.1 Dashboard

Path: `Dashboard`

The sales agent dashboard shows:

- today’s cash sales
- today’s credit sales
- kilograms sold today

### 7.2 Cash Sales

Path: `Sales`

- same sales flow as manager
- stock checks and review step still apply
- sales agent cannot change branch pricing

### 7.3 Credit Sales

Path: `Credit Sales`

- sales agent can create credit sales for existing trusted buyers
- stock and outstanding-balance checks still apply
- sales agent cannot post repayments

### 7.4 Inventory and Records

- `Inventory`: read branch stock status
- `Sales Records`: view branch sales history
- `Credit Sales Records`: view branch credit history

### 7.5 Profile

Sales agents can update:

- name
- username
- password
- profile image

## 8. Director Guide

Path: `Director Dashboard`

Main actions:

1. choose reporting period
2. choose branch scope
3. review totals and trends
4. export reports

Important note:

- only the reserved director account `orban` can access the aggregate cross-branch reporting view

## 9. Profile Management

Path: `Profile`

All users can update:

- full name
- username
- password
- profile image

Profile image constraints:

- PNG, JPG/JPEG, or WEBP
- maximum `1 MB`

Password policy:

- at least `10` characters
- at least one uppercase letter
- at least one lowercase letter
- at least one number
- at least one symbol

## 10. Core Business Rules Enforced

1. Only products in stock can be sold.
2. Cash and credit amounts are derived from the active manager-set price.
3. Inventory reduces after confirmed sales and credit dispatches.
4. Procurement is recorded by managers only.
5. Sales agents are not allowed to record procurement.
6. Credit sales are allowed only for trusted buyers.
7. A buyer with unpaid balance cannot take new credit.
8. Director access is aggregate-only.
9. Branch users are limited according to staffing rules.
10. Contact fields use local `07XXXXXXXX` format.

## 11. Common Errors and Fixes

### "Manager price is required for this produce"

Go to `Price Management` and create either:

- a produce-specific price, or
- a type-default price for that produce type

### "Insufficient stock"

Reduce the tonnage or restock through procurement.

### "Trusted buyer already exists for this branch"

Search for the buyer first and update the existing record instead of creating a duplicate.

### "Payment exceeds balance"

Enter a repayment amount less than or equal to the remaining balance.

### "Each branch can only have 1 manager" or "2 sales agents"

Adjust existing users instead of creating extra users in the same branch.

## 12. Security and Data Notes

- authentication is required for protected pages and API routes
- actions are restricted by role and branch scope
- server-side validation enforces business rules
- logout clears the session and the backend can invalidate active tokens

## 13. Quick Checklist for a New Manager

1. log in successfully
2. set branch prices
3. add or verify trusted buyers
4. verify branch staff
5. record procurement
6. confirm inventory updated
7. start sales operations
8. review records and repayments daily
