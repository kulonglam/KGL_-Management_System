# Enterprise Delivery Backlog (Phased)

**Source:** [`ENTERPRISE_FEATURE_GAP_AUDIT.md`](./ENTERPRISE_FEATURE_GAP_AUDIT.md) §6  
**System:** Karibu Groceries LTD Management System  
**Date:** 2026-10-15  
**Assumption:** 1 senior full-stack engineer (familiar with this repo) · Vue 3 + Express + MongoDB  
**Estimate unit:** engineer-days (includes implementation, unit/integration tests, basic docs)  
**Calibration:** 1 day ≈ 6–7 focused hours; ranges reflect uncertainty, not padding for meetings

---

## Summary Timeline

| Phase | Theme | Duration | Effort | Outcome |
|---|---|---|---|---|
| **P0** | Finish started platforms + control gaps | **3–4 weeks** | **18–24 d** | Ops-safe SME product; no half-open scaffolds |
| **P1** | Inventory enterprise-operable | **5–7 weeks** | **28–38 d** | Transfers, adjustments, stocktake, movement ledger |
| **P2** | Finance & compliance spine | **8–10 weeks** | **40–52 d** | Tax invoices, GL export, payments, retention |
| **P3** | Platform & scale | **ongoing / 8–12 weeks** | **36–48 d** | SSO, queues, webhooks, i18n, scheduled PDFs |

**Cumulative to end of P2 (recommended enterprise MVP):** ~**18–21 weeks** calendar · **86–114 engineer-days**  
**With P3 first slice:** ~**26–30 weeks** · **122–162 engineer-days**

Suggested team shape after P0: **2 engineers** (backend-heavy + frontend) cuts wall-clock ~35–40% if work is split on independent epics.

---

## Estimation Legend

| Tag | Meaning |
|---|---|
| **S** | Small · 0.5–1.5 d |
| **M** | Medium · 2–4 d |
| **L** | Large · 5–8 d |
| **XL** | Extra-large · 9–15 d |
| **Dep** | Blocked by listed IDs |
| **DoD** | Definition of Done (acceptance) |

Priority inside a phase: **Must** → **Should** → **Could**.

---

# Phase P0 — Finish What You Started (3–4 weeks)

**Goal:** Close incomplete scaffolds so nothing “looks built” but fails operators.  
**Exit criteria:** Unified inbox works; delete/void semantics consistent; credit limits enforced; dealer is an entity; prior authz fail-opens closed; CI green.

| ID | Item | Pri | Size | Days | Dep | Primary touchpoints |
|---|---|---|---|---|---|---|
| P0-1 | Unified notification center (`MessageOutbox` `in_app`) | Must | L | 5–6 | — | `messageService`, new `/messages` routes, `DashboardLayout` inbox |
| P0-2 | Wire overdue notices into inbox (stop silent outbox-only) | Must | S | 1 | P0-1 | `overdueCreditNotifier.js` |
| P0-3 | Soft-delete + restore for credit sales (parity with cash) | Must | M | 2–3 | — | `creditSalesController`, `CreditSalesRecords.vue`, API |
| P0-4 | Soft-delete + restore for procurement (replace hard `deleteOne`) | Must | M | 2–3 | — | `procurementController`, records UI, stock sync |
| P0-5 | Formal **void** for cash/credit sales (reason + stock put-back) | Must | L | 5–7 | P0-3 | sales/credit services, audit, receipt “VOID” |
| P0-6 | Credit limit on trusted buyers + hard block at credit sale | Must | M | 3–4 | — | `TrustedBuyer`, `creditSalesService`, UI field |
| P0-7 | Supplier master (replace free-text `dealerName`) | Must | L | 5–7 | — | new `Supplier` model/routes/UI; migrate seed + existing rows |
| P0-8 | Close authz / audit-scope fail-opens from launch reviews | Must | M | 2–3 | — | branch guards, `/audit-logs` director scope |
| P0-9 | Unify password policy (FE/BE/production gate) | Should | S | 1 | — | `passwordPolicy`, `Profile.vue`, seed gate |
| P0-10 | Loading/error states on weak screens (`Branches`, sales inventory) | Should | S–M | 1.5–2 | — | listed Vue views |
| P0-11 | CI green: lint regex + Playwright ANSI readiness | Must | S | 0.5–1 | — | `cookies.js`, browser harness |
| P0-12 | Outbox admin (list failed/queued; retry button) | Could | M | 2–3 | P0-1 | director/manager ops screen |

**P0 subtotal:** **18–24 engineer-days** (Must-only ≈ 16–21 d)

### P0 story cards

#### P0-1 · Unified notification center · 5–6 d
- Backend: `GET /api/v1/messages`, `PUT .../read`, `PUT .../read-all`, filter by `status`/`relatedType`
- Scope by branch + username (`to`)
- Frontend: bell/inbox panel; badge unread count; deep-link to credit sale / inventory
- **DoD:** Manager sees overdue `in_app` + can mark read; sales agent sees stock-related messages; tests cover authz scoping

#### P0-2 · Overdue → inbox · 1 d
- Ensure notifier always writes `in_app` to branch managers (already does) and UI consumes them
- Optional: also surface on Credit Sales Records banner (“N overdue”)
- **DoD:** After notifier run in test, inbox shows the message without SMS configured

#### P0-3 · Credit soft-delete restore · 2–3 d
- `POST /credit-sales/:id/restore` with stock integrity check (mirror sales)
- UI: “Show removed” + Restore on `CreditSalesRecords.vue`
- **DoD:** Soft-deleted credit excluded from balances; restore blocked if stock insufficient; audit logged

#### P0-4 · Procurement soft-delete · 2–3 d
- Stop `deleteOne()`; set `deletedAt`; reverse `StockBalance` via existing hooks
- Restore with non-negative / conflict checks
- **DoD:** Removing procurement that would go negative stock is rejected; restore re-adds tonnage

#### P0-5 · Formal void · 5–7 d
- New status/action `voided` distinct from soft-delete (soft-delete = mistake remove; void = financial cancel)
- Required `reason` (min length); immutable after void; stock returned; credit balance closed as voided
- Receipt shows VOID watermark; audit `sale.voided` / `credit.voided`
- **DoD:** Voided sale cannot be edited/repaid; inventory and dashboards exclude voided amounts; integration test

#### P0-6 · Credit limits · 3–4 d
- `TrustedBuyer.creditLimitUgx` (nullable = unlimited for migration)
- On create credit sale: `outstanding + newAmount <= limit`
- UI: limit field + warning when near 90%
- **DoD:** Over-limit returns 409 with clear message; manager can raise limit; audited

#### P0-7 · Supplier master · 5–7 d
- Model: name, phone, sourceType, branch scope or global, active flag
- Procurement references `supplierId` (+ denormalized name for history)
- Migration script: distinct `dealerName` → Supplier rows
- UI: Suppliers page (manager); procurement picker
- **DoD:** New procurements require supplier; legacy rows backfilled; dealer performance uses supplier id

#### P0-8 · Authz hardening · 2–3 d
- Replace remaining fail-open `role === 'manager'` patterns with explicit deny
- Restrict audit log cross-branch leakage per product rule (director-only aggregate vs manager branch)
- **DoD:** Automated tests prove manager cannot read other branch audit/sales; health/readyz not behind abusive limiter if still open

#### P0-9 · Password policy unify · 1 d
- Single exported policy constants shared FE/BE
- **DoD:** Same min length + classes everywhere; production gate uses same rules

#### P0-10 · UX resilience · 1.5–2 d
- try/catch + loading + empty for named weak screens
- **DoD:** Forced API 500 shows recoverable alert, no unhandled rejection

#### P0-11 · CI green · 0.5–1 d
- Fix `no-control-regex`; strip ANSI / port-poll in Playwright wait
- **DoD:** `npm run lint` + browser job pass on clean clone

#### P0-12 · Outbox admin · 2–3 d
- Director/manager view of queued/failed; retry invokes send again
- **DoD:** Failed SMS/email can be retried; success flips status

---

# Phase P1 — Inventory Enterprise-Operable (5–7 weeks)

**Goal:** Stock becomes a movement-driven subledger, not only balances + sell locks.  
**Exit criteria:** Transfer and adjust in production; stocktake with variance approval; every qty change has an immutable movement row.

| ID | Item | Pri | Size | Days | Dep | Notes |
|---|---|---|---|---|---|---|
| P1-1 | Immutable **stock movement ledger** | Must | L–XL | 8–10 | — | Foundation for all P1 |
| P1-2 | Inter-branch **transfer** (request → ship → receive) | Must | L–XL | 8–12 | P1-1 | Dual-bucket locks |
| P1-3 | Stock **adjustment** with reason codes | Must | L | 5–7 | P1-1 | Damage, shrinkage, found |
| P1-4 | Dual-control for adjustments over threshold | Should | M | 3–4 | P1-3 | Maker-checker |
| P1-5 | **Stocktake** / cycle count + variance | Must | XL | 10–14 | P1-1, P1-3 | Count sheets → post |
| P1-6 | Reservation docs beyond TTL locks | Should | L | 5–7 | P1-1 | Hold qty for in-flight sale |
| P1-7 | Lock renewal heartbeat | Should | M | 2–3 | — | Long request safety |
| P1-8 | Inventory movement report + export | Should | M | 2–3 | P1-1 | CSV/Excel |
| P1-9 | Location / bin (single “store” per branch first) | Could | L | 5–8 | P1-1 | Optional stretch |

**P1 subtotal:** **28–38 d** (Must-only ≈ 26–36 d; dual-control + reservations push upper bound)

### P1 story cards

#### P1-1 · Movement ledger · 8–10 d
- Collection `StockMovement`: `{ type, branch, produce*, qtyKg, refType, refId, actor, note, createdAt }`
- Types: `procurement_in`, `sale_out`, `credit_out`, `transfer_out/in`, `adjustment`, `void_in`, `stocktake`
- Backfill job from historical procurements/sales/credits
- Writers append movement **and** update `StockBalance` in `runInTransaction`
- **DoD:** Balance always equals sum(movements) after reconcile; append-only enforced; integration tests

#### P1-2 · Branch transfer · 8–12 d
- States: `draft` → `in_transit` → `received` / `cancelled`
- Lock source on ship; credit destination on receive
- Director or both managers (configurable) can initiate
- UI: Transfer list + create wizard
- **DoD:** Cannot oversell source; in-transit qty excluded from available; audit + movements written

#### P1-3 · Adjustments · 5–7 d
- Reason enum + free-text note; signed qty delta
- Manager-only; block adjustments that fabricate stock without reason
- **DoD:** Negative on-hand rejected; movement + audit; dashboard inventory matches

#### P1-4 · Dual-control · 3–4 d
- If `|delta| >= ADJUST_APPROVAL_KG` (env), require second manager/director approve
- **DoD:** Pending adjustments not applied to on-hand until approved

#### P1-5 · Stocktake · 10–14 d
- Create count session → freeze optional → enter counted kg → compute variance → post as adjustments
- Export blank count sheet (CSV)
- **DoD:** Posting creates one movement per variance line; session immutable after post

#### P1-6 · Reservations · 5–7 d
- `StockReservation` with expiry; sales create reservation then convert
- Available = onHand − reserved − in_transit_out
- **DoD:** Two concurrent sales cannot both reserve last kilogram

#### P1-7 · Lock heartbeat · 2–3 d
- Renew TTL while critical section runs; env TTL already present
- **DoD:** Request > TTL does not release lock early under load test

#### P1-8 · Movement report · 2–3 d
- Filter by branch/produce/date/type; export
- **DoD:** Director can export cross-branch; manager branch-scoped

---

# Phase P2 — Finance & Compliance Spine (8–10 weeks)

**Goal:** Real-money controls: tax documents, exportable books, payment discipline, retention.  
**Exit criteria:** Numbered tax invoices; daily cash-up; GL CSV/Journal export; retention job; AR aging pack.

| ID | Item | Pri | Size | Days | Dep | Notes |
|---|---|---|---|---|---|---|
| P2-1 | Payment methods on sales (cash / MoMo / bank) | Must | M–L | 4–6 | — | + tender amount validation |
| P2-2 | End-of-day **cash-up / Z-report** | Must | L | 6–8 | P2-1 | Per branch per day |
| P2-3 | Tax config (VAT rate, TIN, invoice preamble) | Must | M | 3–4 | — | System settings |
| P2-4 | Numbered **tax invoice / credit note** PDF | Must | XL | 10–14 | P2-3, P0-5 | Server-side PDF |
| P2-5 | AR **aging report** (current/30/60/90) | Must | M–L | 4–6 | — | Director + manager |
| P2-6 | Credit **write-off** with approval | Must | L | 5–7 | P1-4 pattern | Dual-control |
| P2-7 | Customer **statement** (PDF/email) | Should | L | 5–7 | P2-4, P0-1 | Per trusted buyer |
| P2-8 | **GL export** (journal lines CSV) | Must | L–XL | 8–12 | P2-1, P2-3 | Mapping table |
| P2-9 | Period close (soft lock dates) | Should | L | 5–7 | P2-8 | Block backdated posts |
| P2-10 | Data **retention** job + audit export pack | Must | L | 5–8 | — | Policy config |
| P2-11 | Field encryption for NIN at rest | Should | M–L | 4–6 | — | KMS/env key |
| P2-12 | DSAR export (user/buyer pack) | Could | M | 3–4 | P2-10 | Compliance lite |

**P2 subtotal:** **40–52 d** (Must-only ≈ 35–47 d)

### P2 story cards (condensed DoD)

| ID | DoD (one line) |
|---|---|
| P2-1 | Every cash sale stores tender type; reports split by tender |
| P2-2 | Manager closes day; variance note required if till ≠ system |
| P2-3 | Rates/TIN editable by director; applied to new invoices only |
| P2-4 | Sequential `INV-BRANCH-YYYY-#####`; credit note links void/return |
| P2-5 | Aging totals reconcile to open credit balances ±1 UGX |
| P2-6 | Write-off zeros balance; requires approver ≠ requester |
| P2-7 | Statement PDF emails via outbox when SMTP configured |
| P2-8 | Export produces balanced debits/credits for a date range |
| P2-9 | Closed period rejects create/update with 423 |
| P2-10 | Job archives/anonymizes per policy; zip audit pack downloadable |
| P2-11 | NIN ciphertext in DB; plaintext only on authorized read |
| P2-12 | Director can export one buyer’s personal data JSON/PDF |

---

# Phase P3 — Platform & Scale (8–12 weeks first slice)

**Goal:** Enterprise integration and operability.  
**Exit criteria (first slice):** OIDC login; Redis-backed jobs; signed webhooks; en/lg locale switch; scheduled report emails.

| ID | Item | Pri | Size | Days | Dep |
|---|---|---|---|---|---|
| P3-1 | Job queue (BullMQ/Redis) for overdue, retention, reports | Must | L | 6–8 | — |
| P3-2 | Outbound **domain webhooks** (sale.created, credit.overdue, …) | Must | L | 6–8 | P3-1 |
| P3-3 | Partner **API keys** + scoped permissions | Must | L | 5–7 | — |
| P3-4 | **SSO/OIDC** (one IdP) + JIT provisioning | Must | XL | 10–14 | — |
| P3-5 | Custom roles / permission matrix (beyond 3 enums) | Should | XL | 10–14 | P3-4 |
| P3-6 | i18n framework + Luganda pack (critical strings) | Should | L | 6–8 | — |
| P3-7 | UTC date policy + timezone display settings | Must | M | 3–4 | — |
| P3-8 | Scheduled report email (director weekly) | Should | M–L | 4–6 | P3-1, P2-4 |
| P3-9 | Idempotency-Key on POSTs | Should | M | 3–4 | — |
| P3-10 | Feature flags per branch | Could | M | 3–4 | — |
| P3-11 | PWA offline draft sales (sync later) | Could | XL | 12–15 | P1-6 |
| P3-12 | Session device list + revoke-all UI | Should | M | 2–3 | — |

**P3 first-slice subtotal (Must + key Should):** **36–48 d**

---

## Cross-Phase Dependency Graph

```text
P0-11 CI ─────────────────────────────────────────────► all phases
P0-1 Inbox ◄── P0-2 Overdue
P0-3/P0-4 Soft-delete ──► P0-5 Void ──► P2-4 Credit notes
P0-7 Supplier ─────────────────────────────────────────► (future PO module)
P0-8 Authz ────────────────────────────────────────────► P3-5 Custom roles
P1-1 Ledger ──► P1-2 Transfer
             ├─► P1-3 Adjust ──► P1-4 Dual-control ──► P2-6 Write-off
             └─► P1-5 Stocktake
P2-1 Payments ──► P2-2 Cash-up
P2-3 Tax ──► P2-4 Invoices ──► P2-7 Statements
P2-1+P2-3 ──► P2-8 GL export ──► P2-9 Period close
P3-1 Queue ──► P3-2 Webhooks
            └─► P3-8 Scheduled reports
```

---

## Suggested Sprint Cadence (2-week sprints)

| Sprint | Focus | Deliverables |
|---|---|---|
| S1 | P0 foundations | P0-11, P0-8, P0-9, P0-3, P0-4 start |
| S2 | P0 productize | P0-1, P0-2, P0-3/4 finish, P0-10 |
| S3 | P0 money controls | P0-5, P0-6 |
| S4 | P0 master data + buffer | P0-7, P0-12, harden/tests |
| S5–S6 | P1 ledger + adjust | P1-1, P1-3, P1-7 |
| S7–S8 | P1 transfer + stocktake | P1-2, P1-5 |
| S9 | P1 polish | P1-4, P1-6, P1-8 |
| S10–S12 | P2 commercial docs | P2-1…P2-5 |
| S13–S14 | P2 books & retention | P2-6…P2-10 |
| S15+ | P3 platform | P3-1…P3-4 first |

---

## Resourcing Options

| Model | Wall-clock to end of P2 | Notes |
|---|---|---|
| 1 senior FS | ~18–21 weeks | Matches estimate tables |
| 1 senior + 1 mid | ~12–14 weeks | Split FE inbox/UI vs BE ledger/finance |
| 2 senior + QA half-time | ~10–12 weeks | Best if launch date fixed |

QA effort not fully included: add **~15–20%** calendar for exploratory + regression if no dedicated QA.

---

## Risk Register (Delivery)

| Risk | Impact | Mitigation |
|---|---|---|
| MongoDB not replica-set in prod | Transactions unavailable; P1 ledger unsafe | Mandate ReplicaSet on Render/Atlas before P1 |
| Backfill movements wrong | Inventory distrust | Reconcile job + freeze selling during cutover window |
| Supplier migration breaks dealer reports | Dashboard regression | Dual-read period (`supplierId` + legacy name) |
| PDF/invoice numbering gaps | Legal exposure | Allocate numbers in transaction; gap-audit report |
| Scope creep into full ERP GL | Timeline blowout | Cap P2 at **export**, not full interactive GL |

---

## What We Explicitly Defer (Post-P3 / Separate Programs)

Do not pull into this backlog without a new charter:

- Full interactive General Ledger / bank feeds  
- Purchase Order → GRN → three-way match  
- Lot/expiry food-safety & recalls  
- Native mobile apps  
- Multi-company SaaS tenancy  
- Payroll / commissions engine  
- E-commerce B2B portal  

---

## Tracking Template (copy per ticket)

```text
ID: P0-6
Title: Credit limit on trusted buyers
Phase: P0
Priority: Must
Estimate: 3–4d
Depends on: —
Owner:
Status: Todo | In Progress | Review | Done
Acceptance:
  - [ ] Field creditLimitUgx on TrustedBuyer
  - [ ] Credit sale create enforces limit (409)
  - [ ] UI edit + near-limit warning
  - [ ] Audit log on limit change
  - [ ] Integration test
```

---

## Recommendation

1. **Execute P0 immediately** — highest ROI; finishes paid-for scaffolds.  
2. **Gate P1 on Mongo replica set** in every deployed environment.  
3. **Treat end of P2 as “enterprise-capable SME”** marketing line — not before.  
4. **Buy vs build for P2-4 PDFs** (e.g. PDFKit/Puppeteer) early to avoid sprint slip.

---

*Backlog derived from enterprise gap audit §6; estimates assume current KGL architecture (Express services + Vue views + Mongoose). Re-estimate after P0 if movement-ledger design diverges.*
