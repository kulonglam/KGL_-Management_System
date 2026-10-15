# Enterprise Feature Gap Audit

**System:** Karibu Groceries LTD Management System (KGL)  
**Stack:** Vue 3 + Pinia · Node.js/Express · MongoDB/Mongoose  
**Audit date:** 2026-10-15  
**Auditor stance:** Senior software engineer / QA (enterprise readiness lens)  
**Evidence basis:** Direct inspection of routes, models, services, frontend views, schema docs, user manual, and prior launch-readiness reviews

---

## 1. Executive Verdict

KGL is a **strong operational wholesale/branch ERP for a defined academic/SME scope**: procurement, stock-aware cash/credit sales, pricing, trusted buyers, role dashboards, MFA, audit logs, and backups. Against a **true enterprise grocery / wholesale management platform**, it is roughly **35–45% of the expected feature surface**.

| Lens | Assessment |
|---|---|
| Academic / demo “3 core features” | Largely complete and coherent |
| SME single-company multi-branch ops | Usable with gaps in inventory ops, messaging UX, and consistency |
| Enterprise ERP / commerce platform | **Not ready** — large domains absent or only stubbed |

> **Bottom line:** Core sales-and-stock workflows are real. Enterprise capabilities (accounting, supply chain, CRM depth, approvals, integrations, compliance automation, multi-entity scale) are mostly **missing** or **partially scaffolded**.

---

## 2. What *Is* Built (Baseline — Do Not Over-Count Gaps)

These domains exist end-to-end (API + UI + persistence) and should be treated as the current product core:

| Domain | Evidence | Maturity |
|---|---|---|
| Auth (JWT access + refresh, lockout, password reset via recovery codes) | `authRoutes.js`, `authController.js`, `Login.vue`, `PasswordReset.vue` | Strong |
| TOTP MFA + recovery codes | `User.mfa*`, `/mfa/*`, `Profile.vue`, production MFA gate | Strong |
| RBAC (director / manager / sales_agent) | Router `meta.role(s)`, `authorize(...)` | Adequate for 3 roles |
| Multi-branch (fixed + director-managed branches) | `Branch` model, `Branches.vue`, branch scoping | Adequate |
| Procurement recording CRUD | `Procurement` model/routes/views | Strong for recording; weak as supply-chain |
| Cash sales + stock lock | `Sale`, `stockLockService`, `Sales.vue` | Strong |
| Credit sales + repayments | `CreditSale`, repay endpoints, records UI | Strongest domain |
| Trusted buyers | CRUD + soft-delete restore UI | Strong |
| Price management + price history | `PriceSetting`, `PriceHistory`, UI dialogs | Strong (atomic where replica set) |
| Inventory snapshot + low/out-of-stock | `StockBalance`, `inventoryService`, `Inventory.vue` | Improved (balance table); ops thin |
| Stock notifications (in-app) | `/notifications`, sidebar in `DashboardLayout.vue` | Partial (stock only) |
| Role dashboards + CSV/Excel/print export | Director/Manager dashboards + report utils | Adequate reporting lite |
| Append-only audit log | `AuditLog` + `appendOnly.js`, `AuditLogs.vue` | Strong for app audit |
| Soft delete (users, sales, trusted buyers) | `deletedAt` + restore APIs/UI | Partial coverage |
| DB backup/restore + cron | `databaseSnapshot.js`, Render cron | Strong for size of project |
| Message outbox (email/SMS/in-app) | `MessageOutbox`, `messageService.js` | Scaffolded; delivery optional |
| Overdue credit notifier | `overdueCreditNotifier.js` | Backend job exists; UX incomplete |
| OpenAPI/Swagger | `docs/swagger.js` + coverage test | Present; completeness varies |
| CI, rate limits, CSP, health/ready | GitHub Actions, `opsRoutes`, security middleware | Solid foundation |

---

## 3. Partially Built / Not Fully Built Features

These are the highest-value findings for “features that exist but are incomplete.”

### 3.1 Messaging & Notifications — **Backend ahead of product UX**

| Piece | Status | Gap |
|---|---|---|
| `MessageOutbox` model (`email` / `sms` / `in_app`) | Built | No admin UI to inspect queue, retry failed, or purge |
| SMTP email delivery | Built if `SMTP_*` configured | Silent queue-stay when SMTP unset; no user-facing delivery status |
| SMS via webhook | Built if `SMS_WEBHOOK_URL` set | Not a first-party SMS provider; no templates, DND, or delivery receipts |
| Overdue credit notices | Job queues `in_app` + `sms` | **No inbox UI for `in_app` overdue messages**; stock notifications are a separate channel |
| Stock notifications | List + mark read in sidebar | No email/SMS escalation, no severity routing, no acknowledgment SLA |
| Notification preferences | Absent | Users cannot opt channels, quiet hours, or thresholds |

**Enterprise expectation:** unified notification center, channel preferences, template management, delivery audit, retry/DLQ.

---

### 3.2 Soft Delete & Record Lifecycle — **Inconsistent across entities**

| Entity | Soft delete | Restore API | Restore UI |
|---|---|---|---|
| Users | Yes | Yes | Yes (`Users.vue` “Show removed”) |
| Trusted buyers | Yes | Yes | Yes |
| Cash sales | Yes | Yes | Yes (`SalesRecords.vue`) |
| Credit sales | Soft-delete on delete path | **No dedicated restore flow in UI parity** | Incomplete vs cash sales |
| Procurement | **Hard `deleteOne()`** | No | No |
| Price settings | Delete + history | N/A (history, not soft delete) | N/A |
| Branches | Deactivate pattern | Partial | Director UI exists for activity, not full archival |

**Enterprise expectation:** uniform soft-delete, recycle bin, retention policies, legal hold, and immutable financial voiding instead of free delete.

---

### 3.3 Inventory Operations — **Balances exist; warehouse ops do not**

Current strength: `StockBalance` + reconciliation + sell-time locks.

Still missing / incomplete as enterprise inventory:

| Capability | Status |
|---|---|
| Inter-branch stock transfer | **Absent** |
| Stock adjustment (damage, shrinkage, recount) with reason codes | **Absent** |
| Cycle count / stocktake / variance approval | **Absent** |
| Goods Receipt Note (GRN) separate from procurement cost entry | **Absent** (procurement is the only inbound) |
| Lot / batch / expiry tracking | **Absent** |
| Unit of measure conversion (bags ↔ kg) | **Absent** (kg only) |
| Reserved vs available stock | Partial (lock TTL only; no reservation documents) |
| Lock renewal heartbeat during long requests | Partial (TTL env-configurable; no continuous renew) |
| Negative-stock investigation workflow | Integrity guards only; no adjustment ticket |

**Enterprise expectation:** full inventory subledger with movements table (IN/OUT/TRANSFER/ADJUST), dual-control adjustments, and warehouse locations.

---

### 3.4 Procurement / Purchasing — **Recording only, not purchasing**

What exists: free-text `dealerName`, source type (`individual` / `company` / `kgl_farm`), cost, tonnage, date/time.

Missing for enterprise purchasing:

| Capability | Status |
|---|---|
| Supplier master data (tax ID, contracts, payment terms) | **Absent** (`dealerName` string only) |
| Purchase orders → approvals → GRN → invoice match | **Absent** |
| Three-way match (PO / receipt / invoice) | **Absent** |
| Supplier performance scorecards | Dashboard “dealer performance” is aggregate spend, not supplier CRM |
| Landed cost (transport, fees, duty) | **Absent** |
| Returns to supplier | **Absent** |

---

### 3.5 Sales Commerce — **POS-lite, not enterprise commerce**

| Capability | Status |
|---|---|
| Cash sale + credit sale | Built |
| On-screen print receipt | Built (`ReceiptDialog`) — basic HTML print, no numbered fiscal receipt |
| Official invoice / tax invoice / e-invoicing | **Absent** |
| Returns, refunds, credit notes, voids with stock put-back rules | **Absent** (soft-delete restore ≠ formal void) |
| Discounts, promotions, price lists by customer tier | **Absent** |
| Quotation → order → fulfillment | **Absent** |
| Partial shipment / backorder | **Absent** |
| Payment methods (cash/mobile money/bank) with reconciliation | **Absent** (amount fields only) |
| Till / cash-drawer / end-of-day Z-report | **Absent** |
| Barcode / scale integration | **Absent** |

---

### 3.6 Credit & Collections — **Strong ledger core; weak collections suite**

Built well: balances, repayments, overdue filters, notifier job.

Gaps:

| Capability | Status |
|---|---|
| Credit limit per buyer (hard stop) | **Absent** (trusted buyer ≠ credit facility) |
| Aging buckets (30/60/90) formal report | Partial via overdue filter; no full AR aging pack |
| Collection workflow / dunning stages | Notifier only; no case ownership |
| Interest / late fees / restructuring | **Absent** |
| Write-off / bad debt process with approval | **Absent** |
| Customer statements (PDF) emailed | **Absent** |
| Guarantor / collateral tracking | **Absent** |
| In-app manager inbox for overdue notices | **Missing UI** (messages go to outbox `in_app`) |

---

### 3.7 CRM / Customer Master — **Trusted buyers only**

| Capability | Status |
|---|---|
| Trusted buyer registry (NIN, phone, location) | Built |
| General walk-in customer history | Cash sale stores buyer name string; no customer entity |
| Segmentation, tags, visit frequency | **Absent** |
| Interaction timeline / call notes | **Absent** |
| KYC document attachments | **Absent** |
| Duplicate merge / golden record | Duplicate NIN guard only |

---

### 3.8 Pricing — **Branch price book; not enterprise pricing**

| Capability | Status |
|---|---|
| Branch type-default + produce override | Built |
| Price history audit | Built |
| Atomic price + procurement update (replica set) | Built via `runInTransaction` |
| Customer-specific / contract pricing | **Absent** |
| Volume breaks / time-bound promotions | **Absent** |
| Cost-plus / margin guards | Min price only (`10000`) |
| Multi-currency price books | **Absent** (UGX only) |

---

### 3.9 Money & Accounting — **Operational UGX rounding, not finance**

| Capability | Status |
|---|---|
| Whole-shilling rounding helpers | `utils/money.js` (`roundUgx`, `assertWholeUgx`) |
| Decimal128 / integer-cent invariant everywhere | Incomplete vs bank-grade money |
| Chart of accounts / double-entry GL | **Absent** |
| Journal entries from sales/procurement | **Absent** |
| Tax (VAT, withholding) configuration | **Absent** |
| Bank reconciliation | **Absent** |
| AP / AR subledgers beyond credit balances | **Absent** |
| Period close / fiscal calendar | Dashboard `period` query ≠ accounting close |
| Cost of goods sold & gross margin by SKU | Dashboard metrics only; not formal P&amp;L |

**Enterprise expectation:** either native accounting or certified export to QuickBooks/Xero/ERP with immutable financial documents.

---

### 3.10 Identity, Access & Governance — **Good basics; not enterprise IAM**

| Capability | Status |
|---|---|
| Password + TOTP MFA | Built |
| Role enum (3 roles) | Built |
| Fine-grained permission matrix (capability flags) | **Absent** |
| Custom roles / least-privilege packs | **Absent** |
| SSO (SAML/OIDC), Azure AD, Google Workspace | **Absent** |
| LDAP / SCIM provisioning | **Absent** |
| API keys / OAuth clients for partners | **Absent** |
| Impersonation with audit (support mode) | **Absent** |
| Session inventory (“log out all devices”) UI | Token versioning exists; no device session manager UI |
| Maker-checker / dual approval for sensitive writes | **Absent** |
| SoD (segregation of duties) rules engine | **Absent** |
| Field-level authorization | Branch scope only |

Fail-open / coarse guards called out in prior reviews remain a governance risk for enterprise certification even where features “work.”

---

### 3.11 Reporting & BI — **Exportable dashboards, not enterprise analytics**

| Capability | Status |
|---|---|
| Manager / director charts + KPI strips | Built |
| Client-side CSV / Excel-HTML / print | Built |
| Scheduled report email | **Absent** |
| Pixel-perfect PDF engine (server) | **Absent** |
| Ad-hoc query builder / saved reports | **Absent** |
| Data warehouse / OLAP / Cube | **Absent** |
| Embedded BI (Metabase/Power BI) | **Absent** |
| Row-level security in exports audited | Audit log exists; export events not a first-class report catalog |
| Real-time streaming metrics | Polling only |

---

### 3.12 Documents, Files & Content

| Capability | Status |
|---|---|
| Profile image field | Exists on user |
| General file upload (invoices, GRN scans, NIN scans) | **Absent** (no multer/object-storage pipeline for business docs) |
| Document versioning / virus scan | **Absent** |
| E-signature | **Absent** |

---

### 3.13 Integrations & Extensibility

| Capability | Status |
|---|---|
| Versioned REST API (`/api/v1`) | Built |
| Swagger/OpenAPI | Built |
| Partner webhooks (outbound event bus) | **Absent** (SMS webhook is delivery, not domain events) |
| ERP/accounting connectors | **Absent** |
| Mobile money / payment gateway | **Absent** |
| WhatsApp Business API | **Absent** |
| Feature flags | **Absent** |
| Plugin / app marketplace | **Absent** |
| Idempotency keys on writes | Not a general platform feature |

---

### 3.14 Multi-Entity, Localization, Scale Model

| Capability | Status |
|---|---|
| Multi-branch same company | Built |
| Multi-company / multi-tenant SaaS | **Absent** |
| i18n / Luganda / multi-language UI | **Absent** (English only) |
| Multi-currency | **Absent** |
| Timezone-safe enterprise calendar | Partial risk (local vs UTC boundaries historically flagged) |
| Offline / PWA / mobile native apps | **Absent** |
| Horizontal scale (queue workers, Redis cache) | In-process intervals; no job queue platform |

---

### 3.15 Compliance, Privacy & Security Operations

| Capability | Status |
|---|---|
| Application audit trail (append-only) | Strong |
| Audit export for regulators (packaged pack) | Weak / manual |
| GDPR/PDPA: consent, DSAR export/erase workflows | **Absent** (soft delete ≠ right-to-erasure) |
| Data retention / archival jobs | **Absent** |
| PII encryption at field level (NIN) | Not evident as dedicated crypto field |
| SIEM integration / security event streaming | Structured logs only |
| Penetration-test remediation program | Outside product features |
| Secrets management (Vault) | Env vars |
| WAF / bot management | Platform-dependent (Render), not app-owned |

---

### 3.16 HR / Workforce / Admin Console

| Capability | Status |
|---|---|
| Branch user CRUD by manager | Built |
| Org chart, attendance, payroll, commissions | **Absent** |
| Agent commission engine | Dashboard agent performance ≠ payroll |
| System settings console (thresholds, produce catalog, policies) | Hardcoded produce types / thresholds in code |
| Feature toggles per branch | **Absent** |
| Helpdesk / support ticketing | **Absent** |
| In-app help / guided tours | Docs only (`USER_MANUAL.md`) |

---

### 3.17 Frontend Robustness (Enterprise UX Quality)

Prior readiness reviews still apply as **product completeness** issues:

| Gap | Impact |
|---|---|
| Some screens historically missing load/error states | Operator confusion under failure |
| Unbounded dashboard fetches in places | Breaks under real data volume |
| Modal focus-trap coverage incomplete | Accessibility / enterprise a11y fail |
| Password policy mismatch across Profile / seed / production gate | Security UX inconsistency |
| Sales agent dashboard is thin vs manager/director | Role experience incomplete |

These are not “missing modules,” but they prevent enterprise **operational readiness**.

---

## 4. Missing Enterprise Domains (Not Started)

Treat these as **absent product lines**, not polish items:

1. **Financial ERP** — GL, tax, AP/AR close, bank feeds  
2. **Supply chain** — PO, GRN, ASN, transfers, warehouse bins  
3. **Quality / food safety** — lot traceability, recalls, temperature logs  
4. **Promotions & loyalty**  
5. **E-commerce / B2B portal** for buyers  
6. **Transportation / logistics** — fleet, delivery notes, route planning  
7. **Manufacturing / packing** (if farm processing expands)  
8. **HR / payroll / commissions**  
9. **Enterprise IAM** — SSO, SCIM, custom roles, SoD  
10. **Integration hub** — event webhooks, iPaaS connectors  
11. **Mobile / offline first-line selling**  
12. **Master data management** — enterprise product catalog, UoM, brands  
13. **Advanced credit risk** — scoring, limits, collections cases  
14. **Compliance suites** — retention, DSAR, e-invoicing mandates  

---

## 5. Feature Completeness Matrix (Enterprise Rubric)

Legend: **F** = Fully built · **P** = Partial · **A** = Absent

| Enterprise area | Score | Notes |
|---|---|---|
| Authentication & session security | **P→F** | MFA/refresh strong; no SSO/session UX |
| Authorization model | **P** | 3 roles only |
| Branch / org structure | **P** | Multi-branch, not multi-tenant |
| Product / catalog MDM | **P** | Fixed produce types; free-text names |
| Procurement / purchasing | **P** | Recording ≠ PO cycle |
| Inventory & warehouse | **P** | Balances + locks; no transfers/stocktake |
| Cash sales / POS | **P** | Works; no payments/voids/tax invoices |
| Credit / AR | **P** | Strong core; weak collections product |
| CRM | **P** | Trusted buyers only |
| Pricing | **P** | Branch book only |
| Notifications | **P** | Outbox + stock UI; overdue UX gap |
| Reporting / BI | **P** | Dashboards + export |
| Audit & backup | **F** | Relative strength |
| Accounting | **A** | |
| Tax / e-invoicing | **A** | |
| Approvals / workflows | **A** | |
| Integrations platform | **A** | |
| i18n / multi-currency | **A** | |
| Mobile / offline | **A** | |
| Compliance automation | **A** | |

**Estimated enterprise feature coverage:** ~**40%** of a mid-market wholesale ERP checklist (weighted toward ops; near 0% on finance/integrations).

---

## 6. Highest-Impact Incomplete Items (Prioritized)

> **Phased backlog with estimates, DoD, sprint plan, and dependencies:**  
> [`ENTERPRISE_DELIVERY_BACKLOG.md`](./ENTERPRISE_DELIVERY_BACKLOG.md)

### P0 — Finish what you already started (weeks)

1. **Unified notification center** consuming `MessageOutbox` `in_app` (overdue + stock + system)  
2. **Uniform soft-delete/restore** for credit sales and procurements (or replace delete with void)  
3. **Formal void/return** paths that reverse stock and money with audit reasons  
4. **Credit limits** on trusted buyers + hard block at sale time  
5. **Supplier master** (replace free-text dealer with entity)  
6. Close remaining **authz fail-open / audit-scope** issues from launch reviews  

### P1 — Make inventory enterprise-operable (1–2 months)

7. Stock **transfer** between branches  
8. Stock **adjustment** + **stocktake** with dual control  
9. Movement ledger (immutable stock transactions)  
10. Reservation model beyond short TTL locks  

### P2 — Finance & compliance spine (2–4 months)

11. Tax configuration + tax invoice numbering  
12. GL export or light double-entry  
13. Retention policies + audit export packs  
14. Payment method capture + daily cash-up  

### P3 — Platform (ongoing)

15. SSO/OIDC  
16. Outbound domain webhooks  
17. Job queue (BullMQ/Redis) replacing in-process scanners  
18. i18n + timezone policy  
19. Server PDF statements & scheduled reports  

---

## 7. Role-by-Role Gap View

### Director
**Has:** cross-branch dashboard, branches, audit, exports.  
**Missing:** consolidated financial statements, exception workflows, org-wide settings console, compliance packs, SSO-administered staff directory.

### Manager
**Has:** full branch ops for buy/sell/price/users/credit.  
**Missing:** PO approvals, stocktake, transfers, collections case management, supplier AP, shift/till close, configurable alerts.

### Sales Agent
**Has:** sell cash/credit, view inventory, thin personal dashboard.  
**Missing:** offline selling, quotes, returns, customer lookup beyond trusted list, commission visibility, richer coaching KPIs.

---

## 8. Quality Gaps That Look Like “Missing Features” in Production

Even where a feature exists, enterprise QA would reject launch until these are closed:

| Issue class | Why it reads as “not built” |
|---|---|
| Money as floating `Number` without universal invariants | Finance teams will not trust balances |
| Replica-set-only transactions with standalone fallback in non-prod | Environments diverge; “works on my laptop” risk |
| Docs saying inventory is purely computed while `StockBalance` exists | Conceptual dual-model confusion for operators/auditors |
| CI / browser harness regressions (historically) | Enterprise release train blocked |
| No maker-checker on price/credit/write-off | Control deficiency for external audit |

---

## 9. Conclusion

KGL is **not an unfinished toy** — the core wholesale loop is implemented with above-average engineering (MFA, stock locks, append-only audit, backups, credit repayments).  

It **is** unfinished as an **enterprise system** because:

1. Several started platforms (**outbox messaging, soft delete, stock balances, overdue jobs**) are **not productized end-to-end**.  
2. Entire enterprise pillars (**accounting, purchasing cycle, warehouse ops, SSO, workflows, integrations, compliance automation**) are **absent**.  
3. Commercial depth (**returns, tax invoices, payment methods, credit limits, promotions**) required for real money at scale is **missing**.

**Recommended positioning:**  
- Today: **Branch wholesale operations system** (SME).  
- Path to enterprise: execute **§6 P0→P2** as a deliberate product roadmap; do not market as ERP until finance + inventory movements + IAM are real.

---

## 10. Evidence Index (Primary Paths)

| Area | Paths |
|---|---|
| Frontend routes | `frontend/src/router/index.js` |
| API surface | `backend/routes/*.js` |
| Models | `backend/models/*.js` |
| Inventory | `backend/services/inventoryService.js`, `stockBalanceService.js`, `stockLockService.js` |
| Messaging | `backend/services/messageService.js`, `overdueCreditNotifier.js`, `models/MessageOutbox.js` |
| Money | `backend/utils/money.js` |
| Transactions | `backend/utils/transaction.js` |
| Soft delete | `backend/utils/softDelete.js` |
| Intended scope | `README.md`, `USER_MANUAL.md`, `DATABASE_SCHEMA.md` |
| Prior technical reviews | `concept_development/LAUNCH_READINESS_REVIEW.md`, `LAUNCH_READINESS_REVIEW_ROUND2.md` |

---

*This audit evaluates feature completeness for enterprise readiness. It is complementary to launch-readiness defect reviews: those ask “is the built code safe?”; this asks “is the product surface complete for enterprise use?”*
