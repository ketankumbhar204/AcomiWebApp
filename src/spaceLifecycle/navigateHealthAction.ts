import type { NavigateFunction } from 'react-router-dom';
import type { SpaceType } from '@/shared/types/space';
import {
  spaceAccommodationPath,
  spaceAccommodationQuickSetupPath,
  spaceAddCustomersHubPath,
  spaceBedInventoryPath,
  spaceDashboardPath,
  spaceMealsLibraryPath,
  spaceMealsLocationsPath,
  spaceMealsPath,
  spaceMealsSharePath,
  spaceMembersPath,
  spacePaymentsPath,
  spacePendingActionsPath,
} from '@/routes/paths';
import type { HealthNavAction } from './health/healthActionTargets';
import { mapSetupNavigationTarget } from './navigation';

type NavigateHealthArgs = {
  navigate: NavigateFunction;
  spaceId: string;
  spaceType?: SpaceType | null;
  canViewAccommodation?: boolean;
  canManageMembers?: boolean;
};

/**
 * Resolves Space Health CTAs to web routes (parity with mobile runNavAction).
 */
export function navigateHealthAction(
  action: HealthNavAction,
  args: NavigateHealthArgs,
): void {
  const { navigate, spaceId, spaceType } = args;

  switch (action.kind) {
    case 'pendingActions':
      navigate(spacePendingActionsPath(spaceId));
      return;
    case 'paymentsUnderReview':
      navigate(spacePaymentsPath(spaceId, undefined, { tab: 'review' }));
      return;
    case 'vacantBeds':
      navigate(spaceBedInventoryPath(spaceId, 'AVAILABLE'));
      return;
    case 'occupiedBeds':
      navigate(spaceBedInventoryPath(spaceId, 'OCCUPIED'));
      return;
    case 'setupTarget': {
      const dest = mapSetupNavigationTarget(action.target, { spaceType });
      if (dest.kind === 'path') {
        if (dest.pathBuilder === 'accommodation') {
          if (args.canViewAccommodation === false) return;
          navigate(spaceAccommodationPath(spaceId));
          return;
        }
        if (dest.pathBuilder === 'members') {
          if (args.canManageMembers === false) return;
          navigate(spaceMembersPath(spaceId));
          return;
        }
        if (dest.pathBuilder === 'meals') {
          navigate(spaceMealsPath(spaceId));
          return;
        }
        navigate(spaceDashboardPath(spaceId));
        return;
      }
      switch (dest.name) {
        case 'quickSetup':
          navigate(spaceAccommodationQuickSetupPath(spaceId));
          return;
        case 'addMember':
          navigate(spaceMembersPath(spaceId));
          return;
        case 'addCustomersHub':
          navigate(spaceAddCustomersHubPath(spaceId));
          return;
        case 'menuLibrary':
          navigate(spaceMealsLibraryPath(spaceId));
          return;
        case 'menuPlanning':
          navigate(spaceMealsPath(spaceId));
          return;
        case 'menuShare': {
          const today = new Date().toISOString().slice(0, 10);
          navigate(spaceMealsSharePath(spaceId, today));
          return;
        }
        case 'deliveryLocations':
          navigate(spaceMealsLocationsPath(spaceId));
          return;
        case 'pendingActions':
          navigate(spacePendingActionsPath(spaceId));
          return;
        default:
          return;
      }
    }
    default:
      return;
  }
}
