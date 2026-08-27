# ACOMI Web App — UI/UX Context (baseline)

**Status:** Audit only. No UI redesign was implemented in this pass.  
**Repo:** `K:\AcomiWeb` · Remote: `https://github.com/ketankumbhar204/AcomiWebApp`  
**Audited branch:** `aws-production` @ `a9928a9` (`feat: enable password authentication and account deletion`)  
**Live product:** `https://app.acomi.in` (this is **not** `https://www.acomi.in`)

This document is the working reference for the upcoming UI/UX enhancement phase. Everything below is taken from the current source. Gaps are labelled as **unknown** or **open question**.

---

## 1. Project overview

ACOMI Web is the **operator (and consumer) web application** for running shared-living and meal businesses. It consumes the **same Spring Boot APIs** as the React Native mobile app. README states: mobile is the product source of truth; this repo is the desktop presentation layer.

It is **not**:

- the public marketing site (`K:\AcomiPublicWebsite` → `www.acomi.in`)
- the mobile app (`K:\AcomiMobile`)
- the backend (`acomi-backend`)

**Product principle already encoded in code:** the dashboard is an operations canvas (“what is happening today”), not a marketing page. The shell, tokens, and several workspaces already aim at a dense SaaS layout.

**Space types (first-class in types and create-space):** `PG` | `MESS` | `HOSTEL` | `CO_LIVING` | `RENTAL`.

**Roles:** `OWNER` | `MANAGER` | `TENANT` | `CUSTOMER` | `STAFF`.

**Mess is not accommodation.** `isAccommodationApplicable(spaceType)` returns `false` for `MESS`. Accommodation routes are gated by `canViewAccommodation`, which is derived false for Mess.

---

## 2. Technology stack

| Concern | Actual library (from `package.json`) |
|---|---|
| Runtime | React 19, Vite 8, TypeScript ~6 |
| UI kit | **MUI 9** (`@mui/material`) + Emotion |
| Icons | `lucide-react` |
| Routing | `react-router-dom` 7, lazy-loaded pages |
| Server state | TanStack React Query 5 |
| Client state | Zustand 5 (`authStore`, `spaceStore`, `appStore`, `registrationDraftStore`) |
| HTTP | Axios → `src/shared/api/client.ts` |
| Forms | React Hook Form + Zod + `@hookform/resolvers` |
| i18n | i18next + react-i18next (en, hi, kn, mr, ta, te) |
| Dates | dayjs |
| Toasts | notistack |
| Theme | Custom MUI theme in `src/shared/theme/` |

**Do not replace this stack.** The next UI phase should restyle/reuse MUI + existing shared components.

API base URL: `VITE_API_BASE_URL` (must include `/api/v1`). Default fallback in `env.ts` is `http://localhost:8080/api/v1` (dev only). Production is configured separately (commit `3feecf7`).

---

## 3. Repository structure

```
src/
  app/                 App, router, providers (theme, query, snackbar)
  layouts/             AppLayout, AppSidebar, AppHeader, ScaleShell, AuthLayout
  routes/paths.ts      Path constants + builders
  modules/             Feature modules (auth, onboarding, dashboard, members, …)
  shared/              theme, components, api, hooks, types, utils
  spaceLifecycle/      Setup milestones + space health (ported from mobile)
  store/               Zustand stores
  i18n/locales/        Translation JSON
  styles/global.css    Plus Jakarta Sans + CSS baseline
```

Feature modules under `src/modules/`:

`auth` · `legal` · `onboarding` · `profile` · `global` · `dashboard` · `notifications` · `members` · `accommodation` · `meals` · `payments` · `complaints` · `inventory`

---

## 4. Routes

Declared in `src/app/router/routes.tsx` using `ROUTES` from `src/routes/paths.ts`.

**Count:** 55 declared route entries (including 3 OTP path redirects and the `*` catch-all). About **47 real screens**.

### 4.1 Public / guest

| Route | Page | Purpose | API | Notes |
|---|---|---|---|---|
| `/login` | `LoginPage` | Password sign-in | `authApi` | Guest only |
| `/register` | `RegisterPage` | Password register | `authApi` | Guest only |
| `/register/otp` | redirect → `/register` | Reserved OTP path | — | Not live OTP |
| `/register/password` | redirect → `/register` | Reserved | — | |
| `/otp` | redirect → `/register` | Reserved | — | |
| `/privacy` | `PrivacyPolicyPage` | Privacy | static | Auth layout |
| `/delete-account` | `DeleteAccountPage` | Account deletion | auth | Auth layout |
| `/unauthorized` | `UnauthorizedPage` | Auth error | — | |
| `/forbidden` | `ForbiddenPage` | Permission deny | — | Used by module gates |
| `/404` and `*` | `NotFoundPage` | Unknown URL | — | |

### 4.2 Account / onboarding (protected, no space shell)

| Route | Page | Purpose |
|---|---|---|
| `/` | `AuthenticatedRootRedirect` | Send user to default space / onboarding |
| `/no-spaces` | `NoSpacesPage` | Empty account |
| `/onboarding` | `OnboardingChoicePage` | Create vs join |
| `/create-space` | `CreateSpacePage` | Create PG/Mess/Hostel/Co-living/Rental |
| `/join-space` | `JoinSpacePage` | Join by invitation |
| `/accept-invitations` | `AcceptInvitationsPage` | Accept invites |
| `/my-spaces` | `MySpacesPage` | Space switcher list |
| `/complete-profile` | `CompleteProfilePage` | Profile gate |
| `/profile` | `ProfilePage` | Account settings |
| `/global/attention` | `GlobalAttentionPage` | Cross-space attention |
| `/global/activity` | `GlobalActivityPage` | Cross-space activity |

### 4.3 Space shell (`/spaces/:spaceId/…`)

All of these sit under `ProfileCompletionGate` → `SpaceShellLayout` except **menu editor** (`meals/edit`), which is full-bleed without sidebar chrome.

| Route | Page | Purpose | Gate | Space types |
|---|---|---|---|---|
| `/spaces/:id` index | `DashboardPage` | Ops dashboard | shell | All (layout branches on type) |
| `…/dashboard` | `DashboardPage` | Same | shell | All |
| `…/details` | `SpaceDetailsPage` | Space profile + billing settings | shell | All |
| `…/edit` | `EditSpacePage` | Edit space | shell | All |
| `…/pending-actions` | `PendingActionsPage` | Attention queue | shell | All |
| `…/notifications` | `NotificationsPage` | In-app notifications | shell | All |
| `…/occupancy` | `OccupancyListPage` | Occupancy drill-down | shell | Accommodation (used from dashboard) |
| `…/bed-inventory` | `BedInventoryPage` | Beds by status | shell | Accommodation |
| `…/space-health` | `SpaceHealthPage` | Lifecycle health | shell | All operators |
| `…/meal-headcount` | `MealHeadcountPage` | B/L/D prepare counts | shell | Meals-enabled |
| `…/members` | `MembersWorkspacePage` | People list + inspector | Members gate | All; Mess defaults to CUSTOMER |
| `…/members/import` | `ImportExistingPeoplePage` | Import people | Members | Lodging (nav from members) |
| `…/members/add-hub` | `AddCustomersHubPage` | Add customers hub | Members | Mess (and meals-enabled lodging) |
| `…/members/:memberId` | `MembersWorkspacePage` | Deep-link inspector | Members | All |
| `…/accommodation` | `AccommodationWorkspacePage` | Hierarchy workspace | Accommodation gate | **Not Mess** |
| `…/accommodation/quick-setup` | `QuickSetupWizardPage` | Structure wizard | Accommodation | Not Mess |
| `…/occupancy/wizard` | `OccupancyWizardPage` | Allocate / reserve / move-in / transfer / vacate | Accommodation | Not Mess |
| `…/meals` | `MealsHomePage` | Planner **or** customer meals hub | Meals gate | Meals-enabled |
| `…/meals/library` | `MenuLibraryPage` | Food library | Meals | |
| `…/meals/locations` | `DeliveryLocationsPage` | Delivery locations | Meals | Mess = delivery; PG/hostel/co-living = property serving |
| `…/meals/participation` | `MealParticipationPage` | Participation | Meals | |
| `…/meals/share` | `MealSharePage` | Share menu / WhatsApp-style share | Meals | |
| `…/meals/poll` | `MealPollResponsePage` | Customer poll (PG single-select, Mess multi-qty) | Meals | |
| `…/meals/plans` | `SubscriptionPlansWorkspacePage` | Operator meal plans | Meals + manage | |
| `…/meals/plans/customer` | `CustomerSubscriptionPlansPage` | Customer plans | Meals | |
| `…/meals/edit` | `MealMenuEditorPage` | Full-page menu editor | Meals, **no sidebar** | |
| `…/payments` | `PaymentsWorkspacePage` | Ledger / review / history | Payments gate | All |
| `…/payments/day-meals` | `DayMealPaymentsPage` | Day-meal collection | Payments | Especially Mess; still in **all** operator nav |
| `…/payments/:paymentId` | `PaymentsWorkspacePage` | Payment inspector | Payments | |
| `…/complaints` | `ComplaintsWorkspacePage` | Complaints list + inspector | Complaints | Categories differ Mess vs lodging |
| `…/complaints/:id` | same | Deep link | Complaints | |
| `…/inventory` | `InventoryWorkspacePage` | Catalog / stock | Inventory | Profile FOOD / ASSET / FURNITURE |
| `…/inventory/items/:id` | same | Item inspector | Inventory | |

**UI quality (current, not aspirational):**

- Dashboard, meals planner, headcount, and several workspaces already use StatCards, StatusChips, IconBadges, and master-detail drawers.
- Auth, header chrome, sidebar labelling, and dashboard **ScaleShell** are the weakest “operator control center” surfaces relative to the marketing-site visual language.
- Many inner pages are still **table + filter + inspector** rather than icon+label+value first.

---

## 5. Navigation

Implemented in `SpaceShellLayout` → `AppLayout` → `AppSidebar` + `AppHeader`.

### 5.1 Operator / staff sidebar (not CUSTOMER/TENANT)

Always:

- Dashboard (badge = pending count)
- Space details
- Notifications
- Pending actions (badge)
- Account → Profile

If permitted:

- **Members** (label is always `navigation.members` = **“Members”**, including Mess)
- **Accommodation** (only if `canViewAccommodation` — **hidden for Mess**)
- **Meals** (if `canViewMeals`)
- **Meal plans** (if `canManageMeals`)
- **Payments** (if any `membershipRole`)
- **Day meals** (if any `membershipRole`) — **shown for PG and Mess alike**
- **Complaints**
- **Inventory**

Header (right): notification bell, **My Spaces**, **Profile**, **Logout**, theme toggle.

Header (left): `SpaceContextSelector` (space name + type + role).

Mobile (`< md`): hamburger → temporary drawer. Permanent sidebar from `md` up.

### 5.2 Consumer sidebar (CUSTOMER or TENANT, not operator)

- Dashboard
- My Orders (if can view meals) → meals home
- Payments → **Mess goes to day-meals**; lodging goes to payments
- Complaints (if allowed)
- Notifications
- Footer: `CustomerSidebarProfile`

### 5.3 What does **not** exist

- No breadcrumbs in the shell (some pages add their own `Breadcrumbs`)
- No Mess-specific nav labels (“Customers”, hide Accommodation, hide Day meals on PG)
- No separate “Headcount” nav item (headcount is reached from dashboard / meals)
- No WhatsApp module in the sidebar (share lives under meals)

---

## 6. Modules

| Module | What it owns |
|---|---|
| Auth | Password login/register, OTP leftovers (redirected), session |
| Onboarding | Create/join space, profile completion, space details/edit, meal billing + poll closing settings |
| Dashboard | Ops canvas, occupancy list, bed inventory, space health, meal headcount |
| Members | People CRUD, invite, import, add-customers hub, meal balance, documents, occupancy on member |
| Accommodation | Building/floor/unit/room/bed tree, quick setup, occupancy wizard |
| Meals | Daily menus B/L/D, library, extras, polls, share, participation, subscriptions, headcount APIs |
| Payments | Monthly ledger, review queue, history, universal proof, day-meal payments |
| Complaints | Raise/list/manage; Mess vs lodging categories |
| Inventory | Items, categories, suppliers, stock in/out, space-type profile |
| Notifications | Bell + list |
| Global | Cross-space attention/activity |
| Space lifecycle | Setup milestones + health score (client-side engine, uses live API signals) |

---

## 7. Space types

Source: `src/shared/types/space.ts`, `CreateSpacePage`, `accommodationProfile.ts`, `spacePermissions.ts`, `spaceLifecycle/profiles.ts`.

| Type | Accommodation model | Meals | People default | Inventory profile | Serving locations |
|---|---|---|---|---|---|
| **PG** | Corridor PG or Apartment PG (floors → rooms → beds, or floors → units → rooms → beds) | Optional (`MEALS_READY` optional) | TENANT | ASSET | Property serving |
| **HOSTEL** | Same as PG | Optional | TENANT | ASSET | Property serving |
| **CO_LIVING** | Units → rooms → beds (no floors in UI profile) | Optional | TENANT | ASSET | Property serving |
| **RENTAL** | Units only, **no beds** | **Omitted** from lifecycle meals | TENANT | FURNITURE | Hidden |
| **MESS** | **None** (`getAccommodationUiProfile` returns `null`) | Required (library, today’s menu, share) | CUSTOMER | FOOD | Delivery |

**Shared across types:** dashboard, members (terminology differs), payments, complaints, notifications, inventory (profile differs), space details.

**Hidden for Mess:** entire accommodation module + occupancy wizard + bed inventory (permission false). Occupancy list/bed-inventory routes still exist in the router; they should 403 via accommodation-related usage, not via a dedicated occupancy gate.

**Terminology today:**

- Nav always says “Members”.
- Mess dashboard widget label: “Customers on meals”.
- Mess members page shows **Add Customers** hub; lodging shows **Import people**.
- Filter roles: Mess = CUSTOMER/STAFF/MANAGER/OWNER. Lodging filter list **omits CUSTOMER** even though `assignableRolesForSpaceType` allows CUSTOMER on lodging.

---

## 8. Role / permission model

Permissions come from `GET /spaces/my` `permissions` block, merged with `deriveSpacePermissions` in `spacePermissions.ts`.

| Capability | OWNER | MANAGER | STAFF | TENANT | CUSTOMER |
|---|---|---|---|---|---|
| View accommodation (non-Mess) | yes | yes | yes | no | no |
| Manage accommodation | yes | yes | no | | |
| Deactivate accommodation | yes | | | | |
| Manage occupancy | yes | yes | | | |
| View occupancies | yes | yes | yes | | |
| Manage members | yes | yes | | | |
| Remove member | yes | | | | |
| Manage meals | yes | yes | | | |
| View meals | any membership | | | | |
| Inventory view | yes | yes | yes | | |
| Inventory manage | yes | yes | | | |
| Raise complaint | yes | yes | | yes | yes |
| Manage complaints | yes | yes | | | |
| Manage payments (client helper) | yes | yes | no | no | no |

Module routes are wrapped in `*PermissionGate` components that `Navigate` to `/forbidden`.

`canManageNotifications` (operator chrome) lives in `spaceOperator.ts` — used to distinguish owner/manager ops dashboard vs consumer dashboard.

---

## 9. API dependencies

Axios client: `src/shared/api/client.ts` (`Authorization: Bearer`, unwraps `{ data, message }` envelope).

**Client modules (do not invent extra backend):**

| File | Domain |
|---|---|
| `modules/auth/api/authApi.ts` | Login, register, session, deletion |
| `shared/api/mySpacesApi.ts` | My spaces / default space |
| `modules/onboarding/api/spaceApi.ts` | Create/update space |
| `modules/onboarding/api/invitationApi.ts` | Invites |
| `modules/onboarding/api/mealBillingApi.ts` | Meal billing settings |
| `modules/onboarding/api/mealPollClosingApi.ts` | Poll close times |
| `modules/dashboard/api/dashboardApi.ts` | `GET /spaces/:id/dashboard-summary`, global dashboard |
| `modules/dashboard/api/dashboardDrilldownApi.ts` | Occupancy / bed drill-downs |
| `modules/dashboard/api/notificationsApi.ts` | Notifications |
| `modules/members/api/memberApi.ts` | Members |
| `modules/members/api/memberRelatedApi.ts` | Related people ops |
| `modules/members/api/memberMealBalanceApi.ts` | Prepaid / meal balance |
| `modules/accommodation/api/accommodationApi.ts` | Hierarchy |
| `modules/accommodation/api/occupancyApi.ts` | Allocate/reserve/move-in/transfer/vacate |
| `modules/accommodation/api/accommodationLifecycleApi.ts` | Activate/deactivate |
| `modules/meals/api/mealsApi.ts` | Menus, polls, headcount, share, participation |
| `modules/meals/api/subscriptionPlansApi.ts` | Meal plans |
| `modules/payments/api/paymentsApi.ts` | Payments |
| `modules/complaints/api/complaintsApi.ts` | Complaints |
| `modules/inventory/api/inventoryApi.ts` | Inventory |

Dashboard summary contract (`DashboardSummaryResponse`):

- `financial` (expected / collected / underReview / pending, prepaid extras)
- `messOperations?` (customers on meals, menus published, open polls, today’s headcount, poll responded/eligible)
- `accommodationOperations?` (occupied, vacant, move-ins this month, pending payments count)
- `pendingActions`

**UI must not invent** reserved-bed totals, per-meal B/L/D on `messOperations`, or complaint counts on the dashboard summary — those are **not** on this DTO. Per-meal B/L/D **is** available via meals headcount APIs (`useMealHeadcountDay`), already used by `MealOperationsTodayCard`.

---

## 10. Data flows (actual)

### Create space

`OnboardingChoice` → `CreateSpacePage` (pick type PG/MESS/HOSTEL/CO_LIVING/RENTAL, gender policy, amenities) → `spaceApi` → dashboard.

### Accommodation (non-Mess)

Create space → **Quick setup** (layout mode, buildings/floors/rooms/beds) → **Members** (TENANT) → **Occupancy wizard** (`ALLOCATE` | `RESERVE` | `MOVE_IN` | `TRANSFER` | `VACATE`) → occupancy list / bed inventory → payments → complaints.

Hierarchy UI profile is layout-mode specific (corridor vs apartment vs co-living vs rental-without-beds).

### Mess

Create mess → **menu library** (required lifecycle) → add **customers** (optional skip) → **today’s menu** (B/L/D editor) → **share** → customers respond via **poll** (multi-quantity) → **headcount / meals to prepare** → **day-meal payments** + prepaid/pay-per-meal settings → complaints (food categories) → inventory (FOOD units kg/litre/…).

Delivery locations are **recommended** for Mess (`servingLocationMode === 'delivery'`).

### Combined lodging + meals (PG/Hostel/Co-living)

Property structure + residents required; meals optional. Poll is **single-select** (not Mess multi-qty). Serving location mode is **property**, not delivery list.

---

## 11. Existing reusable UI components

`src/shared/components/`:

`PageContainer` · `PageHeader` · `PageSection` · `SectionHeader` · `ContentCard` · `WidgetCard` · `StatCard` · `ActionCard` · `StatusChip` · `EmptyState` · `LoadingState` · `ErrorState` · `ErrorBoundary` · `LoadingBoundary` · `DataTable` (desktop table + **card fallback below `md`**) · `TableToolbar` · `SearchToolbar` · `FilterBar` · `Pagination` · `AppDrawer` · `SidePanel` · `ConfirmDialog` · `FormSection` · `InfoRow` · `AvatarStack` · `Breadcrumbs` · `ActionToolbar` · `StickyFooter` · `PeriodDayNav` · `PeriodMonthNav` · `DateRangePicker` · `SkipLink`

Dashboard-specific: `IconBadge` · `MetricRow` · `QuickActionTile` · `DashboardSection` · `HealthScoreRing` · `SpaceContextSelector`

Layouts: `AppLayout` · `AppSidebar` · `AppHeader` · `ScaleShell` · `AuthLayout` · `BlankLayout`

**Strategy:** improve these primitives rather than forking per page. `EmptyState` already accepts `icon` + `action` — many call sites still pass weak copy.

---

## 12. Existing design system

| Token | Value (light) | Source |
|---|---|---|
| Font | Plus Jakarta Sans | `typography.ts`, `global.css` |
| Body | 14–15px, weights 400/500/600/700 | `DASHBOARD_UX` + MUI variants |
| Page title | 28px / 700 | |
| Primary | **`#25D366`** (WhatsApp-like green) | `colors.ts` |
| Primary dark | `#128C7E` | Used heavily on nav/buttons |
| Page background | `#F3FAF6` (green-tinted) | Entire app canvas |
| Card | `#FFFFFF`, radius 10–16, shadow `0 2px 10px rgba(16,24,40,0.05)` | |
| Success / warning / danger | `#059669` / `#D97706` / `#DC2626` | |
| Semantic tints | green / amber / red only | **No dedicated meal/payment/complaint/accommodation palettes in the token file** |
| Accent usage in widgets | indigo `#6366F1`, blue `#3B82F6`, amber `#D97706`, purple `#7C3AED` | Hard-coded in dashboard widgets, not tokens |
| Buttons | no elevation, radius 8–12, no text-transform | |
| Inputs | radius 12 | |
| Sidebar | 240 / collapsed 72, header 64 | `layoutConstants.ts` |
| Dashboard canvas | **min width 1200px**, then CSS scale-down | `ScaleShell` + `DASHBOARD_CANVAS_MIN_WIDTH` |
| Dark mode | Dedicated `darkColors` / `DASH_DARK`, header sun/moon toggle | |

**Conflict with the approved product visual direction:** the app is still a **green-first** system (`#25D366` + mint page bg). Marketing site moved to restrained teal/navy with module colors. Web tokens have not been updated.

---

## 13. Dashboard structure

`DashboardPage` — three audiences:

1. **Operator** (`canManageNotifications`): ScaleShell canvas  
   - Row 1: `SpaceOverviewCard` (name, type, health ring, refresh) \| `MealOperationsTodayCard` (B/L/D tiles + headcount) **or** a subtitle placeholder if meals not managed \| `PendingActionsPanel`  
   - Row 2 Mess: `FinancialSummaryWidget` (4-up row) + `MessOperationsWidget` (customers, menus, polls, today’s headcount)  
   - Row 2 lodging: Financial 2×2 board + `AccommodationOpsWidget` (occupied, vacant, move-ins, pending payments)  
   - Row 3: `DashboardQuickActions` tiles  
2. **Meal participant** (tenant/customer with meals): `DashboardCustomerMealsSection` + pending card  
3. **Other consumers:** “My stay / payments / complaints” link cards  

Health score is **client-computed** from lifecycle signals + occupancy/payment extras (`useSpaceHealth`), not a raw backend score field.

**Zeros:** `formatCurrency(null)` renders `₹0`. Empty financial uses i18n empty hints (including a Mess-specific hint). Real empty spaces will show zeros — that is live data, not demo seed. There is **no demo/mock dashboard dataset** in this repo.

---

## 14. Accommodation workflow

1. Quick setup wizard (`defaultLayoutModeForSpaceType`)  
2. Hierarchy tree + center workspace + entity inspector  
3. Occupancy wizard modes: ALLOCATE, RESERVE, MOVE_IN, TRANSFER, VACATE  
4. Bed inventory filtered by status (`AVAILABLE` and others via query)  
5. Occupancy list (`active` | `moveInsThisMonth`)

Bed statuses in types include `OCCUPIED` and `RESERVED`. Dashboard **accommodationOperations does not expose reserved count or occupancy %**.

Rental: no beds in UI profile; occupancy still uses units.

---

## 15. Mess workflow

1. Create MESS space (no building/floor/room/bed)  
2. Menu library + extras  
3. Customers (optional skip in lifecycle; share blocked without customers)  
4. Plan B/L/D (`MealMenuEditorPage`)  
5. Share (`MealSharePage`)  
6. Poll (`MealPollResponsePage`, multi-quantity)  
7. Headcount (`MealHeadcountPage` — meals to prepare, option breakdown, member names)  
8. Day-meal payments + subscription/prepaid settings  
9. Food complaints + FOOD inventory  

**UI gaps vs product intent:** sidebar still says Members; Day meals is duplicated with Payments; Mess ops widget uses a **single** `todaysHeadcount` while the meal-today card already has B/L/D.

---

## 16. Meal / headcount workflow

- Meal types: `BREAKFAST` | `LUNCH` | `DINNER`  
- Planner home: day nav + three `MealSlotCard`s + library/locations/participation/share/plans shortcuts  
- Headcount page: tabs per meal + ALL; `mealsToPrepare`; expand option → member names  
- Dashboard meal card already shows per-slot prepare counts via `useMealHeadcountDay`  
- PG poll: single select. Mess poll: multi-quantity + delivery picker  
- Poll closing settings live on space details (timezone + offsets)

---

## 17. Payment workflow

- Operator: `PaymentsWorkspacePage` tabs **members / review / history**, month nav, StatCards, inspector drawer, proof review  
- Tenant/customer: `TenantPaymentsPage`  
- `DayMealPaymentsPage` for meal-day collection (Mess-primary; still linked for all operators)  
- Universal payment proof form (`UniversalPaymentProofForm` / `ProofSubmitDrawer`)  
- Financial widget maps to payments tabs (members / history / review / pending)  
- Currency INR via `Intl.NumberFormat`

---

## 18. Complaint workflow

Statuses: OPEN, IN_PROGRESS, RESOLVED, CLOSED, CANCELLED.  
Priorities: LOW, MEDIUM, HIGH, URGENT.  

Categories:

- Lodging: MAINTENANCE, HOUSEKEEPING, FOOD, BILLING, SAFETY, OTHER  
- Mess: FOOD_QUALITY, FOOD_SERVICE, BILLING, SERVICE, OTHER  

Workspace: filters + StatCards + table/cards + `ComplaintInspector` + `RaiseComplaintDrawer`. Dashboard summary **does not** include open-complaint counts.

---

## 19. Inventory workflow

Tabs: catalog, categories, suppliers, transactions.  
Stock statuses derived client-side: HEALTHY / LOW / CRITICAL / OUT_OF_STOCK.  
Profiles: Mess FOOD, Rental FURNITURE, else ASSET.  
Actions: stock in/out/adjust drawers. Dashboard inventory is a **quick-action tile only**, not a stock KPI on the home canvas.

---

## 20. Responsive behavior

| Breakpoint | Behavior |
|---|---|
| `< md` | Temporary sidebar, hamburger, `DataTable` card fallback |
| `md+` | Permanent sidebar |
| Operator dashboard | `ScaleShell` locks **1200px** canvas and **scales the entire dashboard** on narrower widths instead of reflowing |
| Auth illustration | Hidden below `md` |
| Header actions | Wrap; three text buttons + bell is cramped on tablet |

This is **not** a true mobile operator layout. Consumer dashboard skips ScaleShell and uses natural stack.

Accessibility already present: `SkipLink`, some `aria-label`s, MUI focus rings, StatusChip tones (not color-only in all places). Contrast of muted green-on-green should be rechecked against WCAG in the redesign.

---

## 21. Current UI/UX problems (observed in source)

1. **Auth brand mark is the letter “C”** on `AuthCard` and `AuthIllustration` — leftover CountIn identity; wordmark says ACOMI.  
2. **Green-first theme** (`#25D366` + mint canvas) vs approved restrained palette.  
3. **Mess labelled “Members”** in primary nav.  
4. **Day meals + Payments both in operator nav** for every space type.  
5. **Duplicate Utensils / Wallet icons** (meals vs meal-plans; payments vs day-meals).  
6. **Header action clutter** (My Spaces, Profile, Logout as peer outlined buttons).  
7. **Dashboard ScaleShell** fights tablet/mobile; marketing-site lesson was true reflow.  
8. **Occupancy metrics lack reserved + percentage + progress.**  
9. **Mess ops widget lacks B/L/D split** (data exists on another API).  
10. **`₹0` for null financials** — live empty spaces look like “demo zeros” even when they are real.  
11. **EmptyState** primitive exists; many lists still feel like “no rows”.  
12. **Lodging member filters omit CUSTOMER** despite assignable role.  
13. **README** still says `cd K:\AmicoWeb`.  
14. **No complaint / inventory KPIs** on dashboard (backend DTO also lacks them — UI cannot invent).  
15. **DASHBOARD_UX comments freeze layout sizes** — visual refresh must negotiate this explicitly.

---

## 22. Recommended UI improvements (do not implement yet)

See `UI_UX_ROADMAP.md` for ranked items. Direction in one line:

Treat the web app as an **operator control center**: shell that changes with space type, dashboard that answers “what needs me now?”, graphics-first metrics (icon + label + value + progress), semantic (not all-green) color, reuse existing StatCard/StatusChip/DataTable/EmptyState.

---

## 23. Components that should be reused

`AppLayout` / `AppSidebar` / `AppHeader` (restyle, don’t replace) · `SpaceContextSelector` · `StatCard` · `StatusChip` · `MetricRow` · `IconBadge` · `QuickActionTile` · `ContentCard` · `DataTable` · `AppDrawer` · `EmptyState` · `LoadingState` · `ErrorState` · `PageHeader` · `MealOperationsTodayCard` pattern (B/L/D tiles) · `HealthScoreRing`

---

## 24. Components that need redesign

`AuthCard` / `AuthIllustration` (C mark) · theme `colors.ts` (green-first) · operator nav construction in `SpaceShellLayout` (labels + Mess/PG information architecture) · `ScaleShell` usage on dashboard · `FinancialSummaryWidget` empty/zero presentation · `AccommodationOpsWidget` (add % / reserved if API allows; otherwise don’t fake) · `MessOperationsWidget` (compose with existing headcount API, don’t invent DTO fields) · `AppHeader` actions · `EmptyState` call sites

---

## 25. Pages that should be redesigned first

1. Application shell (sidebar + header + auth chrome)  
2. Dashboard (operator)  
3. Members workspace (Customers vs Members)  
4. Accommodation occupancy / bed inventory  
5. Meals home + headcount (already closer to the target; polish)  
6. Payments + day meals IA  
7. Complaints / inventory / notifications  

Do **not** start with a full MUI replacement or a new component library.

---

## 26. Known technical constraints

- Must keep MUI, React Query, existing routes and permission gates.  
- `DASHBOARD_UX` documents frozen layout metrics.  
- Dashboard summary DTO is thinner than the desired “control center” (no reserved beds, no complaint counts, Mess headcount is a single number).  
- Occupancy/meals/payments **business rules** live in API + wizard helpers — UI must not change them.  
- i18n: changing “Members” → “Customers” for Mess requires all six locale files.  
- OTP routes exist but currently redirect to password register.  
- Untracked AWS JSON in repo (`cloudfront-*.json`, bucket policy) is deploy config, not product UI.

---

## 27. Backend dependencies

Any UI that needs:

- reserved bed count / occupancy % on dashboard  
- open complaint counts on dashboard  
- Mess `messOperations` split by breakfast/lunch/dinner  
- inventory low-stock count on dashboard  

…requires **backend DTO extension** or must be **composed from existing module APIs** (headcount API is already composed on the meal-today card). Prefer composition before asking for new contracts.

Do not change payment calculation, meal eligibility, occupancy transitions, or auth.

---

## 28. Open questions / items requiring confirmation

1. Should Mess primary nav say **Customers** and hide **Accommodation** / **Day meals** duplication in one pass, or only relabel?  
2. Should PG hide **Day meals** unless meals are enabled for that space? (`canViewMeals` is true for any membership today.)  
3. Is combining lodging financial + property + meal-today on one dashboard the intended combined-space layout, or should meals collapse until enabled?  
4. Should operator dashboard **reflow** (drop ScaleShell) or keep scaled 1200px canvas?  
5. Brand primary: keep `#128C7E` teal and retire `#25D366`, or keep green for success-only?  
6. Are CUSTOMER roles on PG/Hostel in active use? Filter UI currently hides them.  
7. Should complaint/inventory KPIs wait for backend, or is a second dashboard query acceptable?  
8. Auth “C” → “A” mark: confirm using the same A-mark as Play Store / marketing site.  
9. Demo/preview zeros: this app shows **live** data; there is no preview seed. Confirm we will **not** inject fake stats in production.  
10. Branch for UI work: currently on `aws-production`. UI implementation should likely land on `develop` first (confirm with the established web-app branch policy).

---

## Related existing docs (do not treat as this baseline)

Older implementation notes live under `docs/` (`DASHBOARD.md`, `ACCOMMODATION.md`, `MEALS.md`, `PAYMENTS.md`, `web/SCREEN_PARITY_MATRIX.md`, etc.). They describe intended parity with mobile. This file describes **what the web app actually is today** for the UI/UX phase.
