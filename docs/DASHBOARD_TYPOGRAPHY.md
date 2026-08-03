# Dashboard Typography Scale

Source of truth for CountIn Web desktop typography. Use these tokens on every screen so hierarchy stays consistent with the Dashboard.

**Implementation:** `src/modules/dashboard/theme/dashboardUx.ts` → `DASHBOARD_UX.*`  
**Surfaces / text colors:** `dashSurfaces(mode)` (`textPrimary`, `textSecondary`, `textMuted`)

---

## Scale (px)

| Size | Weight | Role |
|------|--------|------|
| **28** | 700 | Page titles, key metric numbers |
| **20** | 700 | Section / panel headings |
| **16** | 600 | Card titles, meal names, list primary labels |
| **15** | 400 | Primary input / content text |
| **14** | 400–600 | Body, subtitles, labels, links, buttons, breadcrumbs |
| **11–12** | 600 | Status badges only |

**Rules**

- Minimum readable body text on desktop: **14px**.
- Do **not** use 10px or 12px for normal content.
- Use **11–12px only** for compact badges.
- Line height ≈ **1.4–1.5** (tokens already set `lineHeight`).
- Prefer tokens over hardcoded `fontSize` / `fontWeight`.
- Match Dashboard spacing via `DASHBOARD_UX` layout tokens (`pagePadding`, `sectionGap`, `cardGap`, `cardPadding`, `buttonHeight`, `iconSize`, `iconWell`, radii).

---

## Token → usage map

| UI element | Token | Size / weight |
|------------|--------|----------------|
| Page title (`h1`) | `DASHBOARD_UX.pageTitle` | 28 / 700 |
| Page subtitle | `DASHBOARD_UX.greetingSub` | 14 / 400 |
| Breadcrumb | `DASHBOARD_UX.breadcrumb` | 14 / 500 |
| Top nav links / pills | `DASHBOARD_UX.link` or `.button` | 14 / 600 |
| Section heading (day, panel) | `DASHBOARD_UX.sectionHeading` | 20 / 700 |
| Section subtitle | `DASHBOARD_UX.sectionSubtitle` | 14 / 400 |
| Card / meal title | `DASHBOARD_UX.cardTitle` | 16 / 600 |
| Card / meal description | `DASHBOARD_UX.cardSubtitle` or `.body` | 14 / 400 |
| Body copy | `DASHBOARD_UX.body` | 14 / 400 |
| Stat / form labels | `DASHBOARD_UX.metricLabel` / `.inputLabel` | 14 / 500 |
| Stat numbers | `DASHBOARD_UX.largeNumber` | 28 / 700 |
| Stat secondary / hint | `DASHBOARD_UX.metricCaption` | 14 / 400 |
| Action links | `DASHBOARD_UX.link` | 14 / 600 |
| Buttons | `DASHBOARD_UX.button` | 14 / 600 |
| Input labels | `DASHBOARD_UX.inputLabel` | 14 / 500 |
| Input text | `DASHBOARD_UX.inputText` | 15 / 400 |
| Status badges | `DASHBOARD_UX.badge` | 12 / 600 |
| Sidebar nav | `DASHBOARD_UX.sidebar` | 14 / 500 |
| Sidebar section label | `DASHBOARD_UX.sidebarSection` | 12 / 600 uppercase |

---

## Code examples

```tsx
import { Typography } from '@mui/material';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

const s = dashSurfaces(theme.palette.mode);

<Typography component="h1" sx={{ ...DASHBOARD_UX.pageTitle, color: s.textPrimary }}>
  Menu planning
</Typography>

<Typography sx={{ ...DASHBOARD_UX.greetingSub, color: s.textSecondary }}>
  Plan breakfast, lunch, and dinner from your menu library.
</Typography>

<Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
  Tue, Aug 4
</Typography>

<Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
  Breakfast
</Typography>

<Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
  No dishes yet. Add combos or items from library.
</Typography>
```

Buttons / links:

```tsx
sx={{ ...DASHBOARD_UX.button /* or .link */, color: colors.primaryDark }}
```

---

## Checklist for new / refactored screens

1. Import `DASHBOARD_UX` + `dashSurfaces` — no one-off rem/px type scales.
2. Map every text node to a token in the table above.
3. Confirm no body/label under 14px; badges use `DASHBOARD_UX.badge` only.
4. Use `DASHBOARD_UX.iconSize` / `iconWell` for icons; `buttonHeight` for controls.
5. Prefer `StatCard`, `StatusChip`, `ContentCard`, `Breadcrumbs` — they already consume tokens.
6. Do not invent larger “marketing” sizes (e.g. 38px titles) unless product explicitly changes this SoT.

---

## Related files

| File | Role |
|------|------|
| `src/modules/dashboard/theme/dashboardUx.ts` | Token definitions |
| `src/shared/components/Breadcrumbs.tsx` | Breadcrumb typography |
| `src/shared/components/StatCard.tsx` | Metric label / number / hint |
| `src/shared/components/StatusChip.tsx` | Badge typography |
| `src/modules/meals/pages/MealsPlannerPage.tsx` | Reference page using this scale |
