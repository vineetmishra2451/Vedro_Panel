# VEDRO BUSINESS DASHBOARD — UI/UX DESIGN BRIEF & MASTER PROMPT

**Version 1.0 | October 2026**

## 1. Project context
Design a premium, production-quality business management and analytics web application for **Vedro**, a food-products business selling offline and online. It combines finance, sales, GST reporting, contributor funding, inventory, marketing, equipment/assets, customers and forecasts.

Vedro is currently described as a proprietorship with three people involved as founders/contributors. A proprietorship has one legal proprietor; do not imply that all three are legal equity owners by default. Show one proprietor and separate contributor records for loans, reimbursements, contributions and other verified categories unless the legal structure changes.

Historical data is partial. Never invent real balances or display fabricated performance as actual. Design empty, incomplete, imported, reconciled and forecast states from the beginning.

## 2. Product and visual direction
Create a mature enterprise finance/operations product—not a generic admin template, ecommerce storefront or decorative food-brand landing page. Combine premium natural-brand cues with high information clarity, trustworthy reporting and efficient daily workflows.

**Brand personality:** refined, grounded, confident, calm, natural, accurate and operationally serious.

**Suggested palette**
- Deep forest green `#244333`: navigation, primary actions and brand anchors.
- Warm ivory `#F7F6F0`: optional page background.
- White `#FFFFFF`: primary surfaces.
- Muted sage `#DDE7D8`: subtle highlights and selected states.
- Charcoal `#252B27`: primary text.
- Slate `#68736C`: secondary text.
- Border `#E3E7E1`.
- Semantic green, amber and red for statuses only, with accessible contrast.

Use color sparingly. Never imply every financial outcome is positive. Pair status color with labels/icons. Use Inter, Geist or another legible sans-serif; tabular numerals for amounts. Use consistent outline icons such as Lucide. Restrained 8–12 px control/card radius, subtle borders and minimal shadows.

**Avoid:** leaf-pattern backgrounds, jute textures, generic organic stock photography, glassmorphism, gradients everywhere, glowing borders, neon colors, cartoon illustrations, oversized cards, excessive whitespace and decorative charts.

## 3. Layout and design system
Design desktop-first for 1440 px and 1280 px, then adapt for tablet and mobile. Use a consistent 8 px spacing scale, clear page gutters and layouts that preserve table readability.

### Application shell
1. **Left sidebar:** Vedro wordmark; Overview; Finance; Contributor Ledger; Sales & Orders; Products & Inventory; Marketing; Equipment & Assets; Customers; Forecasts; Reports & GST; Imports & Reconciliation; Settings, Users & Audit. Include active state, compact icons, collapse behavior and profile/company context.
2. **Top header:** breadcrumbs, page title, global date range/financial year, search, meaningful notifications, context-relevant add/import action and user profile.
3. **Page body:** title and short explanation; consistent action placement; filter row; useful KPIs; main chart/table; supporting alerts and details.
4. **Detail drawer:** show transaction, customer, stock movement or audit detail without losing table context.
5. **Responsive:** tablet collapses navigation and reduces card columns. Mobile prioritizes key actions and overview; wide tables become card/list layouts or horizontally scrollable tables with pinned identifiers. Do not merely shrink desktop UI.

Build reusable tokens for colors, typography, spacing, radii, elevation, focus, hover, disabled, loading, error and success states. Standardize Indian rupee formatting, dates, percentages, negatives and missing values. Right-align monetary columns.

## 4. Required screens and UX

### A. Executive Overview
KPI cards: Net Revenue excluding GST, Gross Profit, Operating Profit/Loss, Reconciled Cash & Bank, Units Sold, Inventory Value, Ad Spend and ROAS. Show comparisons only when valid comparable data exists.

Charts: monthly revenue vs operating expenses; cash flow; product/channel performance. Alerts: unreconciled bank items, low stock, overdue payments, expiring lots if enabled, failed imports and incomplete historical data. Add a data-quality indicator.

Clicking any KPI/chart should open the filtered source records. Distinguish actuals, estimates, platform-attributed values and forecasts. Empty states must explain what needs importing. Do not display fake values as real.

### B. Finance
Transaction table columns: date, reference, description, party, category/account, debit, credit, status, payment method and attachment indicator. Filters: date, type, category, account, party, status and amount. Actions: add, import, reconcile, export and submit for approval.

Detail drawer: journal lines, attachments, creator, approver, audit trail and linked invoice/payment. Workflow: Draft → Submitted → Approved → Posted. Posted records are immutable; corrections use reversal/adjustment flows. Make unbalanced and unreconciled records obvious. Separate cash position from profit.

### C. Contributor / Capital Ledger
Show one legal proprietor profile and separate contributor profiles. Summary cards for verified proprietor capital, contributor loans outstanding, repayments and reimbursements. Table columns: person, date, type, amount, direction, payment reference, evidence and status.

Never label a contributor an equity owner merely because they contributed money. Where ownership/equity is not legally applicable, display a clear note. Provide review/approval status and drill-down.

### D. Sales & Orders
Table columns: order ID, date, channel, customer, line count, net sales excluding GST, tax, payment status, fulfilment status and return status. Filters for offline, wholesale, website, marketplace and other channels.

Provide a quick-add offline sale flow. Order detail includes line items, discounts, GST, payments, fulfilment, return/refund history and stock movements. Statuses: draft, confirmed, fulfilled, cancelled, partially returned and returned. Cancelled orders are not fulfilled sales. Detect duplicate external order IDs.

### E. Products & Inventory
Catalogue columns: SKU, name, category, unit, selling price, tax/HSN, available stock, reorder point and active status. Product detail tabs: Overview, Stock Movements, Sales, Purchase History, Costing and Batch/Expiry if enabled.

Show stock by location, movement history, low stock, negative stock, count variance and expiry warnings. Adjustments require reason and approval. Optional food traceability fields: lot/batch, manufacturing date, best-before/expiry date, supplier lot, storage location and recall status. If production is in scope, design recipes/BOM, material consumption, yields and wastage as a later module.

### F. Marketing
Campaign table: platform, campaign, reporting period, spend, impressions, clicks, conversions, attributed revenue, ROAS and source. Chart spend vs attributed revenue. Filter by platform, campaign, date and attribution model. Keep platform-attributed revenue separate from revenue verified against Vedro orders. Show attribution model/window beside ROAS. Explain that ROAS is not profit. Include import preview, duplicate detection and validation errors.

### G. Equipment & Assets
Asset register columns: ID, name, category, supplier, purchase date, acquisition cost, warranty, location, status and book value. Detail view includes invoice, serial number, installation, maintenance, repairs, depreciation and disposal history. Distinguish acquisition cost, payment status and depreciation. Never present book value as cash.

### H. Customers
Searchable list: customer ID, name, contact fields subject to permissions, city, first/last order, order count, net spend, repeat status and known acquisition source. Detail view shows order history, returns/refunds and contact preferences. Restrict personal data and exports. Do not overstate lifetime value when history is incomplete. Review possible duplicates before merging.

### I. Forecasts
Scenario selector: Conservative, Base, Aggressive, Custom. Editable assumptions: units, price, discounts/returns, growth, COGS, ad spend, fixed costs, capex, receivable timing, supplier terms, inventory purchases, GST settlement and opening cash.

Charts: revenue, gross profit, operating result and closing cash. Include scenario comparison, assumptions, exclusions and version/date. Forecasts never mix with actuals or write into the transaction ledger. Flag potential cash shortfalls and the month expected.

### J. Reports & GST
Reports: P&L, cash flow, account balances, receivables/payables aging, sales by SKU/channel, returns, stock valuation, contributor ledger, asset/depreciation register, ad performance and forecast-vs-actual. GST summaries must trace to invoice lines and tax components. Show period, filters, generation timestamp and data-quality notes. Export CSV/XLSX and selected PDF reports. Make clear that tax reports require accountant review and are not automatically filed.

### K. Imports & Reconciliation
Use a stepper: Upload → Map Fields → Preview → Validate → Resolve Errors → Approve → Post. Preserve source file, hash, row number, raw row and normalized row. Show valid, duplicate, warning and rejected counts. Provide row-level errors and correction guidance. Never silently auto-post uncertain historical records.

Bank reconciliation should show statement line, matched transaction, difference and match status.

### L. Settings, Users & Audit
Company/legal settings, GST configuration, chart of accounts, inventory policy, tax codes, channels, roles and integrations. Use least-privilege access. Audit log shows actor, action, timestamp, entity and before/after details where appropriate. Restrict legal proprietor and opening-balance changes. Audit history cannot be deleted in the UI.

## 5. Data visualization rules
- Lines for trends; horizontal bars for ranked products/categories; stacked bars only when composition matters; tables for exact values.
- Avoid pie charts with many categories, 3D charts, excessive gradients and misleading axes.
- Every chart needs title, period, unit, legend, tooltip and empty/loading/error states.
- Never rely on color alone to encode status.
- Chart values and table totals must use the same filters and calculation logic.
- Make definitions and sources for revenue, profit, cash, ROAS and inventory value discoverable.

## 6. Table UX rules
- Sticky headers for long tables.
- Search, filter, sort, pagination and column visibility where useful.
- Right-align numeric columns; align dates consistently.
- Freeze identifier columns where possible.
- Show totals only when mathematically valid and useful.
- Preserve filters when opening a detail record and returning.
- Confirm high-impact actions; bulk actions should be limited to safe operations.
- Exports follow current filters and user permissions.

## 7. States to design for every major screen
First-use empty; partially imported/incomplete history; populated; loading/skeleton; validation error; permission denied; no results; failed import/integration; success confirmation; network failure where relevant; estimate-only or forecast-only.

Never use invented financial figures in mockups. Use empty states, neutral placeholders or clearly labelled illustrative demo data that cannot be mistaken for Vedro actuals.

## 8. Interaction and accessibility
- All controls have labels and keyboard focus states.
- Aim for WCAG 2.2 AA contrast.
- Semantic headings and predictable focus order.
- Confirm irreversible/high-impact actions.
- Explain validation errors next to fields.
- Important financial errors must retain actionable details, not only a disappearing toast.
- Use plain language and help text for COGS, GST, ROAS, CAC, depreciation and cash flow.
- Avoid decorative motion; use restrained transitions only when they improve feedback.

## 9. Critical financial integrity rules
- Revenue excludes GST collected.
- Cash is not profit.
- Capital contributions and loans are not sales.
- Inventory purchases are not automatically COGS.
- Equipment purchase and depreciation are separate.
- ROAS is not profit or ROI.
- Orders, payments, marketplace settlements and bank deposits are different events.
- Actuals, estimates and forecasts must never be visually or technically conflated.
- Every posted journal balances.
- Posted financial records are immutable and corrected via reversal/adjustment entries.
- Important KPIs drill down to supporting records.

## 10. Suggested Overview layout at 1440 px
- Sidebar approximately 230–250 px; header around 64 px.
- Page heading and date-filter row.
- One row of four compact KPI cards; second row only if needed.
- Main area: 7/5 column split for revenue/expense chart and cash-flow/alerts.
- Lower area: product/channel performance table and data-quality panel.
- Avoid ten oversized cards. Keep the initial view focused on the six to eight metrics founders use to make decisions.

## 11. Design deliverables
1. High-fidelity 1440 px desktop Overview.
2. Finance list, transaction drawer and add-transaction form.
3. Contributor ledger and contributor detail.
4. Sales/order list and order detail.
5. Product catalogue and inventory detail.
6. Marketing campaign dashboard.
7. Asset register and asset detail.
8. Customer list and customer detail.
9. Forecast scenario builder and comparison view.
10. Reports/GST screen.
11. Import wizard and reconciliation screen.
12. Settings/users/permissions/audit screens.
13. Responsive tablet/mobile variants for key screens.
14. Reusable design system and component library.
15. Clickable prototype with linked navigation and drill-downs.
16. Empty/loading/error/incomplete-data/permission-denied states.
17. Handoff specs: components, states, spacing, typography, responsive behavior, interaction rules and design tokens.

## 12. Copy-and-paste master prompt

Act as a senior product designer, UX architect and design-systems lead specializing in finance and operations SaaS. Design a complete, high-fidelity, production-ready web application called **Vedro Business Dashboard** using this brief.

The product is a connected business-management platform for a food-products business selling offline and online. It includes Overview, Finance, Contributor Ledger, Sales & Orders, Products & Inventory, Marketing, Equipment & Assets, Customers, Forecasts, Reports & GST, Imports & Reconciliation, and Settings/Users/Audit.

Create a mature enterprise finance/operations product with a restrained natural brand identity. Use deep forest green, warm ivory, white surfaces, muted sage, charcoal text, subtle borders, crisp typography, tabular numerals, compact tables, consistent spacing and accessible contrast. Avoid generic admin templates, decorative food imagery, leaf motifs, giant cards, excessive whitespace, excessive gradients and decorative charts.

Design the application shell and reusable design system first, then all module screens. Prioritize Overview, Finance, Contributor Ledger, Sales & Orders, Products & Inventory, Marketing, Equipment & Assets, Customers, Forecasts, Reports & GST, Imports & Reconciliation, and Settings/Users/Audit.

Make prototype interactions meaningful: navigation, filters, sorting, search, date ranges, detail drawers, create/edit forms, import wizard, approvals, scenario editing, drill-downs and export controls must work in the prototype. Do not create inert buttons. If a backend is unavailable, use clearly labelled demo data or empty states and explicitly state the prototype limitation.

Do not invent Vedro financial balances. Design incomplete-history and first-use states as first-class experiences. Keep verified actuals, estimates, platform-reported attribution and forecasts distinct. Apply all financial integrity rules in the brief to labels, calculations, tooltips and workflows.

Design for 1440 px desktop first, then tablet and mobile. Use a consistent sidebar, top header, page title/filter area, compact KPIs, purposeful charts, dense but readable tables and contextual detail panels. Include accessibility, keyboard focus, validation errors, loading states, permission-denied states and confirmations for high-impact actions.

Deliver a cohesive, linked, high-fidelity clickable prototype, reusable component library, responsive variants and detailed design handoff. Make it feel ready for real business use, not merely a visual concept. Do not omit modules, edge cases or data-quality states to make the design look cleaner.

Before finalizing, verify that every key workflow is represented, every key metric has a definition and drill-down, tables work at realistic data volumes, and the interface does not imply three legal equity owners for a proprietorship without confirmed legal basis.
