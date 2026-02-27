# Karibu Groceries LTD Requirements Compliance

Last updated: 2026-02-23

## Legend
- `Compliant`: Implemented and enforced.
- `Compliant with Control`: Implemented and enforced with operational guardrails.

## Compliance Table
| ID | Requirement | Frontend Evidence | Backend Evidence | Status | Notes |
|---|---|---|---|---|---|
| R1 | System supports 2 branches (Maganjo, Matugga) | `frontend/src/router/index.js` | `backend/models/User.js`, `backend/models/Procurement.js`, `backend/models/Sale.js`, `backend/models/CreditSale.js` | Compliant | Branch values restricted to the two branches. |
| R2 | Products handled: Beans, Grain Maize, Cow peas, G-nuts, Soybeans | `frontend/src/components/procurement/ProcurementFormFields.vue` | `backend/models/Procurement.js`, `backend/models/Sale.js`, `backend/models/CreditSale.js`, `backend/models/PriceSetting.js` | Compliant | Product types use fixed enum values. |
| R3 | Procurement source types include individual dealers, companies, own farms | `frontend/src/components/procurement/ProcurementFormFields.vue` | `backend/models/Procurement.js` | Compliant | `sourceType` restricted to `individual`, `company`, `kgl_farm`. |
| R4 | Individual dealer procurement must be at least 1000kg | `frontend/src/components/procurement/ProcurementFormFields.vue` | `backend/models/Procurement.js` | Compliant | Conditional validation now applies 1000kg only when `sourceType='individual'`. |
| R5 | Manager records procurement with required fields and validations | `frontend/src/views/Procurement.vue`, `frontend/src/components/procurement/ProcurementFormFields.vue` | `backend/routes/procurementRoutes.js`, `backend/models/Procurement.js`, `backend/controllers/procurementController.js` | Compliant | Required field, pattern, and numeric minimum checks present on UI and API model. |
| R6 | Sales agents record sales for their branch with required fields | `frontend/src/views/Sales.vue`, `frontend/src/components/sales/SalesDetailsSection.vue` | `backend/routes/salesRoutes.js`, `backend/models/Sale.js`, `backend/controllers/salesController.js` | Compliant | API stamps branch and sales agent from authenticated user context. |
| R7 | Amount paid for sale and amount due for credit are computed from managed prices | `frontend/src/components/sales/SalesDetailsSection.vue`, `frontend/src/components/credit/CreditProduceSection.vue` | `backend/controllers/salesController.js`, `backend/controllers/creditSalesController.js`, `backend/controllers/priceController.js` | Compliant | Amount fields are readonly in UI and server-calculated from inventory selling price. |
| R8 | Credit/deferred sales are recorded separately with trusted buyer details and required fields | `frontend/src/views/CreditSales.vue`, `frontend/src/views/TrustedBuyers.vue` | `backend/routes/creditSalesRoutes.js`, `backend/routes/trustedBuyerRoutes.js`, `backend/models/CreditSale.js`, `backend/models/TrustedBuyer.js` | Compliant | Trusted buyers are branch-scoped and validated before credit sale creation. |
| R9 | Only products in stock can be sold | `frontend/src/composables/useStockValidation.js` | `backend/controllers/salesController.js`, `backend/controllers/creditSalesController.js` | Compliant | Server-side stock validation is enforced before writing sale/credit sale records. |
| R10 | Sold tonnage reduces stock | `frontend/src/views/Inventory.vue` | `backend/services/inventoryService.js` | Compliant | Inventory snapshot subtracts tonnage from cash and credit movements. |
| R11 | Manager is notified when stock is out | `frontend/src/views/DashboardLayout.vue` | `backend/models/StockNotification.js`, `backend/services/stockNotificationService.js`, `backend/controllers/stockNotificationController.js`, `backend/routes/stockNotificationRoutes.js`, `backend/controllers/salesController.js`, `backend/controllers/creditSalesController.js`, `backend/app.js` | Compliant | Out-of-stock notifications are persisted and shown to manager with acknowledgement actions. |
| R12 | Sales agent cannot record procurement; manager can record sale | `frontend/src/router/index.js` | `backend/routes/procurementRoutes.js`, `backend/routes/salesRoutes.js` | Compliant | Role-based guards enforce permissions on both UI route level and API level. |
| R13 | Director (Mr. Orban) sees only cross-branch totals/aggregations | `frontend/src/views/DirectorDashboard.vue`, `frontend/src/views/DashboardLayout.vue` | `backend/routes/salesRoutes.js`, `backend/middleware/auth.js`, `backend/models/User.js`, `backend/controllers/authController.js`, `backend/seedData.js` | Compliant | Access now tied to explicit user flag `canViewCrossBranchTotals` (legacy Orban records auto-backfilled on login). |
| R14 | Each branch has exactly 1 manager and 2 attendants | `frontend/src/views/Users.vue` | `backend/controllers/authController.js` | Compliant with Control | Max limits prevent exceeding; minimum guards prevent role change/deletion that would drop below required staffing levels. |

## Implemented Fix Summary
1. Added formal out-of-stock notification pipeline (persist + manager acknowledgement).
2. Updated procurement tonnage validation to be source-aware (`individual >= 1000kg` only).
3. Strengthened branch staffing controls by enforcing minimum staffing on user role changes and deletion.
4. Replaced brittle Orban username/name gate with explicit permission flag (`canViewCrossBranchTotals`) plus legacy auto-backfill during login.
