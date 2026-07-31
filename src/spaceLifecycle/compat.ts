import type { SpacePermissionsResponse, SpaceType } from '@/shared/types/space';
import type { PredicateContext } from './types';

/** Empty / zeroed predicate snapshot — useful before signals load. */
export function emptyPredicateContext(
  spaceType: SpaceType,
  permissions: SpacePermissionsResponse,
  overrides?: Partial<PredicateContext>,
): PredicateContext {
  return {
    spaceType,
    spaceExists: true,
    buildingCount: 0,
    floorCount: 0,
    unitCount: 0,
    roomCount: 0,
    bedCount: 0,
    memberCount: 0,
    hasMealLibrary: false,
    hasTodaysMenuPlanned: false,
    hasMenuShared: false,
    deliveryLocationCount: 0,
    pendingActionCount: 0,
    hasOperationalSignal: false,
    permissions,
    dismissedOptionalMilestoneIds: [],
    ...overrides,
  };
}
