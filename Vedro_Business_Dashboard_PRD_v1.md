# Vedro Business Dashboard

PRODUCT REQUIREMENTS DOCUMENT · Version 1.0 · October 2026


## 1. Document control
**Status:** Draft for founder and engineering review  
**Product:** Vedro Business Dashboard / Business Control Center  
**Version:** 1.0 — October 2026  
**Platform:** Responsive web application  
**Business:** Food products; proprietorship; online and offline sales; INR and GST reporting; partial historical records  
**Proposed stack:** Next.js + TypeScript, server-side API/business logic, PostgreSQL, secure file storage and managed hosting.

No actual revenue, expense, cash, stock, founder contribution or asset balances are assumed in this PRD. Opening values must be supported by source records and approved during migration.

## 2. Executive summary
Vedro requires a central system to manage finance, sales, inventory, advertising, contributor funding, equipment, customers and future projections. The application must replace disconnected records with linked, traceable data.

The system must:
- Track sales, discounts, returns, GST, COGS, expenses, profit and cash separately.
- Support offline, wholesale, website and marketplace sales.
- Record each contributor's financial activity without incorrectly assigning legal ownership.
- Link orders to customer history, inventory movements and payment records.
- Compare ad spend with attributed revenue while making clear that ROAS is not profit.
- Track machines and equipment with invoices, warranty, maintenance and depreciation.
- Provide 12-month scenario projections.
- Import partial historical records with validation, duplicate detection, reconciliation and audit history.

## 3. Problem statement, goals and non-goals
### Problems to solve
Founders need reliable answers to: how much was sold; which products are profitable; how much cash is available; how much each person contributed; which ads drive attributable sales; what stock is available; what equipment was purchased; and how much future funding may be required.

### Goals
1. Establish reliable finance and transaction records.
2. Connect orders, payments, inventory, tax and customer records.
3. Provide an executive dashboard with drill-down to source records.
4. Reduce manual reconciliation and reporting.
5. Make contributor records transparent and auditable.
6. Separate actuals, estimates and forecasts.

### Non-goals for the first release
- Replacing a qualified accountant or tax adviser.
- Automatically filing GST returns without separately scoped, tested compliance integration.
- Initiating bank payments.
- Treating platform-reported ad revenue as verified order revenue.
- Full manufacturing ERP unless approved as a later phase.
- Treating three contributors as legal equity owners by default.

## 4. Legal structure safeguard
A proprietorship has one legal proprietor. The other two people may contribute money or work, but must not automatically be represented as legal owners. Store one proprietor record and separate contributor records classified as loans, reimbursements, capital introduced by the proprietor, withdrawals or other approved categories. Keep ownership/equity functionality disabled or marked not applicable unless the legal structure changes and professional advice confirms the treatment.

## 5. Users, roles and permissions
### Roles
- **Admin/proprietor:** business oversight, configuration and designated approvals.
- **Finance:** transactions, invoices, reconciliation and finance reports.
- **Operations:** products, suppliers, stock and equipment.
- **Marketing:** ad imports and campaign performance.
- **Approver:** approves restricted transactions, corrections and imports.
- **Viewer:** read-only access to permitted modules.
- **Contributor:** role-specific access based on documented agreement and need.

### Permission requirements
- Enforce permissions on the server/database, not only in the UI.
- Scope every query to the Vedro company.
- Prevent users from approving their own restricted transactions.
- Posted financial entries cannot be silently edited/deleted; use reversals and corrections.
- Restrict changes to proprietor details, opening balances, tax settings, chart of accounts and user permissions.
- Restrict customer data and exports by role.
- Audit logs cannot be deleted through the application.

## 6. Functional scope and module requirements

### 6.1 Executive overview
**KPI cards:** net revenue excluding GST, gross profit, gross margin, operating profit/loss, reconciled cash/bank balance, units sold net of returns, inventory value, ad spend, ROAS, contributor loan balances, receivables, payables and data-quality status.

**Charts:** monthly revenue vs expenses; gross profit trend; cash flow; sales by channel; top products by sales and gross profit; expense breakdown; ad spend vs attributed revenue; low-stock and expiry alerts.

**Rules:** global date/channel/product filters; every KPI drills down to records; actual/forecast/estimated/incomplete values are visibly different. Unknown values must not be displayed as verified zero.

### 6.2 Finance and accounting
- Chart of accounts; expense categories; vendor/customer parties.
- Draft, submit, approve, post, reverse and reconcile workflows.
- Receipts, payments, bank/cash/UPI accounts and internal transfers.
- Customer invoices, supplier bills, payment allocation and outstanding balances.
- P&L, account summaries, cash flow and expense reports.
- Evidence attachments and audit history.

**Rules:** double-entry ledger; debits equal credits before posting; posted journals immutable; internal transfers are not income/expenses; contributor loans are not sales; inventory purchases are not automatically COGS; capitalized equipment is separated from operating expenses.

### 6.3 GST and tax
- GSTIN and party tax details.
- Tax codes with effective dates.
- HSN/SAC where relevant, taxable amount, CGST, SGST, IGST and cess.
- Place of supply, invoice date/number and tax treatment fields.
- Input tax credit tracking and reconciliation status.
- Exportable sales/purchase tax summaries.

Do not hard-code one rate for all products. GST treatment depends on applicable classification and transaction facts. GST collected is not revenue. Reports must trace to invoice lines. Return filing is outside MVP unless separately scoped and validated by a qualified tax professional.

### 6.4 Contributor and capital ledger
- Contributor profile and relationship type.
- Date, amount, payment method, reference and evidence.
- Types: proprietor capital, loan given, loan repayment, reimbursement, withdrawal and approved other types.
- Running balances by person and category.
- Period reports and correction history.

Do not label transfers as equity by default. Separate loan principal from interest where applicable. Reconcile to bank/cash evidence. Ownership reports require a valid legal structure and verified documents.

### 6.5 Sales, orders and customers
- Product catalogue, SKU, unit, category, HSN and tax code.
- Order headers and lines, channel, customer, dates, discount, tax and status.
- Manual offline sales; import online/marketplace orders.
- Cancellations, partial fulfilment, returns and refunds.
- Invoice and external order references.
- Reports by product, channel, customer and period.

Cancelled orders must not count as fulfilled sales or sold stock. Returns link to original order lines. Refund amount and restockable quantity are separate. Detect duplicate imports.

### 6.6 Products and inventory
- Stock by SKU and location.
- Opening count, purchase receipt, sale, customer return, transfer, wastage and adjustment.
- Reorder thresholds, low-stock alerts, stock counts and variance approval.
- Inventory valuation using an accountant-approved costing method.
- Stock aging and movement history.

**Food-specific optional extension:** lot/batch, manufacturing date, best-before/expiry date, supplier lot, storage location and recall status where required. If Vedro manufactures/re-packs, later add recipes/BOM, material consumption, batch yield, labour, overhead and wastage.

Stock is derived from approved movements. Opening stock needs a date and valuation basis. Only approved restockable returns increase available stock. Adjustments need reason, user and timestamp. Negative stock should be blocked or flagged by policy.

### 6.7 Marketing and advertising
- Ad accounts and campaigns, external IDs and platforms.
- Daily spend, impressions, clicks, conversions and platform-attributed revenue.
- CSV import with duplicate detection.
- ROAS, CPC, CPA/CAC and conversion rate.
- Order attribution and attribution model.
- Paid/organic/direct/offline breakdown where supported by evidence.

ROAS = attributed ad revenue ÷ ad spend. ROAS is not profit. Platform-reported revenue and verified order revenue must remain separate. Show the attribution model and window. CAC must state which costs and new customers are included.

### 6.8 Equipment and fixed assets
- Asset ID/name/category, supplier, invoice, purchase date and acquisition cost.
- Delivery/installation costs where applicable.
- Serial number, warranty, physical location and status.
- Maintenance, repair, warranty claims and disposal.
- Useful life, residual value, depreciation method and book value.

Keep purchase cost, payment status and depreciation separate. Accountant approves capitalization/depreciation policy. Audit asset changes and disposal.

### 6.9 Customer management
- Customer ID, name, phone/email, city and relevant addresses.
- First/last purchase, order count, net spend and average order value.
- New/repeat status, acquisition source when known, refunds and outstanding balances where appropriate.
- Consent and communication preference status.

Minimize personal data, restrict exports, review possible duplicates before merging and do not classify missing attribution as organic. Customer lifetime value should be marked provisional until there is sufficient history and margin data.

### 6.10 Forecasts and planning
- 6- and 12-month horizons.
- Conservative, base, aggressive and custom scenarios.
- Units, price, discounts/returns, growth, COGS, advertising, fixed costs and capex.
- Receivable collection, supplier payment terms, inventory purchases, GST settlement and tax assumptions.
- Cash runway, funding gap, contribution margin and break-even sales.
- Versioned assumptions and saved forecast snapshots.

Forecasts never overwrite actuals. Assumptions must be visible. Use GST-exclusive revenue for profitability. Cash forecasting must model timing, not just profit. Every scenario must disclose exclusions.

### 6.11 Imports, reports and audit
Import flow: upload CSV/XLSX → map columns → preview → validate → detect duplicates → review exceptions → approve → post → export errors. Retain source file, hash, row number, raw data, normalized data, validation errors and posting reference.

Reports: P&L; cash/bank reconciliation; receivables/payables aging; sales by product/channel/customer; discounts/returns; inventory valuation/movement/wastage/expiry; contributor ledger; asset/depreciation register; marketing performance; GST summaries; forecast vs actual; data quality exceptions.

## 7. Navigation and UI requirements
Primary navigation:
1. Overview
2. Finance
3. Contributor Ledger
4. Sales & Orders
5. Products & Inventory
6. Marketing
7. Equipment & Assets
8. Customers
9. Forecasts
10. Reports & GST
11. Imports & Reconciliation
12. Settings, Users & Audit

Global controls: date range/financial year, channel, SKU, status, search, actual-vs-forecast indicator and permission-aware exports. Use consistent INR formatting, accessible form labels, clear empty/loading/error states, confirmation for high-impact actions and paginated searchable tables.

## 8. Database and ER model
Initial PostgreSQL migration is a separate deliverable (`001_initial_schema.sql`). Core entities:

- Access: `companies`, `app_users`, `company_members`, `proprietors`, `contributors`
- Finance: `accounts`, `transactions`, `transaction_lines`, `payments`, `payment_allocations`, `parties`
- Tax: `tax_codes` and tax fields on order/transaction lines
- Commerce: `products`, `product_categories`, `sales_channels`, `orders`, `order_lines`, `returns`, `return_lines`
- Inventory: `inventory_locations`, `inventory_movements`
- Contributor finance: `contributors_ledger`
- Assets: `assets`, `asset_events`, `depreciation_entries`
- Marketing: `ad_accounts`, `campaigns`, `ad_performance_daily`, `order_attributions`
- Migration: `import_jobs`, `import_rows`
- Forecasting: `forecast_scenarios`, `forecast_months`
- Audit: `audit_logs`

### Main relationships
- One company has many members, products, accounts, orders, transactions, assets and forecast scenarios.
- One order has many order lines and may have many returns.
- One product appears in many order lines and inventory movements.
- One transaction has multiple journal lines.
- Payments are allocated to invoices/transactions through allocation records.
- One contributor has many ledger entries.
- One asset has many events and depreciation entries.
- One ad account has many campaigns; campaigns have daily performance rows.
- One import job has many staged rows.
- One forecast scenario has monthly rows.

Use UUID IDs, integer paise or exact decimals for money, fixed-precision quantity, foreign keys and constraints. Enforce company consistency using composite foreign keys or server-side validation. Use DB transactions for posting/stock updates, tenant scoping/RLS and immutable posted journals. Do not seed real balances in migrations.

## 9. KPI definitions and formulas
- **Gross sales:** sales value before discounts/returns, excluding GST.
- **Net sales/revenue:** gross sales less discounts and sales returns, excluding GST.
- **COGS:** cost assigned to units sold under selected costing policy.
- **Gross profit:** net revenue − COGS.
- **Gross margin %:** gross profit ÷ net revenue × 100; undefined when net revenue is zero.
- **Operating profit:** gross profit − operating expenses including applicable depreciation.
- **Net profit:** operating result adjusted for other income, finance costs and applicable taxes.
- **Cash position:** reconciled cash and bank balances, not profit.
- **Contributor balance:** derived from verified entries by classification.
- **ROAS:** attributed ad revenue ÷ ad spend.
- **CAC:** defined acquisition spend ÷ defined new customers.
- **AOV:** net sales ÷ eligible completed orders.
- **Inventory value:** on-hand quantity × approved cost.
- **Break-even sales:** fixed costs ÷ contribution margin ratio when ratio is positive.
- **Runway:** available cash ÷ forecast monthly net cash burn when burn is positive; otherwise report positive/neutral cash generation.

Formulas should be implemented centrally and reused across dashboard, reports and exports.

## 10. Non-functional requirements
### Security/privacy
- Secure authentication; MFA where available.
- Server-side authorization and tenant scoping.
- Least privilege, HTTPS, secrets outside source control and encrypted storage where supported.
- Audit sensitive actions, revoke sessions and deactivate departing users.
- Restrict customer PII and exports.

### Reliability/integrity
- Atomic database transactions for finance and stock.
- Duplicate-safe import processing.
- Idempotency for integrations/webhooks.
- No sensitive data in error messages.
- Reproducible exports and tested backup restoration.

### Performance/usability
- Responsive desktop/tablet/mobile layouts.
- Initial target: common dashboard views load within 3 seconds for agreed test data volumes.
- Search/sort/filter/pagination for tables.
- Progress for long imports and downloadable error reports.
- Accessible controls and clear validation.
- Indian number formatting and INR.

### Operations
- Central error monitoring, migration tracking, backup verification, health checks and rollback plan.

## 11. Architecture
- **Frontend:** Next.js + TypeScript; reusable cards, tables, charts, filters and forms.
- **Backend:** server-side API/business logic for authorization, journals, tax, inventory, imports and forecasts.
- **Database:** PostgreSQL with versioned migrations, constraints and indexes.
- **File storage:** secure object storage for invoices, bills and source imports; validated file types and time-limited access where appropriate.
- **Integrations:** start with CSV/XLSX and manual entry; later add supported commerce, ad, bank-statement and accounting exports. Preserve source IDs and import timestamps.

## 12. Acceptance criteria
### Finance
- Unbalanced journals cannot post.
- Posted journals cannot be silently edited/deleted.
- Internal transfers do not create income/expense.
- Contributor loans are not counted as sales.
- Reconciliation differences are visible.

### Sales/inventory
- Cancelled orders do not count as fulfilled sales or sold stock.
- Returns link to original lines.
- Inventory movement totals reconcile.
- Duplicate orders are detected.
- Valuation follows configured costing policy.

### GST/marketing
- Tax detail is stored by invoice line and component; GST collected is excluded from revenue.
- Tax summaries trace to source records.
- Platform attributed revenue is separate from verified order revenue.
- Reimporting the same campaign/date data does not double-count.

### Contributor/assets/forecast
- Capital, loans, repayments and reimbursements are separate.
- Asset purchase and depreciation are reported separately.
- Forecasts do not alter actuals and retain scenario versions.
- Cash forecasts account for timing, stock, GST and capex where configured.

### Security/imports
- Users cannot access another company’s data by changing IDs.
- Imports retain row-level errors.
- Privileged actions are audited.
- Backup restoration is tested before launch.

## 13. Historical data migration
Known available records: bank, contributor/founder, inventory and equipment. Other sales, purchase, invoice and ad history may be incomplete.

1. Confirm proprietor/contributor classification and accounting policy.
2. Set opening date and financial year.
3. Import bank data to staging and reconcile to statements.
4. Import contributor transfers and classify with evidence.
5. Import stock counts with date, location, unit and cost basis.
6. Import equipment bills and purchase dates.
7. Import sales/purchase/ads only where evidence exists.
8. Flag unknowns; never infer unverified amounts.
9. Resolve duplicates and rejected rows.
10. Approve and lock opening snapshot.
11. Compare reports against source records before launch.

## 14. Implementation roadmap
**Phase 0 — Discovery (2–4 days):** confirm proprietor/contributor roles, opening date, chart of accounts, GST, inventory costing, channels and source files. Exit: approved data dictionary and migration plan.

**Phase 1 — Foundation (3–5 days):** repository, environments, authentication, roles, company scoping, audit log and schema. Exit: secure app shell in staging.

**Phase 2 — Finance (5–8 days):** chart of accounts, journals, approvals, reversals, payments, reconciliation and reports. Exit: finance acceptance tests pass.

**Phase 3 — Sales/inventory (5–8 days):** products, channels, orders, returns, stock movement and customer history. Exit: sales and stock reconcile.

**Phase 4 — Contributors/assets (3–5 days):** contributor ledger, loans/reimbursements, asset register and depreciation. Exit: reports match evidence.

**Phase 5 — Marketing/forecasting (5–8 days):** ad imports, attribution, ROAS, scenarios and cash forecasts. Exit: actuals and estimates are distinct.

**Phase 6 — Migration/QA/launch (5–8 days):** import records, resolve exceptions, test permissions, GST workflows, backup restore and founder UAT. Exit: approved opening snapshot and go-live sign-off.

Estimated range: 4–8 weeks for a focused release with one experienced full-stack developer and timely decisions. Integrations, production/lot tracking, complex tax automation and data cleanup can extend the schedule.

## 15. Risks and mitigations
| Risk | Mitigation |
|---|---|
| Proprietorship confused with three owners | One proprietor record; separate contributor ledger; professional review |
| Incomplete records distort metrics | Staging, data-quality flags, reconciliation and approved opening snapshot |
| Incorrect GST treatment | Effective-dated codes and accountant review |
| Duplicate sales/cash | Separate invoices, payments and settlements; reconciliation |
| Incorrect product margin | Approved costing method and verified stock counts |
| Platform attribution conflicts | Show platform metrics separately from verified orders |
| Unauthorized edits | Server-side roles, approvals and immutable audit trail |
| Forecast treated as fact | Separate visual status, versioned assumptions and exclusions |
| Customer data exposed | Least privilege and export controls |
| Scope creep | Finance foundation first; optional production module later |

## 16. Founder decisions required
1. Who is the legal proprietor, and what is the correct relationship of the other two contributors?
2. Is Vedro GST-registered and which states/registrations are relevant?
3. What is the opening date and financial year?
4. Which online channels are active?
5. Are products bought finished for resale, manufactured, repacked or mixed?
6. Is batch/expiry tracking required?
7. Which inventory costing method has the accountant approved?
8. Which bank/cash accounts must be reconciled?
9. Who can approve expenses, repayments, stock adjustments and imports?
10. Should customer messaging integrations be included in the first release?
11. Which reports does the accountant need monthly?
12. What cash buffer and forecast assumptions should be used?

No actual balances should be loaded until supported by records and approved.

## 17. Release definition
Release is ready when finance journals balance; opening bank balances reconcile; contributors are classified correctly; product and stock data have approved quantities/cost basis; offline/online order and return workflows work; available equipment bills are recorded; GST detail is reviewable; reports drill into source records; permissions and audit tests pass; forecasts are separate from actuals; backup restoration succeeds; and known data gaps are visible.
