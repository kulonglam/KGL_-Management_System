# Launch Readiness Review — Round 2 (Re-Diagnosis)

**Project:** Karibu Groceries LTD Management System (KGL Management System)
**Previous review:** [`LAUNCH_READINESS_REVIEW.md`](./LAUNCH_READINESS_REVIEW.md) — commit `23e4f9c`, score **72/100 (B−)**
**Re-reviewed commit:** `b8d5302` — "Enhance authentication flow and user session management" (2026-10-13)
**Scope of change:** 15 new commits · 237 tracked files (was 5,730) · +6,208 / −858,660 lines

---

## 1. Executive Summary

**All four critical launch blockers from Round 1 are genuinely fixed and verified.** The work is substantial and of high quality — this was not cosmetic patching. New subsystems (append-only audit/price history, database backup & restore, refresh-token rotation, production hardening gates) were built and tested.

**However, the remediation introduced two new blocking regressions**, and the four most severe *high-severity* architectural findings were left untouched. Net movement is positive, but the project is **still not launch-ready**.

> ### Score movement: **72 → 78 (B− → B)**
> Critical blockers **4 → 0**, but **2 new regressions** landed in CI-breaking territory.

### Round 1 → Round 2 verification

| # | Round 1 blocker | Status | Proof |
|---|---|---|---|
| 🔴 1 | Seed data broke inventory (9/12 movements unmatched) | ✅ **FIXED** | Re-ran my simulation: **10/10 movements now match**. Added `findUnmatchedStockMovements()` guard + `assertSeedStockIntegrity()` |
| 🔴 2 | Documented setup failed on fresh clone | ✅ **FIXED** | `resolveSeedPassword()` falls back to documented password; `SEED_DEFAULT_PASSWORD` added to `.env.example`; production seeding now **refuses** the demo password |
| 🔴 3 | Refresh cookie never sent on `/api/v1` | ✅ **FIXED** | Path changed `/api/auth` → `/api` (+ legacy dual-clear). RFC 6265 re-verified: all auth endpoints now `SENT` |
| 🔴 4 | `node_modules` committed (96% of repo) | ✅ **FIXED** | **0** of 237 tracked files are `node_modules` |

### Commands run this round

| Check | Round 1 | Round 2 |
|---|---|---|
| Backend lint | ✅ clean | ❌ **FAILS — 1 error (new regression)** |
| Backend tests | ✅ 80/80 | ✅ **113/113** |
| Backend audit | ✅ 0 vulns | ✅ 0 vulns |
| Frontend lint | ✅ clean | ✅ clean |
| Frontend tests | ✅ 69/69 | ✅ **75/75** (34 unit + 41 component) |
| Frontend build | ✅ | ✅ builds |
| Frontend audit | ✅ 0 vulns | ✅ 0 vulns |
| **Browser tests (Playwright)** | n/a | ❌ **2/2 FAIL — new regression** |
| Seed-data integrity sim | ❌ 9/12 | ✅ **10/10** |
| Cookie path sim | ❌ not sent | ✅ **sent** |
| Git hygiene | ❌ 96% node_modules | ✅ **0** |

---

## 2. Updated Grade

# **Overall: B (78 / 100)** — up from 72

| Dimension | Weight | R1 | R2 | Change | Notes |
|---|---|---|---|---|---|
| Architecture & design | 15% | 13 | **13** | — | Unchanged; still clean layering |
| Core feature completeness | 20% | 17 | **17** | — | Core features intact and now integration-tested |
| Code quality & consistency | 15% | 11 | **10** | ▼ | Regression: lint now fails |
| Testing | 12% | 7 | **10** | ▲▲ | +33 tests, real DB integration, browser tests added |
| Security | 13% | 9 | **12** | ▲▲▲ | Token rotation, reuse detection, prod gates, atomic lockout |
| Documentation | 10% | 6 | **7** | ▲ | Seed docs resynced; backup documented |
| DevOps / deployment | 8% | 5 | **7** | ▲▲ | Cron backup, real CSP, `/readyz` health check |
| Performance & scalability | 7% | 4 | **4** | — | Untouched; still full-collection scans |
| **TOTAL** | **100%** | **72** | **78** | **+6** | **B− → B** |

**Why not higher:** two of the gains are offset by regressions that break CI, and the four heaviest *architectural* findings — no transactions, lock TTL expiry, full-collection inventory scans, and float money — were not addressed at all.

---

## 3. New Blocking Regressions

### 🔴 NEW-1: Backend Lint Fails — CI Is Red on Arrival

```
backend/utils/cookies.js
  100:60  error  Unexpected control character(s) in regular expression: \x00, \x1f  no-control-regex
✖ 1 problem (1 error, 0 warnings)
```

`cookies.js:100` (new remembered-username validation added this round) uses:

```js
!/[\u0000-\u001f\u007f;]/.test(username)
```

`eslint` rejects control characters in regexes by default. `npm run lint` exits **1**, and `.github/workflows/ci.yml:30` runs `npm run lint` as the **second step** of the `backend` job — so **every push and PR fails immediately**, before tests ever run.

Round 1's backend lint was clean. This is a newly introduced break.

**Fix (one line):**
```js
// eslint-disable-next-line no-control-regex
!/[\u0000-\u001f\u007f;]/.test(username)
```
or switch to an explicit allowlist, e.g. `/[^A-Za-z0-9._-]/`.

---

### 🔴 NEW-2: Both Playwright Browser Tests Fail — Readiness Check Can Never Pass

```
not ok 1 - a signed-in user records a cash sale in the browser
not ok 2 - a director and a manager use the branch and staff screens
# pass 0
# fail 2

error: Timed out waiting for the dev server.
```

Both tests hang for 60s and fail. **I traced the root cause precisely.**

`cashSale.browser.mjs:120` and `staffBranches.browser.mjs:118` both wait on:
```js
await waitForOutput(vite, /Local:/, 60_000);
```

Vite's startup banner applies **bold ANSI** to the label, so the raw stdout is:

```
"\u001b[32m\u001b[1mLocal\u001b[22m:   \u001b[36mhttp://localhost:\u001b[1m45999\u001b[22m/\u001b[39m\n"
                  ^^^^^^^^         ^
                  "Local"  "]"     ":"
```

The literal substring `Local:` **never appears contiguously**. Verified:

```
raw contains literal 'Local:'  : false
```

So `pattern.test(buffer)` is permanently `false` regardless of how healthy Vite is — Vite reports *"ready in 1169 ms"* and the test still times out at 60s. The test is structurally guaranteed to fail on any ANSI-enabled terminal.

`.github/workflows/ci.yml:69-98` adds a dedicated `browser-sale` job running exactly these two files, so **that CI job fails too**.

**Fix** — strip ANSI before matching, which also hardens it against future Vite output changes:
```js
const stripAnsi = (s) => s.replace(/\u001b\[[0-9;]*m/g, '');
child.stdout?.on('data', (c) => { buffer += stripAnsi(String(c)); ... });
```
Keep `/Local:/` as the pattern. Alternatively poll the TCP port, which is immune to output-format changes entirely.

---

## 4. Round 1 High-Severity Items — Resolution Status

### ✅ Resolved (5 of 12)

| R1 # | Finding | Evidence |
|---|---|---|
| HIGH-1 | Broken `\\s` `pattern` regexes | **Gone** — `grep` for `pattern="^[A-Za-z0-9` returns no matches; all now use `(?: [A-Za-z0-9]+)*` |
| HIGH-4 | `isActive` unsafe coercion | **Fixed** — `branchRoutes.js:35` now `.isBoolean().withMessage(...).toBoolean()` |
| HIGH-7 | Refresh tokens never rotated | **Substantially fixed** — `authController.js:57-100` implements rotation with **JTI-based reuse detection** and a 10s grace window; `revokeUserTokens` on reuse. New `refreshRotation.test.mjs` (206 lines) covers it |
| HIGH-8 | `orban` username hardcoding | **Fixed** — `grep -i orban` across backend returns **3 hits, all comments/seed data**. `isDirectorAccount()` (`authService.js:77`) is now role-based. Frontend: **0 matches** |
| MEDIUM-8 | Login lockout lost-update race | **Fixed** — `recordFailedLogin()` (`authController.js:109-139`) uses a single atomic aggregation pipeline that increments and locks in one document write. Covered by `loginLockout.test.mjs` |

**Also fixed beyond the original list:**
- **Append-only guarantees** — `utils/appendOnly.js` blocks `updateOne/deleteOne/bulkWrite` and non-insert `save` on `AuditLog` and `PriceHistory`, patching both Mongoose hooks *and* the raw collection to close the `bulkWrite` bypass. Verified by assertion in `stock.integration.test.mjs:241-248`.
- **Backup & restore** — `services/databaseSnapshot.js` + `scripts/backupDatabase.js` + `scripts/restoreDatabase.js`, with EJSON (preserves BSON types), path-traversal guards (`safeBackupFileName`), a Render **cron job** at 02:15 UTC, and production refusal unless the snapshot is actually published off-machine.
- **Destructive-seed guards** — `assertSeedMayRun()` refuses production seeding without `ALLOW_PRODUCTION_SEED=true` and refuses the demo password in production. Every seed writes a snapshot first.
- **Production hardening gate** — `productionLoginGate()` (`authController.js:141-164`) forces password change and MFA enrollment in production, with full frontend support in `Login.vue:91-133`.
- **Real DB integration tests** — 10 files use `mongodb-memory-server`; `stock.integration.test.mjs` proves sale→stock-decrement and login→refresh→procurement→credit→repay against a real database.
- **`healthCheckPath` moved `/healthz` → `/readyz`**, CSP upgraded from `Report-Only` to enforcing.

### ❌ Still Open (unchanged)

| R1 # | Finding | Current state |
|---|---|---|
| **HIGH-2** | **No MongoDB transactions** | `grep startSession\|withTransaction\|\.session(` → **0 matches**. Price update still saves price + history + `Procurement.updateMany` non-atomically |
| **HIGH-3** | **Stock lock TTL expiry → overselling** | `stockLockService.js:11` still `DEFAULT_LOCK_TTL_MS = 8000`, **not env-configurable, no renewal heartbeat**. Still locks only the target bucket, not the source |
| **HIGH-9** | **Inventory loads full collections** | `inventoryService.js:112-120` unchanged — `Procurement.find(filter), Sale.find(filter), CreditSale.find(filter)`. **No `$group`, no `.lean()`, no `.limit()`** on every sale/procurement write |
| **HIGH-11** | **Float money, no rounding** | `grep Math.round(\|Decimal128` → **2 hits, both cosmetic** (`creditSalesService.js:76`, `overdueCreditNotifier.js:40`). No integer/decimal invariant on any monetary field |
| **HIGH-6** | **Health behind rate limiter** | `app.js:63` `apiLimiter` still precedes `app.js:71` `opsRoutes`. Now **more consequential** — Render's `healthCheckPath` is `/readyz`, which is also behind the limiter |
| **HIGH-10** | **`/audit-logs` lacks Orban guard** | `auditRoutes.js:11` still `authorize('manager','director')` with no director-identity restriction; `auditController` still drops the branch filter for directors |
| **HIGH-5** | **Internal errors leaked as 400** | The ~18 `res.status(400).json({message: error.message})` catch blocks remain |
| **HIGH-12** | **Fail-open branch guards** | All 6 sites still `role === 'manager'` — `creditSalesController.js:194,226`, `salesController.js:247,283`, `creditSalesService.js:222,309`, `procurementService.js:98` |

### ❌ Medium/Low Still Open

| R1 # | Finding | Current state |
|---|---|---|
| MEDIUM-1 | UTC/local date inconsistency | `listQuery.js:22-26` `startOfToday()` still local-midnight |
| MEDIUM-3 | Missing loading/error states | `Branches.vue:106-109` `loadBranches()` **still has no try/catch** → unhandled rejection. `Sales.vue` has no inventory loading/error state |
| MEDIUM-4 | Unbounded client fetches | `useManagerDashboard.js` — `grep 'limit\|page\|getAll('` → **no matches**; dashboards still pull whole tables |
| MEDIUM-6 | Missing `StockNotification` index | `models/StockNotification.js:49-55` unchanged — still no `{branch, isRead, createdAt}` index |
| MEDIUM-7 | Unanchored regex search | `listQuery.js:17` still `{ $regex, $options:'i' }` |
| MEDIUM-10 | Swagger incomplete | Not extended this round |
| MEDIUM-11 | 9 modals lack focus traps | Not addressed |
| MEDIUM-12 | Unvalidated edit paths | Not addressed |
| MEDIUM-14 | Password policy mismatch | **Partly worsened** — a new third policy now exists for the production gate |
| LOW-16 | No backup script | ✅ Resolved |
| LOW-4/5/6/7 | Dead code, triplication, divergent `normalizeProduceName`, chart cleanup | Not addressed |

---

## 5. New Findings Introduced This Round

### 🟠 NEW-3: Production Login Gate Uses a `bcrypt.compare` on Every Login

`authController.js:146` runs `await bcrypt.compare(DOCUMENTED_SEED_PASSWORD, user.password)` on **every** successful login in production — an extra bcrypt verification (cost 10) added to the hot auth path purely to detect a demo password. Cacheable, or better: store a boolean flag at seed time rather than re-deriving it per request.

### 🟠 NEW-4: Hardcoded Developer-Machine Path in Test Harness

Eight test files contain:
```js
const installedMongod = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';
```
(`cashSale.browser.mjs:20`, `stock.integration.test.mjs:11`, and 6 others). Guarded by `existsSync`, so it degrades safely — but it pins tests to a **specific Windows install path and MongoDB minor version**, and signals the suite was tuned on one machine. Prefer `MONGOMS_SYSTEM_BINARY` from the environment with the local path as an opt-in fallback.

### 🟡 NEW-5: Stray Nested `backend/concept_development/` Folder

A copy of the Round 1 review exists at `backend/concept_development/LAUNCH_READINESS_REVIEW.md`, **untracked** by git. It sits inside the `backend/` package root where ESLint and the build resolve modules — confusing, and a candidate for accidental commit.

### 🟡 NEW-6: Audit Logs Are Not Cleared by Seed

`clearCollections()` (`seedData.js:546-553`) deletes 8 collections but **not `AuditLog`** or `PriceHistory` — correctly so, given they are now append-only. Consequence: re-seeding **accumulates** audit entries pointing at deleted users and procurements forever. `enrichAuditItems` degrades gracefully, but the audit trail becomes progressively misleading. Consider a documented `AuditLog` truncation step for dev reseeds.

### 🟡 NEW-7: Refresh Grace Window Is a 10-Second Replay Window

`authController.js:47-51` allows a rotated-but-recent token to be replayed for `AUTH_REFRESH_REUSE_GRACE_MS` (default 10s). This is a deliberate, standard trade-off for concurrent-tab races — worth documenting as such, but it is a real (small) window.

### 🟡 NEW-8: Three Coexisting Password Policies

- `PASSWORD_POLICY` (`authService.js`) — 10 chars + 4 character classes
- `rejectDocumentedPassword()` (`seedPolicy.js`) — blocks the demo password
- Frontend: `Profile.vue` 6-char, `Branches.vue`/`PasswordReset.vue` 10-char, **none with complexity rules**

The production gate makes the mismatch user-visible: a user who set a 10-char lowercase-only password in dev will pass the frontend check and be forced through the production gate.

---

## 6. Remaining Critical Path (Phase 1 Equivalent — ~45 min)

| # | Action | Effort |
|---|---|---|
| 1 | Fix the `no-control-regex` lint error in `cookies.js:100` → **CI green** | 1 min |
| 2 | Strip ANSI (or poll the port) in both browser tests → **CI green** | 5 min |
| 3 | Add `npm run test:browser` script; note browser tests are excluded from `npm test` | 2 min |
| 4 | Move `opsRoutes` **above** `apiLimiter` in `app.js` | 2 min |
| 5 | Replace the 6 fail-open `role === 'manager'` guards | 10 min |
| 6 | Restrict `/audit-logs` director access | 5 min |
| 7 | Delete stray `backend/concept_development/` | 1 min |
| 8 | Make stock-lock TTL env-configurable + add renewal | 15 min |

**After items 1–2, CI is green and the demo path works.** Items 4–8 close the remaining exploitable/consistency gaps.

### Phase 2 — Structural (unchanged from Round 1, still required)

| # | Action | Fixes |
|---|---|---|
| 9 | MongoDB transactions for price + branch mutations | HIGH-2 |
| 10 | `calculateInventoryByFilter` → single `$group` pipeline with `.lean()` | HIGH-9 |
| 11 | Integer/Decimal128 money with rounding at every computation | HIGH-11 |
| 12 | Lock **both** source and target buckets | HIGH-3 |
| 13 | Unify all date boundaries on UTC | MEDIUM-1 |
| 14 | Paginate dashboards; stop downloading full tables | MEDIUM-4 |
| 15 | Add `{branch, isRead, createdAt}` index; `balanceUgx` index | MEDIUM-6 |
| 16 | Route internal errors through `next(error)` | HIGH-5 |
| 17 | Extend Swagger to all endpoints | MEDIUM-10 |

---

## 7. Feature-Level Grades

### Backend (57/60 — 95%)

| Area | R1 | R2 | Change |
|---|---|---|---|
| Procurement recording | B− | **A−** | ▲ Seed integrity + integration tests |
| Inventory computation | B− | **B−** | = Full-scan architecture unchanged |
| Cash sales | A− | **A** | ▲ Now integration-tested end to end |
| Credit sales & repayments | A | **A** | = Still the best code in the repo |
| Trusted buyers | A− | **A−** | = |
| Pricing | B+ | **B+** | = Still non-atomic multi-doc writes |
| Auth & sessions | B+ | **A−** | ▲▲ Token rotation, reuse detection, prod gates, atomic lockout |
| RBAC | B | **B+** | ▲ `orban` hardcoding gone; fail-open guards remain |
| Audit logging | B+ | **A** | ▲ Append-only enforced at hook *and* collection level |
| Observability | B | **B** | = Logger gaps unchanged |

### Frontend (37/40 — 93%)

| Area | R1 | R2 | Change |
|---|---|---|---|
| UI/UX breadth | A | **A** | = |
| Routing & auth guards | B+ | **A−** | ▲ `orban` meta removed; role-based |
| Forms & validation | B | **B−** | ▲ Broken `pattern` regexes fixed |
| Accessibility | B | **B** | = 9 modals still lack focus traps |
| Charts & dashboards | B+ | **B+** | = |
| Error/loading states | C+ | **C** | ▼ Still missing in `Branches.vue`, `Sales.vue` |
| Data fetching | C+ | **C+** | = Dashboards still unbounded |

### Infrastructure (6/10 → 8/10)

| Item | R1 | R2 |
|---|---|---|
| CI pipeline | A− | **B** (↓ CI is red) |
| Render blueprint | B− | **A−** (cron backup, enforcing CSP, `/readyz`) |
| Git hygiene | **F** | **A+** (0 node_modules files) |
| Backup & DR | **F** | **A−** (snapshot + cron + guarded restore) |

---

## 8. Positive Findings

This round contains genuinely impressive work:

- **Append-only enforcement is thorough.** Patching both Mongoose hooks *and* the raw collection driver closes the `bulkWrite` bypass that a hooks-only approach would miss. The module-level `nativeWriteDepth` escape hatch lets `restoreDatabase` wipe and reinsert while remaining closed to normal traffic.
- **Refresh-token rotation with reuse detection** is the textbook implementation: atomic `$inc` version bump, JTI comparison, bounded grace window for concurrent tabs, and full revocation on suspected theft.
- **The atomic login-lockout pipeline** (`recordFailedLogin`) collapses read-check-write into one document write — genuinely eliminating the lost-update race.
- **Backup refuses to lie.** In production, `publishBackup` throws if `BACKUP_UPLOAD_URL` is unset, and requires `https`. A seed that cannot publish its snapshot **stops before clearing a single collection**. Path traversal is guarded. This is how destructive jobs should be written.
- **Seed integrity is now enforced, not assumed** — `findUnmatchedStockMovements` + `assertSeedStockIntegrity` means the Round 1 bug class cannot silently return.
- **`mongodb-memory-server` integration tests** close the single biggest methodological gap I flagged. The tests assert real DB state, not mocks.
- **The `orban` removal** was done properly — a clean role-based `isDirectorAccount()` replacing username-keyed authorization, rather than a patch.

---

## 9. Final Scorecard

| Category | R1 | R2 | Grade |
|---|---|---|---|
| Architecture & design | 13/15 | **13/15** | A− |
| Core feature completeness | 17/20 | **17/20** | B+ |
| Code quality & consistency | 11/15 | **10/15** | C+ |
| Testing | 7/12 | **10/12** | B |
| Security | 9/13 | **12/13** | A− |
| Documentation | 6/10 | **7/10** | C+ |
| DevOps & deployment | 5/10 | **7/10** | C+ |
| Performance & scalability | 4/7 | **4/7** | C |
| **Overall** | **72** | **78** | **B** |

### Critical blockers: 4 → 0 · New regressions: 2

---

## 10. Conclusion

Round 1's four blockers were **all** fixed, and fixed properly — not by loosening assertions, but by adding seed-integrity guards, production refusals, a dual-path cookie migration, and a genuine DB test harness. The security posture improved substantially, and backup/restore plus append-only audit guarantees are capabilities most projects at this stage don't have at all.

**But the two new regressions are self-inflicted and both break CI on arrival** — a lint error from a security regex, and a browser-test readiness check that can never match Vite's ANSI-formatted output. Neither is conceptually hard (one `eslint-disable` comment, one `.replace()` for ANSI stripping), but together they mean **a fresh clone does not pass its own pipeline**, which undercuts the credibility of everything else that improved.

The pattern worth naming: this round invested heavily in **new capability** (rotation, append-only, backups, production gates) while leaving the **performance and consistency architecture untouched** — no transactions, no inventory aggregation, no money rounding, lock TTL still 8s. Those are the findings that will bite under real data volume, and they are exactly as severe as they were two rounds ago.

**Recommendation:** spend 45 minutes on §6 items 1–8 to get CI green and close the fail-open guards, then treat Phase 2 (§6 items 9–17) as the real remaining work. The project is a strong submission and now a credible B; items 9–11 are what separate it from a system safe to run with real money.

---

*Re-review generated by direct code inspection, re-execution of lint/test/build/audit on both apps, re-running the Round 1 seed-integrity and cookie-path simulations against the new code, executing the new Playwright browser tests to reproduce their failure, and byte-level analysis of Vite's stdout to isolate the readiness-check defect.*