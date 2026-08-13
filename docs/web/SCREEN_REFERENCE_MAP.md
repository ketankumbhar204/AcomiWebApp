# Acomi Web — Screen Reference Map

> **Every screen has exactly one RN business reference and a predefined set of reusable Web / Dashboard components.**  
> Before implementing, read this row — do not invent a new pattern.  
> Companions: [`SCREEN_IMPLEMENTATION_CHECKLIST.md`](./SCREEN_IMPLEMENTATION_CHECKLIST.md) · [`UI_COMPONENT_CATALOG.md`](./UI_COMPONENT_CATALOG.md) · [`MASTER_SCREEN_IMPLEMENTATION_GUIDE.md`](./MASTER_SCREEN_IMPLEMENTATION_GUIDE.md)

---

## Rules

1. **Visual SoT:** Web Dashboard (`DashboardPage` + `dashboardUx.ts`).  
2. **Business SoT:** React Native screen in the **RN Reference** column.  
3. **Reuse SoT:** Components in **Dashboard / Web Components** — prefer catalog entries.  
4. **Previous Screen:** UX entry path — reuse its chrome before adding new chrome.  
5. If Web consolidates multiple RN screens into one workspace, keep **one row per user-facing surface** (list, detail, form, wizard step group).

---

## Legend

| Column | Meaning |
|--------|---------|
| Web Screen | Product surface name (may map to a workspace route + mode) |
| Web Route / Page | Path builder or page file |
| RN Reference | Exact RN screen to mirror for behavior |
| Dashboard / Web Components | Preferred building blocks |
| Previous Screen | Natural prior surface in the flow |

---

## Phase 1 — Dashboard

| Web Screen | Web Route / Page | RN Reference | Dashboard / Web Components | Previous Screen |
|------------|------------------|--------------|----------------------------|-----------------|
| Dashboard | `DashboardPage` · `/spaces/:spaceId` | `DashboardScreen` | `SpaceOverviewCard`, `MealOperationsTodayCard`, `PendingActionsPanel`, `FinancialSummaryWidget`, `AccommodationOpsWidget` / `MessOperationsWidget`, `MetricRow`, `DashboardSection`, `QuickActionTile`, `DashboardQuickActions`, `DashboardScaleShell`, `IconBadge` | Space shell / My Spaces |
| Pending Actions | `PendingActionsPage` · `.../pending-actions` | `DashboardPendingActionsScreen` | `PageHeader`, `PendingActionsPanel` (full), `StatusChip` / badge token, `SearchToolbar`, `EmptyState`, `LoadingState` | Dashboard |
| Occupancy List | `OccupancyListPage` · `.../occupancy` | `DashboardOccupancyListScreen` | `PageHeader`, `DataTable` / list cards, `FilterBar`, `StatusChip`, `EmptyState` | Dashboard → Property Ops |
| Bed Inventory | `BedInventoryPage` · `.../bed-inventory` | `DashboardBedInventoryScreen` | `PageHeader`, `DataTable`, `FilterBar`, `StatusChip`, `EmptyState` | Dashboard → Property Ops |
| No Spaces | `NoSpacesPage` · `/no-spaces` | *(empty shell)* | `EmptyState`, `PageHeader`, primary `Button` | Auth / bootstrap |

---

## Phase 3 — Authentication

| Web Screen | Web Route / Page | RN Reference | Dashboard / Web Components | Previous Screen |
|------------|------------------|--------------|----------------------------|-----------------|
| Login | `LoginPage` · `/login` | `LoginScreen` | `AuthLayout`, `FormSection`, primary/secondary `Button`, text fields | — |
| OTP | `OtpPage` · `/otp` | `OtpScreen` | `AuthLayout`, OTP input, `Button`, `LoadingState` | Login |
| Unauthorized | `UnauthorizedPage` · `/unauthorized` | — | `EmptyState` / `ErrorState`, `Button` | Any gated route |
| Forbidden | `ForbiddenPage` · `/forbidden` | — | `EmptyState` / `ErrorState`, `Button` | Any gated route |

---

## Phase 4 — Onboarding & Invitations

| Web Screen | Web Route / Page | RN Reference | Dashboard / Web Components | Previous Screen |
|------------|------------------|--------------|----------------------------|-----------------|
| Onboarding Choice | `OnboardingChoicePage` · `/onboarding` | `OnboardingChoiceScreen` | `AuthHero`, `OnboardingChoiceCard`, `IconBadge`, Dashboard tokens | Auth |
| Join Space | `JoinSpacePage` · `/join-space` | `JoinSpaceScreen` | `PageHeader`, `ContentCard`, `EmptyState`, `StickyFooter`, Dashboard tokens | Onboarding Choice |
| Accept Invitations | `AcceptInvitationsPage` · `/accept-invitations` | `AcceptInvitationsScreen` | `ContentCard`, `StatusChip`, `IconBadge`, `EmptyState`, Dashboard tokens | Onboarding / My Spaces |
| Complete Profile | `CompleteProfilePage` · `/complete-profile` | `CompleteProfileScreen` | `PageHeader`, `ContentCard`, `FormSection`, `StickyFooter`, Dashboard tokens | Auth gate |

---

## Phase 5 — My Spaces

| Web Screen | Web Route / Page | RN Reference | Dashboard / Web Components | Previous Screen |
|------------|------------------|--------------|----------------------------|-----------------|
| My Spaces | `MySpacesPage` · `/my-spaces` | `MySpacesScreen` | `PageHeader`, space list cards, `EmptyState`, `Button`, `SearchToolbar` | Profile / header |

---

## Phase 6 — Space Details & Management

| Web Screen | Web Route / Page | RN Reference | Dashboard / Web Components | Previous Screen |
|------------|------------------|--------------|----------------------------|-----------------|
| Create Space | `CreateSpacePage` · `/create-space` | `CreateSpaceScreen` | `FormSection`, `PageHeader`, `Button` | Onboarding Choice |
| Space Details | `SpaceDetailsPage` · `.../details` | `SpaceDetailsScreen` | `PageHeader`, `SectionHeader`, `ContentCard`, `InfoRow`, activity list | Dashboard / sidebar |
| Edit Space | `EditSpacePage` · `.../edit` | `EditSpaceScreen` | `FormSection`, `Button`, `ConfirmDialog` | Space Details |

---

## Phase 7 — Members

| Web Screen | Web Route / Page | RN Reference | Dashboard / Web Components | Previous Screen |
|------------|------------------|--------------|----------------------------|-----------------|
| Members List | `MembersWorkspacePage` · `.../members` | `MembersScreen` | `PageHeader`, `SearchToolbar`, `FilterBar`, `DataTable` / list cards, `StatusChip`, `EmptyState`, `QuickActionTile` (optional) | Dashboard |
| Member Details | same page · `.../members/:memberId` | `MemberDetailsScreen` | `SectionHeader`, `ContentCard`, `InfoRow`, `StatusChip`, tab bar pattern | Members List |
| Add Member | workspace / modal / route | `AddMemberScreen` | `FormSection`, `Button`, `SidePanel` / drawer | Members List |
| Edit Member | workspace / modal / route | `EditMemberScreen` | `FormSection`, `Button`, `ConfirmDialog` | Member Details |
| Import Existing People | `ImportExistingPeoplePage` · `.../import` | `ImportExistingPeopleScreen` | `PageHeader`, `DataTable`, `SearchToolbar`, `Button`, `EmptyState` | Members List / Add Hub |
| Invite Member | workspace / modal / route | `InviteMemberScreen` | `FormSection`, `Button` | Members List |
| Add Customers Hub | `AddCustomersHubPage` · `.../add-hub` | `AddCustomersHubScreen` | `PageHeader`, `QuickActionTile` / action cards | Dashboard QA / Members |
| Member Subscription | workspace / route | `MemberSubscriptionScreen` | `FormSection`, `ContentCard`, `Button`, `StatusChip` | Member Details |
| Member Subscription History | workspace / route | `MemberSubscriptionHistoryScreen` | `PageHeader`, timeline / `DataTable`, `EmptyState` | Member Details |
| Member Occupancy History | workspace / route | `MemberOccupancyHistoryScreen` | `PageHeader`, timeline / `DataTable`, `EmptyState` | Member Details |

---

## Phase 8 — Accommodation

| Web Screen | Web Route / Page | RN Reference | Dashboard / Web Components | Previous Screen |
|------------|------------------|--------------|----------------------------|-----------------|
| Accommodation Workspace | `AccommodationWorkspacePage` | `AccommodationHomeScreen` | `PageHeader`, hierarchy cards, `MetricRow` (optional), `EmptyState`, `QuickActionTile` | Dashboard → Property Ops / QA |
| Quick Setup Wizard | `QuickSetupWizardPage` | `QuickSetupWizardScreen` | Wizard chrome, `FormSection`, `Button`, `StickyFooter` | Accommodation Workspace |
| Accommodation Builder | *(verify route / embed)* | `AccommodationBuilderScreen` | Hierarchy builder UI, `ContentCard`, `Button` | Accommodation Workspace |
| Building Form | workspace / route | `BuildingFormScreen` | `FormSection`, `Button` | Building Detail / list |
| Building Detail | workspace / route | `BuildingDetailScreen` | `SectionHeader`, `ContentCard`, `InfoRow` | Accommodation Workspace |
| Floors List | workspace / route | `FloorsScreen` | List + `SearchToolbar`, `EmptyState` | Building Detail |
| Floor Form / Detail | workspace / route | `FloorFormScreen` / `FloorDetailScreen` | `FormSection` / `ContentCard` | Floors List |
| Units List / Form / Detail | workspace / route | `UnitsScreen` / `UnitFormScreen` / `UnitDetailScreen` | Same list/form/detail pattern | Floor Detail |
| Rooms List / Form / Detail | workspace / route | `AccommodationRoomsScreen` / `RoomFormScreen` / `RoomDetailScreen` | Same pattern | Unit / Floor |
| Beds List / Form / Detail | workspace / route | `AccommodationBedsScreen` / `BedFormScreen` / `BedDetailScreen` | Same pattern + `StatusChip` | Room Detail |
| Floor Apartments | workspace / route | `AccommodationFloorApartmentsScreen` | List cards, `EmptyState` | Floor Detail |
| Occupancy Wizard | `OccupancyWizardPage` | `OccupancyWizardScreen` | Step header, `FormSection`, `Button`, `StickyFooter`, confirm step | Bed Detail / Dashboard |

**Establishes:** hierarchy navigation, multi-step wizard, entity form/detail pattern.

---

## Phase 9 — Meals

| Web Screen | Web Route / Page | RN Reference | Dashboard / Web Components | Previous Screen |
|------------|------------------|--------------|----------------------------|-----------------|
| Meals Planner | `MealsPlannerPage` · `.../meals` | `MealsHomeScreen` / `MenuPlanningScreen` / `DailyMenuTodayScreen` | **`MealOperationsTodayCard` patterns**, `PageHeader`, date controls, meal slot cards, `Button` / link style | Dashboard Meal Ops |
| Menu Library | `MenuLibraryPage` | `MenuLibraryScreen` | `PageHeader`, `SearchToolbar`, `DataTable` / cards, `FilterBar` | Meals Planner |
| Meal Combo Form | library / route | `MealComboFormScreen` | `FormSection`, `Button` | Menu Library |
| Daily Menu Edit | planner / route | `DailyMenuEditScreen` | `FormSection`, meal slot cards, `Button` | Meals Planner |
| Select Combo / Hub | planner / route | `DailyMenuSelectComboScreen` / `SelectMenuHubScreen` | Selection lists, `Button` | Daily Menu Edit |
| Menu Share | `MealSharePage` | `MenuSharePreviewScreen` | `ContentCard`, `Button`, preview layout | Meals Planner |
| Meal Poll Response | `MealPollResponsePage` | `MealPollResponseScreen` | `FormSection`, `Button`, `StatusChip` | Meals / Notifications |
| Delivery Locations | `DeliveryLocationsPage` | `MealDeliveryLocationsScreen` | `PageHeader`, `DataTable`, `FormSection` | Meals Planner |
| Meal Participation | `MealParticipationPage` | *(participation surfaces)* | `PageHeader`, `DataTable`, `FilterBar` | Meals Planner |

**Establishes:** date-centric ops cards, slot cards, share/preview.

---

## Phase 10 — Meal Subscription Plans

| Web Screen | Web Route / Page | RN Reference | Dashboard / Web Components | Previous Screen |
|------------|------------------|--------------|----------------------------|-----------------|
| Subscription Plans | `SubscriptionPlansWorkspacePage` | `SubscriptionPlansScreen` | `PageHeader`, plan cards (`ContentCard`), `StatusChip`, `Button` | Meals / sidebar |
| Customer Subscription Plans | `CustomerSubscriptionPlansPage` | `CustomerSubscriptionPlansScreen` | Plan cards, `Button`, `EmptyState` | Meals (customer) |
| Activation Requests | *(add if missing)* | `SubscriptionActivationRequestsScreen` | `DataTable`, `StatusChip`, `Button`, `ConfirmDialog` | Subscription Plans |

---

## Phase 11 — Payments

| Web Screen | Web Route / Page | RN Reference | Dashboard / Web Components | Previous Screen |
|------------|------------------|--------------|----------------------------|-----------------|
| Payments Workspace | `PaymentsWorkspacePage` | `PaymentsScreen` | **`FinancialSummaryWidget` / `MetricRow`**, `PageHeader`, `DataTable`, `FilterBar`, `StatusChip`, `SearchToolbar` | Dashboard Payment Summary |
| Tenant Payments | `TenantPaymentsPage` (inside workspace) | `TenantPaymentsTabScreen` | Same table/filter patterns | Payments tab |
| Member Payments | workspace / route | `MemberPaymentsScreen` | `PageHeader`, `DataTable`, `Button` | Payments / Member Details |
| Payment Detail | `.../payments/:paymentId` | `PaymentDetailScreen` | `SectionHeader`, `ContentCard`, `InfoRow`, `StatusChip`, `Button` | Payments Workspace |
| Payment History | tab / route | `PaymentHistoryScreen` | Timeline / `DataTable`, `EmptyState` | Payment Detail |
| Payment Review | tab / route | `PaymentReviewScreen` | `DataTable`, `StatusChip`, `ConfirmDialog` | Payments Workspace |

**Establishes:** money metrics, payment tables, review queues.

---

## Phase 12 — Day Meals

| Web Screen | Web Route / Page | RN Reference | Dashboard / Web Components | Previous Screen |
|------------|------------------|--------------|----------------------------|-----------------|
| Day Meal Payments | `DayMealPaymentsPage` · `.../payments/day-meals` | Day-meal owner flows | `PageHeader`, `DataTable`, `FilterBar`, date controls | Payments / Meals |
| Day Meal Payment Detail | route / drawer | `DayMealPaymentDetailScreen` | `ContentCard`, `InfoRow`, `Button` | Day Meal Payments |
| Day Meal Bulk Pay | route / modal | `DayMealBulkPayScreen` | `DataTable` selection, `StickyFooter`, `Button`, `ConfirmDialog` | Day Meal Payments |

---

## Phase 13 — Complaints

| Web Screen | Web Route / Page | RN Reference | Dashboard / Web Components | Previous Screen |
|------------|------------------|--------------|----------------------------|-----------------|
| Complaints List | `ComplaintsWorkspacePage` | `ComplaintsListScreen` | `PageHeader`, `SearchToolbar`, `FilterBar`, list/`DataTable`, **`StatusChip`** (from Pending patterns), `EmptyState` | Dashboard / sidebar |
| Raise Complaint | workspace / route | `RaiseComplaintScreen` | `FormSection`, `Button` | Complaints List |
| Complaint Detail | `.../complaints/:id` | `ComplaintDetailScreen` | `SectionHeader`, `ContentCard`, timeline, `StatusChip` | Complaints List |

**Reuses:** Members/Payments list+detail; Pending badge density.

---

## Phase 14 — Inventory

| Web Screen | Web Route / Page | RN Reference | Dashboard / Web Components | Previous Screen |
|------------|------------------|--------------|----------------------------|-----------------|
| Inventory Dashboard / Workspace | `InventoryWorkspacePage` | `InventoryDashboardScreen` | `PageHeader`, **`MetricRow` / StatCards**, `QuickActionTile`, `EmptyState` | Dashboard QA |
| Inventory Items | workspace list | `InventoryItemsScreen` | `SearchToolbar`, `FilterBar`, `DataTable` | Inventory Dashboard |
| Item Details | `.../items/:itemId` | `InventoryItemDetailsScreen` | `SectionHeader`, `ContentCard`, stock actions `Button` | Inventory Items |
| Item Form | workspace / route | `InventoryItemFormScreen` | `FormSection`, `Button` | Inventory Items |
| Categories / Suppliers / Transactions | *(if scoped)* | RN inventory extras | `DataTable`, `FormSection`, `PageHeader` | Inventory Dashboard |

**Reuses:** Payments metrics + Members tables + Accommodation forms.

---

## Phase 15 — Notifications

| Web Screen | Web Route / Page | RN Reference | Dashboard / Web Components | Previous Screen |
|------------|------------------|--------------|----------------------------|-----------------|
| Space Notifications | `NotificationsPage` | `SpaceNotificationsScreen` | `PageHeader`, list rows (**PendingActionsPanel** density), `StatusChip` / badge, `EmptyState`, `SearchToolbar` | Header bell / Dashboard |

---

## Phase 16 — Pending Actions

| Web Screen | Web Route / Page | RN Reference | Dashboard / Web Components | Previous Screen |
|------------|------------------|--------------|----------------------------|-----------------|
| Pending Actions Page | `PendingActionsPage` | `DashboardPendingActionsScreen` | Full **`PendingActionsPanel`** patterns, `PageHeader`, `FilterBar`, `SearchToolbar` | Dashboard |

*(Same surface as Phase 1 drill — one implementation.)*

---

## Phase 17 — Profile

| Web Screen | Web Route / Page | RN Reference | Dashboard / Web Components | Previous Screen |
|------------|------------------|--------------|----------------------------|-----------------|
| Profile | `ProfilePage` · `/profile` | `ProfileScreen` | `PageHeader`, `ContentCard`, `FormSection`, `Button`, `InfoRow` | Header Profile |

---

## Phase 18 — Settings

| Web Screen | Web Route / Page | RN Reference | Dashboard / Web Components | Previous Screen |
|------------|------------------|--------------|----------------------------|-----------------|
| Language / meal billing / poll defaults | Profile / Space settings embeds | RN `components/settings/*` | `FormSection`, `SectionHeader`, `Button` | Profile / Edit Space |

---

## Phase 19 — Global Attention / Activity

| Web Screen | Web Route / Page | RN Reference | Dashboard / Web Components | Previous Screen |
|------------|------------------|--------------|----------------------------|-----------------|
| Global Attention | `GlobalAttentionPage` · `/global/attention` | `GlobalAttentionListScreen` | `PageHeader`, list cards, `StatusChip`, `EmptyState` | My Spaces / header |
| Global Activity | `GlobalActivityPage` · `/global/activity` | `GlobalActivityListScreen` | `PageHeader`, timeline / list, `EmptyState` | My Spaces / header |

---

## Component decision cheat-sheet

| Need | Use |
|------|-----|
| Page title + actions | `PageHeader` / `ActionToolbar` |
| Section title | `SectionHeader` or `DashboardSection` (18/700) |
| KPI 2×2 or strip | `MetricRow` / `FinancialSummaryWidget` |
| Alert list | `PendingActionsPanel` item pattern |
| Hub shortcuts | `QuickActionTile` |
| Icon in tinted well | `IconBadge` |
| Tables | `DataTable` + `TableToolbar` / `SearchToolbar` / `FilterBar` |
| Forms | `FormSection` + Dashboard button tokens |
| Empty / loading / error | `EmptyState` / `LoadingState` / `ErrorState` |
| Status | `StatusChip` + badge token (10/600) |
| Confirm | `ConfirmDialog` |
| Drawer / inspector | `SidePanel` / `AppDrawer` |
| Tokens | `DASHBOARD_UX` + `dashSurfaces` |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-30 | Initial screen reference map (RN ↔ Web ↔ Dashboard components) |
