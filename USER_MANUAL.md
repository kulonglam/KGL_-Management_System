# Karibu Groceries LTD Management System - User Manual

Last Updated: 2026-02-27

## 1. Purpose

This manual explains how to use the Karibu Groceries LTD Management System for day-to-day branch and executive operations.

The system supports:
- Procurement recording
- Cash sales recording
- Credit sales and repayment tracking
- Inventory monitoring
- Price management
- Trusted buyer management
- Branch user management
- Role-based dashboards and report exports

## 2. Supported Roles and Access

## Director
- Access: Director Dashboard, Profile
- Main use: Cross-branch performance monitoring and report export
- Restriction: No branch operations (cannot record procurement/sales, manage users, or manage prices)

## Manager
- Access: Full branch operations and administration
- Main use: Prices, procurement, sales, credit sales, records, trusted buyers, inventory, users, profile
- Restriction: Can manage only own branch data

## Sales Agent
- Access: Sales operations and personal monitoring
- Main use: Record cash sales, record credit sales, view inventory and records, profile
- Restriction: Cannot record procurement, manage prices, manage users, or repay credit balances

## 3. Branch and Product Scope

## Branches
- Maganjo
- Matugga

## Produce Types
- Beans
- Grain Maize
- Cow peas
- Groundnuts
- Soybeans

## 4. Login and Session

1. Open the application login page.
2. Enter your `username` and `password`.
3. Click `Sign In`.
4. You are redirected automatically based on role.

Optional:
- `Remember username` stores your username on this device.
- `Forgot Password?` shows reset guidance (contact manager/system admin).

Logout:
- Use the `Logout` button in the sidebar and confirm.

## 5. Navigation Basics

- The top bar shows system branding.
- The sidebar shows pages based on your role.
- Managers see grouped navigation:
  - Operations
  - Records
  - Administration
- Managers also receive stock notifications and out-of-stock alerts in the dashboard layout.

## 6. Manager User Guide

## 6.1 Set Prices First (Mandatory)

Before recording procurement, configure managed prices.

Path: `Administration > Price Management`

1. Add a price row or edit an existing one.
2. Enter `Produce Type`.
3. Optional: enter `Produce Name` if you need a price for one specific produce, for example `Red Beans`.
4. Enter `Price per kg (UGX)`.
5. Click `Create` (first time) or `Update`.

Notes:
- Minimum price is 10,000 UGX.
- Leave `Produce Name` blank to create one type-default price for all produce names in that type.
- Add a `Produce Name` to create a specific override, for example separate prices for `Red Beans` and `Yellow Beans`.
- Price status can be `Managed` or `Suggested`.
- Updating a managed price synchronizes related procurement selling prices for that branch.
- Use `History` on a managed row to see who changed the price, when it changed, and the old/new amount.
- If no managed price exists, procurement creation is blocked.

## 6.2 Record Procurement

Path: `Operations > Procurement`

Enter:
- Produce name
- Produce type
- Source type (`individual`, `company`, `kgl_farm`)
- Date and time received
- Tonnage (kg)
- Cost (UGX)
- Dealer name and dealer contact
- Branch is auto-filled from your account

Validation rules:
- Produce/dealer text: alphanumeric words with spaces
- Dealer contact: Uganda format (`+2567XXXXXXXX` or `07XXXXXXXX`)
- Tonnage:
  - `individual`: at least 1000 kg
  - other sources: at least 100 kg
- Cost: at least 10,000 UGX
- Selling price: controlled by Price Management

Submit with `Record Procurement`.

## 6.3 Record Cash Sale

Path: `Operations > Sales`

1. Select produce from available inventory.
2. Enter tonnage.
3. Buyer name.
4. Confirm date/time and auto-filled sales agent/branch.
5. Click `Record Sale`.
6. Review modal appears.
7. Click `Save Cash Sale`.

System behavior:
- Amount is auto-calculated from managed selling price.
- Sale is blocked if stock is insufficient.
- If stock reaches zero, out-of-stock notification is generated.

## 6.4 Record Credit Sale

Path: `Operations > Credit Sales`

1. Select a trusted buyer.
2. Select produce and enter tonnage.
3. Confirm due date and dispatch date.
4. Click `Record Credit Sale`.
5. Review details in modal.
6. Click `Save Credit Sale`.

System behavior:
- Amount due is auto-calculated from managed price.
- Due date is required.
- Stock must be available.
- Buyer must belong to your branch.
- New credit sale is blocked if the buyer has outstanding unpaid balance.

## 6.5 Manage Trusted Buyers

Path: `Administration > Trusted Buyers`

Available actions:
- Add buyer
- Edit buyer
- Delete buyer

Required fields:
- Name
- National ID (NIN)
- Location
- Contact

Validation rules:
- NIN: strict Uganda format (`CM` or `CF` followed by 12 digits)
- Contact: Uganda phone format
- NIN is unique per branch

## 6.6 Monitor Inventory and Notifications

Path: `Operations > Inventory`

You can view:
- Total items, total weight, total value, low-stock count
- Per-item stock, price, value, and stock status
- Dedicated out-of-stock list

Thresholds:
- Low stock: below 500 kg
- Out of stock: 0 kg

Notifications:
- Unread stock notifications appear in dashboard header.
- Use `Acknowledge` or `Acknowledge All`.

## 6.7 Manage Branch Users

Path: `Administration > Users`

Actions:
- Create manager or sales-agent accounts for your branch
- Edit user details
- Delete users (except self)

Staffing controls enforced:
- Maximum 1 manager per branch
- Maximum 2 attendants (sales agents) per branch
- System prevents updates/deletions that break minimum required staffing

## 6.8 Work with Records

## Procurement Records
Path: `Records > Procurement Records`
- Refresh list
- Edit procurement
- Delete procurement

## Sales Records
Path: `Records > Sales Records`
- Read-only listing with pagination and refresh

## Credit Sales Records
Path: `Records > Credit Sales Records`
- View due amount, balance, status, due/dispatch dates
- Repay outstanding balances (manager only)

Repayment rules:
- Amount must be greater than 0
- Amount cannot exceed current balance
- Payment date must be valid
- Status changes to `Paid` automatically when balance reaches 0

## 6.9 Manager Dashboard and Exports

Path: `Operations > Dashboard`

Features:
- Weekly/monthly/yearly filtering
- KPI cards (inventory value, cash sales, credit sales, procurement, revenue)
- Charts (revenue split, credit collection, trends, product and agent performance)

Export options:
- CSV
- Excel (`.xls`)
- PDF (requires browser pop-up permission)

## 7. Sales Agent User Guide

## 7.1 Dashboard
Path: `Dashboard`
- Shows your own today-only summary:
  - Cash sales value/count
  - Credit sales value/count
  - Total kilograms sold today

## 7.2 Record Cash Sale
Path: `Sales`
- Same recording flow as manager (review and save)
- Amount auto-calculated
- Stock constraints enforced

## 7.3 Record Credit Sale
Path: `Credit Sales`
- Select an existing trusted buyer
- Amount auto-calculated
- Stock, due-date, and outstanding-balance checks enforced

## 7.4 Inventory and Records
- `Inventory`: view branch stock and alerts
- `Sales Records`: read-only history
- `Credit Sales Records`: read-only history (no repay action)

## 7.5 Profile
- Update name and username
- Optionally change password
- Upload/remove profile image

## 8. Director User Guide

Path: `Director Dashboard`

Main actions:
1. Choose `Period` (weekly/monthly/yearly).
2. Choose `Branch` scope (all, Maganjo, Matugga).
3. Review totals, branch breakdowns, trends, and procurement metrics.
4. Export reports as CSV, Excel, or PDF.

Access note:
- Cross-branch aggregation is restricted to the director account `orban` (Mr. Orban).

## 9. Profile Management (All Roles)

Path: `Profile`

You can update:
- Full name
- Username
- Password (optional)
- Profile image (optional)

Profile image constraints:
- Allowed formats: PNG, JPG/JPEG, WEBP
- Maximum size: 1 MB

Password constraints:
- Minimum 6 characters
- Confirmation must match

## 10. Core Business Rules Enforced by the System

1. Only in-stock products can be sold.
2. Cash and credit amounts are system-calculated from managed prices.
3. Inventory decreases automatically after sale/credit sale.
4. Low-stock alert threshold is below 500 kg.
5. Out-of-stock notifications are generated when stock reaches zero.
6. Credit sales require a trusted buyer.
7. Credit sales must include a due date.
8. A trusted buyer cannot start new credit with outstanding unpaid balance.
9. Procurement requires managed pricing for the selected produce, either through a produce-specific price or a type default.
10. Branch staffing controls enforce manager/attendant limits.

## 11. Common Errors and Fixes

## "Manager price is required for this produce"
- Go to `Price Management` and create/update either:
  - a produce-specific price for that produce name, or
  - a type-default price for its produce type.

## "Insufficient stock"
- Reduce tonnage or replenish stock through procurement.

## "Trusted buyer already exists for this branch"
- Search buyer list and edit existing record instead of creating duplicate.

## "Payment exceeds balance"
- Enter an amount less than or equal to remaining balance.

## "Each branch can only have 1 manager" / "2 attendants"
- Update existing staff roles instead of creating additional users.

## 12. Data and Security Notes

- Authentication uses secure token-based sessions.
- Route and action access are role-restricted.
- Branch-level isolation applies to manager and sales-agent records.
- Director sees aggregation only, not branch transaction entry pages.

## 13. Quick Checklist for New Branch Managers

1. Confirm login works for your account.
2. Set all produce prices in `Price Management`.
3. Add/verify trusted buyers.
4. Verify branch users (1 manager + 2 sales agents).
5. Record procurement for incoming stock.
6. Confirm inventory appears and status badges are correct.
7. Start sales and credit operations.
8. Review records daily and process repayments.
