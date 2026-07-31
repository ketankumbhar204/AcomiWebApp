# Permission Parity — Mobile vs Web

> Roles compared: **OWNER**, **MANAGER**, **STAFF**, **TENANT**, **CUSTOMER** (and meal-customer variants where applicable).  
> Source of truth: mobile `spacePermissions` / feature gates + matching web gates (`canManage*`, route guards, UI conditionals).

## Legend

| Symbol | Meaning |
|--------|---------|
| V | Visible / actionable |
| H | Hidden |
| D | Disabled / read-only |
| ≈ | Same intent, different control chrome |
| ? | Needs verification on a specific role in QA |

## Cross-cutting gates

| Capability | OWNER | MANAGER | STAFF | TENANT | CUSTOMER | Mobile | Web | Notes |
|------------|-------|---------|-------|--------|----------|--------|-----|-------|
| Enter space shell | V | V | V | V | V | ✅ | ✅ | |
| Edit space settings | V | V? | H | H | H | ✅ | ✅ | Manager depends on space policy |
| Deactivate space | V | H | H | H | H | ✅ | ✅ | |
| Set default space | V | V | V | V | V | ✅ | ✅ | User-level |
| View dashboard | V | V | V | limited | limited | ✅ | ✅ | Tenant/customer dashboards scoped |
| Manage members | V | V | limited | H | H | ✅ | ✅ | Staff often read/invite limited |
| Invite members | V | V | ? | H | H | ✅ | ✅ | |
| Manage accommodation | V | V | limited | H | H | ✅ | ✅ | |
| Occupancy mutations | V | V | ? | H | H | ✅ | ✅ | |
| Manage meals / publish | V | V | ? | H | H | ✅ | ✅ | |
| Respond to meal poll | — | — | — | V | V | ✅ | ✅ | |
| Review payments | V | V | ? | H | H | ✅ | ✅ | |
| Submit payment proof | — | — | — | V | V | ✅ | ✅ | |
| Manage complaints (staff side) | V | V | V | raise only | raise only | ✅ | ✅ | |
| Inventory manage | V | V | ? | H | H | ✅ | ✅ | |
| Notifications | V | V | V | V | V | ✅ | ✅ | Filtered by relevance |

Exact staff capabilities vary by feature flags / space type; both apps should call the same permission helpers. Spot-check STAFF on members invite, meal publish, and payment review during QA.

## Module permission notes

### Members

| Action | Expected roles | Mobile | Web |
|--------|----------------|--------|-----|
| List members | Owner/Manager/(Staff) | ✅ | ✅ |
| Add / edit / remove | Owner/Manager | ✅ | ✅ |
| Invite | Owner/Manager | ✅ | ✅ |
| View own linked member | Tenant/Customer | ✅ | ✅ |
| Documents / status / deposit / emergency | Owner/Manager (`canManageMembers` && not OWNER target) | ✅ | ✅ |

### Accommodation / Occupancy

| Action | Expected roles | Mobile | Web |
|--------|----------------|--------|-----|
| CRUD hierarchy | Owner/Manager | ✅ | ✅ |
| Duplicate | Owner/Manager (`canManageAccommodation`, active entities) | ✅ | ✅ |
| Lifecycle deactivate/restore | Owner/Manager | ✅ | ✅ |
| Occupancy allocate/vacate/etc. | Owner/Manager | ✅ | ✅ |
| Tenant view bed assignment | Tenant | ✅ | ✅ via occupancy/member panels |

### Meals / Payments / Complaints / Inventory

Permission-gated screens and CTAs exist on both sides for owner/manager vs tenant/customer paths. No role **matrix** divergence found beyond the functional gaps already listed (those gaps are missing features, not alternate permission rules).

## Gaps that affect permission UX

1. ~~**Member documents / status / deposit / emergency contact**~~ ✅ Phase 1 — gated with `canManageMembers && role !== 'OWNER'`.  
2. ~~**Accommodation duplicate**~~ ✅ Phase 2 — gated with `canManageAccommodation` and hidden when inactive.  
3. ~~**Space Health page**~~ ✅ Phase 3 — operator-only (`canManageNotifications`); headcount gated by `canManageMeals`.  
4. ~~**Inventory delete / notification resolve**~~ ✅ Phase 4 verified — Mobile has no UI; Web correctly does not invent them.

## Verification checklist (manual QA)

- [ ] OWNER: all management CTAs visible  
- [ ] MANAGER: matches mobile for members, meals, payments, accommodation  
- [ ] STAFF: limited CTAs match mobile (no deactivate space, etc.)  
- [ ] TENANT: payments submit, poll respond, complaints raise; no owner tools  
- [ ] CUSTOMER: meal-customer surfaces only  
- [ ] Switching spaces refreshes role-derived menus
