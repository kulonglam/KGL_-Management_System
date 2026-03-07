# DATABASE_SCHEMA.md

## Overview
Karibu Groceries LTD Management System uses MongoDB with Mongoose models in `backend/models`.

Core business domains:
- Authentication and role-based users
- Procurement and inventory movement
- Cash and credit sales
- Price management by branch
- Trusted buyers and stock notifications

## Technical Stack
- Database engine: MongoDB
- ODM: Mongoose
- Backend entry: `backend/app.js`
- Seed script: `backend/seedData.js`

## Shared Domain Rules
- Branches: `Maganjo`, `Matugga`
- Produce types: `Beans`, `Grain Maize`, `Cow peas`, `Groundnuts`, `Soybeans`
- Uganda phone format: `^(\+256|0)[0-9]{9}$`
- Uganda NIN format: `^(CM|CF)[0-9]{12}$`

## Collections and Fields

### 1) users
Source: `backend/models/User.js`

| Field | Type | Constraints |
|---|---|---|
| name | String | required, min 2, alphanumeric/space/dot |
| username | String | required, unique |
| password | String | required (hashed) |
| profileImage | String | default `''` |
| role | String | enum: `director`, `manager`, `sales_agent` |
| branch | String | enum: `Maganjo`, `Matugga`; required for non-director |
| canViewCrossBranchTotals | Boolean | default `false`; synchronized for the reserved director account `orban` |
| tokenVersion | Number | default `0`, min `0` |
| loginAttempts | Number | default `0`, min `0` |
| lockUntil | Date | nullable |
| createdAt / updatedAt | Date | auto timestamps |

Indexes:
- `{ branch: 1, role: 1 }`
- `{ username: 1, lockUntil: 1 }`

### 2) price settings
Source: `backend/models/PriceSetting.js`

| Field | Type | Constraints |
|---|---|---|
| branch | String | required, enum branches |
| produceName | String | optional, min 2, normalized, alphanumeric+spaces; blank means type default |
| produceType | String | required, enum produce types |
| priceUgx | Number | required, min `10000` |
| createdAt / updatedAt | Date | auto timestamps |

Indexes:
- Unique `{ branch: 1, produceType: 1, produceName: 1 }`
- `{ branch: 1, produceType: 1, priceUgx: 1 }`

### 3) price history
Source: `backend/models/PriceHistory.js`

| Field | Type | Constraints |
|---|---|---|
| branch | String | required, enum branches |
| priceSettingId | ObjectId | required, original managed price row id |
| action | String | required, enum: `create`, `update`, `delete` |
| previousProduceName | String | optional, normalized |
| previousProduceType | String | optional, enum produce types |
| previousPriceUgx | Number | optional |
| nextProduceName | String | optional, normalized |
| nextProduceType | String | optional, enum produce types |
| nextPriceUgx | Number | optional |
| changedBy | ObjectId | ref `User`, required |
| createdAt / updatedAt | Date | auto timestamps |

Indexes:
- `{ branch: 1, priceSettingId: 1, createdAt: -1 }`
- `{ changedBy: 1, createdAt: -1 }`

### 4) procurements
Source: `backend/models/Procurement.js`

| Field | Type | Constraints |
|---|---|---|
| produceName | String | required, min 2, normalized, alphanumeric+spaces |
| produceType | String | required, enum produce types, normalized |
| sourceType | String | required, enum: `individual`, `company`, `kgl_farm` |
| dateReceived | Date | required |
| timeReceived | String | required |
| tonnageKg | Number | required, min `100`; if `individual` then min `1000` |
| costUgx | Number | required, min `10000` |
| dealerName | String | required, min 2, alphanumeric+spaces |
| dealerContact | String | required, Uganda phone format |
| branch | String | required, enum branches |
| sellingPrice | Number | required, min `10000` |
| recordedBy | ObjectId | ref `User`, required |
| createdAt / updatedAt | Date | auto timestamps |

Indexes:
- `{ branch: 1, createdAt: -1 }`
- `{ branch: 1, dateReceived: -1 }`
- `{ branch: 1, produceType: 1, sourceType: 1 }`

### 5) sales
Source: `backend/models/Sale.js`

| Field | Type | Constraints |
|---|---|---|
| produceName | String | required, min 2, normalized |
| produceType | String | required, enum produce types, normalized |
| tonnageKg | Number | required, min `1` |
| amountPaidUgx | Number | required, min `10000` |
| buyerName | String | required, min 2, alphanumeric+spaces |
| salesAgentName | String | required, min 2, alphanumeric+spaces |
| date | Date | required |
| time | String | required |
| branch | String | required, enum branches |
| recordedBy | ObjectId | ref `User`, required |
| createdAt / updatedAt | Date | auto timestamps |

Indexes:
- `{ branch: 1, createdAt: -1 }`
- `{ branch: 1, date: -1 }`
- `{ branch: 1, produceName: 1, produceType: 1 }`

### 6) trusted buyers
Source: `backend/models/TrustedBuyer.js`

| Field | Type | Constraints |
|---|---|---|
| name | String | required, min 2, alphanumeric words |
| nationalId | String | required, strict Uganda NIN format |
| location | String | required, min 2, alphanumeric words |
| contact | String | required, Uganda phone format |
| branch | String | required, enum branches |
| recordedBy | ObjectId | ref `User`, required |
| createdAt / updatedAt | Date | auto timestamps |

Indexes:
- Unique `{ nationalId: 1, branch: 1 }`
- `{ branch: 1, createdAt: -1 }`

### 7) credit sales
Source: `backend/models/CreditSale.js`

| Field | Type | Constraints |
|---|---|---|
| buyerName | String | required, min 2 |
| nationalId | String | required, strict Uganda NIN format |
| location | String | required, min 2 |
| contact | String | required, Uganda phone format |
| amountDueUgx | Number | required, min `10000` |
| amountPaidUgx | Number | default `0`, min `0` |
| balanceUgx | Number | default `amountDueUgx`, min `0` |
| salesAgentName | String | required |
| dueDate | Date | required |
| produceName | String | required, normalized |
| produceType | String | required, enum produce types, normalized |
| tonnageKg | Number | required, min `1` |
| dateOfDispatch | Date | required |
| branch | String | required, enum branches |
| recordedBy | ObjectId | ref `User`, required |
| trustedBuyer | ObjectId | ref `TrustedBuyer`, required |
| isPaid | Boolean | default `false` |
| payments | Array | repayment events (`amountUgx`, `paidAt`, `receivedBy`) |
| createdAt / updatedAt | Date | auto timestamps |

Indexes:
- `{ branch: 1, createdAt: -1 }`
- `{ branch: 1, dateOfDispatch: -1 }`
- `{ branch: 1, dueDate: 1, isPaid: 1 }`
- `{ trustedBuyer: 1, createdAt: -1 }`

### 8) stock notifications
Source: `backend/models/StockNotification.js`

| Field | Type | Constraints |
|---|---|---|
| branch | String | required, enum branches |
| produceName | String | required, normalized |
| produceType | String | required, normalized, enum produce types |
| category | String | enum `out_of_stock`, default `out_of_stock` |
| message | String | required |
| isRead | Boolean | default `false` |
| readAt | Date | nullable |
| createdAt / updatedAt | Date | auto timestamps |

Indexes:
- `{ branch: 1, category: 1, produceName: 1, produceType: 1, isRead: 1 }`

### 9) stock locks
Source: `backend/models/StockLock.js`

| Field | Type | Constraints |
|---|---|---|
| key | String | required, unique |
| ownerId | String | required |
| expiresAt | Date | required |
| createdAt / updatedAt | Date | auto timestamps |

Indexes:
- TTL on `{ expiresAt: 1 }` with `expireAfterSeconds: 0`

## Relationship Summary
- `User` 1 -> many `Procurement` via `recordedBy`
- `User` 1 -> many `Sale` via `recordedBy`
- `User` 1 -> many `TrustedBuyer` via `recordedBy`
- `User` 1 -> many `CreditSale` via `recordedBy`
- `User` 1 -> many `PriceHistory` via `changedBy`
- `TrustedBuyer` 1 -> many `CreditSale` via `trustedBuyer`
- `User` 1 -> many `CreditSale.payments.receivedBy`

## Sample Seed Data
Source: `backend/seedData.js`

Seed inserts a clean baseline:
- Users: 7
- Price settings: 10 type-default rows (2 branches x 5 produce types)
- Trusted buyers: 2
- Procurements: 6
- Sales: 4
- Credit sales: 2

Seed login accounts:
- Director: `orban`
- Managers: `kulong` (Maganjo), `lam` (Matugga)
- Sales agents: `agent1A`, `agent2A`, `agent1B`, `agent2B`
- Password: `Karibu@2026!` (or `SEED_DEFAULT_PASSWORD`)

## Reseeding Command
From `backend/`:

```bash
npm run seed
```

Warning: seeding clears existing records in core transactional collections before inserting sample data.
