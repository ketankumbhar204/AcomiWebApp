# Navigation Parity — Mobile vs Web

> Mobile uses React Navigation stacks/tabs. Web uses React Router. Destinations must preserve **user journey**, not identical route strings.

## Top-level space shell

| Intent | Mobile path | Web path | Status |
|--------|-------------|----------|--------|
| Enter space | MySpaces → SpaceTabs | `/spaces/:spaceId/*` | Match |
| Dashboard tab | SpaceTabs → Dashboard | `/spaces/:spaceId/dashboard` | Match |
| Members tab | SpaceTabs → Members | `/spaces/:spaceId/members` | Match |
| Accommodation tab | SpaceTabs → Accommodation | `/spaces/:spaceId/accommodation` | Match |
| Meals tab | SpaceTabs → Meals | `/spaces/:spaceId/meals` | Match |
| Payments tab | SpaceTabs → Payments | `/spaces/:spaceId/payments` | Match |
| Complaints (stack) | Main → Complaints | `/spaces/:spaceId/complaints` | Match |
| Inventory (stack) | Main → Inventory | `/spaces/:spaceId/inventory` | Match |
| Notifications | Main → SpaceNotifications | `/spaces/:spaceId/notifications` | Match |
| Profile | Main → Profile | `/profile` (or space profile) | Match |
| Space details | Main → SpaceDetails | `/spaces/:spaceId/details` | Match |
| Edit space | SpaceDetails → EditSpace | `/spaces/:spaceId/edit` | Match |

## Auth / onboarding journeys

```
Login → OTP → (Profile gate) → My Spaces
My Spaces → Create Space → Space
My Spaces → Join Space → Accept Invitations → Space
My Spaces → Accept Invitations → Space
Complete Profile → My Spaces / Space
```

Web mirrors this via public routes + gates. **Match.**

## Dashboard drilldowns

| From | Mobile target | Web target | Status |
|------|---------------|------------|--------|
| Pending actions card | DashboardPendingActions | PendingActionsPage | Match |
| Occupancy card | DashboardOccupancyList | OccupancyListPage | Match |
| Bed inventory | DashboardBedInventory | BedInventoryPage | Match |
| Space health | DashboardSpaceHealth | SpaceHealthPage | Match |
| Meal headcount | Headcount sheet / meals | MealHeadcountPage | Match |
| Quick Inventory | InventoryDashboard | InventoryWorkspace | Match |
| Notification deep link | type → screen | `navigateFromNotificationType` | Match |

## Members journeys

```
Members → Add Member → save → Members
Members → Invite → dialog → Members
Members → Member Details → Edit → save → Details
Members → Details → Documents (add/delete) ✅
Members → Details → Status change ✅
Members → Details → Deposit edit ✅
Members → Details → Emergency contact edit ✅
Members → Details → Notes → add
Members → Details → Subscription panel → purchase / end / history
Members → Details → Occupancy history → Occupancy Wizard
Members → Import Existing → select → import
Members → Add Customers Hub → invite/create paths
```

Web uses workspace + drawers/inspectors. Phase 1 member editors are present in `MemberProfilePanel`.

## Accommodation journeys

```
Accommodation Home → Building → Floor → Unit → Room → Bed
Any entity → Form (create/edit) → back
Quick Setup Wizard → execute → hierarchy
Entity → Duplicate (building/floor/room) ✅
Entity → Lifecycle deactivate/restore/delete
Bed / room → Occupancy Wizard
```

Web consolidates hierarchy into AccommodationWorkspace + EntityInspector/FormDrawer. Duplicate present via `DuplicateEntityDialog`.

## Occupancy wizard

```
Entry (member / bed / room / dashboard) →
  Member picker (if needed) →
  Dates / terms →
  Review →
  Submit →
  Back to source
Flows: allocate | reserve | move-in | transfer | vacate | cancel reservation
```

**Match** on web OccupancyWizardPage.

## Meals journeys

```
Meals Home → Daily menu edit → Select combo → Publish/share
Menu Library → Combo form
Delivery locations CRUD
Share preview → Poll response (tenant)
Subscription plans → Activation requests
Customer plans (tenant) → activate
Day meal payments → detail → approve/reject/remind | bulk pay
Participation (owner)
```

Web consolidates planner + drawers; named “SelectMenuHub” page absent but flow covered. **~Match.**

## Payments journeys

```
Owner Payments → Members / Review / History tabs → Payment detail → review
Tenant Payments → submit proof / day meal pay
Sync month (owner)
```

**Match.**

## Complaints journeys

```
List → Raise → Detail
Detail → assign / progress / resolve / close / reopen / comment / photos
```

Web: workspace + RaiseComplaintDrawer + ComplaintInspector. **Match.**

## Inventory journeys

```
Dashboard → Catalog / Categories / Suppliers / Transactions tabs
Item → Details → Edit / Stock move
Add category / supplier
Delete item/category   [SHARED GAP — UI]
```

**Match** except shared delete UI.

## Global (outside space)

```
My Spaces → Global Attention
My Spaces → Global Activity
```

**Match.**

## Deep links / notification routing

Both apps map notification types to domain screens (payments, meals, complaints, occupancy, members, etc.). Web uses `navigateFromNotificationType`. **Match** for wired types; resolve action shared gap.

## Back / cancel behavior

| Pattern | Mobile | Web | Notes |
|---------|--------|-----|-------|
| Stack pop | `navigation.goBack` | router history / close drawer | Equivalent |
| Wizard cancel | leave wizard | leave OccupancyWizardPage | Match |
| Drawer dismiss | N/A / sheet | SidePanel close | Match |
| Unsaved form | alerts where implemented | confirm where implemented | Spot-check per form |

---

## Navigation gaps summary

1. ~~No dedicated Space Health route/page (card-only).~~ ✅ Phase 3  
2. ~~Meal headcount deep link lands on planner, not a headcount detail surface.~~ ✅ Phase 3  
3. ~~Member detail subflows for documents / status / deposit / emergency contact.~~ ✅ Phase 1  
4. ~~Accommodation duplicate subflows.~~ ✅ Phase 2
