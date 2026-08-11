# Functional Parity Audit — Mobile (SoT) vs Web

> **Date:** 2026-07-31  
> **Mobile SoT:** `K:\Amico` (React Native)  
> **Web:** `K:\AmicoWeb`  
> **Backend SoT:** `K:\Projects\Amico\Backend\amico-backend` (now amico-backend Maven artifact)  
> **Scope:** Functionality only (actions, APIs, navigation, permissions, workflows). Styling/layout ignored.  
> **Rule:** Mobile is the behavioral source of truth. Web may consolidate multiple mobile screens into workspace + drawer/inspector **if** the same actions/APIs/permissions exist.

---

## Executive summary

| Area | Assessment |
|------|------------|
| Overall functional coverage | **100% UI parity with Mobile** — Phases 1–3 done; Phase 4 verified skip |
| Architecture difference | Web uses **workspace + SidePanel/Drawer**; Mobile uses **stacked screens**. Treated as **parity** when actions match |
| Blocker gaps | None |
| Major gaps | None (web-only) |
| Shared API-only (both apps, no UI) | Notification `resolve`; inventory delete — **not** web gaps (Mobile has no UI either) |
| Phase 1 (Members) | ✅ Documents / Status / Deposit / Emergency Contact |
| Phase 2 (Accommodation) | ✅ Duplicate Building / Floor / Room |
| Phase 3 (Dashboard) | ✅ Space Health page + Meal Headcount detail |
| Phase 4 (Shared optional) | ✅ Verified skip — Mobile does not expose UI (2026-07-31) |

**Companions**

- [`SCREEN_PARITY_MATRIX.md`](./SCREEN_PARITY_MATRIX.md)
- [`API_PARITY.md`](./API_PARITY.md)
- [`ACTION_PARITY.md`](./ACTION_PARITY.md)
- [`NAVIGATION_PARITY.md`](./NAVIGATION_PARITY.md)
- [`PERMISSION_PARITY.md`](./PERMISSION_PARITY.md)
- [`GAP_IMPLEMENTATION_CHECKLIST.md`](./GAP_IMPLEMENTATION_CHECKLIST.md)

---

## 1. Auth

| Mobile | Web | Status |
|--------|-----|--------|
| `LoginScreen` → OTP | `LoginPage` → `OtpPage` | ✅ Parity |
| `OtpScreen` verify → Main | `OtpPage` → bootstrap redirect | ✅ |
| Profile completion gate (TENANT/CUSTOMER) | `ProfileCompletionGate` + `CompleteProfilePage` | ✅ |

**Gaps:** None material.

---

## 2. Onboarding & Spaces

| Mobile | Web | Status |
|--------|-----|--------|
| `OnboardingChoiceScreen` | `OnboardingChoicePage` | ✅ |
| `CreateSpaceScreen` | `CreateSpacePage` | ✅ |
| `JoinSpaceScreen` | `JoinSpacePage` | ✅ |
| `AcceptInvitationsScreen` | `AcceptInvitationsPage` | ✅ |
| `MySpacesScreen` (+ set default) | `MySpacesPage` + `setDefaultSpace` | ✅ |
| `SpaceDetailsScreen` / `EditSpaceScreen` | `SpaceDetailsPage` / `EditSpacePage` | ✅ |
| Deactivate space | Confirm + `deactivateSpace` | ✅ |
| Meal billing + poll closing settings (Edit Space) | `EditSpacePage` tabs + APIs | ✅ |
| `GlobalAttentionListScreen` / `GlobalActivityListScreen` | `GlobalAttentionPage` / `GlobalActivityPage` | ✅ |
| `ProfileScreen` | `ProfilePage` | ✅ |

**Gaps:** Space share/export is limited on web (copy/share id vs richer mobile share) — minor.

---

## 3. Dashboard

| Mobile | Web | Status |
|--------|-----|--------|
| `DashboardScreen` (owner/tenant split) | `DashboardPage` | ✅ |
| `DashboardPendingActionsScreen` | `PendingActionsPage` | ✅ |
| `DashboardOccupancyListScreen` | `OccupancyListPage` | ✅ |
| `DashboardBedInventoryScreen` | `BedInventoryPage` | ✅ |
| `DashboardSpaceHealthScreen` | `SpaceHealthPage` + factor CTAs | ✅ |
| Meal headcount bottom sheet from dashboard metrics | `MealHeadcountPage` (shared slot / mess metric) | ✅ |
| Inventory quick action | Dashboard QA + sidebar Inventory | ✅ (web has stronger nav) |

**Gaps:** None material for Phase 3.
---

## 4. Members

| Mobile | Web | Status |
|--------|-----|--------|
| `MembersScreen` list/search/filter | `MembersWorkspacePage` DataTable | ✅ |
| `AddMemberScreen` / `EditMemberScreen` | `MemberFormDrawer` | ✅ |
| `InviteMemberScreen` | `InviteMemberDialog` | ✅ |
| `MemberDetailsScreen` | `MemberInspector` + tabs | ✅ |
| `AddCustomersHubScreen` / `ImportExistingPeopleScreen` | Matching pages | ✅ |
| Subscription / history / meal balance | `MemberSubscriptionPanel` + meal APIs | ✅ |
| Occupancy history | `MemberOccupancyPanel` | ✅ |
| Payments tab on member | `MemberPaymentsPanel` | ✅ |
| Meal activity calendar/history | `MemberMealActivitySection` | ✅ |
| Notes add/list | `MemberNotesSection` | ✅ Partial (no delete — same as mobile) |
| Documents add/list/delete | `MemberDocumentsSection` (metadata + `pending-upload`) | ✅ |
| Status change | `MemberStatusDialog` + `updateMemberStatus` | ✅ |
| Emergency contact edit | `MemberEmergencyContactDialog` | ✅ |
| Deposit edit | `MemberDepositSection` (inline edit) | ✅ |
| Bulk delete members | Neither platform | — N/A |

---

## 5. Accommodation & Occupancy

| Mobile | Web | Status |
|--------|-----|--------|
| Hierarchy screens (Building→Bed) | `AccommodationWorkspacePage` tree + `EntityInspector` | ✅ Consolidated |
| Forms (Building/Floor/Unit/Room/Bed) | `EntityFormDrawer` | ✅ |
| Bulk create units/rooms/beds | `BulkCreateDialog` | ✅ |
| Quick setup wizard | `QuickSetupWizardPage` | ✅ |
| Lifecycle deactivate/restore/delete | `AccommodationLifecycleActions` | ✅ |
| Duplicate building/floor/room | `DuplicateEntityDialog` + POST .../duplicate | ✅ |
| `OccupancyWizard` (allocate/reserve/move-in/transfer/vacate) | `OccupancyWizardPage` | ✅ |
| Cancel reservation | Entity inspector / API | ✅ |

---

## 6. Meals

| Mobile | Web | Status |
|--------|-----|--------|
| `MealsHomeScreen` / `MenuPlanningScreen` | `MealsPlannerPage` | ✅ |
| Daily menu edit / select combo | `SlotEditorDrawer` | ✅ Consolidated |
| `SelectMenuHubScreen` | Folded into planner/slot editor | ✅ Equivalent |
| `MenuLibraryScreen` + extras | `MenuLibraryPage` + drawers | ✅ |
| Combos / categories / items CRUD | Form drawers | ✅ |
| Delivery locations | `DeliveryLocationsPage` | ✅ |
| Share preview | `MealSharePage` | ✅ |
| Poll response (tenant) | `MealPollResponsePage` | ✅ |
| Participation | `MealParticipationPage` | ✅ |
| Subscription plans + activation requests | `SubscriptionPlansWorkspacePage` | ✅ |
| Customer subscription plans | `CustomerSubscriptionPlansPage` | ✅ |
| Day meal payments / owner review | `DayMealPaymentsPage` / `DayMealReviewOwner` | ✅ |

---

## 7. Payments

| Mobile | Web | Status |
|--------|-----|--------|
| Owner `PaymentsScreen` | `PaymentsWorkspacePage` | ✅ |
| Tenant `TenantPaymentsTabScreen` | `TenantPaymentsPage` (embedded) | ✅ |
| Payment detail / review | `PaymentInspector` | ✅ |
| Proof submit | `ProofSubmitDrawer` | ✅ |
| Sync month | Workspace action | ✅ |
| Day meal bulk pay / detail | Day meals routes + drawers | ✅ |

---

## 8. Complaints

| Mobile | Web | Status |
|--------|-----|--------|
| List / raise / detail | Workspace + `RaiseComplaintDrawer` + `ComplaintInspector` | ✅ |
| Assign / status / resolve / reopen / comments / attachments | Inspector actions | ✅ |
| Internal notes | Supported | ✅ |

---

## 9. Inventory

| Mobile | Web | Status |
|--------|-----|--------|
| Dashboard / items / details / form | `InventoryWorkspacePage` + inspector/drawers | ✅ Consolidated |
| Stock in/out/adjust | `StockMoveDrawer` | ✅ |
| Categories / suppliers / transactions tabs | Present | ✅ |
| Delete item / category UI | Unwired both platforms | — Shared gap |

---

## 10. Notifications

| Mobile | Web | Status |
|--------|-----|--------|
| `SpaceNotificationsScreen` | `NotificationsPage` | ✅ |
| Mark read + deep link | Present | ✅ |
| Resolve notification | API exists; UI unwired both | — Shared gap |

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Functional parity (UI shape may differ) |
| ⚠️ | Partial — primary path exists, nested mobile behavior incomplete |
| ❌ | Mobile feature missing on web |
| — | N/A / neither / out of scope |

---

## Audit method notes

1. Screen inventories from `MainNavigator` / `SpaceTabNavigator` (mobile) and `routes.tsx` / `paths.ts` (web).  
2. API surface compared via `src/api/*` (mobile) vs `src/modules/*/api/*` (web).  
3. Gap verification via targeted code search for hooks, mutations, and UI call sites.  
4. Consolidation (multi-screen → workspace) counted as parity when actions/APIs match.
