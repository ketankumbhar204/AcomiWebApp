# Gap Implementation Checklist — Web Functional Parity

> Mobile (`K:\Amico`) is the source of truth. Check items only when **functional** behavior matches mobile.  
> Do **not** invent features beyond mobile. Shared mobile+web gaps are marked **(shared)**.

---

## Members

- [x] Add member **documents** section in MemberInspector (list / upload / delete)
- [x] Connect `getMemberDocuments` / `addMemberDocument` / `deleteMemberDocument` call sites
- [x] Add document success / error toasts and loading states
- [x] Add permission check for document management (Owner/Manager)
- [x] Add member **status** editor (active / inactive / etc. per mobile options)
- [x] Connect `updateMemberStatus` API
- [x] Add status change confirmation if mobile shows one *(mobile has no confirm — modal only)*
- [x] Add member **deposit** editor
- [x] Connect `updateDeposit` API
- [x] Add deposit validation (amount / notes per mobile)
- [x] Add **emergency contact** editor on member inspector
- [x] Connect `updateEmergencyContact` from member context (not only complete-profile)
- [x] Refresh member detail after each of the above mutations
- [x] Empty / error states for documents list

## Dashboard

- [x] Add dedicated **Space Health** page/route (or full-panel workflow matching mobile)
- [x] Wire navigation from dashboard health card → health page
- [x] Match mobile health signals, scores, and drill actions
- [x] Add meal **headcount** deep-link target matching mobile sheet/detail (not only planner open)
- [x] Preserve role gates on health and headcount surfaces

## Accommodation

- [x] Add **Duplicate building** action + confirmation
- [x] Add **Duplicate floor** action + confirmation
- [x] Add **Duplicate room** action + confirmation
- [x] Connect duplicate APIs (parity with mobile accommodation duplicate endpoints)
- [x] Navigate to duplicated entity after success
- [x] Success / error toasts and loading on duplicate
- [x] Permission-gate duplicate to Owner/Manager

## Notifications

- [x] **(shared)** Wire `resolve` notification action if/when mobile UI enables it — **Phase 4 verified: Mobile has no UI** (`notificationsApi.resolve` unused). Skipped.
- [x] **(shared)** Match resolve confirmation, toast, and list refresh — N/A until Mobile exposes resolve UI

## Inventory

- [x] **(shared)** Wire delete item UI if/when mobile enables it — **Phase 4 verified: Mobile has no UI** (`inventoryApi.deleteItem` unused). Skipped.
- [x] **(shared)** Wire delete category UI if/when mobile enables it — **Phase 4 verified: Mobile has no UI**. Skipped.
- [x] **(shared)** Confirmations + toasts + permission checks for deletes — N/A until Mobile exposes delete UI

## Members — explicitly out of scope (neither app)

- [ ] ~~Bulk delete members~~ — not on mobile; do not add for parity

## Meals / Payments / Complaints / Auth / Spaces

No open functional gaps identified relative to mobile SoT (IA may differ: drawers vs screens). Re-verify after Members / Dashboard / Accommodation work:

- [ ] Spot-check meal planner publish / share / poll / day-meal review
- [ ] Spot-check payments sync / proof / approve-reject
- [ ] Spot-check complaints lifecycle + attachments
- [ ] Spot-check space edit billing + poll closing settings
- [ ] Spot-check occupancy wizard all flows including cancel reservation

## QA regression after closing gaps

- [ ] OWNER walkthrough of all new member editors
- [ ] MANAGER walkthrough (same as mobile)
- [ ] TENANT/CUSTOMER: confirm new editors remain hidden
- [x] Update `SCREEN_PARITY_MATRIX.md` % after each module closes
- [x] Update `ACTION_PARITY.md` / `API_PARITY.md` statuses
- [ ] Re-run permission smoke on STAFF

---

## Suggested implementation order

1. ~~Members documents + status + deposit + emergency contact~~ ✅  
2. ~~Accommodation duplicate~~ ✅  
3. ~~Dashboard Space Health page~~ ✅  
4. ~~Dashboard headcount deep link~~ ✅  
5. ~~Shared optional: notification resolve / inventory delete~~ ✅ **Verified skip** (no Mobile UI)

---

## Definition of done (100% parity)

- [x] All web-only rows in `ACTION_PARITY.md` marked Present  
- [x] All web-only rows in `API_PARITY.md` Match (shared API-only noted)  
- [x] Navigation gaps in `NAVIGATION_PARITY.md` closed  
- [x] `SCREEN_PARITY_MATRIX.md` module averages ≥ 99% with no P0 Missing  
- [ ] Manual role QA checklist in `PERMISSION_PARITY.md` passed *(manual)*
