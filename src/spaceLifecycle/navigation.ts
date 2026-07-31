import type { SetupNavigationTarget } from './types';

/**
 * Maps engine navigation targets to existing web destinations.
 * Ported from mobile spaceLifecycle/navigation.ts.
 */
export type SetupNavDestination =
  | { kind: 'path'; pathBuilder: 'accommodation' | 'members' | 'meals' | 'dashboard' }
  | {
      kind: 'named';
      name:
        | 'quickSetup'
        | 'addMember'
        | 'addCustomersHub'
        | 'menuLibrary'
        | 'menuPlanning'
        | 'menuShare'
        | 'deliveryLocations'
        | 'pendingActions';
    };

export function mapSetupNavigationTarget(
  target: SetupNavigationTarget,
  options?: { spaceType?: string | null },
): SetupNavDestination {
  switch (target) {
    case 'QUICK_SETUP':
      return { kind: 'named', name: 'quickSetup' };
    case 'ACCOMMODATION_HOME':
      return { kind: 'path', pathBuilder: 'accommodation' };
    case 'BUILDING_FORM':
      return { kind: 'path', pathBuilder: 'accommodation' };
    case 'MEMBERS':
      return { kind: 'path', pathBuilder: 'members' };
    case 'ADD_MEMBER':
      return options?.spaceType === 'MESS'
        ? { kind: 'named', name: 'addCustomersHub' }
        : { kind: 'named', name: 'addMember' };
    case 'MENU_LIBRARY':
      return { kind: 'named', name: 'menuLibrary' };
    case 'MENU_PLANNING':
      return { kind: 'named', name: 'menuPlanning' };
    case 'MENU_SHARE':
      return { kind: 'named', name: 'menuShare' };
    case 'DELIVERY_LOCATIONS':
      return { kind: 'named', name: 'deliveryLocations' };
    case 'PENDING_ACTIONS':
      return { kind: 'named', name: 'pendingActions' };
    case 'DASHBOARD':
      return { kind: 'path', pathBuilder: 'dashboard' };
    default: {
      const _exhaustive: never = target;
      return _exhaustive;
    }
  }
}
