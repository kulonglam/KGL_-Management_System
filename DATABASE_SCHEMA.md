# Database Schema and Sample Data

## Overview

Karibu Groceries LTD Management System uses **MongoDB** with **Mongoose** models stored in `backend/models`.

The schema supports these domains:

- users and authentication
- branch pricing
- procurements
- cash sales
- credit sales and repayments
- trusted buyers
- stock notifications
- stock locking for concurrency control

Important design note:

- inventory is **not stored as a standalone collection**
- inventory is computed from procurement, cash sale, and credit sale movements

## Technical References

- Backend application: `backend/app.js`
- Database connection: `backend/config/database.js`
- Seed data: `backend/seedData.js`
- Models: `backend/models/`

## Shared Domain Rules

- Branches: `Maganjo`, `Matugga`
- Produce types: `Beans`, `Grain Maize`, `Cow peas`, `Groundnuts`, `Soybeans`
- Local phone format: `^07\\d{8}$`
- Uganda NIN format: `^(CM|CF)[0-9]{12}$`

## Collections

### 1. `users`

Source: `backend/models/User.js`

| Field | Type | Constraints |
|---|---|---|
| name | String | required, minimum 2 characters |
| username | String | required, unique |
| password | String | required, stored hashed |
| profileImage | String | optional, default `''` |
| role | String | enum: `director`, `manager`, `sales_agent` |
| branch | String | required for non-director users |
| canViewCrossBranchTotals | Boolean | reserved for the director account |
| tokenVersion | Number | used for token invalidation |
| loginAttempts | Number | lockout tracking |
| lockUntil | Date | nullable |
| createdAt / updatedAt | Date | timestamps |

Indexes:

- `{ branch: 1, role: 1 }`
- `{ username: 1, lockUntil: 1 }`

### 2. `price settings`

Source: `backend/models/PriceSetting.js`

| Field | Type | Constraints |
|---|---|---|
| branch | String | required |
| produceName | String | optional, blank means type-default price |
| produceType | String | required, valid produce type |
| priceUgx | Number | required, minimum `10000` |
| createdAt / updatedAt | Date | timestamps |

Indexes:

- unique `{ branch: 1, produceType: 1, produceName: 1 }`
- `{ branch: 1, produceType: 1, priceUgx: 1 }`

### 3. `price history`

Source: `backend/models/PriceHistory.js`

| Field | Type | Constraints |
|---|---|---|
| branch | String | required |
| priceSettingId | ObjectId | required |
| action | String | enum: `create`, `update`, `delete` |
| previousProduceName | String | optional |
| previousProduceType | String | optional |
| previousPriceUgx | Number | optional |
| nextProduceName | String | optional |
| nextProduceType | String | optional |
| nextPriceUgx | Number | optional |
| changedBy | ObjectId | ref `User`, required |
| createdAt / updatedAt | Date | timestamps |

Indexes:

- `{ branch: 1, priceSettingId: 1, createdAt: -1 }`
- `{ changedBy: 1, createdAt: -1 }`

### 4. `procurements`

Source: `backend/models/Procurement.js`

| Field | Type | Constraints |
|---|---|---|
| produceName | String | required, normalized |
| produceType | String | required, normalized |
| sourceType | String | enum: `individual`, `company`, `kgl_farm` |
| dateReceived | Date | required |
| timeReceived | String | required |
| tonnageKg | Number | required, minimum `100`; minimum `1000` for `individual` |
| costUgx | Number | required, minimum `10000` |
| dealerName | String | required |
| dealerContact | String | required, `07XXXXXXXX` |
| branch | String | required |
| sellingPrice | Number | required |
| recordedBy | ObjectId | ref `User`, required |
| createdAt / updatedAt | Date | timestamps |

Indexes:

- `{ branch: 1, createdAt: -1 }`
- `{ branch: 1, dateReceived: -1 }`
- `{ branch: 1, produceType: 1, sourceType: 1 }`

### 5. `sales`

Source: `backend/models/Sale.js`

| Field | Type | Constraints |
|---|---|---|
| produceName | String | required |
| produceType | String | required |
| tonnageKg | Number | required, minimum `1` |
| amountPaidUgx | Number | required, minimum `10000` |
| buyerName | String | required |
| salesAgentName | String | required |
| date | Date | required |
| time | String | required |
| branch | String | required |
| recordedBy | ObjectId | ref `User`, required |
| createdAt / updatedAt | Date | timestamps |

Indexes:

- `{ branch: 1, createdAt: -1 }`
- `{ branch: 1, date: -1 }`
- `{ branch: 1, produceName: 1, produceType: 1 }`

### 6. `trusted buyers`

Source: `backend/models/TrustedBuyer.js`

| Field | Type | Constraints |
|---|---|---|
| name | String | required |
| nationalId | String | required, strict Uganda NIN |
| location | String | required |
| contact | String | required, `07XXXXXXXX` |
| branch | String | required |
| recordedBy | ObjectId | ref `User`, required |
| createdAt / updatedAt | Date | timestamps |

Indexes:

- unique `{ nationalId: 1, branch: 1 }`
- `{ branch: 1, createdAt: -1 }`

### 7. `credit sales`

Source: `backend/models/CreditSale.js`

| Field | Type | Constraints |
|---|---|---|
| buyerName | String | required |
| nationalId | String | required |
| location | String | required |
| contact | String | required, `07XXXXXXXX` |
| amountDueUgx | Number | required, minimum `10000` |
| amountPaidUgx | Number | default `0` |
| balanceUgx | Number | computed remaining amount |
| salesAgentName | String | required |
| dueDate | Date | required |
| produceName | String | required |
| produceType | String | required |
| tonnageKg | Number | required, minimum `1` |
| dateOfDispatch | Date | required |
| branch | String | required |
| recordedBy | ObjectId | ref `User`, required |
| trustedBuyer | ObjectId | ref `TrustedBuyer`, required |
| isPaid | Boolean | default `false` |
| payments | Array | repayment entries |
| createdAt / updatedAt | Date | timestamps |

Indexes:

- `{ branch: 1, createdAt: -1 }`
- `{ branch: 1, dateOfDispatch: -1 }`
- `{ branch: 1, dueDate: 1, isPaid: 1 }`
- `{ trustedBuyer: 1, createdAt: -1 }`

### 8. `stock notifications`

Source: `backend/models/StockNotification.js`

| Field | Type | Constraints |
|---|---|---|
| branch | String | required |
| produceName | String | required |
| produceType | String | required |
| category | String | default `out_of_stock` |
| message | String | required |
| isRead | Boolean | default `false` |
| readAt | Date | nullable |
| createdAt / updatedAt | Date | timestamps |

Indexes:

- `{ branch: 1, category: 1, produceName: 1, produceType: 1, isRead: 1 }`

### 9. `stock locks`

Source: `backend/models/StockLock.js`

| Field | Type | Constraints |
|---|---|---|
| key | String | required, unique |
| ownerId | String | required |
| expiresAt | Date | required |
| createdAt / updatedAt | Date | timestamps |

Indexes:

- TTL index on `{ expiresAt: 1 }`

## Relationship Summary

- `User` -> many `Procurement` through `recordedBy`
- `User` -> many `Sale` through `recordedBy`
- `User` -> many `TrustedBuyer` through `recordedBy`
- `User` -> many `CreditSale` through `recordedBy`
- `User` -> many `PriceHistory` through `changedBy`
- `TrustedBuyer` -> many `CreditSale` through `trustedBuyer`
- `User` -> many credit-sale repayment entries through `payments.receivedBy`

## Sample Seed Data

Source: `backend/seedData.js`

The seed script inserts a baseline dataset for testing and demonstration:

- Users: 7
- Price settings: 10
- Trusted buyers: 2
- Procurements: 6
- Sales: 4
- Credit sales: 2

Seed accounts:

- Director: `orban`
- Managers: `kulong`, `lam`
- Sales agents: `agent1A`, `agent2A`, `agent1B`, `agent2B`
- Default password: `Karibu@2026!`

## Seed Command

Run from `backend/`:

```bash
npm run seed
```

Warning:

- reseeding clears and recreates core demo data
