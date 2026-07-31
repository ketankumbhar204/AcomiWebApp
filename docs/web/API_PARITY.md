# API Parity — Mobile vs Web

> Compares API **clients and call sites**. Backend contracts are authoritative.  
> Status: **Match** = same endpoint family used; **Web missing call site** = client may exist but UI does not call it; **Mobile missing UI** = shared gap.

## Auth

| Screen / flow | Mobile API | Web API | Status |
|---------------|------------|---------|--------|
| Login | `authApi.sendOtp` | `authApi.sendOtp` | Match |
| OTP | `authApi.verifyOtp` / `getMe` | same | Match |
| Complete profile | `authApi.completeProfile` / `updateMe` | same | Match |

## Spaces / onboarding

| Screen / flow | Mobile API | Web API | Status |
|---------------|------------|---------|--------|
| My spaces | `mySpacesApi.getMySpaces` / `search` / `setDefaultSpace` | same | Match |
| Create space | `spaceApi.createSpace` | same | Match |
| Space details/edit | `getSpaceById` / `updateSpace` | same | Match |
| Deactivate | `deactivateSpace` | same | Match |
| Invitations | `getMyInvitations` / `acceptInvitation` | same | Match |
| Meal billing settings | `mealBillingApi` | `mealBillingApi` | Match |
| Poll closing settings | `mealPollClosingApi` | `mealPollClosingApi` | Match |
| Global dashboard | `dashboardApi.getGlobalDashboard` | same | Match |

## Dashboard / notifications

| Screen / flow | Mobile API | Web API | Status |
|---------------|------------|---------|--------|
| Dashboard summary | `dashboardApi.getDashboardSummary` | same | Match |
| Pending actions | `notificationsApi.getPendingActions` | same | Match |
| Occupancy list | occupancy list / drilldown | `dashboardDrilldownApi` / occupancy | Match |
| Bed inventory | beds search/list | `useSpaceBedInventory` | Match |
| Space health | local health calculator + signals | `useSpaceHealth` + `SpaceHealthPage` | Match |
| Notifications list | `listNotifications` | same | Match |
| Mark read | `markRead` | same | Match |
| Resolve | `resolve` | client exists | **Shared — no UI on Mobile or Web** (Phase 4 skip) |

## Members

| Screen / flow | Mobile API | Web API | Status |
|---------------|------------|---------|--------|
| List / search | `memberApi.getMembers` | same | Match |
| CRUD member | create/update/remove | same | Match |
| Invite | create/cancel invitation | same | Match |
| Import | `searchImportCandidates` / `importMember` | same | Match |
| Linked member | `getMyLinkedMember` | same | Match |
| History | `getMemberHistory` | same | Match |
| Notes | get/add notes | same | Match |
| Documents | get/add/delete documents | `MemberDocumentsSection` + mutations | Match |
| Status update | `updateMemberStatus` | `MemberStatusDialog` | Match |
| Emergency contact | `updateEmergencyContact` | `MemberEmergencyContactDialog` (+ complete profile) | Match |
| Deposit | `updateDeposit` | `MemberDepositSection` | Match |
| Meal balance | `mealBalanceApi` / web `memberMealBalanceApi` | Match |
| Occupancies | `getMemberOccupancies` | same | Match |

## Accommodation

| Screen / flow | Mobile API | Web API | Status |
|---------------|------------|---------|--------|
| Buildings/floors/units/rooms/beds CRUD | `accommodationApi` | same | Match |
| Bulk create | bulk units/rooms/beds | same | Match |
| Quick setup | preview/execute setup | same | Match |
| Lifecycle | `accommodationLifecycleApi` | same | Match |
| Duplicate building/floor/room | mobile duplicate APIs/hooks | `accommodationApi.duplicate*` + `DuplicateEntityDialog` | Match |
| Search allocation targets | present | present | Match |

## Occupancy

| Screen / flow | Mobile API | Web API | Status |
|---------------|------------|---------|--------|
| Allocate / reserve / move-in / transfer / vacate | `occupancyApi` | same | Match |
| Cancel reservation | present | present | Match |
| List / get | present | present | Match |

## Meals

| Screen / flow | Mobile API | Web API | Status |
|---------------|------------|---------|--------|
| Daily menu upsert/publish/copy | `mealsApi` | same | Match |
| Library items/categories/combos/extras | present | present | Match |
| Delivery locations | present | present | Match |
| Polls open/close/respond | present | present | Match |
| Headcount | present | `MealHeadcountPage` + planner | Match |
| Day meal payment approve/reject/remind/proof | present | present | Match |
| Subscription plans + activation | `subscriptionPlansApi` | same | Match |
| Member meal activity | present | present | Match |

## Payments

| Screen / flow | Mobile API | Web API | Status |
|---------------|------------|---------|--------|
| Summary / members / review / history | `paymentsApi` | same | Match |
| Detail / timeline | present | present | Match |
| Submit proof / review | present | present | Match |
| Sync month | present | present | Match |

## Complaints

| Screen / flow | Mobile API | Web API | Status |
|---------------|------------|---------|--------|
| list/get/create | `complaintsApi` | same | Match |
| status/assign/resolution/reopen | present | present | Match |
| comments/attachments | present | present | Match |

## Inventory

| Screen / flow | Mobile API | Web API | Status |
|---------------|------------|---------|--------|
| Dashboard / items CRUD / stock move | `inventoryApi` | same | Match |
| Categories / suppliers / transactions | present | present | Match |
| deleteItem / deleteCategory | client present | client present | **Shared — no UI on Mobile or Web** (Phase 4 skip) |

---

## Incorrect / unused / duplicate notes

| Finding | Detail |
|---------|--------|
| Unused on web UI | *(none for web-only parity)* — resolve + inventory deletes are unused on Mobile UI too |
| Unused / shared | Inventory deletes & notification resolve: API clients exist; **no Mobile screen calls them** → Phase 4 correctly skipped |
| Duplicate clients | None material — naming differs (`mealBalanceApi` vs `memberMealBalanceApi`) but endpoints align |
| Wrong parameters | No systematic mismatch found in client signatures; backend remains SoT for payloads |

---

## Recommendation order (API-related)

1. ~~Wire member documents / status / deposit / emergency-contact UIs~~ ✅ Phase 1.  
2. ~~Port accommodation duplicate endpoints + UI~~ ✅ Phase 2.  
3. ~~Dashboard Space Health page + meal headcount deep link~~ ✅ Phase 3.  
4. ~~Notification resolve / inventory delete~~ ✅ Phase 4 **verified skip** (Mobile has API only, no UI).
