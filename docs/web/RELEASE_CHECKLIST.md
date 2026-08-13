# Acomi Web — Release checklist (Phase 22)

Signed off: **2026-07-30** (Dashboard DS rollout Phases 1–22)

## Pre-release

- [x] Dashboard visual SoT locked (`dashboardUx.ts`)
- [x] Shared chrome tokenized (PageHeader, ContentCard, DataTable, dialogs, etc.)
- [x] Modules Design/Desktop aligned (Phases 2–19)
- [x] Accessibility: skip link, main landmarks, labeled IconButtons, keyboard table cards
- [x] Responsive: sidebar `< md` drawer + hamburger; workspace inspectors via `AppDrawer`
- [x] Loading/empty/error use shared states on primary flows
- [x] Orphan `AuthenticatedHomePage` removed
- [x] `npx tsc --noEmit` passes

## Smoke (manual)

- [ ] Auth login → OTP → onboarding / spaces
- [ ] Dashboard scale on ~1280 and phone-width with hamburger nav
- [ ] Members / Payments / Complaints / Inventory list → detail drawer on narrow
- [ ] Dark theme: ActionCard highlight + pending tints readable
- [ ] Lazy route transition shows LoadingState

## Notes

- Table virtualization deferred until list sizes warrant it (pagination in place).
- Deeper assistive-tech SR pass recommended before public launch.
