# Acomi Web — UI Component Catalog

> Catalog of reusable UI building blocks.  
> **Primary visual reference:** Dashboard (`DashboardPage` + `dashboardUx.ts`).  
> Prefer these components before creating new ones.  
> Companions: [`MASTER_SCREEN_IMPLEMENTATION_GUIDE.md`](./MASTER_SCREEN_IMPLEMENTATION_GUIDE.md) · [`SCREEN_IMPLEMENTATION_CHECKLIST.md`](./SCREEN_IMPLEMENTATION_CHECKLIST.md) · [`SCREEN_REFERENCE_MAP.md`](./SCREEN_REFERENCE_MAP.md) · [`DASHBOARD_UI_AUDIT.md`](./DASHBOARD_UI_AUDIT.md)

---

## How to use this catalog

1. Find a matching **pattern** for your screen.  
2. Reuse the listed component (or extract it if still module-local).  
3. Apply **Dashboard tokens** (`DASHBOARD_UX` / `dashSurfaces`) for type, color, radius, density.  
4. Only create a new component if nothing here fits.

**Status legend**

| Tag | Meaning |
|-----|---------|
| ✅ Ready | Shared or stable; reuse freely |
| 📦 Dashboard-local | Proven on Dashboard; extract/promote when second consumer appears |
| 🔄 Needs DS alignment | Exists; restyle to Dashboard tokens |
| ⏳ Planned | Named pattern; not yet a dedicated export |

---

## App chrome

| Component | Path | Status | Used for |
|-----------|------|--------|----------|
| AppLayout | `src/layouts/AppLayout.tsx` | ✅ | Authenticated shell |
| AppHeader | `src/layouts/AppHeader.tsx` | ✅ / 🔄 | Top bar |
| AppSidebar | `src/layouts/AppSidebar.tsx` | ✅ / 🔄 | Left nav (14px labels, 12px section) |
| ContentLayout | `src/layouts/ContentLayout.tsx` | ✅ | Content width/padding |
| AuthLayout | `src/layouts/AuthLayout.tsx` | ✅ | Login/OTP shell |
| BlankLayout | `src/layouts/BlankLayout.tsx` | ✅ | Minimal shell |
| SpaceShellLayout | `src/modules/dashboard/layouts/SpaceShellLayout.tsx` | ✅ | Space nav + header actions + Outlet |
| SpaceBootstrapOutlet | `src/modules/dashboard/layouts/SpaceBootstrapOutlet.tsx` | ✅ | Bootstrap gate |
| SpaceContextSelector | `src/modules/dashboard/components/SpaceContextSelector.tsx` | 📦 | Space switcher in header |
| NotificationBellButton | `src/modules/notifications/...` | ✅ | Header notifications |

**Reference:** Dashboard header buttons (My Spaces / Profile / Log out) — 13px / 600.

---

## Page structure

| Component | Path | Status | Dashboard mapping |
|-----------|------|--------|-------------------|
| PageContainer | `src/shared/components/PageContainer.tsx` | ✅ | Page shell |
| PageHeader | `src/shared/components/PageHeader.tsx` | ✅ | Dashboard pageTitle / body |
| OnboardingChoiceCard | `src/modules/onboarding/components/OnboardingChoiceCard.tsx` | 📦 | Create/join choice — IconBadge + benefits |
| PageSection | `src/shared/components/PageSection.tsx` | ✅ | Section block |
| SectionHeader | `src/shared/components/SectionHeader.tsx` | ✅ | = Dashboard `sectionHeading` 18/700 |
| Breadcrumbs | `src/shared/components/Breadcrumbs.tsx` | ✅ | Hierarchy |
| WidgetCard | `src/shared/components/WidgetCard.tsx` | ✅ | Card shell (dash surfaces) |
| ContentCard | `src/shared/components/ContentCard.tsx` | ✅ | Dashboard radius / border / shadow |
| FormSection | `src/shared/components/FormSection.tsx` | ✅ | Dashboard sectionHeading + field grid |
| FormCard | — | ⏳ | Use ContentCard + FormSection |
| StickyFooter | `src/shared/components/StickyFooter.tsx` | ✅ | Dashboard sticky actions |
| SearchToolbar | `src/shared/components/SearchToolbar.tsx` | ✅ | Dense search field |
| FilterBar | `src/shared/components/FilterBar.tsx` | ✅ | Filter panel surfaces |
| TableToolbar | `src/shared/components/TableToolbar.tsx` | ✅ | Table chrome |
| DataTable | `src/shared/components/DataTable.tsx` | ✅ | ContentCard + mobile cards |
| StatCard | `src/shared/components/StatCard.tsx` | ✅ | Metric cell |
| InfoRow | `src/shared/components/InfoRow.tsx` | ✅ | Label/value rows |
| StatusChip | `src/shared/components/StatusChip.tsx` | ✅ | Badge density |
| ConfirmDialog | `src/shared/components/ConfirmDialog.tsx` | ✅ | Dialog + dash buttons |
| SidePanel | `src/shared/components/SidePanel.tsx` | ✅ | Inspector panel |
| LoadingState / ErrorState / EmptyState | `src/shared/components/*` | ✅ | Feedback states |
| DashboardSection | `src/modules/dashboard/components/DashboardSection.tsx` | 📦 | Title + optional subtitle inside/out of surface |
| DashboardScaleShell | `src/modules/dashboard/components/DashboardScaleShell.tsx` | 📦 | Freeze canvas + scale-down |

---

## Cards & metrics

| Component | Path | Status | Dashboard mapping |
|-----------|------|--------|-------------------|
| StatCard | `src/shared/components/StatCard.tsx` | ✅ | Metric cell |
| MetricRow | `src/modules/dashboard/components/MetricRow.tsx` | 📦 | **Payment / Property 2×2** |
| MetricCard | — | ⏳ | Alias concept → MetricRow cell or StatCard |
| FinancialSummaryWidget | `.../FinancialSummaryWidget.tsx` | 📦 | Payment Summary board **or** 4-card row |
| AccommodationOpsWidget | `.../AccommodationOpsWidget.tsx` | 📦 | Property Operations 2×2 |
| MessOperationsWidget | `.../MessOperationsWidget.tsx` | 📦 | Mess Operations 2×2 |
| SpaceOverviewCard | `.../SpaceOverviewCard.tsx` | 📦 | Greeting + health + refresh |
| SpaceHealthCard | `.../SpaceHealthCard.tsx` | 📦 | Legacy health-only (prefer Overview) |
| HealthScoreRing | `.../HealthScoreRing.tsx` | 📦 | Circular % |
| MealOperationsTodayCard | `.../MealOperationsTodayCard.tsx` | 📦 | Meals Today + B/L/D |
| MealOperationsDayWidget | `.../MealOperationsDayWidget.tsx` | 📦 | Full-width meal day (if needed) |
| TodaysOverviewCard | `.../TodaysOverviewCard.tsx` | 📦 | Older overview; prefer MealOperationsTodayCard |
| SummaryCard | — | ⏳ | Use DashboardSection + MetricRow |
| DashboardCard | — | ⏳ | Use ContentCard / DashboardSection |
| InfoRow | `src/shared/components/InfoRow.tsx` | ✅ | Label/value rows |
| ActionCard | `src/shared/components/ActionCard.tsx` | ✅ / 🔄 | Action entry |

**Typography:** metric value 26/700 · label 13/500 `#475569`.

---

## Status, alerts & pending

| Component | Path | Status | Dashboard mapping |
|-----------|------|--------|-------------------|
| PendingActionsPanel | `.../PendingActionsPanel.tsx` | 📦 | Pending list (1 preview + more) |
| PendingActionsHeroCard | `.../PendingActionsHeroCard.tsx` | 📦 | Deprecated for top row; keep if needed |
| StatusCard | — | ⏳ | Pending item row pattern |
| PendingActionCard | — | ⏳ | Extract from PendingActionsPanel item |
| StatusChip | `src/shared/components/StatusChip.tsx` | ✅ / 🔄 | Status pills |
| Badge | — (MUI + Dashboard badge token) | 🔄 | HIGH/MEDIUM 10/600 |
| IconBadge | `.../IconBadge.tsx` | 📦 | Tinted icon well |

---

## Quick actions & toolbars

| Component | Path | Status | Dashboard mapping |
|-----------|------|--------|-------------------|
| QuickActionTile | `.../QuickActionTile.tsx` | 📦 | **Quick Actions** tiles |
| DashboardQuickActions | `.../DashboardQuickActions.tsx` | 📦 | QA strip container |
| ActionToolbar | `src/shared/components/ActionToolbar.tsx` | ✅ | Page actions |
| SearchToolbar | `src/shared/components/SearchToolbar.tsx` | ✅ | List search |
| FilterBar | `src/shared/components/FilterBar.tsx` | ✅ | Filters |
| TableToolbar | `src/shared/components/TableToolbar.tsx` | ✅ | Table tools |
| ListSearchBar / ListSearchFilterBar | *(RN patterns — port if needed)* | ⏳ | Match density |

**QA type:** title 15/600 · subtitle 12/400 · max 2 lines.

---

## Tables & lists

| Component | Path | Status | Notes |
|-----------|------|--------|-------|
| DataTable | `src/shared/components/DataTable.tsx` | ✅ | Primary table |
| Pagination | `src/shared/components/Pagination.tsx` | ✅ | Paging |
| AvatarStack | `src/shared/components/AvatarStack.tsx` | ✅ | People stacks |

Reuse Pending list row density for alert-style lists.

---

## Forms & inputs

| Component | Path | Status | Notes |
|-----------|------|--------|-------|
| FormSection | `src/shared/components/FormSection.tsx` | ✅ | Group fields |
| DateRangePicker | `src/shared/components/DateRangePicker.tsx` | ✅ | Ranges |
| TextField / Select | MUI + theme | 🔄 | Match Dashboard button radius 8, readable labels |
| OTP Input | auth module | 🔄 | Align density |

**Buttons:** 13px / 600 · height ~32 · radius 8 — match Dashboard Refresh / header actions.

---

## Feedback & empty states

| Component | Path | Status | Notes |
|-----------|------|--------|-------|
| EmptyState | `src/shared/components/EmptyState.tsx` | ✅ / 🔄 | Empty lists |
| LoadingState | `src/shared/components/LoadingState.tsx` | ✅ | Loading |
| LoadingBoundary | `src/shared/components/LoadingBoundary.tsx` | ✅ | Suspense-style |
| ErrorState | `src/shared/components/ErrorState.tsx` | ✅ | Errors |
| ErrorBoundary | `src/shared/components/ErrorBoundary.tsx` | ✅ | Crash boundary |
| LoadingSkeleton | — | ⏳ | Prefer Skeleton patterns; Dashboard has no separate export yet |
| ConfirmDialog | `src/shared/components/ConfirmDialog.tsx` | ✅ | Confirmations |
| AppDrawer / SidePanel | `AppDrawer.tsx`, `SidePanel.tsx` | ✅ | Drawers / inspectors |

---

## Tokens (import these)

| Export | Path | Purpose |
|--------|------|---------|
| `DASHBOARD_UX` | `src/modules/dashboard/theme/dashboardUx.ts` | Typography, spacing, radii, card heights |
| `dashSurfaces` | same | Light/dark surface + text colors |
| `metricValueSx` | same | Metric number style |
| `DASH_LIGHT` / `DASH_DARK` | same | Color palettes |
| `LAYOUT` | `src/layouts/layoutConstants.ts` | Sidebar/header chrome |

### Color tokens (light)

| Token | Hex |
|-------|-----|
| textPrimary | `#0F172A` |
| textSecondary | `#475569` |
| textMuted | `#64748B` |
| pageBg | `#F7F9F8` |
| surface | `#FFFFFF` |
| border | `#E7EBF0` |

---

## Recommended promotion order

When polishing the next module, promote in this order if a second consumer appears:

1. `MetricRow` + `DashboardSection` → shared metrics  
2. `IconBadge` → shared  
3. `QuickActionTile` → shared  
4. Pending item row → shared `PendingActionRow`  
5. `FinancialSummaryWidget` layout modes → payments module reuse  

Do **not** duplicate shadows, radii, or type scales in ad-hoc `sx`.

---

## Anti-patterns

- ❌ New purple/cream “AI aesthetic” themes  
- ❌ Metric labels lighter than `#64748B`  
- ❌ One-off card paddings that ignore `cardPadding` / `sectionPadding`  
- ❌ Growing card heights to “fix” typography (use type tokens only)  
- ❌ New button styles when Dashboard header/Refresh already defines density  

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-30 | Initial catalog from Dashboard + shared layouts/components inventory |
