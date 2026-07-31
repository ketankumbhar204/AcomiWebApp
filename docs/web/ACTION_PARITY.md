# Action Parity — Mobile vs Web

> Every row is a user-visible action. **Web = Present** means an equivalent control exists (button, menu, drawer CTA), even if placement differs.

| Screen / area | Action | Mobile | Web | Missing |
|---------------|--------|--------|-----|---------|
| Auth | Send OTP | ✅ | ✅ | |
| Auth | Verify OTP | ✅ | ✅ | |
| Profile | Edit / complete profile | ✅ | ✅ | |
| Profile | Logout | ✅ | ✅ | |
| My Spaces | Open space | ✅ | ✅ | |
| My Spaces | Set default space | ✅ | ✅ | |
| My Spaces | Create space | ✅ | ✅ | |
| My Spaces | Join / accept invitations | ✅ | ✅ | |
| My Spaces | Global attention / activity | ✅ | ✅ | |
| Space Details | Edit space | ✅ | ✅ | |
| Space Details | Deactivate space | ✅ | ✅ | |
| Edit Space | Save meal billing settings | ✅ | ✅ | |
| Edit Space | Save poll closing settings | ✅ | ✅ | |
| Dashboard | Refresh | ✅ | ✅ | |
| Dashboard | Open pending actions | ✅ | ✅ | |
| Dashboard | Open occupancy list | ✅ | ✅ | |
| Dashboard | Open bed inventory | ✅ | ✅ | |
| Dashboard | Open space health detail | ✅ | ✅ | |
| Dashboard | Open meal headcount detail | ✅ sheet | ✅ page | |
| Dashboard | Quick → Inventory | ✅ | ✅ | |
| Dashboard | Quick → Payments / Meals / Members | ✅ | ✅ | |
| Pending Actions | Search / filter / open item | ✅ | ✅ | |
| Members | Search / filter / sort / paginate | ✅ | ✅ | |
| Members | Add member | ✅ | ✅ | |
| Members | Edit member | ✅ | ✅ | |
| Members | Invite member | ✅ | ✅ | |
| Members | Remove member | ✅ | ✅ | |
| Members | Import existing people | ✅ | ✅ | |
| Members | Add customers hub | ✅ | ✅ | |
| Members | Update member status | ✅ | ✅ | |
| Members | Manage documents | ✅ | ✅ | |
| Members | Add note | ✅ | ✅ | |
| Members | Edit emergency contact (member) | ✅ | ✅ | |
| Members | Update deposit | ✅ | ✅ | |
| Members | Record meal purchase / end sub | ✅ | ✅ | |
| Members | View meal activity / calendar | ✅ | ✅ | |
| Members | Start occupancy wizard | ✅ | ✅ | |
| Members | Bulk delete | ❌ | ❌ | Neither |
| Accommodation | Create/edit entities | ✅ | ✅ | |
| Accommodation | Bulk create | ✅ | ✅ | |
| Accommodation | Quick setup | ✅ | ✅ | |
| Accommodation | Deactivate / restore / delete | ✅ | ✅ | |
| Accommodation | Duplicate building/floor/room | ✅ | ✅ | |
| Occupancy | Allocate / reserve / move-in | ✅ | ✅ | |
| Occupancy | Transfer / vacate | ✅ | ✅ | |
| Occupancy | Cancel reservation | ✅ | ✅ | |
| Meals | Plan / publish / copy menu | ✅ | ✅ | |
| Meals | Library CRUD + extras | ✅ | ✅ | |
| Meals | Manage delivery locations | ✅ | ✅ | |
| Meals | Share menu | ✅ | ✅ | |
| Meals | Respond to poll | ✅ | ✅ | |
| Meals | Manage subscription plans | ✅ | ✅ | |
| Meals | Approve/reject activation | ✅ | ✅ | |
| Meals | Day meal approve/reject/remind | ✅ | ✅ | |
| Meals | Submit day-meal proof / bulk pay | ✅ | ✅ | |
| Payments | Sync month | ✅ | ✅ | |
| Payments | Submit proof | ✅ | ✅ | |
| Payments | Approve / reject / request update | ✅ | ✅ | |
| Payments | View timeline | ✅ | ✅ | |
| Complaints | Raise | ✅ | ✅ | |
| Complaints | Assign / start / resolve / close / reopen | ✅ | ✅ | |
| Complaints | Comment / internal note / attach photo | ✅ | ✅ | |
| Inventory | Add / edit item | ✅ | ✅ | |
| Inventory | Stock in / out / adjust | ✅ | ✅ | |
| Inventory | Add category / supplier | ✅ | ✅ | |
| Inventory | Delete item / category | ❌ UI | ❌ UI | Shared — Phase 4 skip |
| Notifications | Search / filter | ✅ | ✅ | |
| Notifications | Mark read + navigate | ✅ | ✅ | |
| Notifications | Resolve | ❌ UI | ❌ UI | Shared — Phase 4 skip |
| Common | Refresh | ✅ | ✅ | |
| Common | Retry on error | ✅ | ✅ | |

## Priority missing actions (web only)

All web-only priority actions closed (Phases 1–3).

**Phase 4:** Notification resolve + inventory delete remain **API-only on both platforms**. Do not invent Web UI until Mobile exposes them.
