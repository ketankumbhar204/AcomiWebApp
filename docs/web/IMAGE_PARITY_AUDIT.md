# Image & Illustration Parity Audit — Mobile (SoT) vs Web

> **Date:** 2026-07-31  
> **Mobile:** `K:\CountIn`  
> **Web:** `K:\CountInWeb`  
> **Assets:** `src/assets` copied (45 PNGs, accommodation only)  
> **Rule:** Mobile is SoT. Do not invent illustrations. Empty states on Mobile use Lucide/emoji — **not** PNGs.

---

## Executive summary

| Finding | Detail |
|---------|--------|
| Asset pack | Accommodation only (same on both). No members/meals/payments/etc. illustration packs. |
| Live Mobile PNG usage | **16** illustrations via `illustrationAssets.ts` → `LayoutIllustration` |
| Dead / unmounted Mobile art | Sprites + plan backgrounds required but **no screen mounts** those components |
| EmptyState PNGs | **0** on Mobile and Web (icons/emoji only) |
| Web before this work | Assets on disk; **0** imports / 0 UI wiring |
| Web after implementation | Live illustration helpers + layout cards / bed hero / layout-mode picker |

---

## Inventory — live Mobile illustrations

| Image | Asset path | Mobile usage | Condition | Web (before) | Web (after) | Status |
|-------|------------|--------------|-----------|--------------|-------------|--------|
| building.png | `illustrations/buildings/` | Builder layout hero | Layout view + building context | Missing | CenterWorkspace building summary | ✅ |
| floor.png | `illustrations/floors/` | Floor cards; apartment summary; layout picker (APARTMENT) | Layout view; `layoutMode !== CORRIDOR_PG` | Missing | Floor cards + layout picker | ✅ |
| corridor_floor.png | `illustrations/floors/` | Corridor floor banner/summary; picker CORRIDOR | `layoutMode === CORRIDOR_PG` | Missing | Floor cards + layout picker | ✅ |
| small_unit.png | `illustrations/units/` | Unit cards / unit summary | `rooms≤4 \|\| beds≤20` | Missing | Unit cards | ✅ |
| unit_medium.png | `illustrations/units/` | Unit cards | `rooms≤8 \|\| beds≤40` | Missing | Unit cards | ✅ |
| unit_large.png | `illustrations/units/` | Unit cards | else | Missing | Unit cards | ✅ |
| room_single…six | `illustrations/rooms/` | Room cards; bed-map summary | capacity 1…5 / ≥6 | Missing | Room cards | ✅ |
| bed-available.png | `illustrations/beds/` | Bed cards; BedDetailHero | status AVAILABLE (default) | Missing | Bed cards + inspector | ✅ |
| bed-reserved.png | `illustrations/beds/` | same | RESERVED | Missing | same | ✅ |
| bed-occupied.png | `illustrations/beds/` | same | OCCUPIED | Missing | same | ✅ |
| bed-maintenance.png | `illustrations/beds/` | same | MAINTENANCE / BLOCKED | Missing | same | ✅ |

---

## Assets present but not live on Mobile (do not invent Web UI)

| Category | Paths | Notes |
|----------|-------|-------|
| Sprites | `sprites/*` (many) | Wired only in unmounted `Illustrated*` comps |
| Plan BGs | `building-bg.png`, `corridor-bg.png`, … | Dead `PlanImageFrame` / visual tiles |
| Reference | `reference/layout-mockup.png` | Never referenced |
| Unused sprite status beds | `sprites/bed-*.png` | Live beds use `illustrations/beds/*` |

**Parity rule:** Web must not mount dead Mobile art. Only port live `illustrationAssets` consumers.

---

## Empty / error / loading states

| State type | Mobile | Web | Parity |
|------------|--------|-----|--------|
| EmptyState | Lucide / emoji — **no PNG** | Lucide / text — **no PNG** | ✅ Match (no bitmap) |
| Error / offline / permission | Text / Lucide | Text / ErrorState | ✅ No shared PNGs |
| Loading | Skeleton / spinner | LoadingState | ✅ No shared PNGs |
| Search empty | Text EmptyState | Text EmptyState | ✅ |

---

## Logic port (selectors)

Source: `Mobile …/layout/illustrations/illustrationAssets.ts`  
Web: `src/modules/accommodation/illustrations/illustrationAssets.ts`

| Helper | Condition |
|--------|-----------|
| `getBuildingIllustration()` | always building.png |
| `getFloorIllustration(mode)` | CORRIDOR_PG → corridor_floor; else floor |
| `getUnitIllustration(rooms, beds)` | size tiers as Mobile |
| `getRoomIllustration(capacity)` | 1–5 mapped; default six |
| `getBedIllustration(status)` | AVAILABLE/RESERVED/OCCUPIED/MAINTENANCE\|BLOCKED |

Visibility on Web (desktop UX equivalent of Mobile layout mode):

- Show illustrations in **cards** view (`viewMode === 'cards'`) and on **bed inspector** hero.
- Table view stays data-dense without large illustrations (same intent as Mobile list mode).

---

## Implementation checklist

- [x] Port `illustrationAssets` + `LayoutIllustration`
- [x] Building summary illustration (`CenterWorkspace` cards + `EntityInspector`)
- [x] Floor / unit / room / bed cards (`CenterWorkspace`, cards view)
- [x] Bed detail hero in `EntityInspector` (status-driven)
- [x] Layout mode picker images (`PropertyLayoutModePicker` in Quick Setup + Building create when multiple modes)
- [x] Floor / unit / room inspector illustrations
- [x] Audit updated after implementation
- [x] `tsc --noEmit` clean

### Web files added / updated

| File | Role |
|------|------|
| `src/modules/accommodation/illustrations/illustrationAssets.ts` | Selector SoT (ported) |
| `src/modules/accommodation/illustrations/LayoutIllustration.tsx` | Shared `<img>` frame |
| `src/modules/accommodation/illustrations/PropertyLayoutModePicker.tsx` | Visual layout picker |
| `src/modules/accommodation/illustrations/index.ts` | Barrel |
| `src/modules/accommodation/components/CenterWorkspace.tsx` | Card illustrations |
| `src/modules/accommodation/components/EntityInspector.tsx` | Detail heroes |
| `src/modules/accommodation/components/EntityFormDrawer.tsx` | Building layout picker |
| `src/modules/accommodation/pages/QuickSetupWizardPage.tsx` | Setup layout step |

---

## Definition of done

Every **live** Mobile image usage has a Web equivalent with the same selector conditions. Dead Mobile assets remain unused on both. Empty / error / loading states remain Lucide/text on both (no bitmap inventing).
