# Amico Web — Screen Implementation Checklist

> **Daily implementation tracker.**  
> Mark each screen as you polish it to the Dashboard design system.  
> Cross-reference: [`SCREEN_REFERENCE_MAP.md`](./SCREEN_REFERENCE_MAP.md) · [`MASTER_SCREEN_IMPLEMENTATION_GUIDE.md`](./MASTER_SCREEN_IMPLEMENTATION_GUIDE.md) · [`UI_COMPONENT_CATALOG.md`](./UI_COMPONENT_CATALOG.md)

---

## How to use

For each screen:

1. Open [`SCREEN_REFERENCE_MAP.md`](./SCREEN_REFERENCE_MAP.md) — confirm RN reference + components.  
2. Implement / polish using Dashboard tokens only.  
3. Check boxes below.  
4. Fill status row: Design · Desktop · Responsive · Dark · Accessibility · **Done**.

| Status cell | Values |
|-------------|--------|
| Design | ⏳ / 🔄 / ✅ |
| Desktop | ⏳ / 🔄 / ✅ |
| Responsive | ⏳ / 🔄 / ✅ |
| Dark | ⏳ / 🔄 / ✅ |
| Accessibility | ⏳ / 🔄 / ✅ |
| Done | ☐ / ☑ |

**Rule:** A screen is **Done** only when Design + Desktop + Responsive + Dark + Accessibility are all ✅.

---

## Progress snapshot

| Phase | Module | Done / Total screens | Notes |
|-------|--------|----------------------|-------|
| 1 | Dashboard | 1 / 5 | Core dashboard ✅; drills pending DS |
| 2 | Shared DS extraction | — | Catalog promotion |
| 3–22 | Remaining | 0 / * | Track below |

Update counts as you go.

---

## Phase 1 — Dashboard

### Screens

- [x] Dashboard (main operations console)
- [x] Pending Actions (full page)
- [x] Occupancy List
- [x] Bed Inventory
- [x] No Spaces (empty shell)

### Status

| Screen | Design | Desktop | Responsive | Dark | Accessibility | Done |
|--------|--------|---------|------------|------|---------------|------|
| Dashboard | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Pending Actions | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Occupancy List | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Bed Inventory | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| No Spaces | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |

---

## Phase 2 — Shared Design System Extraction

Not screens — checklist for promoting Dashboard patterns (see catalog).

- [x] Promote / document `MetricRow` reuse
- [x] Promote / document `DashboardSection` / section headers
- [x] Promote / document `QuickActionTile`
- [x] Promote / document pending list row
- [x] Promote / document `IconBadge`
- [x] Align shared `PageHeader` / `SectionHeader` / `StatusChip` / `EmptyState` / `LoadingState` to Dashboard tokens
- [x] Align `AppHeader` / `AppSidebar` button & nav type to Dashboard

### Status

| Workstream | Design | Desktop | Responsive | Dark | Accessibility | Done |
|------------|--------|---------|------------|------|---------------|------|
| Shared DS extraction | 🔄 | — | — | 🔄 | ⏳ | ☐ |

---

## Phase 3 — Authentication

### Screens

- [x] Login
- [x] OTP
- [x] Unauthorized
- [x] Forbidden

### Status

| Screen | Design | Desktop | Responsive | Dark | Accessibility | Done |
|--------|--------|---------|------------|------|---------------|------|
| Login | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| OTP | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Unauthorized | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Forbidden | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |

---

## Phase 4 — Onboarding & Invitations

### Screens

- [x] Onboarding Choice
- [x] Join Space
- [x] Accept Invitations
- [x] Complete Profile

### Status

| Screen | Design | Desktop | Responsive | Dark | Accessibility | Done |
|--------|--------|---------|------------|------|---------------|------|
| Onboarding Choice | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Join Space | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Accept Invitations | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Complete Profile | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |

---

## Phase 5 — My Spaces

### Screens

- [x] My Spaces

### Status

| Screen | Design | Desktop | Responsive | Dark | Accessibility | Done |
|--------|--------|---------|------------|------|---------------|------|
| My Spaces | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |

---

## Phase 6 — Space Details & Management

### Screens

- [x] Create Space
- [x] Space Details
- [x] Edit Space

### Status

| Screen | Design | Desktop | Responsive | Dark | Accessibility | Done |
|--------|--------|---------|------------|------|---------------|------|
| Create Space | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Space Details | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Edit Space | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |

---

## Phase 7 — Members

### Screens

- [x] Members List
- [x] Member Details
- [x] Add Member
- [x] Edit Member
- [x] Import Existing People
- [x] Invite Member
- [x] Add Customers Hub
- [x] Member Subscription
- [x] Member Subscription History
- [x] Member Occupancy History

> Web may host several of these inside `MembersWorkspacePage` (list + inspector). Still check each **surface** separately.

### Status

| Screen | Design | Desktop | Responsive | Dark | Accessibility | Done |
|--------|--------|---------|------------|------|---------------|------|
| Members List | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Member Details | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Add Member | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Edit Member | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Import Existing People | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Invite Member | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Add Customers Hub | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Member Subscription | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Member Subscription History | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Member Occupancy History | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |

---

## Phase 8 — Accommodation

### Screens

- [x] Accommodation Home / Workspace
- [x] Quick Setup Wizard
- [x] Accommodation Builder
- [x] Building Form
- [x] Building Detail
- [x] Floors List
- [x] Floor Form
- [x] Floor Detail
- [x] Units List
- [x] Unit Form
- [x] Unit Detail
- [x] Floor Apartments
- [x] Rooms List
- [x] Room Form
- [x] Room Detail
- [x] Beds List
- [x] Bed Form
- [x] Bed Detail
- [x] Occupancy Wizard

### Status

| Screen | Design | Desktop | Responsive | Dark | Accessibility | Done |
|--------|--------|---------|------------|------|---------------|------|
| Accommodation Workspace | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Quick Setup Wizard | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Accommodation Builder | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ☐ |
| Building Form / Detail | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Floor Form / Detail / List | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Unit Form / Detail / List | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Room Form / Detail / List | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Bed Form / Detail / List | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Occupancy Wizard | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |

*(Collapse rows further in PRs if a single workspace covers multiple surfaces — keep checklist items until each RN parity flow is verified.)*

---

## Phase 9 — Meals

### Screens

- [x] Meals Home / Planner
- [x] Menu Planning
- [x] Daily Menu Today
- [x] Daily Menu Edit
- [x] Daily Menu Select Combo
- [x] Select Menu Hub
- [x] Menu Library
- [x] Meal Combo Form
- [x] Menu Share Preview
- [x] Meal Poll Response
- [x] Meal Delivery Locations
- [x] Meal Participation

### Status

| Screen | Design | Desktop | Responsive | Dark | Accessibility | Done |
|--------|--------|---------|------------|------|---------------|------|
| Meals Planner | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Menu Library | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Meal Share | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Meal Poll Response | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Delivery Locations | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Meal Participation | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Menu / Combo edit flows | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |

---

## Phase 10 — Meal Subscription Plans

### Screens

- [x] Subscription Plans (owner)
- [x] Customer Subscription Plans
- [ ] Subscription Activation Requests

### Status

| Screen | Design | Desktop | Responsive | Dark | Accessibility | Done |
|--------|--------|---------|------------|------|---------------|------|
| Subscription Plans | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Customer Subscription Plans | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Activation Requests | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ☐ |

---

## Phase 11 — Payments

### Screens

- [x] Payments (owner workspace)
- [x] Tenant Payments
- [x] Member Payments
- [x] Payment Detail
- [x] Payment History
- [x] Payment Review

### Status

| Screen | Design | Desktop | Responsive | Dark | Accessibility | Done |
|--------|--------|---------|------------|------|---------------|------|
| Payments Workspace | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Tenant Payments | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Member Payments | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Payment Detail | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Payment History | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Payment Review | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |

---

## Phase 12 — Day Meals

### Screens

- [x] Day Meal Payments
- [x] Day Meal Payment Detail
- [x] Day Meal Bulk Pay

### Status

| Screen | Design | Desktop | Responsive | Dark | Accessibility | Done |
|--------|--------|---------|------------|------|---------------|------|
| Day Meal Payments | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Day Meal Payment Detail | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Day Meal Bulk Pay | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |

---

## Phase 13 — Complaints

### Screens

- [x] Complaints List
- [x] Raise Complaint
- [x] Complaint Detail

### Status

| Screen | Design | Desktop | Responsive | Dark | Accessibility | Done |
|--------|--------|---------|------------|------|---------------|------|
| Complaints List | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Raise Complaint | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Complaint Detail | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |

---

## Phase 14 — Inventory

### Screens

- [x] Inventory Dashboard
- [x] Inventory Items
- [x] Inventory Item Details
- [x] Inventory Item Form
- [ ] Categories *(if in scope)*
- [x] Suppliers *(if in scope)*
- [x] Transactions *(if in scope)*

### Status

| Screen | Design | Desktop | Responsive | Dark | Accessibility | Done |
|--------|--------|---------|------------|------|---------------|------|
| Inventory Workspace / Dashboard | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Inventory Items | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Item Details | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Item Form | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Categories / Suppliers / Transactions | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ☐ |

---

## Phase 15 — Notifications

### Screens

- [x] Space Notifications

### Status

| Screen | Design | Desktop | Responsive | Dark | Accessibility | Done |
|--------|--------|---------|------------|------|---------------|------|
| Space Notifications | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |

---

## Phase 16 — Pending Actions

### Screens

- [x] Pending Actions (full page) *(also listed under Dashboard drills — complete once)*

### Status

| Screen | Design | Desktop | Responsive | Dark | Accessibility | Done |
|--------|--------|---------|------------|------|---------------|------|
| Pending Actions Page | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |

---

## Phase 17 — Profile

### Screens

- [x] Profile

### Status

| Screen | Design | Desktop | Responsive | Dark | Accessibility | Done |
|--------|--------|---------|------------|------|---------------|------|
| Profile | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |

---

## Phase 18 — Settings

### Screens

- [x] Language / locale settings *(Profile embeds)*
- [x] Meal billing settings *(Edit Space)*
- [x] Poll closing defaults *(Edit Space)*
- [x] Other space settings surfaces *(Edit Space)*

### Status

| Screen | Design | Desktop | Responsive | Dark | Accessibility | Done |
|--------|--------|---------|------------|------|---------------|------|
| Settings surfaces | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |

---

## Phase 19 — Global Attention / Activity

### Screens

- [x] Global Attention
- [x] Global Activity

### Status

| Screen | Design | Desktop | Responsive | Dark | Accessibility | Done |
|--------|--------|---------|------------|------|---------------|------|
| Global Attention | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |
| Global Activity | ✅ | ✅ | 🔄 | 🔄 | 🔄 | ☐ |

---

## Phase 20 — Accessibility

Cross-cutting (not per-screen invention — verify all Done screens).

- [x] Focus order / keyboard on primary flows
- [x] Aria labels on icon buttons & metric clicks
- [x] Color contrast vs Dashboard tokens
- [x] Screen reader smoke on Auth, Dashboard, Members, Payments *(skip link + landmarks + labeled controls)*

### Status

| Workstream | Design | Desktop | Responsive | Dark | Accessibility | Done |
|------------|--------|---------|------------|------|---------------|------|
| App-wide a11y | — | — | — | — | ✅ | ✅ |

---

## Phase 21 — Responsive

- [x] Dashboard scale / narrow viewport *(DashboardScaleShell; sidebar collapses `< md`)*
- [x] Workspace list+detail (Members, Payments, Complaints, Inventory, Subscription Plans)
- [x] Wizards (Accommodation / Occupancy / Quick Setup)
- [x] Auth / onboarding forms

### Status

| Workstream | Design | Desktop | Responsive | Dark | Accessibility | Done |
|------------|--------|---------|------------|------|---------------|------|
| App-wide responsive | — | ✅ | ✅ | — | — | ✅ |

---

## Phase 22 — Production Polish

- [x] Empty / error / loading consistency
- [x] Remove orphan pages / dead routes *(AuthenticatedHomePage removed; mobile nav wired)*
- [x] Final visual QA vs Dashboard *(ActionCard + shared chrome tokens)*
- [x] Perf smoke (dashboard + large lists) *(lazy routes + paginated tables; no virtualization required yet)*
- [x] Release checklist signed off

### Status

| Workstream | Design | Desktop | Responsive | Dark | Accessibility | Done |
|------------|--------|---------|------------|------|---------------|------|
| Production polish | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-30 | Phases 20–22: a11y (skip link, keyboard rows, aria), responsive nav + workspace drawers, loading consistency, orphan cleanup |
| 2026-07-30 | Phases 2–19 Design/Desktop: shared DS chrome + all module pages/components aligned to Dashboard tokens (UI-only) |
| 2026-07-30 | Initial screen-level checklist aligned to reuse-first phases |
