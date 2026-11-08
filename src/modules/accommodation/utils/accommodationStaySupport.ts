import type { AllocationTargetType } from '@/shared/types/accommodation';
import type { SpaceType } from '@/shared/types/space';
import { getAllowedTargetTypes } from './occupancyRules';

/** Accommodation SpaceTypes that use Stay Management (not Mess/Tiffin). */
export const ACCOMMODATION_STAY_SPACE_TYPES: readonly SpaceType[] = [
  'PG',
  'HOSTEL',
  'CO_LIVING',
  'RENTAL',
  'CORPORATE_STAY',
] as const;

/**
 * There is no separate SERVICED_APARTMENT SpaceType in the backend enum.
 * Serviced/corporate apartment inventory uses CORPORATE_STAY (unit-level) or RENTAL.
 */
export function isAccommodationStaySpaceType(spaceType: SpaceType | null | undefined): boolean {
  return spaceType != null && (ACCOMMODATION_STAY_SPACE_TYPES as readonly string[]).includes(spaceType);
}

export function stayTypesAvailableForSpace(spaceType: SpaceType | null | undefined): boolean {
  return isAccommodationStaySpaceType(spaceType);
}

export function hasConcreteAllocationTarget(
  spaceType: SpaceType | null | undefined,
  params: { bedId?: string; roomId?: string; unitId?: string },
): boolean {
  if (params.bedId || params.unitId) {
    return true;
  }
  if (params.roomId && spaceType === 'CO_LIVING') {
    return true;
  }
  return false;
}

export function primaryAllocationTargetType(spaceType: SpaceType): AllocationTargetType | null {
  return getAllowedTargetTypes(spaceType)[0] ?? null;
}
