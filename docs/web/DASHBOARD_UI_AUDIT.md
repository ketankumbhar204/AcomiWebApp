# Dashboard UI Audit (Current Implementation)

> **Scope:** Reverse-engineered visual design tokens from AcomiWeb Dashboard code.  
> **Date:** 2026-07-29  
> **Status:** Read-only inspection — no code was modified.  
> **Styling system:** MUI `sx` + TypeScript theme tokens. **Tailwind is not used** on the Dashboard.

---

## Token Sources of Truth

| Source | Path |
|--------|------|
| Dashboard UX tokens | `src/modules/dashboard/theme/dashboardUx.ts` |
| Light/dark app colors | `src/shared/theme/colors.ts` |
| Layout chrome | `src/layouts/layoutConstants.ts` |
| Global typography | `src/shared/theme/typography.ts` |
| Global radius | `src/shared/theme/radius.ts` |
| Global elevation (chrome) | `src/shared/theme/elevation.ts` |
| MUI theme builder | `src/shared/theme/theme.ts` |

**Assumptions:** rem → px at root `16px`. MUI spacing unit = `8px` (`theme.spacing(1)`).

---

## 1. Components Analyzed

### Present on Dashboard (wire map)

| Requested name | Actual component | File |
|----------------|------------------|------|
| DashboardPage | `DashboardPage` | `src/modules/dashboard/pages/DashboardPage.tsx` |
| DashboardLayout | `SpaceShellLayout` + `AppLayout` + `ContentLayout` | `src/modules/dashboard/layouts/SpaceShellLayout.tsx`, `src/layouts/AppLayout.tsx`, `src/layouts/ContentLayout.tsx` |
| AppHeader | `AppHeader` | `src/layouts/AppHeader.tsx` |
| Sidebar | `AppSidebar` | `src/layouts/AppSidebar.tsx` |
| SpaceSelector | `SpaceContextSelector` | `src/modules/dashboard/components/SpaceContextSelector.tsx` |
| SectionCard | `DashboardSection` | `src/modules/dashboard/components/DashboardSection.tsx` |
| MetricRow / MetricCard | `MetricRow` | `src/modules/dashboard/components/MetricRow.tsx` |
| PaymentSummary | `FinancialSummaryWidget` | `src/modules/dashboard/components/FinancialSummaryWidget.tsx` |
| PropertyOperationCard | `AccommodationOpsWidget` | `src/modules/dashboard/components/AccommodationOpsWidget.tsx` |
| MealOperationCard | `MealOperationsDayWidget` | `src/modules/dashboard/components/MealOperationsDayWidget.tsx` |
| QuickActionCard | `QuickActionTile` + `DashboardQuickActions` | `…/QuickActionTile.tsx`, `…/DashboardQuickActions.tsx` |
| PendingActionsPanel / Item | `PendingActionsPanel` (inline rows) | `src/modules/dashboard/components/PendingActionsPanel.tsx` |
| (summary) Space Health | `SpaceHealthCard` + `HealthScoreRing` | `…/SpaceHealthCard.tsx`, `…/HealthScoreRing.tsx` |
| (summary) Today’s Overview | `TodaysOverviewCard` | `…/TodaysOverviewCard.tsx` |
| Icon container | `IconBadge` | `…/IconBadge.tsx` |
| Greeting | `DashboardGreetingBar` | `…/DashboardGreetingBar.tsx` |
| EmptyState / LoadingState | shared | `src/shared/components/ErrorState.tsx`, `…/LoadingState.tsx` |

### Not found as named files

`SectionCard`, `DashboardCard`, `MetricCard`, `QuickActionCard`, `PendingActionItem`, `MealOperationCard`, `PropertyOperationCard`, `DashboardLayout` — behavior is covered by the components above.

### Unused / legacy

| File | Notes |
|------|--------|
| `MealOpsWidget.tsx` | Present under dashboard components; **not imported** by `DashboardPage` |

---

## 2. Typography Table

**Font family (global):** `"Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif`  
(`src/shared/theme/typography.ts`). Dashboard text inherits this unless overridden.

| Element | Component | Size (px) | Weight | Line Height | Letter Spacing | Transform | Color (light) |
|---------|-----------|-----------|--------|-------------|----------------|-----------|---------------|
| Dashboard title / greeting | `DashboardGreetingBar` | **32** (`2rem`) | 700 | **38px** (`2.375rem`) | `-0.015em` | none | `#0F172A` |
| Greeting subtitle | `DashboardGreetingBar` | **16** (`1rem`) | 400 | 1.4 | default | none | `#64748B` |
| Section title | `DashboardSection`, Meal ops header, Quick actions | **24** (`1.5rem`) | 700 | 1.3 | default | none | `#0F172A` |
| Pending panel title | `PendingActionsPanel` | **20** (`1.25rem` override) | 700 | 1.3 | default | none | `#0F172A` |
| Section subtitle | `DashboardSection`, meal strip | **13** (`0.8125rem`) | 400 | 1.4 | default | none | `#64748B` |
| Card title | Space Health, Today’s Overview, Pending item | **16** (`1rem`) | 600 | 1.3 | default | none | `#0F172A` |
| Quick action title | `QuickActionTile` | **15** (`0.9375rem` override) | 600 | 1.3 | default | none | `#0F172A` |
| Meal slot title | `MealOperationsDayWidget` | **15** (`0.9375rem`) | 600 | 1.3 | default | none | `#0F172A` |
| Card subtitle | Overview footer, QA sub, meal status | **13** (`0.8125rem`) | 400 | 1.35 | default | none | `#64748B` |
| Metric value | `MetricRow`, property cards, overview metrics | **32** desktop (`2rem`); **30** lg; **28** md; **24** xs | 700 | 1.15 | default | none + `tabular-nums` | accent / `#0F172A` |
| Metric label | Payment cell label | **14** (`0.875rem`) | 500 | 1.3 | default | none | `#64748B` |
| Caption / property label | Property cards, overview labels | **12** (`0.75rem`) | 500 | 1.35 | default | none | `#64748B` |
| Body | Empty placeholders | **14** (`0.875rem`) | 400 | 1.4 | default | none | `#64748B` |
| Button text | Refresh, header actions, Plan menu | **14** (`0.875rem`) | 600 | 1.2 | default | none (`textTransform: none`) | `primary.dark` / inherit |
| Sidebar brand | `AppSidebar` (`h6`) | ~**13** (theme `h6` = 13) | 700 | 1.4 | default | none | `primary.dark` (`#128C7E`) |
| Sidebar section heading | `AppSidebar` overline | **12** | 600 | theme overline | `0.08em` | **uppercase** | `text.secondary` |
| Sidebar label | `ListItemText` | **15** | 500 (600 when `.active`) | 1.3 | default | none | default / `primary.dark` when active |
| Space selector name | `SpaceContextSelector` | **15** (`0.9375rem`) | 700 | 1.2 | default | none | `#0F172A` |
| Space selector role | `SpaceContextSelector` | **12** (`smallLabel`) | 500 | 1.2 | default | none | `#64748B` |
| Priority chip / badge | Pending badge, QA badge, nav badge | **10** | 700 | — | pending: `0.04em` + uppercase | uppercase (pending) | chip fg `#B45309` / white on red |

### Metric value responsive (fixed steps — not fluid)

| Breakpoint (MUI) | Approx viewport | Font size |
|------------------|-----------------|-----------|
| `xs` | &lt; 900 | 24px (`1.5rem`) |
| `md` | ≥ 900 | 28px (`1.75rem`) |
| `lg` | ≥ 1200 | 30px (`1.875rem`) |
| `xl` | ≥ 1536 | 32px (`2rem`) |

---

## 3. Layout Table

| Area | Width | Min / Max | Gap | Padding |
|------|-------|-----------|-----|---------|
| App sidebar (expanded) | **240px** (`LAYOUT.sidebarWidth`) | collapsed **72px** | n/a | Toolbar `px: 16` (`spacing 2`); list `px: 8` |
| App header | 100% of main column | height **64px** | toolbar `gap: 16` | `px: 12` xs / `16` md |
| Dashboard page shell | 100% | content max **1600px** | section **24px** | page **20px** md (`DASHBOARD_UX.pagePadding`); xs `16px` |
| Main + utility grid | 100% of content | below 1280: **1 col**; ≥1280: `minmax(520px, 1fr) 360px` | **24px** | inherited |
| Utility / right panel | **360px** fixed track (≥1280) | token `utilityMinWidth: 340` (track is 360) | **24px** vertical to pending | none extra |
| Summary row | auto-fit | cell min **260px** | **12px** | cards **16px** |
| Payment metrics | auto-fit | cell min **200px** | **1px** (separator) | cell **12px** |
| Property cards | auto-fit | cell min **180px** | **12px** | **16px** |
| Meal slots | auto-fit | cell min **180px** | **1px** | surface **16px**; cell `px~12 py~8` |
| Quick actions | auto-fit | tile min track **156px** | **12px** | tile **16px** |
| ContentLayout (shell) | max 1600 (non-dashboard) / full when dashboard `contentMaxWidth={false}` | — | — | `px: 24` md; py dense ~14 |

### Header / chrome specifics

| Token | Value |
|-------|-------|
| Header height | 64px |
| Sidebar width | 240px (expanded) / 72px (collapsed) |
| Space selector height | 44px |
| Space selector max width (header slot) | xs 55% / sm 360 / md 420 |

---

## 4. Card Table

| Component | Width | Height | Min W | Min H | Max H | Padding | Radius | Border | Shadow (light) | Hover |
|-----------|-------|--------|-------|-------|-------|---------|--------|--------|----------------|-------|
| SpaceHealthCard | 100% of grid cell | **140** | ≥260 (grid) | 140 | 140 | 16 | **12** | 1px `#E7EBF0` | `0 1px 4px rgba(0,0,0,0.04)` | shadowHover |
| TodaysOverviewCard | 100% | **140** | ≥260 | 140 | 140 | 16 | 12 | 1px | same | shadowHover |
| DashboardSection surface | 100% | auto | — | — | — | **16** (`sectionPadding`) | 12 | 1px | same | — |
| Payment metric cell (`MetricRow`) | ≥**200** / 1fr | **120** (height locked to min) | 200 | 120 | 150 | **12** | outer grid `radius-4`≈8 | via 1px gap | — | light bg tint |
| Property card | ≥**180** / 1fr | **110** | — | 110 | 110 | 16 | 12 | 1px | same | shadowHover + `translateY(-1px)` |
| Meal slot | ≥**180** | **110** | 180 | 96 | 110 | ~12×8 | — (parent 12) | gap sep | — | elevated/tint |
| QuickActionTile | 100% of track | **120** | track 156 | 120 | 120 | 16 | 12 | 1px (amber if highlighted) | same | shadowHover + `translateY(-1px)` |
| PendingActionsPanel | 100% of utility | auto | — | 0 | sticky scroll | 16 | 12 | 1px | same | — |
| Pending item row | 100% | **70** | — | — | **72** | px 4 | 12 (`1.5`) | none | — | row tint |
| SpaceContextSelector | auto / max 100% | **44** | 0 | — | — | px 10 / py 4 | 12 | 1px | same | — |

**Shared transition:**  
`box-shadow 150ms ease, transform 100ms ease, background-color 150ms ease`

**Dark shadows:** `none` default; hover `0 0 0 1px #4B5563` (border substitute).

---

## 5. Icon Table

| Component | Library | Icon size | Container | Container radius | Container fill | Stroke | Gap to text |
|-----------|---------|-----------|-----------|------------------|----------------|--------|-------------|
| `IconBadge` (metrics, QA, meals, health, pending) | Lucide React | **18px** | **32×32** | **8px** | `{accent}1A` light / elevated dark | **1.75** (CSS on svg) | flex gap ~8–12 |
| Space selector building | Lucide | **18** | **32×32** | 8 | `#D1FAE5` / elevated | default lucide | Stack `spacing 1.25` (~10px) |
| Sidebar nav icons | Lucide | **18** | none (icon only); ListItemIcon minWidth **36** | — | — | default | ~icon→label via ListItem |
| AppHeader menu / theme | Lucide | Menu **20**, Moon/Sun **18** | IconButton (MUI) | — | — | default | — |
| HealthScoreRing | SVG | ring **56px**, stroke **5** | — | — | track = border color | — | gap **12** (`1.5`) to text |
| Chevrons | Lucide | 14–16 | — | — | muted `#94A3B8` | — | — |
| Quick action badge | — | text 10 | badge **16×16** min | full | `error.main` | — | absolute −4/−4 |
| Priority chip | — | text 10 | auto padding | 8 (`radius 1`) | `#FEF3C7` / dark amber tint | — | row gap 6 |

**Accent examples used:** `#128C7E`, `#059669`, `#2563EB`, `#D97706`, `#6366F1`, `#7C3AED`, `#0F766E`.

---

## 6. Button Table

| Button | Height | Padding | Font | Radius | Border | Hover / focus |
|--------|--------|---------|------|--------|--------|---------------|
| Refresh (`DashboardGreetingBar`) | **36** | `px: 12` (`1.5`) | 14 / 600 | **12** (`1.5`) | outlined `primary.main` | MUI outlined + surface bg |
| Header My Spaces / Profile / Logout | **36** | `px: 12` | 14 / 600 | **12** | outlined | MUI default |
| Theme toggle | IconButton default | — | — | circular | none | MUI |
| View all (Pending) | small text | MUI small | 14 / 600 | — | none | text / `primary.dark` |
| Plan menu link | text button | — | 14 / 600 | — | none | underline hover |
| Sidebar nav `ListItemButton` | min **44** | `px: 10` | 15 / 500 | **10** (`1.25`) | none | active: mint bg + **3px** left accent |
| Meal day chevrons | IconButton small | — | — | — | — | — |

**Focus visible (cards / metrics):** `outline: 2px solid #25D366; outlineOffset: 2` (or −2 inset on metric cells).

---

## 7. Color Table

### Dashboard surfaces (`DASH_LIGHT` / `DASH_DARK`)

| Token | Light | Dark |
|-------|-------|------|
| Page background | `#F5FCF8` | `#111827` |
| Surface | `#FFFFFF` | `#1F2937` |
| Elevated | `#FFFFFF` | `#374151` |
| Border | `#E7EBF0` | `#374151` |
| Text primary | `#0F172A` | `#F9FAFB` |
| Text secondary | `#64748B` | `#D1D5DB` |
| Text muted | `#94A3B8` | `#9CA3AF` |
| Shadow | `0 1px 4px rgba(0,0,0,0.04)` | `none` |
| Shadow hover | `0 4px 12px rgba(0,0,0,0.08)` | `0 0 0 1px #4B5563` |

### App palette (`colors` / `darkColors`)

| Token | Light | Dark |
|-------|-------|------|
| Primary | `#25D366` | `#25D366` |
| Primary hover | `#20BD5A` | `#20BD5A` |
| Primary dark | `#128C7E` | `#34D399` |
| Background | `#F5FCF8` | `#111827` |
| Light green | `#D1FAE5` | `#064E3B` |
| Text primary | `#0F172A` | `#F9FAFB` |
| Text secondary | `#64748B` | `#D1D5DB` |
| Border | `#E7EBF0` | `#374151` |
| Surface / white token | `#FFFFFF` | `#1F2937` |
| Success | `#059669` | `#34D399` |
| Muted | `#94A3B8` | `#9CA3AF` |
| Danger / error | `#DC2626` | `#F87171` |
| Warning | `#D97706` | `#FBBF24` |

### Ad-hoc accents in dashboard widgets

| Use | Value |
|-----|-------|
| Info / review | `#2563EB` |
| Property vacant | `#6366F1` |
| Dinner accent | `#7C3AED` |
| Inventory accent | `#0F766E` |
| Sidebar active bg | `rgba(18, 140, 126, 0.1)` |
| QA highlighted bg | `#FFFBEB` / `rgba(217,119,6,0.12)` dark |
| Priority chip bg | `#FEF3C7` |
| Priority chip fg | `#B45309` |

---

## 8. Component Spec Sheets (condensed)

### DashboardPage
- **Page bg:** `dashSurfaces.pageBg`
- **Padding:** 20px (md), 16px (xs); negative pull into ContentLayout gutters
- **Max width:** 1600px centered
- **Section gap:** 24px
- **Main grid:** 1fr → from **1280px**: `minmax(520px,1fr) 360px`
- **Summary grid:** `repeat(auto-fit, minmax(260px, 1fr))`, gap 12

### AppHeader
- Height 64; sticky; border-bottom divider; paper bg
- Actions gap 16 between leading and actions cluster

### AppSidebar
- Width 240 / 72; paper bg; border-right
- Nav item minHeight 44; icon 18; label 15/500
- Active: left bar 3×(~24) + mint fill

### MetricRow
- Grid: `repeat(auto-fit, minmax(200px, 1fr))`
- Gap 1px as hairline separators on border-colored track
- Cell height 120; padding 12; value nowrap + tabular-nums

### QuickActionTile
- Fixed 120×auto width; gap 6 (`0.75`); title no ellipsis policy (word wrap); subtitle clamp 2

### PendingActionsPanel
- Item 70px; title nowrap; description 1-line clamp; IconBadge + chip + chevron

---

## 9. Responsive Audit

Custom + MUI rules that affect Dashboard:

| Viewport target | What code does |
|-----------------|----------------|
| **1920 / 1600** | Utility 360 beside main; metric xl **32px**; payment often 4-across if main ≥ ~800px |
| **1440** | Same grid (≥1280); metric **lg 30px** until xl |
| **1366 / 1280** | Side-by-side starts at **1280** CSS px; metric md/lg 28–30 |
| **&lt; 1280** (e.g. **1024**) | Utility **stacks below** main; grids auto-fit wrap |
| **768** | Single column; summary/payment/property/QA wrap by minmax; metric **24px**; header menu icon shown (&lt; md) |
| **1600** content | `contentMaxWidth: 1600` caps dashboard inner column |

**No dedicated rules** for 1920 / 1600 / 1440 / 1366 as named breakpoints — behavior comes from `1280` media query + MUI `xs|md|lg|xl` on metric fonts and some chrome.

| Change type | Rules |
|-------------|-------|
| Typography | Metric value steps only (`metricValueByBp`) |
| Grid | Page 1→2 cols at 1280; all section grids `auto-fit`/`minmax` wrap |
| Cards | Heights fixed; columns drop when container &lt; N×minWidth |
| Sidebar | Permanent md+; temporary drawer xs; collapsible width 240↔72 |

---

## 10. Tailwind Audit

**Tailwind is not used** in Dashboard modules (`className` / `@apply` / utilities not present).  
Styling is **MUI `sx`**, theme palette, and `DASHBOARD_UX` / `dashSurfaces` tokens.

CSS modules: **none** dedicated to Dashboard.  
CSS variables: **none** custom `--*` in dashboard theme; colors are TS string constants.

---

## 11. Global Theme Tokens (chrome-adjacent)

| Token set | Values |
|-----------|--------|
| `radius` (shared) | sm 8, button 12, input 12, card 16, section 20, full 9999 — note dashboard cards use **`DASHBOARD_UX.radius = 12`**, not `radius.card` |
| `elevation` (shared) | sm/md/lg — dashboard cards use **`DASH_LIGHT.shadow`**, not `elevation.*` |
| MUI button root | `borderRadius: radius.button` (12), `fontWeight: 600`, no elevation |

---

## 12. Audit Limitations

1. **Computed vs coded:** Heights/paddings are from source tokens; browser subpixel rounding may differ by ±1px.  
2. **Screenshot vs tokens:** If the running app looks larger than this spec, hard-refresh / HMR cache may be stale relative to `dashboardUx.ts`.  
3. **Loading/Empty:** Shared components are used; no dashboard-specific size tokens.  
4. **`MealOpsWidget`:** Not on current page tree — excluded from live layout measurements.

---

## Summary Checklist (return items)

1. **Components analyzed** — see §1  
2. **Typography table** — see §2  
3. **Layout measurements** — see §3  
4. **Card measurements** — see §4  
5. **Icon measurements** — see §5  
6. **Button measurements** — see §6  
7. **Color tokens** — see §7  
8. **Responsive rules** — see §9  
9. **Tailwind classes** — **none** (§10)  
10. **Report path:** [`docs/web/DASHBOARD_UI_AUDIT.md`](./DASHBOARD_UI_AUDIT.md) → `K:\AmicoWeb\docs\web\DASHBOARD_UI_AUDIT.md`
