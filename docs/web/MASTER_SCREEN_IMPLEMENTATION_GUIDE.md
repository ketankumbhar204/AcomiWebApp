# Amico Web Screen Implementation Guide

> **Every future screen implementation MUST first analyze previously completed screens and reuse existing components before creating new ones.**
>
> **New UI components should only be created if no suitable reusable component already exists.**
>
> **The Dashboard design system is the primary visual reference for the entire web application.**

---

## Overview

| Item | Value |
|------|-------|
| Design SoT (visual) | **Web Dashboard** (`DashboardPage` + `dashboardUx.ts`) |
| Business SoT | **React Native** (`K:\Amico`) |
| API SoT | **Backend** (`K:\Projects\Amico\Backend\amico-backend`) (now amico-backend Maven artifact) |
| Implementation target | **Amico Web** (`K:\AmicoWeb`) |
| Companion catalog | [`UI_COMPONENT_CATALOG.md`](./UI_COMPONENT_CATALOG.md) |
| Screen checklist (daily tracker) | [`SCREEN_IMPLEMENTATION_CHECKLIST.md`](./SCREEN_IMPLEMENTATION_CHECKLIST.md) |
| Screen reference map | [`SCREEN_REFERENCE_MAP.md`](./SCREEN_REFERENCE_MAP.md) |
| Related audit | [`DASHBOARD_UI_AUDIT.md`](./DASHBOARD_UI_AUDIT.md) |

### Current implementation status (high level)

| Area | Status |
|------|--------|
| Dashboard UX (layout + typography + density) | ✅ **Completed — official design reference** |
| Auth / onboarding / spaces | ✅ Design/Desktop DS aligned |
| Members / Accommodation / Meals / Payments / Complaints / Inventory / Notifications / Profile / Global | ✅ Design/Desktop DS aligned |
| Shared component extraction from Dashboard | ✅ Shared chrome tokenized (`PageHeader`, `ContentCard`, `StatCard`, tables, dialogs, etc.) |
| Responsive + a11y pass across all modules | ✅ Phases 20–21 complete |
| Production readiness | ✅ Phase 22 complete |

### Completed modules (design-reference quality)

- ✅ **Dashboard** — visual + layout SoT
- ✅ **Phases 2–22** — Design/Desktop + a11y + responsive + production polish

### Remaining

- Optional follow-ups: table virtualization for very large lists; deeper SR QA with assistive tech

---

## Totals (analysis snapshot)

| Source | Count | Notes |
|--------|------:|-------|
| React Native product screens | **~79** | 78 under `src/screens` + OccupancyWizard feature |
| Web page files | **41** | `src/modules/**/pages` (+ `NotFoundPage`) |
| Web routed surfaces | **~45+** | Includes workspace detail URL variants |
| Modules documented below | **20** | Includes Settings / Reports / Global |

Web often consolidates many RN screens into **workspace** pages (list + detail inspector). That is valid architecture — polish still requires Dashboard DS reuse.

---

## Dashboard Design System Reference

See chapter **[Dashboard Design System](#dashboard-design-system)** below and tokens in:

`K:\AmicoWeb\src\modules\dashboard\theme\dashboardUx.ts`

Do **not** invent new visual styles. Prefer tokens + catalog components from [`UI_COMPONENT_CATALOG.md`](./UI_COMPONENT_CATALOG.md).

---

# Modules

Legend for **Status**:

| Tag | Meaning |
|-----|---------|
| ✅ Completed | Matches Dashboard DS + functional |
| 🔄 Partial | Exists functionally; needs DS polish and/or missing RN screens |
| ⏳ Pending | Not started / missing |
| 🚫 Blocked | Waiting on dependency |

---

## 1. Authentication

| Field | Value |
|-------|-------|
| **Status** | 🔄 Partial (functional ✅, DS polish ⏳) |
| **Description** | Phone login, OTP, unauthorized/forbidden shells |
| **Priority** | P1 (early chrome consistency) |
| **Complexity** | S |
| **Depends on** | Auth layout, form fields, primary button |
| **Reference screens** | Dashboard buttons, cards, form density |

### React Native screens

| Screen | Path |
|--------|------|
| LoginScreen | `src/screens/auth/LoginScreen.tsx` |
| OtpScreen | `src/screens/auth/OtpScreen.tsx` |

### Web pages / routes

| Page | Route | Status |
|------|-------|--------|
| LoginPage | `/login` | 🔄 Partial |
| OtpPage | `/otp` | 🔄 Partial |
| UnauthorizedPage | `/unauthorized` | 🔄 Partial |
| ForbiddenPage | `/forbidden` | 🔄 Partial |
| AuthenticatedHomePage | *(orphan — not routed)* | ⏳ / legacy |

### Missing vs RN

- None for core login/OTP (RN Splash/Welcome are app-shell, not required as web pages)

### Reusable components

- `AuthLayout`, `FormSection`, `Button`, OTP input pattern, `LoadingState`, `EmptyState`/`ErrorState`
- Align buttons with Dashboard button tokens (13px / 600)

### Checklist

- [ ] Login DS polish
- [ ] OTP DS polish
- [ ] Unauthorized / Forbidden DS polish
- [ ] Dark mode
- [ ] Responsive
- [ ] Accessibility

---

## 2. Dashboard

| Field | Value |
|-------|-------|
| **Status** | ✅ Completed (official design reference) |
| **Description** | Space operations console — overview, meals today, pending, payment/property/mess metrics, quick actions |
| **Priority** | — (done) |
| **Complexity** | L (done) |
| **Depends on** | `useSpaceDashboard`, pending actions, meals hooks, space lifecycle |
| **Reference screens** | **Self** |

### React Native screens

| Screen | Path |
|--------|------|
| DashboardScreen | `src/screens/dashboard/DashboardScreen.tsx` |
| DashboardPendingActionsScreen | `.../DashboardPendingActionsScreen.tsx` |
| DashboardSpaceHealthScreen | `.../DashboardSpaceHealthScreen.tsx` |
| DashboardOccupancyListScreen | `.../DashboardOccupancyListScreen.tsx` |
| DashboardBedInventoryScreen | `.../DashboardBedInventoryScreen.tsx` |

### Web pages / routes

| Page | Route | Status |
|------|-------|--------|
| DashboardPage | `/spaces/:spaceId`, `/spaces/:spaceId/dashboard` | ✅ Completed |
| PendingActionsPage | `/spaces/:spaceId/pending-actions` | 🔄 Partial (DS) |
| OccupancyListPage | `/spaces/:spaceId/occupancy` | 🔄 Partial (DS) |
| BedInventoryPage | `/spaces/:spaceId/bed-inventory` | 🔄 Partial (DS) |
| NoSpacesPage | `/no-spaces` | 🔄 Partial |

### Missing vs RN

| Screen | Notes |
|--------|-------|
| DashboardSpaceHealth (dedicated) | Health embedded in Space Overview card; dedicated page optional |

### Reusable components (export these as app patterns)

- `SpaceOverviewCard`, `MealOperationsTodayCard`, `PendingActionsPanel`, `FinancialSummaryWidget`, `AccommodationOpsWidget` / `MessOperationsWidget`, `MetricRow`, `DashboardSection`, `QuickActionTile`, `DashboardQuickActions`, `DashboardScaleShell`, `IconBadge`, `HealthScoreRing`

### Checklist

- [x] Row layout (Overview · Meals Today · Pending)
- [x] Payment / Property or Mess ops
- [x] Quick actions
- [x] Typography & contrast polish
- [ ] Dedicated Space Health page (optional)
- [ ] Dark mode verification
- [ ] Final a11y pass

---

## 3. My Spaces

| Field | Value |
|-------|-------|
| **Status** | 🔄 Partial |
| **Description** | List / switch spaces; empty state when none |
| **Priority** | P2 |
| **Complexity** | S–M |
| **Depends on** | Space store, AppHeader actions |
| **Reference** | Dashboard cards, PageHeader, EmptyState |

### React Native

- `MySpacesScreen`, `GlobalAttentionListScreen`, `GlobalActivityListScreen`

### Web

| Page | Route | Status |
|------|-------|--------|
| MySpacesPage | `/my-spaces` | 🔄 Partial |
| GlobalAttentionPage | `/global/attention` | 🔄 Partial |
| GlobalActivityPage | `/global/activity` | 🔄 Partial |

### Checklist

- [ ] My Spaces DS polish
- [ ] Global Attention DS polish
- [ ] Global Activity DS polish

---

## 4. Space Details & Space Management

| Field | Value |
|-------|-------|
| **Status** | 🔄 Partial |
| **Description** | View/edit space settings, activity |
| **Priority** | P2 |
| **Complexity** | M |
| **Depends on** | Forms, SectionHeader, ConfirmDialog |
| **Reference** | Dashboard Form/Button style |

### React Native

- `SpaceDetailsScreen`, `EditSpaceScreen`, `CreateSpaceScreen`

### Web

| Page | Route | Status |
|------|-------|--------|
| SpaceDetailsPage | `/spaces/:spaceId/details` | 🔄 Partial |
| EditSpacePage | `/spaces/:spaceId/edit` | 🔄 Partial |
| CreateSpacePage | `/create-space` | 🔄 Partial |

### Checklist

- [ ] Space Details DS
- [ ] Edit Space DS
- [ ] Create Space DS

---

## 5. Onboarding & Invitations

| Field | Value |
|-------|-------|
| **Status** | ✅ Design / Desktop (Responsive / Dark / A11y open) |
| **Description** | Post-auth choice, join, accept invites, complete profile |
| **Priority** | P1 |
| **Complexity** | M |
| **Depends on** | Auth session, invitations API |
| **Reference** | Auth + Dashboard cards/buttons |

### React Native

- `OnboardingChoiceScreen`, `JoinSpaceScreen`, `AcceptInvitationsScreen`, `CompleteProfileScreen`, `ProfileCompletionGateScreen` (orphan)

### Web

| Page | Route | Status |
|------|-------|--------|
| OnboardingChoicePage | `/onboarding` | ✅ Design |
| JoinSpacePage | `/join-space` | ✅ Design |
| AcceptInvitationsPage | `/accept-invitations` | ✅ Design |
| CompleteProfilePage | `/complete-profile` | ✅ Design |

### Checklist

- [x] Onboarding choice DS
- [x] Join space DS
- [x] Accept invitations DS
- [x] Complete profile DS

---

## 6. Members

| Field | Value |
|-------|-------|
| **Status** | 🔄 Partial |
| **Description** | Member directory, detail, invite/add, import, subscriptions/history |
| **Priority** | P2 |
| **Complexity** | L |
| **Depends on** | DataTable, SearchToolbar, FilterBar, StatusChip, FormSection |
| **Reference** | Dashboard section headers, pending list density, QA tiles |

### React Native screens

- MembersScreen, InviteMemberScreen, AddMemberScreen, AddCustomersHubScreen, ImportExistingPeopleScreen, MemberDetailsScreen, EditMemberScreen, MemberSubscriptionScreen, MemberSubscriptionHistoryScreen, MemberOccupancyHistoryScreen

### Web pages

| Page | Route | Status |
|------|-------|--------|
| MembersWorkspacePage | `/spaces/:spaceId/members`, `.../members/:memberId` | 🔄 Partial |
| ImportExistingPeoplePage | `.../members/import` | 🔄 Partial |
| AddCustomersHubPage | `.../members/add-hub` | 🔄 Partial |

### Missing / gaps vs RN (dedicated flows)

| Gap | Notes |
|-----|-------|
| Invite Member page | May be modal/drawer inside workspace — confirm parity |
| Add Member dedicated | Often inside workspace |
| Edit Member dedicated | Often inside workspace |
| Member Subscription + History | Confirm coverage in workspace |
| Member Occupancy History | Confirm coverage |

### Checklist

- [ ] Members list DS
- [ ] Member details DS
- [ ] Invite / Add flows
- [ ] Edit member
- [ ] Import people
- [ ] Add customers hub
- [ ] Subscription + history
- [ ] Occupancy history
- [ ] Responsive / dark / a11y

---

## 7. Customer Import

| Field | Value |
|-------|-------|
| **Status** | 🔄 Partial (covered by Import + Add hub) |
| **Priority** | P3 |
| **Complexity** | M |
| **Reference** | Forms, tables, EmptyState |

### Checklist

- [ ] Import flow DS
- [ ] Hub DS
- [ ] Error / empty states

---

## 8. Accommodation

| Field | Value |
|-------|-------|
| **Status** | 🔄 Partial |
| **Description** | Hierarchy builder, CRUD for building→bed, occupancy wizard |
| **Priority** | P2 |
| **Complexity** | XL |
| **Depends on** | Hierarchy UI, wizards, MetricRow patterns |
| **Reference** | Property Operations metrics, Dashboard cards |

### React Native (18+ screens)

AccommodationHome, QuickSetupWizard, AccommodationBuilder, Building/Floor/Unit/Room/Bed Form+Detail, Floors/Units/Rooms/Beds lists, FloorApartments, OccupancyWizard

### Web

| Page | Route | Status |
|------|-------|--------|
| AccommodationWorkspacePage | `/spaces/:spaceId/accommodation` | 🔄 Partial |
| QuickSetupWizardPage | `.../accommodation/quick-setup` | 🔄 Partial |
| OccupancyWizardPage | `/spaces/:spaceId/occupancy/wizard` | 🔄 Partial |

### Missing vs RN (often in-workspace; verify)

- Dedicated Form/Detail routes for Building, Floor, Unit, Room, Bed
- AccommodationBuilder as first-class page
- Floors/Units/Rooms/Beds list routes

### Checklist

- [ ] Accommodation home DS
- [ ] Hierarchy navigation density
- [ ] Entity forms DS
- [ ] Entity details DS
- [ ] Quick setup wizard DS
- [ ] Occupancy wizard DS
- [ ] Bed inventory / occupancy list DS (dashboard drills)

---

## 9. Meals

| Field | Value |
|-------|-------|
| **Status** | 🔄 Partial |
| **Description** | Menu planning, library, share, poll, delivery locations |
| **Priority** | P2 |
| **Complexity** | XL |
| **Depends on** | Meals APIs, date picker, cards |
| **Reference** | **Meal Operations (Today)** card, Dashboard section headers |

### React Native

MealsHome, MenuPlanning, DailyMenuToday/Edit/SelectCombo, SelectMenuHub, MenuLibrary, MealComboForm, MenuSharePreview, MealPollResponse, MealDeliveryLocations

### Web

| Page | Route | Status |
|------|-------|--------|
| MealsPlannerPage | `/spaces/:spaceId/meals` | 🔄 Partial |
| MenuLibraryPage | `.../meals/library` | 🔄 Partial |
| DeliveryLocationsPage | `.../meals/locations` | 🔄 Partial |
| MealParticipationPage | `.../meals/participation` | 🔄 Partial |
| MealSharePage | `.../meals/share` | 🔄 Partial |
| MealPollResponsePage | `.../meals/poll` | 🔄 Partial |

### Checklist

- [ ] Planner DS (match Meal Ops Today density)
- [ ] Library DS
- [ ] Share preview DS
- [ ] Poll response DS
- [ ] Delivery locations DS
- [ ] Participation DS

---

## 10. Meal Subscription Plans

| Field | Value |
|-------|-------|
| **Status** | 🔄 Partial |
| **Priority** | P3 |
| **Complexity** | M–L |
| **Reference** | Dashboard cards, StatusChip, tables |

### React Native

- SubscriptionPlansScreen, CustomerSubscriptionPlansScreen, SubscriptionActivationRequestsScreen, MemberSubscription*

### Web

| Page | Route | Status |
|------|-------|--------|
| SubscriptionPlansWorkspacePage | `.../meals/plans` | 🔄 Partial |
| CustomerSubscriptionPlansPage | `.../meals/plans/customer` | 🔄 Partial |

### Missing

- Activation requests dedicated page (confirm if inside workspace)

### Checklist

- [ ] Owner plans DS
- [ ] Customer plans DS
- [ ] Activation requests DS

---

## 11. Payments

| Field | Value |
|-------|-------|
| **Status** | 🔄 Partial |
| **Priority** | P2 |
| **Complexity** | L |
| **Reference** | **Payment Summary** 2×2 / 4-card strip, MetricRow |

### React Native

PaymentsScreen, TenantPaymentsTabScreen, MemberPaymentsScreen, PaymentDetailScreen, PaymentHistoryScreen, PaymentReviewScreen

### Web

| Page | Route | Status |
|------|-------|--------|
| PaymentsWorkspacePage | `/spaces/:spaceId/payments`, `.../payments/:paymentId` | 🔄 Partial |
| TenantPaymentsPage | *(role variant inside workspace)* | 🔄 Partial |

### Checklist

- [ ] Owner payments DS
- [ ] Tenant payments DS
- [ ] Payment detail DS
- [ ] History / review tabs DS
- [ ] Metric strip reuse from Dashboard

---

## 12. Day Meals

| Field | Value |
|-------|-------|
| **Status** | 🔄 Partial |
| **Priority** | P3 |
| **Complexity** | M |
| **Reference** | Meal + Payment cards |

### React Native

- DayMealPaymentDetailScreen, DayMealBulkPayScreen

### Web

| Page | Route | Status |
|------|-------|--------|
| DayMealPaymentsPage | `/spaces/:spaceId/payments/day-meals` | 🔄 Partial |

### Checklist

- [ ] Day meal payments DS
- [ ] Bulk pay flow DS

---

## 13. Complaints

| Field | Value |
|-------|-------|
| **Status** | 🔄 Partial |
| **Priority** | P3 |
| **Complexity** | M |
| **Reference** | Pending Actions list, StatusChip, badges |

### React Native

- ComplaintsListScreen, RaiseComplaintScreen, ComplaintDetailScreen

### Web

| Page | Route | Status |
|------|-------|--------|
| ComplaintsWorkspacePage | `/spaces/:spaceId/complaints`, `.../:complaintId` | 🔄 Partial |

### Checklist

- [ ] List DS
- [ ] Raise complaint form DS
- [ ] Detail / timeline DS

---

## 14. Inventory

| Field | Value |
|-------|-------|
| **Status** | 🔄 Partial |
| **Priority** | P3 |
| **Complexity** | L |
| **Reference** | Metric cards, DataTable, QuickActionTile |

### React Native

- InventoryDashboard, InventoryItems, InventoryItemDetails, InventoryItemForm  
- (RN may also have categories/suppliers/transactions in newer work — verify against current RN)

### Web

| Page | Route | Status |
|------|-------|--------|
| InventoryWorkspacePage | `/spaces/:spaceId/inventory`, `.../items/:itemId` | 🔄 Partial |

### Missing (verify)

- Categories, Suppliers, Transactions as dedicated surfaces if present on RN

### Checklist

- [ ] Inventory dashboard DS
- [ ] Items list DS
- [ ] Item detail / stock in-out DS
- [ ] Item form DS
- [ ] Categories / suppliers / transactions (if in scope)

---

## 15. Notifications

| Field | Value |
|-------|-------|
| **Status** | 🔄 Partial |
| **Priority** | P3 |
| **Complexity** | S–M |
| **Reference** | Pending Actions panel, badges |

### React Native

- SpaceNotificationsScreen

### Web

| Page | Route | Status |
|------|-------|--------|
| NotificationsPage | `/spaces/:spaceId/notifications` | 🔄 Partial |

### Checklist

- [ ] Inbox list DS
- [ ] Bell badge consistency
- [ ] Empty / loading states

---

## 16. Pending Actions

| Field | Value |
|-------|-------|
| **Status** | 🔄 Partial |
| **Priority** | P2 |
| **Complexity** | M |
| **Reference** | **PendingActionsPanel** on Dashboard |

### React Native / Web

- RN: DashboardPendingActionsScreen  
- Web: PendingActionsPage

### Checklist

- [ ] Full list DS (reuse Dashboard pending item row)
- [ ] Filters / search
- [ ] Priority badges
- [ ] Deep-links to resolution screens

---

## 17. Profile

| Field | Value |
|-------|-------|
| **Status** | 🔄 Partial |
| **Priority** | P3 |
| **Complexity** | S–M |
| **Reference** | Space Overview density, forms |

### React Native / Web

- RN: ProfileScreen (+ CompleteProfile)  
- Web: ProfilePage `/profile`

### Checklist

- [ ] Profile DS
- [ ] Documents / settings sections
- [ ] Logout affordance consistency

---

## 18. Settings

| Field | Value |
|-------|-------|
| **Status** | ⏳ Pending / embedded |
| **Description** | Language, meal billing defaults, poll closing — mostly sections on RN, not always standalone web pages |
| **Priority** | P4 |
| **Complexity** | S–M |

### Checklist

- [ ] Inventory settings surfaces on Web
- [ ] Align with Dashboard form tokens
- [ ] Language picker DS

---

## 19. Occupancy (wizard + lists)

| Field | Value |
|-------|-------|
| **Status** | 🔄 Partial |
| **Priority** | P2 |
| **Complexity** | L |
| **Reference** | Dashboard Property Ops drills |

### Web

- OccupancyWizardPage, OccupancyListPage, BedInventoryPage

### Checklist

- [ ] Wizard step chrome DS
- [ ] Occupancy list DS
- [ ] Bed inventory DS

---

## 20. Reports

| Field | Value |
|-------|-------|
| **Status** | ⏳ Pending / N/A |
| **Notes** | No dedicated Reports module found in RN/Web inventories. Revisit if backend exposes report APIs. |

---

# Per-screen matrix (condensed)

| Module | Screen / surface | RN ref | Web route | Func | DS | Desktop | Tablet | Mobile | Dark | A11y |
|--------|------------------|--------|-----------|------|----|---------|--------|--------|------|------|
| Dashboard | Dashboard | DashboardScreen | `/spaces/:id` | ✅ | ✅ | ✅ | 🔄 | 🔄 | 🔄 | 🔄 |
| Dashboard | Pending Actions | DashboardPendingActions | `.../pending-actions` | ✅ | 🔄 | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ |
| Dashboard | Occupancy list | DashboardOccupancyList | `.../occupancy` | ✅ | 🔄 | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ |
| Dashboard | Bed inventory | DashboardBedInventory | `.../bed-inventory` | ✅ | 🔄 | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ |
| Auth | Login | LoginScreen | `/login` | ✅ | 🔄 | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ |
| Auth | OTP | OtpScreen | `/otp` | ✅ | 🔄 | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ |
| Onboarding | Choice / Join / Invites / Profile | * | `/onboarding` etc. | ✅ | 🔄 | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ |
| Spaces | My Spaces / Details / Edit | * | `/my-spaces`, details, edit | ✅ | 🔄 | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ |
| Members | Workspace + import + hub | * | `.../members*` | ✅ | 🔄 | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ |
| Accommodation | Workspace + wizards | * | `.../accommodation*` | ✅ | 🔄 | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ |
| Meals | Planner / library / share / poll / locs | * | `.../meals*` | ✅ | 🔄 | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ |
| Plans | Owner / Customer plans | * | `.../meals/plans*` | ✅ | 🔄 | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ |
| Payments | Workspace + day meals | * | `.../payments*` | ✅ | 🔄 | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ |
| Complaints | Workspace | * | `.../complaints*` | ✅ | 🔄 | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ |
| Inventory | Workspace | * | `.../inventory*` | ✅ | 🔄 | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ |
| Notifications | Inbox | SpaceNotifications | `.../notifications` | ✅ | 🔄 | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ |
| Profile | Profile | ProfileScreen | `/profile` | ✅ | 🔄 | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ |
| Global | Attention / Activity | * | `/global/*` | ✅ | 🔄 | 🔄 | ⏳ | ⏳ | ⏳ | ⏳ |

Update cells to ✅ as modules are polished.

---

# Dashboard Design System

**Source of truth:** `src/modules/dashboard/theme/dashboardUx.ts` + Dashboard page composition.

### Typography (light)

| Role | Size | Weight | Color |
|------|------|--------|-------|
| Greeting | 18–26px (context) | 700 | `#0F172A` |
| Space name | 18px | 600 | `#0F172A` |
| Space role | 13px | 500 | `#475569` |
| Section title | 18px | 700 | `#0F172A` |
| Card title | 15px | 600 | `#0F172A` |
| Metric value | 26px | 700 | keep semantic accents |
| Metric label | 13px | 500 | `#475569` |
| Body | 12px | 400 | `#475569` |
| Caption / secondary | 12px | 400 | `#64748B` |
| Badge | 10px | 600 | — |
| Button | 13px | 600 | — |
| Sidebar nav | 14px | 500 | — |
| Sidebar section | 12px | 600 uppercase | — |

### Colors

| Token | Light |
|-------|-------|
| pageBg | `#F7F9F8` |
| surface | `#FFFFFF` |
| elevated | `#F8FAFC` |
| border | `#E7EBF0` |
| textPrimary | `#0F172A` |
| textSecondary | `#475569` |
| textMuted | `#64748B` |
| Never use readable text lighter than muted | |

### Spacing / chrome (frozen for Dashboard; reuse elsewhere)

- pagePadding 18 · sectionGap 14 · cardGap 12 · cardPadding 16 · radius 10 · tileRadius 8  
- Shadows: soft card shadow from `DASH_LIGHT.shadow`

### Patterns to reuse

| Pattern | Dashboard source |
|---------|------------------|
| Section header | `DashboardSection` / `sectionHeading` |
| Metric board 2×2 | `MetricRow` + Payment/Property widgets |
| Metric strip 4-up | `FinancialSummaryWidget` `layout="row"` |
| Pending list + more | `PendingActionsPanel` |
| Quick actions | `QuickActionTile` / `DashboardQuickActions` |
| Overview card | `SpaceOverviewCard` |
| Meal today | `MealOperationsTodayCard` |
| Icon well | `IconBadge` |
| Scale-down canvas | `DashboardScaleShell` (optional for dense consoles) |

### Shared app chrome

- `AppHeader`, `AppSidebar`, `AppLayout`, `SpaceShellLayout`, `ContentLayout`
- `PageHeader`, `SectionHeader`, `EmptyState`, `LoadingState`, `ErrorState`, `ConfirmDialog`, `StatusChip`, `DataTable`, `SearchToolbar`, `FilterBar`

### Responsive

- Prefer **same structure + scale** for dense operator consoles (Dashboard approach) over reflow stacking when fidelity matters.
- Forms/lists may use responsive columns — still reuse type/color tokens.

### Dark mode

- Use `dashSurfaces(mode)` / MUI palette; verify each module after DS polish.

---

# Recommended implementation order

Optimized for **maximum component reuse**. Members → Accommodation → Meals → Payments establish tables, forms, drawers, and detail patterns; later modules reuse them.

Daily tracking: [`SCREEN_IMPLEMENTATION_CHECKLIST.md`](./SCREEN_IMPLEMENTATION_CHECKLIST.md)  
Per-screen RN + component binding: [`SCREEN_REFERENCE_MAP.md`](./SCREEN_REFERENCE_MAP.md)

| Phase | Focus | Status |
|------:|-------|--------|
| 1 | ✅ Dashboard (Done — design SoT) | ✅ |
| 2 | Shared Design System Extraction | ✅ |
| 3 | Authentication | ✅ Design |
| 4 | Onboarding | ✅ Design |
| 5 | My Spaces | ✅ Design |
| 6 | Space Details | ✅ Design |
| 7 | Members | ✅ Design |
| 8 | Accommodation | ✅ Design |
| 9 | Meals | ✅ Design |
| 10 | Meal Subscription Plans | ✅ Design |
| 11 | Payments | ✅ Design |
| 12 | Day Meals | ✅ Design |
| 13 | Complaints | ✅ Design |
| 14 | Inventory | ✅ Design |
| 15 | Notifications | ✅ Design |
| 16 | Pending Actions | ✅ Design |
| 17 | Profile | ✅ Design |
| 18 | Settings | ✅ Design (via Edit Space) |
| 19 | Global Attention / Activity | ✅ Design |
| 20 | Accessibility | ✅ |
| 21 | Responsive | ✅ |
| 22 | Production Polish | ✅ |

---

# Shared reusable components (priority extract)

Promote Dashboard-proven patterns into shared or documented module exports before inventing new ones:

| Component | Today | Promote for reuse |
|-----------|-------|-------------------|
| MetricRow | dashboard | Yes — all metric boards |
| DashboardSection | dashboard | Yes — section shells |
| QuickActionTile | dashboard | Yes — hub actions |
| PendingActionsPanel / item row | dashboard | Yes — alerts lists |
| IconBadge | dashboard | Yes |
| FinancialSummaryWidget | dashboard | Payments + dashboard |
| SpaceOverviewCard | dashboard | Optional compact headers |
| MealOperationsTodayCard | dashboard | Meals home |
| PageHeader / SectionHeader | shared | Yes |
| StatCard / WidgetCard / ContentCard | shared | Yes |
| DataTable / SearchToolbar / FilterBar | shared | Yes |
| EmptyState / LoadingState / ErrorState | shared | Yes |
| StatusChip / ConfirmDialog | shared | Yes |
| AppHeader / AppSidebar | layouts | Yes |

Full catalog: [`UI_COMPONENT_CATALOG.md`](./UI_COMPONENT_CATALOG.md).

---

# How to update this document

When a module is finished:

1. Set module **Status** to ✅ Completed  
2. Check off screen checklist items  
3. Update the per-screen matrix (DS / Responsive / Dark / A11y)  
4. Note any **new** shared components added to the catalog  
5. Record date + PR link in a short changelog entry below  

### Changelog

| Date | Change |
|------|--------|
| 2026-07-30 | Initial master guide from RN/Web inventory; Dashboard marked official DS reference |
| 2026-07-30 | Linked screen checklist + reference map; adoption of reuse-first Phases 1–22 |

---

# Return summary (analysis)

1. **Total modules documented:** 20  
2. **Total React Native screens (~):** 79 product surfaces  
3. **Total Web page files:** 41 (+ NotFound)  
4. **Module-wise list:** see Modules sections above  
5. **Missing screens:** primarily dedicated Accommodation CRUD routes, some Member/Subscription/Inventory subflows, optional Space Health page, subscription activation requests — see each module  
6. **Shared reusable components:** Dashboard widgets + `src/shared/components` + layouts — see catalog  
7. **Recommended order:** see Implementation order  
8. **This file:** `K:\AmicoWeb\docs\web\MASTER_SCREEN_IMPLEMENTATION_GUIDE.md`
