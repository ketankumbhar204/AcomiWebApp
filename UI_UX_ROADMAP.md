# ACOMI Web App — UI/UX Roadmap

**Companion to:** `UI_UX_CONTEXT.md`  
**Scope:** Ranked improvements only. **Do not implement until this baseline is accepted.**  
**Constraint:** Preserve business logic, API contracts, auth, and occupancy/meal/payment rules. Prefer restyling existing MUI + shared components.

Impact: H = daily operator time saved or confusion removed · M = frequent · L = polish  
Complexity: S / M / L  
Dependencies: none | existing APIs (compose) | backend DTO | i18n | design tokens

---

## P0 — Critical usability / identity

| ID | Screen / module | Problem | Proposed improvement | Impact | Complexity | Dependencies |
|---|---|---|---|---|---|---|
| P0-1 | Auth (`AuthCard`, `AuthIllustration`) | Letter **“C”** mark while product is ACOMI | Replace with ACOMI **A** mark used on marketing / Play; keep layout | H | S | Asset only; no API |
| P0-2 | Theme `colors.ts` + page canvas | WhatsApp green `#25D366` + mint page makes the whole app green | Move brand to restrained teal/navy; reserve green for **success**; introduce semantic tints (meal orange, payment blue, accommodation indigo, complaint coral) as **tokens**, then wire MUI palette | H | M | Design tokens; do not change logic |
| P0-3 | `SpaceShellLayout` nav | Mess operators see **Members** + **Accommodation hidden correctly** but **Payments and Day meals both listed**; lodging also sees Day meals | Nav by space type: Mess → Dashboard, Customers, Meals, Payments (or Day meals as the Mess payment home—not both), Complaints, Inventory. Lodging → Dashboard, Members, Accommodation, Meals (if enabled), Payments, Complaints, Inventory. Hide Day meals on spaces without meal ops | H | M | i18n six locales; permission flags already exist |
| P0-4 | Operator dashboard `ScaleShell` | 1200px locked canvas **scales** instead of reflowing — tablet/phone ops UI is a shrink | Stop using ScaleShell for dashboard (or raise breakpoint). Stack Row 1/2/3; reuse `DataTable` md card pattern | H | M | Layout only; widgets already grid |
| P0-5 | Header actions | My Spaces + Profile + Logout as three outlined buttons crowd the header | Space switcher stays left; overflow **account menu** (profile, theme, spaces, logout); keep bell | M | S | `AppHeader` |

---

## P1 — Major workflow improvements

| ID | Screen / module | Problem | Proposed improvement | Impact | Complexity | Dependencies |
|---|---|---|---|---|---|---|
| P1-1 | Dashboard occupancy widget | Occupied / vacant counts only; no % , no reserved, no progress | Icon + label + value + **progress bar**. Occupancy % can be computed client-side from occupied+vacant **if those two are the full capacity**. Reserved: **do not invent** — either compose bed-inventory API or document backend gap | H | M | Existing occupancy numbers; reserved needs API or drill-down only |
| P1-2 | Dashboard Mess ops widget | Single `todaysHeadcount`; B/L/D already loaded by `MealOperationsTodayCard` | Align Mess row with breakfast/lunch/dinner **prepare** counts (reuse `useMealHeadcountDay`). Keep customers / open polls | H | S | Existing meals APIs |
| P1-3 | Members workspace | Nav and page title always “Members”; Mess already has Add Customers hub | Mess: title **Customers**, default role CUSTOMER, customer-first empty state. Lodging: **Residents / members**. Do not merge TENANT and CUSTOMER workflows | H | M | i18n; `memberRoles.ts` already correct |
| P1-4 | Empty states | Primitive exists; lists often feel like empty tables | Every major workspace: icon + one-line next action + primary CTA (Create menu, Start property setup, Add customers, Record payment). Use real empty, **never fake stats** | H | M | Copy + `EmptyState` |
| P1-5 | Combined PG + meals dashboard | Meal-today + finance + property + quick actions can overwhelm | If meals not configured (lifecycle `MEALS_READY` incomplete), collapse meal column to a **setup chip** instead of a large empty meal card | M | M | `spaceLifecycle` already knows this |
| P1-6 | Payments IA | Two payment homes (ledger vs day meals) | Mess: Day meals is primary, monthly ledger secondary. Lodging: monthly ledger primary; day meals only if meals enabled | H | M | Routes already exist; nav + page headers |
| P1-7 | Occupancy wizard | Long stepper; desktop-capable but visually form-heavy | Keep steps/API; visualise bed/room availability as status chips + counts, not only lists | H | M | `occupancyApi` unchanged |
| P1-8 | Quick actions | Tiles are navigation, not “what to do next” | Drive 1–2 tiles from `recommendNextAction` / pending groups (e.g. Review 3 proofs, Plan dinner) | H | M | Lifecycle + pending APIs already on dashboard |

---

## P2 — Visual / design improvements

| ID | Screen / module | Problem | Proposed improvement | Impact | Complexity | Dependencies |
|---|---|---|---|---|---|---|
| P2-1 | Shared tokens | Accents hard-coded in widgets (`#6366F1`, `#3B82F6`, …) | Promote to `colors.modules.*` so meals/payments/complaints stay consistent | M | S | Tokens |
| P2-2 | StatCard / MetricRow | Numbers without bars | Optional compact progress + spark-free bars (no chart library unless needed) | M | S | Shared component |
| P2-3 | Meals planner / headcount | Already closer to target | Match marketing-site density: slot cards with prepare 78/86 + bar; keep option expand | M | S | Headcount API |
| P2-4 | Accommodation workspace | Tree + inspector is powerful, looks dense | Card canvas for selected node: occupancy chip, bed glyphs, primary actions Allocate / Vacate | M | L | No API change |
| P2-5 | Complaints / inventory / payments tables | Desktop tables OK; still field-heavy | Status badges first column; fewer columns; keep md card fallback | M | M | `DataTable` `primary` columns |
| P2-6 | Space overview / health | Health ring exists; explanation is text-heavy | Band chip + 3 factor chips linking to existing `space-health` page | M | S | `useSpaceHealth` |
| P2-7 | Auth / onboarding forms | Functional; green C-era styling | Same tokens as shell; keep password rules and Zod schemas | M | S | No auth logic change |
| P2-8 | Dark mode | Exists; mint/green dark tints | Recalibrate after light token change | L | M | Theme |

---

## P3 — Nice-to-have

| ID | Screen / module | Problem | Proposed improvement | Impact | Complexity | Dependencies |
|---|---|---|---|---|---|---|
| P3-1 | Dashboard | No complaint / inventory KPIs | Add only if composed from existing list APIs **or** backend extends `dashboard-summary` | L | M | Confirm Q7 in context |
| P3-2 | Notifications / WhatsApp | Share is buried in meals | Keep share in meals; optional dashboard “Menu not shared” attention (pending engine may already surface this) | L | S | Pending actions types |
| P3-3 | Global attention / activity | Separate from space shell | Visual alignment only | L | S | |
| P3-4 | i18n | Six locales; EN is source | After copy freeze, sync hi/kn/mr/ta/te | L | M | Translators |
| P3-5 | README | Path still `K:\AmicoWeb` | Fix path/name in docs only | L | S | Docs |
| P3-6 | Charts | None today | Add **only** where a trend (7-day headcount, collection vs expected) beats a number; no chart-for-decoration | L | L | Prefer CSS bars first |
| P3-7 | Lodging CUSTOMER filter | Assignable but hidden in filters | Show CUSTOMER filter if product confirms dual roles on PG | L | S | Product confirm |

---

## Recommended redesign sequence

Derived from **this repo**, not a generic template.

| Phase | Focus | Why this order |
|---|---|---|
| **1. Shell + identity** | P0-1, P0-2, P0-3, P0-5 | Wrong brand and wrong Mess/PG nav will make every later screen feel inconsistent |
| **2. Dashboard** | P0-4, P1-1, P1-2, P1-5, P1-8, P2-2, P2-6 | This is the control center; meals B/L/D and occupancy % teach the visual language |
| **3. Space management** | Space details / create-space visual pass | Type picker should feel PG **and** Mess first-class (already in data; polish UI) |
| **4. Members / Customers** | P1-3, P1-4 | Terminology and empty states unblock Mess operators |
| **5. Accommodation / occupancy** | P1-7, P2-4 | Lodging daily work; after shell so tokens apply |
| **6. Meals / menu / headcount** | P2-3 | Already strongest visual module; polish not rewrite |
| **7. Payments** | P1-6, P2-5 | After Mess vs lodging IA is decided |
| **8. Complaints** | P2-5 + Mess categories already exist | Visual + empty states |
| **9. Inventory** | Profile FOOD vs ASSET already exists | Visual + low-stock chips |
| **10. Notifications / share** | P3-2 | Attention is already a dashboard column |
| **11. Forms + shared components** | StatCard, EmptyState, DataTable, drawers | Sweep once tokens stabilize |
| **12. Responsive + a11y** | Drop ScaleShell leftover, contrast, focus, icon labels | Last mile after layouts stop moving |

**Explicitly deferred:** new UI framework, new chart library, backend contract changes, auth/payment/occupancy rule changes, fake demo metrics on production dashboards.

---

## Implementation rules for later phases

1. One phase per PR-sized slice; screenshots against PG **and** Mess.  
2. If a mock needs data the API does not return, **stop and document** — do not hardcode.  
3. Reuse `shared/components` and `DASHBOARD_UX` (update tokens there; don’t copy hex per page).  
4. Work on `develop` (confirm) — do not ship UI experiments straight to `aws-production` without the usual web-app branch policy.  
5. Do not deploy or touch AWS as part of UI work unless a later task asks.
