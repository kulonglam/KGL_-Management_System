# Launch Readiness Review — Karibu Groceries LTD Management System

**Project:** Karibu Groceries LTD Management System (KGL Management System)
**Stack:** Vue 3 + Vite + Pinia (frontend) · Node.js + Express + Mongoose (backend) · MongoDB
**Review date:** 2026-10-12
**Reviewed commit:** `23e4f9c` — "Enhance audit service with trusted query integration and improve test coverage"
**Review scope:** Full repository — backend, frontend, infrastructure, documentation, tests, CI

---

## 1. Executive Summary

This is a **well-architected, above-average student/academic submission** with genuinely thoughtful engineering: distributed stock locking, atomic MongoDB aggregation pipelines for repayments, `sanitizeFilter` hardening against NoSQL injection, TOTP MFA, recovery codes, account lockout, role-based branch scoping, and a real CI pipeline.

However, **it is not launch-ready.** The verification I ran uncovered several defects that would break a first-time setup or corrupt a demo — most severely, the documented install path **fails outright**, and the seeded demo data is **internally inconsistent in a way that silently breaks inventory**.

### What I actually ran

| Check | Command | Result |
|---|---|---|
| Backend lint | `npm run lint` | ✅ Clean |
| Backend tests | `npm test` | ✅ 80/80 pass |
| Backend deps | `npm audit --omit=dev` | ✅ 0 vulnerabilities |
| Frontend lint | `npm run lint` | ✅ Clean |
| Frontend tests | `npm test` | ✅ 31 unit + 38 component = 69/69 pass |
| Frontend build | `npm run build` | ✅ Succeeds in 6.3s |
| Frontend deps | `npm audit --omit=dev` | ✅ 0 vulnerabilities |
| Seed-data integrity | Custom simulation against real normalization code | ❌ **9 of 12 sale/credit movements do not decrement stock** |
| Refresh-cookie path | RFC 6265 path-match simulation | ❌ **Cookie never sent on `/api/v1`** |
| Git hygiene | `git ls-files` | ❌ **96% of repo is committed `node_modules`** |

### Headline verdict

> **Do not launch yet.** The green test/lint/build signals are real but misleading — they do not cover the integration paths where the actual defects live. Expect a first-time-setup failure and a broken demo on day one.

---

## 2. Overall Grade

# **Overall: B − (72 / 100)**

| Dimension | Weight | Score | Notes |
|---|---|---|---|
| Architecture & design | 15% | **13/15** | Clean layering (routes → controllers → services → models), sensible separation |
| Core feature completeness | 20% | **17/20** | All 3 required core features are genuinely implemented and coherent |
| Code quality & consistency | 15% | **11/15** | Clean lint, good comments; some dead code, duplicated helpers |
| Testing | 12% | **7/12** | Good volume (149 tests) but **zero real DB integration tests** — the exact gap where bugs hide |
| Security | 13% | **9/13** | Strong foundations (MFA, lockout, sanitizeFilter, CSP, HSTS); token/session gaps remain |
| Documentation | 10% | **6/10** | Very thorough, but **out of sync with the code in places that break setup** |
| DevOps / deployment | 8% | **5/8** | CI + Render blueprint present; health-check ordering and git hygiene problems |
| Performance & scalability | 7% | **4/7** | Inventory recomputation loads entire collections; unbounded client fetches |
| **TOTAL** | **100%** | **72** | **B −** |

### Interpretation

- **A (85+):** Safe for real users and real money.
- **B (70–84):** Sound system; needs a focused hardening and consistency pass.
- **C (55–69):** Major gaps; demo would visibly break.
- **D (<55):** Not a working system.

This project is a solid **B** on design and a **C+** on production readiness, netting **B −**.

---

## 3. Feature-Level Grades

### 3.1 Backend (50/60 — 83%)

| Area | Grade | Score | Rationale |
|---|---|---|---|
| Procurement recording | **A** | 9/10 | Validated, branch-scoped, audited, stock-integrity guarded |
| Inventory computation | **B−** | 6/10 | Correct logic, but recomputes from **full collection scans** on every write |
| Cash sales | **A−** | 9/10 | Stock-locked, price-resolved, audited; correct error propagation |
| Credit sales & repayments | **A** | 10/10 | Best code in the repo — atomic pipelines, `$expr` guards, proper 409s |
| Trusted buyers | **A−** | 9/10 | Strict NIN/phone validation, branch scoping, unique composite index |
| Pricing | **B+** | 8/10 | History tracking is good; **non-atomic multi-doc writes** |
| Auth & sessions | **B+** | 8/10 | MFA, recovery codes, lockout, token versioning; **no refresh rotation** |
| RBAC | **B** | 7/10 | Role model sound; **`orban` username hardcoding** and fail-open guards |
| Audit logging | **B+** | 8/10 | Enriched metadata, branch scoping; best-effort writes are silent |
| Observability | **B** | 7/10 | Structured JSON logs, request IDs, health/readiness probes |

### 3.2 Frontend (37/40 — 93% in surface area, lower in robustness)

| Area | Grade | Score | Rationale |
|---|---|---|---|
| UI/UX breadth | **A** | 10/10 | 20 views, role-aware nav, charts, exports, dialogs |
| Routing & auth guards | **B+** | 8/10 | Lazy routes, meta-based guards; hardcodes business rule |
| Forms & validation | **B** | 6/10 | Good schemas; **two broken `pattern` regexes**, inconsistent edit paths |
| Accessibility | **B** | 7/10 | Skip link, focus trap composable, axe tests pass; **9 modals lack focus traps** |
| Charts & dashboards | **B+** | 8/10 | Empty states handled; **no canvas cleanup, no ARIA for chart data** |
| Error/loading states | **C+** | 5/10 | Several views have **no loading, empty, or error state at all** |
| Data fetching | **C+** | 5/10 | Dashboards download **entire tables** with no pagination |

### 3.3 Documentation (6/10 — 60%)

Comprehensive and well-structured, but **desynchronised from the code in ways that break setup and demos** (detailed in §5).

### 3.4 Infrastructure & DevOps (6/10 — 60%)

| Item | Grade | Notes |
|---|---|---|
| CI pipeline | **A−** | GitHub Actions: lint → audit → test → build, both apps. Dependabot configured |
| Render blueprint | **B−** | Two services, health check wired, CSP headers — but health check sits behind the rate limiter |
| Git hygiene | **F** | `node_modules` committed — 5,520 of 5,730 tracked files, 47 MB repo |

---

## 4. Critical Issues — Must Fix Before Launch

### 🔴 CRITICAL-1: Seed Data Is Internally Inconsistent and Silently Breaks Inventory

**Severity:** Critical · **Impact:** Demo shows wrong stock numbers · **Effort:** ~15 min

`backend/seedData.js` inserts procurement rows under produce names that **do not match** the names used by the seeded sales and credit sales. Since inventory buckets are keyed on `(normalizedName, produceType, branch)`, unmatched sales **are never deducted**.

I simulated this against the real normalization code:

| Seed movement | Matched a procurement bucket? |
|---|---|
| Sale `Beans` / Maganjo / 900kg | ❌ **NO MATCH** — bucket is `Red Beans` |
| Sale `SoyBeans` / Maganjo / 600kg | ❌ **NO MATCH** — bucket is `SoyBeans01` |
| Sale `Maize` / Matugga / 1500kg | ❌ **NO MATCH** — bucket is `White Maize` |
| Sale `Cow Peas` / Matugga / 400kg | ✅ matched |
| Credit `Maize` ×5 / Matugga / 3500kg | ❌ **NO MATCH** ×5 |
| Credit `Ground Nuts` / Maganjo / 200kg | ✅ matched |

**Result: 9 of 12 movements (75%) silently fail to decrement stock.** The director dashboard and inventory screens will report inflated stock and inflated available-to-sell.

**Root cause:** `PRODUCE_NAME_ALIASES` (`backend/utils/produceNormalization.js:15-28`) maps `red bean(s) → Red Beans`, `white maize → White Maize`, etc. — but plain `beans` → `Beans` and `maize` → `Maize` have no alias, so they title-case to names with no corresponding procurement bucket.

**Fix:** Align every seeded movement to its procurement's canonical produce name (`Red Beans`, `SoyBeans`, `White Maize`, `Cow Peas`, `Groundnuts`). **Better:** add a seed-integrity assertion that fails `npm run seed` if any movement does not resolve to a bucket.

> This directly breaks **Part B, C, and D** of `DEMO_WALKTHROUGH.md` — the three core features being assessed.

---

### 🔴 CRITICAL-2: Documented First-Time Setup Fails Immediately

**Severity:** Critical · **Impact:** Onboarding blocker · **Effort:** ~5 min

`backend/seedData.js:18` reads `process.env.SEED_DEFAULT_PASSWORD` with an **empty-string default**, then `ensureRequiredEnv()` (line 427-430) throws if it fails the password policy:

```js
const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || '';
// ...
const passwordError = validatePasswordStrength(DEFAULT_PASSWORD);
if (passwordError) throw new Error(`SEED_DEFAULT_PASSWORD is invalid: ${passwordError}`);
```

An empty string fails the 10-character minimum → **`npm run seed` throws on a fresh clone.**

Meanwhile **four documents** instruct users to run exactly that and promise a working password:

- `README.md:100-106` — "All seeded users use password `Karibu@2026!`"
- `DEMO_WALKTHROUGH.md:39` — same
- `DATABASE_SCHEMA.md:266` — same
- `RENDER_DEPLOYMENT.md:58` — "Password: from `SEED_DEFAULT_PASSWORD` env var if set, otherwise `Karibu@2026!`"

And **`backend/.env.example` does not mention `SEED_DEFAULT_PASSWORD` at all** (verified).

The last change (`f1edd04 Change default password to an empty string`) removed the default but did not update any of the four docs or the env template.

**Fix (pick one):**
1. Add `SEED_DEFAULT_PASSWORD=` to `backend/.env.example` with guidance, **and** update all four docs.
2. Restore a safe development default in `seedData.js` while keeping the production-strength guard.

---

### 🔴 CRITICAL-3: Refresh Cookie Is Never Sent on the Canonical `/api/v1` Path

**Severity:** Critical · **Impact:** Silent session loss · **Effort:** ~2 min

`backend/utils/cookies.js:23` scopes the refresh cookie to:

```js
path: '/api/auth',
```

But the app is mounted at `/api/v1` (`backend/app.js:94`) and the frontend defaults to `VITE_API_URL=/api/v1` (`frontend/.env.example:2`). RFC 6265 path matching:

```
Cookie Path = "/api/auth"
  /api/v1/auth/refresh   -> cookie NOT SENT   ← canonical path
  /api/auth/refresh      -> cookie SENT
  /api/v1/auth/logout    -> cookie NOT SENT
```

**Consequence:** the silent-refresh mechanism in `frontend/src/services/api.js:120-141` **never works** on `/api/v1`. After the 12-hour access token expires, users are hard-redirected to `/` and lose unsaved work — with no explanation. Note `render.yaml:34` uses `VITE_API_URL=https://kgl-backend-7mow.onrender.com/api` (the `/api` alias), which *would* work — so this bug is **environment-dependent and easy to miss in a demo**.

**Fix:** Change the cookie path to `/api` (covers both aliases) or `/`.

---

### 🔴 CRITICAL-4: `node_modules` Is Committed to Git (96% of the Repository)

**Severity:** Critical · **Impact:** Repo hygiene, supply-chain, review quality · **Effort:** ~10 min

```
Total tracked files:  5,730
node_modules files:   5,520  (96%)
Repo pack size:       47.05 MiB
```

`.gitignore` **does** list `backend/node_modules/` and `frontend/node_modules/` (lines 2-3) — they were committed **before** the ignore rule was added and were never cleaned out. There are also **3 lockfiles** tracked (root-level duplicate).

This inflates clone time, pollutes every future diff and code review, makes it near-impossible to audit what actually changed, and is a supply-chain risk (third-party code shipped in-repo).

**Fix:**
```bash
git rm -r --cached backend/node_modules frontend/node_modules
git commit -m "chore: untrack node_modules"
# Optionally rewrite history to shed the 47 MB (git filter-repo / BFG)
```

---

## 5. High-Severity Issues

### 🟠 HIGH-1: Broken `pattern` Regexes Reject Names Containing Spaces

`frontend/src/views/Profile.vue:59` and `frontend/src/views/Users.vue:160` use `\\s` inside a **static** HTML attribute. HTML attributes are not JS strings, so the browser compiles a literal backslash-`s` rather than a whitespace class:

| Input | Frontend regex | Backend regex |
|---|---|---|
| `John Doe` | ❌ **REJECT** | ✅ PASS |
| `Smith` | ✅ PASS | ✅ PASS |
| `Jos\ne` | ✅ PASS (matches literal `s`) | ❌ REJECT |

A user **cannot save their name if it contains a space** — a serious usability bug on the Profile screen, and it diverges from `backend/models/User.js:9` which correctly uses `\s`. The sibling fields (`TrustedBuyers.vue`, `SalesRecords.vue`, `ProcurementFormFields.vue`) all correctly use `(?: [A-Za-z0-9]+)*`. Fix: use `pattern="^[A-Za-z0-9\s.]+$"`.

### 🟠 HIGH-2: No MongoDB Transactions Anywhere — Multi-Document Writes Can Partially Fail

A grep for `startSession|withTransaction|.session(` across the backend returns **zero matches**. Every multi-document mutation is non-atomic. Highest-risk cases:

- **Price update** (`priceController.js:152,153,162`): saves the price, writes history, *then* propagates to procurements. If step 3 throws, the new price is saved and audited but procurements keep the old price — **silently inconsistent**.
- **Branch creation** (`branchService.js:60-71`): branch + cache + manager user + audit. Partial failure leaves an orphan branch.
- **Sales/credit creation**: the sale document and the stock notifications are separate writes.

> **Positive note:** repayments and payment-status flips (`creditSalesService.js:254-293`, `:318-359`) are the exception — they correctly use single-document aggregation pipelines with `$expr` guards and return 409 on conflict. This is the right pattern.

### 🟠 HIGH-3: Stock Lock Can Expire Mid-Critical-Section → Overselling

`stockLockService.js:11-12` sets `DEFAULT_LOCK_TTL_MS = 8000` with **no renewal heartbeat** and **no env configurability**. The critical section performs **three unbounded collection loads** (`inventoryService.js:112-120`) plus writes and notification upserts. On a real dataset this routinely exceeds 8s, the TTL index expires the lock, and a second request acquires it — **both believe they hold the lock and oversell**.

Additionally, locks cover only the **target** bucket, not the source:
- `salesController.js:333-338` — moving a sale A→B locks only B
- `procurementController.js:254-259` — renaming a procurement A→B locks only B

Two concurrent renames *out of* bucket A take different lock keys, both read the same pre-update snapshot, and both pass the non-negative-stock assertion → **negative stock**.

### 🟠 HIGH-4: `PUT /branches/:id` — `isActive` Coercion Is Unsafe

`branchRoutes.js:35` validates only `body('isActive').exists()` — **presence, not type**. `branchController.js:39` then coerces with `req.body.isActive === true || req.body.isActive === 'true'`. Verified behaviour:

```
isActive="false"  -> stored false   (correct, by luck)
isActive=1        -> stored false   (caller intended true)
isActive="yes"    -> stored false
isActive="on"     -> stored false
```

Any client sending `1` (a very natural choice for a boolean flag) **silently deactivates the branch**, locking out every manager assigned to it. Fix: `.isBoolean().toBoolean()`.

Related: `frontend/src/views/Branches.vue:60` calls `toggleActive` **with no confirmation dialog**, unlike every other destructive action in the app.

### 🟠 HIGH-5: Internal Errors Leaked to Clients as HTTP 400

`middleware/responseFormatter.js:12-18` only masks messages for status codes **≥500**. Roughly 18 controllers return **400** on a caught error, so raw internal messages — including Mongoose `ValidationError`, `CastError`, and Mongo duplicate-key text — reach the client. For example, a duplicate-key violation on `TrustedBuyer`'s unique `{nationalId, branch}` index (`models/TrustedBuyer.js:25`) surfaces the **full Mongo error string** via `trustedBuyerController.js:87`.

Affected: `priceController.js:33,55,105,174,205` · `stockNotificationController.js:67,79` · `trustedBuyerController.js:87,120` · `salesController.js:167` · `procurementController.js:162,323` · `authController.js:190,272` · `branchController.js:27,43`.

### 🟠 HIGH-6: Health Endpoints Sit Behind the Global Rate Limiter

In `backend/app.js`, `app.use(apiLimiter)` (line 63) is registered **before** `app.use('/', opsRoutes)` (line 71). The limiter is **IP-keyed** (300 req / 15 min) and `app.set('trust proxy', 1)` collapses all users behind a proxy to one key. If the budget is exhausted, `/healthz` returns 429 and Render (`render.yaml:9`) will bounce the service. Move the probes above the limiter.

### 🟠 HIGH-7: Refresh Tokens Are Never Rotated

`authController.js:308-332` verifies `refreshTokenVersion` but never increments it. A stolen refresh token is **replayable for its full 7-day lifetime** (`authService.js:93`) with no reuse detection. Standard practice: rotate on use and revoke the family on reuse.

Also: `middleware/auth.js:35` loads the full user but never checks `mfaEnabled` — **enabling MFA does not invalidate already-issued access tokens**.

### 🟠 HIGH-8: Hard-Coded Business Rules Duplicated Across the Stack

The special-cased `orban` director identity appears in **16+ locations** across backend, frontend, router, seed data, and Swagger:

| Location | Purpose |
|---|---|
| `backend/services/authService.js:29,39-40,303-305,374-376` | Identity + registration guard |
| `backend/middleware/auth.js:5,81-99` | `authorizeDirectorOrban` — "Only Mr. Orban can access this route" |
| `backend/controllers/authController.js:152-154,166-169` | Self-rename block, flag recompute |
| `backend/routes/salesRoutes.js:47`, `branchRoutes.js:16,32` | Route gating |
| `frontend/src/utils/directorAccess.js:3` | Frontend route guard |
| `frontend/src/router/index.js:49,127` | `requiresOrbanDirector` meta |
| `backend/seedData.js:29` | Seed account |

This couples **authorization to a mutable username**. Case-sensitivity mismatch is live: `User.username` has a **case-sensitive** unique index (`models/User.js:10`) while authorization uses `normalizeUsername()` (lowercased, `authService.js:36`) — so `Orban` and `orban` can coexist.

Related dead code: `User.canViewCrossBranchTotals` (`models/User.js:20`) is **written in 4 places and never read for authorization**. It grants nothing while looking like an ACL. Its maintenance function `ensureLegacyDirectorTotalsAccess` (`authService.js:163-170`) performs a **DB write on every login** for a flag nothing consumes.

**Recommendation:** replace with a `capabilities` array or a role-permission map. Delete `canViewCrossBranchTotals` entirely.

### 🟠 HIGH-9: Inventory Recomputation Loads Entire Collections

`services/inventoryService.js:112-120`:

```js
const [procurements, sales, creditSales] = await Promise.all([
  Procurement.find(filter), Sale.find(filter), CreditSale.find(filter)
]);
```

No `.select()`, no `.lean()`, no `.limit()`. Called on **every** sale create/update/delete, credit-sale create, and all three procurement mutations. Cost is **O(all historical rows)**, not O(bucket). At scale this becomes the dominant cost of every write. Replace with a single `$group` aggregation pipeline plus `.lean()`.

### 🟠 HIGH-10: Audit Log Route Bypasses the `orban` Guard

`routes/auditRoutes.js:11` uses `authorize('manager','director')` with **no** `authorizeDirectorOrban` — unlike `salesRoutes.js:47` and `branchRoutes.js:16,32`. And `auditController.js:8-10` **removes** the branch filter for directors, so any director reads **every branch's** audit trail including monetary metadata. Currently low-exploitability (only one director exists), but it is exactly the inconsistency the custom middleware exists to prevent.

### 🟠 HIGH-11: Money Stored as IEEE-754 Doubles With No Rounding

All monetary fields are `Number`, and tonnage is validated as a float (`isFloat({min:1})`), so fractional tonnage like `1500.5 kg × 35000` is legal. Every computation multiplies without rounding:

- `salesController.js:137` — `amountPaidUgx = item.sellingPrice * tonnage`
- `creditSalesService.js:177` — `amountDueUgx = item.sellingPrice * tonnage`
- `inventoryService.js:136`, `salesAggregationService.js:214-246`, `creditSalesController.js:94-97`

The **only** rounding in the codebase is cosmetic (`creditSalesService.js:76`). For a financial system handling UGX, use integer minor units or `Decimal128`. Repayments additionally accept **fractional** UGX (`isFloat({gt:0})`, `requestValidators.js:433`), compounding drift over time.

### 🟠 HIGH-12: Fail-Open Branch Guards

Six sites use `role === 'manager'` as the guard:

- `salesController.js:236,272`
- `creditSalesController.js:181,213`
- `creditSalesService.js:222,309`
- `procurementService.js:97-99` (`canManagerAccessBranch` returns `true` for director/sales_agent)

Currently unreachable because routes restrict to `manager`, but **the moment a route widens, the controller check silently no-ops** and grants full cross-branch read/write/delete. Compare the safe pattern at `priceController.js:28,44,116,185`. Flip all six to `role !== 'director'`.

---

## 6. Medium-Severity Issues

### 🟡 MEDIUM-1: Timezone Inconsistency Between UTC and Local Boundaries

- `utils/listQuery.js:22-26` `startOfToday()` → **local** midnight
- `salesAggregationService.js:67-71` `atStartOfDay()` → **local** midnight
- `salesAggregationService.js:91` `parseSpecificDate` → **UTC** midnight (`T00:00:00.000Z`)

These are compared against each other in `buildAggregationContext` (`:177-179`). In **EAT (UTC+3)** — the deployment target — a `specificDate` query buckets records into the **previous calendar day**. A credit sale due "today" may be classified overdue or outstanding depending on server TZ. Unify on UTC.

Additionally `Sale.time` and `Procurement.timeReceived` are free-form strings with **no timezone or offset** (`models/Sale.js:28`), disconnected from their `Date` columns. `seedData.js:229,251` even seeds malformed dates like `'2026-03-5'`.

### 🟡 MEDIUM-2: Zero Database Integration Tests

All 149 tests run against **mocks or pure functions**. `app.integration.test.mjs` uses Supertest but only asserts **401s on unauthenticated routes** — it never touches a database. This is precisely why CRITICAL-1 (seed data), CRITICAL-3 (cookie path), and HIGH-3 (lock expiry) went undetected. Add `mongodb-memory-server` and cover: login→token→create sale→verify stock decremented; repayment→verify balance; cross-branch access denial.

### 🟡 MEDIUM-3: Several Frontend Views Have No Loading/Empty/Error State

| File | Issue |
|---|---|
| `Sales.vue:193-200` | No loading flag; error only to `console.error`. **No fallback** on `response.data.inventory` → `.find()` on `undefined` throws |
| `CreditSales.vue:234-254` | Same, plus `response.data.map(...)` with no `Array.isArray` guard |
| `Branches.vue:107-110` | `loadBranches()` has **no try/catch** and no loading ref → **unhandled promise rejection** |
| `useProcurementForm.js:96-99` | Price fetch failure is silent; user sees an empty price |
| `DashboardLayout.vue:658-704` | Stock alerts and notifications fail silently |

### 🟡 MEDIUM-4: Unbounded Client-Side Data Fetching

- `useManagerDashboard.js:564-570` — `salesAPI.getAll()`, `creditSalesAPI.getAll()`, `procurementAPI.getAll()` with **no pagination**, then aggregates in the browser.
- `SalesAgentDashboard.vue:203-207` — three full-table fetches to compute "today's" numbers, filtered client-side by **string-comparing `salesAgentName` to `user.name`** (breaks on duplicate names or a later rename).
- `DashboardLayout.vue:670-677` — `setInterval` re-fetches full inventory + notifications **every 60s** for the whole session, with no visibility guard or backoff.

The server already provides `salesAPI.getAggregation` — the manager dashboard reimplements that logic client-side instead of using it (`useManagerDashboard.js:98-183`).

### 🟡 MEDIUM-5: Unvalidated Query Parameters Override Role Filters

- `authController.js:218-221` — `req.query.role` is unvalidated and **overwrites** the manager role filter set at `:215`. A manager passing `?role=director` bypasses the restriction (branch filter still holds, limiting impact, but the logic is wrong).
- `stockNotificationController.js:14` — `req.query.unread` unvalidated; any value other than the literal `'false'` forces `isRead: false`.
- Director aggregation params (`period`, `branch`, `specificDate`) have **no validator at all**.

### 🟡 MEDIUM-6: Missing Index for the Stock Notification List Query

`models/StockNotification.js:49-55` indexes `{branch, category, produceName, produceType, isRead}`. But the actual list query (`stockNotificationController.js:10-19`) filters only `{branch, isRead}` and sorts by `createdAt: -1`. **No index supports it.** Add `{branch:1, isRead:1, createdAt:-1}`.

Similarly, `CreditSale` has **no index on `balanceUgx > 0`**, which the overdue notifier filters on every 15 minutes (`overdueCreditNotifier.js:13-24`) — a collection scan each cycle.

### 🟡 MEDIUM-7: Search Uses Unanchored Case-Insensitive Regex

`utils/listQuery.js:17` builds `{ $regex: escapeRegex(query), $options: 'i' }`. **No index can serve this.** Applied to sales, credit sales, procurement, trusted buyers, and users — it degrades to a collection scan as data grows.

### 🟡 MEDIUM-8: Login Lockout Has a Lost-Update Race

`authController.js:78-86` reads `loginAttempts`, increments in memory, then `user.save()`. Two concurrent failed logins both read `n` and both write `n+1` — **the lockout threshold can be bypassed**. Use `$inc` with an atomic filter. Same pattern for `tokenVersion` increments.

### 🟡 MEDIUM-9: No Soft Delete — Deletion Orphans Referenced Documents

Hard `deleteOne()` everywhere. Deleting a `TrustedBuyer` orphans every `CreditSale.trustedBuyer`; deleting a `User` orphans `recordedBy` / `changedBy` / `payments.receivedBy` across collections. For a financial audit system, records should be voided or soft-deleted, not removed.

### 🟡 MEDIUM-10: Swagger Documents Only 22 of ~31 Endpoints

Missing: `/notifications*`, `/branches*`, `/audit-logs`, `/auth/refresh`, `/auth/password-reset`, `/auth/recovery-codes`, `/auth/mfa/{setup,enable,disable}`, `/auth/login/mfa`, `/auth/users/:id/recovery-codes`.

### 🟡 MEDIUM-11: Nine Modals Declare `aria-modal="true"` Without Focus Management

`Users.vue:141,238` · `TrustedBuyers.vue:136` · `SalesRecords.vue:143` · `ProcurementRecords.vue:10` · `CreditSalesRecords.vue:181,272` · `PriceEditorDialog.vue:4` · `PriceHistoryDialog.vue:4` · `ReceiptDialog.vue:3`.

All lack focus trapping, initial focus, and Escape-to-close — a WCAG 2.1.2 / 2.4.3 failure. The codebase already has `useModalFocusTrap` (`composables/useModalFocusTrap.js`) and applies it correctly in `Sales.vue`, `CreditSales.vue`, and `ConfirmDialog.vue`; it just isn't used everywhere.

### 🟡 MEDIUM-12: Edit Paths Bypass Client-Side Validation

- `ProcurementRecords.vue:208-222` — `handleUpdate()` has **zero validation**, while the identical create path (`Procurement.vue:119-123`) runs `validateForm()`.
- `SalesRecords.vue:496-517` — no validation **and no stock-availability check**; editing can push a sale past available inventory.
- `SalesDetailsSection.vue:45-55` and `CreditProduceSection.vue:55-65` — `amountPaidUgx`/`amountDueUgx` are `required` + `min="10000"` but have **no rule in the validation schema**, making their error bindings unreachable.

### 🟡 MEDIUM-13: Profile Image Base64 Stored in `sessionStorage`

`Profile.vue:288-297` reads the file as a data URL; `stores/auth.js:21-30` writes the **entire base64 string** into `sessionStorage`. A 1 MB image becomes ~1.37 MB of base64 against a ~5 MB quota. The resulting `QuotaExceededError` is **silently swallowed** by the empty `catch` at `auth.js:27-29`. Serve images from object storage or a data blob instead.

### 🟡 MEDIUM-14: Password Policy Inconsistent Between Client and Server

Backend requires **10 chars + upper + lower + digit + symbol** (`authService.js:22-28`). Frontend checks only length, and often too short:

| File | Frontend rule |
|---|---|
| `Profile.vue:98,109,312-319` | `minlength="6"`, no complexity |
| `Branches.vue:32` | `minlength="10"`, no complexity |
| `PasswordReset.vue:26` | `minlength="10"`, no complexity |

Users pass the client check and get a server rejection. Share one policy constant.

### 🟡 MEDIUM-15: `updateSale` Leaves Source-Bucket Notifications Stale

`salesController.js:396-401` syncs notifications **only for the new bucket**. Compare `procurementController.js:279-306`, which correctly syncs both. Moving a sale out of a depleted bucket leaves a stale "out of stock" alert.

---

## 7. Low-Severity Issues

| # | Issue | Location |
|---|---|---|
| LOW-1 | Unbounded list endpoints when pagination is omitted (no fallback `.limit()`, unlike notifications' 50 and audit's 100) | `salesController.js:63`, `procurementController.js:71`, `creditSalesController.js:70`, `trustedBuyerController.js:30`, `authController.js:233` |
| LOW-2 | Dead code: `resolveSellingPrice` (test-only), `REFRESH_COOKIE_NAME`, `createLowStockNotification`, `findInventoryBucket`, 4 pass-through branch re-exports | `procurementService.js:101`, `cookies.js:42`, `stockNotificationService.js:104-106`, `inventoryService.js:215`, `branchService.js:123-127` |
| LOW-3 | Dead code: `outOfStockAlertMessage`, `lowStockAlertMessage`, `barCurrency`, `validators.notPastDate`, `setErrors`, `validateField` | `Inventory.vue:252,264`, `dashboardChartTheme.js:211`, `formValidation.js:63`, `useFormValidation.js:55,57` |
| LOW-4 | Unreachable `v-else-if` branches (computed returns `this.users`/`this.buyers`, identical to preceding check) | `Users.vue:87-92`, `TrustedBuyers.vue:83-88` |
| LOW-5 | Triplicated helpers: `toDateInput` ×3, `toNumber` ×6, UGX `Intl.NumberFormat` ×7, `downloadReportFile` ×2 (byte-identical) | `useProcurementForm.js:137`, `numberFormat.js`, `reports/*` |
| LOW-6 | `normalizeProduceName` has **two divergent implementations** — price UI will disagree with the procurement form on `"red beans"` | `useProcurementForm.js:26-31` vs `pricing/priceManagement.js:66` |
| LOW-7 | Chart.js instances have no `key`, so they are never destroyed on filter change; shared module-level `chartOptions` object can leak mutations across charts | `ManagerDashboardCharts.vue:104-127`, `dashboardChartTheme.js:134` |
| LOW-8 | `maintainAspectRatio: false` with **no `ResizeObserver`**; referenced `.chart-panel` classes appear undefined in component `<style>` blocks | `dashboardChartTheme.js:136-188` |
| LOW-9 | No `<Suspense>`/skeleton; `index.html` ships an empty `#app`, so users see a blank page during the refresh round-trip; `main.js:22-27` has no `.catch()` | `main.js`, `index.html:11` |
| LOW-10 | No Vue `errorHandler` / `onErrorCaptured`; a render-time throw blanks the page | `main.js` |
| LOW-11 | On refresh failure the app hard-redirects to `/` with **no "session expired" message**, discarding unsaved form state; if refresh resolves without a token, `clearSession()` is skipped and a stale token lingers | `api.js:129-140` |
| LOW-12 | `accessLogger` logs `req.originalUrl` verbatim including query strings — `?search=<nationalId>` leaks PII into logs; `X-Request-Id` is client-trusted with no format validation | `observability.js:8-12,31` |
| LOW-13 | Logger redacts `password`/`token`/`nationalId` but **not** `mfaSecret`, `recoveryCodeHashes`, or `otpauthUri` — and `middleware/auth.js:35` attaches the full user doc to `req.user`, so any future `logger.info({user: req.user})` leaks TOTP secrets | `logger.js:6-13` |
| LOW-14 | `/healthz` returns `ok` unconditionally — no DB check, uptime, or version. Render uses it, so a wedged Mongo reports healthy | `opsController.js:8-12` |
| LOW-15 | `console.log`/`console.error` bypass the structured logger in `config/database.js` and all of `seedData.js` | multiple |
| LOW-16 | No soft-delete, no data export/import, no backup script; `npm run seed` is destructive (deletes 8 collections) with **no confirmation flag** | `seedData.js:438-450` |
| LOW-17 | Records views have **no export/print affordance** while dashboards have CSV/Excel/PDF; `ReceiptDialog.vue:46-47` silently returns if pop-ups are blocked | `CreditSalesRecords.vue`, `SalesRecords.vue`, `AuditLogs.vue`, etc. |
| LOW-18 | Buttons missing loading state: `Profile.vue:157` (double-submittable MFA enable), `Users.vue:115`, `Branches.vue:37`, `ReceiptDialog.vue:24` | multiple |
| LOW-19 | `@import url('https://fonts.googleapis.com/...')` in `style.css:1` — render-blocking third-party dependency on every load, and a CSP/offline failure point | `assets/style.css:1` |
| LOW-20 | `eslint.config.mjs:4-5` imports `@eslint/eslintrc` and `@eslint/js`, **neither declared in devDependencies** — works only via transitive hoisting | `backend/eslint.config.mjs` |
| LOW-21 | Colour contrast is **disabled** in the a11y test harness (`a11y-utils.mjs:4-6`), so contrast regressions are untested | `frontend/tests/components/a11y-utils.mjs` |

---

## 8. Positive Findings

Credit where due — this project has real strengths:

- **Credit repayment logic is excellent.** `creditSalesService.js:318-359` uses a single-document aggregation pipeline with an `$expr` guard, correctly returns 409 on conflict, and never allows overpayment. Same discipline in `applyCreditPaymentStatusUpdate` (`:254-293`) with the `$concatArrays` payment-history append.
- **NoSQL injection defence is genuinely thorough.** Global `mongoose.set('sanitizeFilter', true)` (`config/database.js:71`) plus `sanitizeRequestPayload` stripping `$`/`.`/`__proto__` keys, plus a custom parameter-pollution guard — and every dynamic query correctly wraps operators in `mongoose.trusted()`.
- **Security headers are comprehensive.** CSP, HSTS (prod only), `X-Frame-Options`, `Cross-Origin-Opener-Policy`, `Origin-Agent-Cluster`, `Permissions-Policy` — all hand-rolled in `securityHeaders.js:29-54`.
- **Env validation fails fast** (`config/env.js:22-66`) with a weak-secret blocklist and mandatory production CORS/JWT claims. Good production hygiene.
- **Token versioning + revocation** (`tokenVersion`/`refreshTokenVersion`) means password changes invalidate issued tokens.
- **MFA (TOTP), recovery codes, and account lockout** are implemented — well beyond typical scope for this kind of project.
- **JWT is held in memory only** (`stores/auth.js:45`); `sessionStorage` stores just the non-sensitive user, and legacy token keys are actively removed.
- **Zero production dependency vulnerabilities** in both apps, with Dependabot configured.
- **CI is real**: lint → audit → test → build on both apps, on push and PR.
- **Accessibility has genuine investment**: skip link, focus-trap composable, ARIA on pagination, and **axe-core automated a11y tests** that pass.
- **Frontend code-splitting works**: 32 lazy chunks, largest vendor bundle 134 kB (52 kB gzip).
- **Documentation is unusually thorough** — README, USER_MANUAL, DATABASE_SCHEMA, DEMO_WALKTHROUGH, RENDER_DEPLOYMENT — with real business-rule explanations.

---

## 9. Prioritized Remediation Plan

### Phase 1 — Launch Blockers (day 1, ~2 hours)

| # | Action | Fixes |
|---|---|---|
| 1 | Align seeded sale/credit-sale produce names to their procurement buckets; add a seed integrity assertion | CRITICAL-1 |
| 2 | Fix the seed password default and update all 4 docs + `.env.example` | CRITICAL-2 |
| 3 | Change refresh cookie `path` from `/api/auth` to `/api` | CRITICAL-3 |
| 4 | `git rm -r --cached` both `node_modules` dirs | CRITICAL-4 |

### Phase 2 — Correctness & Security (week 1, ~1 day)

| # | Action | Fixes |
|---|---|---|
| 5 | Fix `\\s` → `\s` in `Profile.vue:59` and `Users.vue:160` | HIGH-1 |
| 6 | Add `.isBoolean().toBoolean()` for `isActive` | HIGH-4 |
| 7 | Move `/healthz` + `/readyz` above `apiLimiter` | HIGH-6 |
| 8 | Route internal errors through `next(error)`; stop returning 400 for unexpected failures (~18 sites) | HIGH-5 |
| 9 | Make the stock lock configurable + renewable; lock **both** source and target buckets | HIGH-3 |
| 10 | Apply `authorizeDirectorOrban` to `/audit-logs` | HIGH-10 |
| 11 | Rotate refresh tokens on use; check `mfaEnabled` in `protect` | HIGH-7 |
| 12 | Flip the 6 fail-open `role === 'manager'` guards to `role !== 'director'` | HIGH-12 |

### Phase 3 — Scalability & Correctness (week 2, ~2 days)

| # | Action | Fixes |
|---|---|---|
| 13 | Rewrite `calculateInventoryByFilter` as a single `$group` pipeline with `.lean()` | HIGH-9 |
| 14 | Introduce MongoDB transactions for price + branch mutations | HIGH-2 |
| 15 | Adopt integer/Decimal128 money with rounding at every computation | HIGH-11 |
| 16 | Unify all date boundaries on UTC | MEDIUM-1 |
| 17 | Paginate the dashboards; stop downloading full tables | MEDIUM-4 |
| 18 | Add fallback `.limit()` to all list endpoints | LOW-1 |
| 19 | Add missing indexes (`{branch, isRead, createdAt}`, `balanceUgx`) | MEDIUM-6 |
| 20 | Use atomic `$inc` for `loginAttempts` / `tokenVersion` | MEDIUM-8 |

### Phase 4 — Quality & Maintainability (week 3, ~2 days)

| # | Action | Fixes |
|---|---|---|
| 21 | Add `mongodb-memory-server` integration tests (login→sale→stock; repayment→balance; cross-branch denial) | MEDIUM-2 |
| 22 | Replace the `orban` username check with a capabilities model; delete `canViewCrossBranchTotals` | HIGH-8 |
| 23 | Add loading/empty/error states to `Sales.vue`, `CreditSales.vue`, `Branches.vue`, `useProcurementForm.js` | MEDIUM-3 |
| 24 | Apply `useModalFocusTrap` to the 9 remaining modals | MEDIUM-11 |
| 25 | Fix the 2 unvalidated edit paths (`ProcurementRecords.vue`, `SalesRecords.vue`) | MEDIUM-12 |
| 26 | Share one password-policy constant between client and server | MEDIUM-14 |
| 27 | Remove dead code; de-duplicate the triplicated helpers | LOW-2/3/5 |
| 28 | Complete Swagger coverage for the ~9 undocumented endpoints | MEDIUM-10 |
| 29 | Move the remaining hardcoded business rules to backend config endpoints | HIGH-8 (frontend) |
| 30 | Fix the divergent `normalizeProduceName` implementations | LOW-6 |

---

## 10. Final Scorecard

| Category | Score | Grade |
|---|---|---|
| Architecture & design | 13/15 | **A−** |
| Core feature completeness | 17/20 | **B+** |
| Code quality & consistency | 11/15 | **B** |
| Testing | 7/12 | **C+** |
| Security | 9/13 | **B** |
| Documentation | 6/10 | **C** |
| DevOps & deployment | 6/10 | **C** |
| Performance & scalability | 4/7 | **C** |
| **Overall** | **72/100** | **B −** |

### Per-feature grades at a glance

| Feature | Grade |
|---|---|
| Procurement & inventory control | **B−** (blocked by CRITICAL-1 seed bug) |
| Cash & credit sales management | **A−** (best-executed domain in the project) |
| Role-based access & governance | **B+** (sound model, hardcoded identity) |
| Authentication & security | **B+** (strong foundations, token gaps) |
| Dashboards & reporting | **B** (good UX, unscalable data fetching) |
| Documentation & deliverables | **C** (thorough but desynchronised) |
| Deployment & DevOps | **C** (CI good, repo hygiene and health-check ordering poor) |

---

## 11. Conclusion

The **engineering thinking in this codebase is well above typical** for its scope — the distributed locking, atomic repayment pipelines, NoSQL-injection hardening, TOTP MFA, and recovery-code flows are the work of someone who understands the problems. The architecture is clean, the security posture is genuinely considered, and the tests and CI are real rather than decorative.

**But quality of thinking has outpaced quality of verification.** Every blocking defect in this report — the broken seed data, the failing documented setup, the dead refresh cookie, the 47 MB `node_modules` commit — lives precisely in the gap between "unit tests pass" and "the system actually works end to end." The 149 green tests give strong assurance about the code they touch and **zero** assurance about the integration paths where the real bugs are.

**Recommendation:** complete Phase 1 before any demo, panel, or deployment. The four items there take roughly two hours and between them they would prevent a failed first-run setup, a visibly broken inventory demo, a mid-session logout, and an embarrassing repository state. Phases 2-4 are what move this from a strong submission to something safe to run with real money.

---

*Review generated by direct code inspection, execution of the project's own lint/test/build/audit commands, targeted simulations of the seed-data and cookie-path logic against the real normalization code, and systematic route-by-route authorization review.*