# Screen Parity Matrix — Mobile vs Web

> Functional completeness only. Web drawers/inspectors count as present when they replace mobile screens with the same actions.

| Module | Screen (Mobile SoT) | Mobile | Web surface | % Complete | Missing / notes |
|--------|---------------------|--------|-------------|------------|-----------------|
| Auth | LoginScreen | ✅ | LoginPage | 100 | — |
| Auth | OtpScreen | ✅ | OtpPage | 100 | — |
| Onboarding | OnboardingChoiceScreen | ✅ | OnboardingChoicePage | 100 | — |
| Onboarding | CreateSpaceScreen | ✅ | CreateSpacePage | 100 | — |
| Onboarding | JoinSpaceScreen | ✅ | JoinSpacePage | 100 | — |
| Onboarding | AcceptInvitationsScreen | ✅ | AcceptInvitationsPage | 100 | — |
| Onboarding | CompleteProfileScreen | ✅ | CompleteProfilePage | 100 | — |
| Onboarding | ProfileCompletionGate | ✅ | ProfileCompletionGate | 100 | — |
| Spaces | MySpacesScreen | ✅ | MySpacesPage | 100 | — |
| Spaces | SpaceDetailsScreen | ✅ | SpaceDetailsPage | 98 | Richer share optional |
| Spaces | EditSpaceScreen | ✅ | EditSpacePage | 100 | Billing + poll closing settings present |
| Spaces | GlobalAttentionListScreen | ✅ | GlobalAttentionPage | 100 | — |
| Spaces | GlobalActivityListScreen | ✅ | GlobalActivityPage | 100 | — |
| Profile | ProfileScreen | ✅ | ProfilePage | 100 | — |
| Dashboard | DashboardScreen | ✅ | DashboardPage | 100 | Phase 3 health + headcount |
| Dashboard | DashboardPendingActionsScreen | ✅ | PendingActionsPage | 100 | — |
| Dashboard | DashboardOccupancyListScreen | ✅ | OccupancyListPage | 100 | — |
| Dashboard | DashboardBedInventoryScreen | ✅ | BedInventoryPage | 100 | — |
| Dashboard | DashboardSpaceHealthScreen | ✅ | SpaceHealthPage | 100 | Phase 3 complete |
| Dashboard | Meal headcount sheet | ✅ | MealHeadcountPage | 100 | Shared slot / mess metric |
| Members | MembersScreen | ✅ | MembersWorkspacePage | 100 | — |
| Members | AddMemberScreen | ✅ | MemberFormDrawer (create) | 100 | — |
| Members | EditMemberScreen | ✅ | MemberFormDrawer (edit) | 100 | — |
| Members | InviteMemberScreen | ✅ | InviteMemberDialog | 100 | — |
| Members | MemberDetailsScreen | ✅ | MemberInspector | 100 | Phase 1 editors complete |
| Members | MemberSubscriptionScreen | ✅ | MemberSubscriptionPanel | 100 | — |
| Members | MemberSubscriptionHistoryScreen | ✅ | Panel history | 100 | — |
| Members | MemberOccupancyHistoryScreen | ✅ | MemberOccupancyPanel | 100 | — |
| Members | AddCustomersHubScreen | ✅ | AddCustomersHubPage | 100 | — |
| Members | ImportExistingPeopleScreen | ✅ | ImportExistingPeoplePage | 100 | — |
| Accommodation | AccommodationHomeScreen | ✅ | AccommodationWorkspacePage | 100 | Consolidated |
| Accommodation | AccommodationBuilderScreen | ✅ | Workspace hierarchy | 100 | — |
| Accommodation | Floors/Units/Rooms/Beds lists | ✅ | Tree + center list | 100 | — |
| Accommodation | *DetailScreen (Building…Bed) | ✅ | EntityInspector | 100 | Duplicate + lifecycle complete |
| Accommodation | *FormScreen | ✅ | EntityFormDrawer | 100 | — |
| Accommodation | QuickSetupWizardScreen | ✅ | QuickSetupWizardPage | 100 | — |
| Accommodation | Duplicate building/floor/room | ✅ | DuplicateEntityDialog | 100 | Phase 2 complete |
| Occupancy | OccupancyWizardScreen | ✅ | OccupancyWizardPage | 100 | — |
| Meals | MealsHome / MenuPlanning | ✅ | MealsPlannerPage | 100 | — |
| Meals | DailyMenuToday / Edit | ✅ | Planner + SlotEditorDrawer | 100 | — |
| Meals | DailyMenuSelectCombo | ✅ | SlotEditorDrawer | 100 | — |
| Meals | SelectMenuHubScreen | ✅ | Planner/slot flow | 95 | No named hub page; behavior folded in |
| Meals | MenuLibraryScreen | ✅ | MenuLibraryPage | 100 | — |
| Meals | MealComboFormScreen | ✅ | MealComboFormDrawer | 100 | — |
| Meals | MealDeliveryLocationsScreen | ✅ | DeliveryLocationsPage | 100 | — |
| Meals | MenuSharePreviewScreen | ✅ | MealSharePage | 100 | — |
| Meals | MealPollResponseScreen | ✅ | MealPollResponsePage | 100 | — |
| Meals | SubscriptionPlansScreen | ✅ | SubscriptionPlansWorkspacePage | 100 | — |
| Meals | SubscriptionActivationRequestsScreen | ✅ | Plans workspace tab | 100 | — |
| Meals | CustomerSubscriptionPlansScreen | ✅ | CustomerSubscriptionPlansPage | 100 | — |
| Meals | MealParticipation (owner) | ✅ | MealParticipationPage | 100 | — |
| Payments | PaymentsScreen (owner) | ✅ | PaymentsWorkspacePage | 100 | — |
| Payments | TenantPaymentsTabScreen | ✅ | TenantPaymentsPage | 100 | — |
| Payments | MemberPaymentsScreen | ✅ | Workspace members tab | 100 | — |
| Payments | PaymentDetailScreen | ✅ | PaymentInspector | 100 | — |
| Payments | PaymentReviewScreen | ✅ | Inspector review actions | 100 | Mobile is shim |
| Payments | PaymentHistoryScreen | ✅ | History tab | 100 | — |
| Payments | DayMealPaymentDetailScreen | ✅ | DayMealPaymentsPage detail | 100 | — |
| Payments | DayMealBulkPayScreen | ✅ | Day meals bulk flow | 100 | — |
| Complaints | ComplaintsListScreen | ✅ | ComplaintsWorkspacePage | 100 | — |
| Complaints | RaiseComplaintScreen | ✅ | RaiseComplaintDrawer | 100 | — |
| Complaints | ComplaintDetailScreen | ✅ | ComplaintInspector | 100 | — |
| Inventory | InventoryDashboardScreen | ✅ | InventoryWorkspacePage | 100 | — |
| Inventory | InventoryItemDetailsScreen | ✅ | ItemInspector | 100 | — |
| Inventory | InventoryItemFormScreen | ✅ | ItemFormDrawer | 100 | — |
| Inventory | InventoryItemsScreen | alias | Workspace catalog | 100 | Deprecated alias on mobile |
| Notifications | SpaceNotificationsScreen | ✅ | NotificationsPage | 100 | Resolve API unused on both (Phase 4 skip) |
| Misc | HomeScreen | unused | — | N/A | Not product navigation |

---

## Rollup by module

| Module | Avg % | Rating |
|--------|------:|--------|
| Auth | 100 | Complete |
| Onboarding / Spaces / Profile | 99 | Complete |
| Dashboard | 100 | Phase 3 complete |
| Members | 100 | Phase 1 complete |
| Accommodation / Occupancy | 100 | Phase 2 duplicate complete |
| Meals | 99 | Complete (IA consolidated) |
| Payments | 100 | Complete |
| Complaints | 100 | Complete |
| Inventory | 100 | Delete API unused on both (Phase 4 skip) |
| Notifications | 100 | Resolve API unused on both (Phase 4 skip) |

**Overall weighted estimate: 100% functional UI parity with Mobile.**  
Shared backend capabilities without Mobile UI (notification resolve, inventory delete) are intentionally not invented on Web.
