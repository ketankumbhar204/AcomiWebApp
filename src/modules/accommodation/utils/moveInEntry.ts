import type { SpaceType } from '@/shared/types/space';
import { getAllowedTargetTypes } from '@/modules/accommodation/utils/occupancyRules';

/**
 * PG/Hostel Move In starts on vacant beds until a bed is chosen.
 * Spaces that also allocate by room (co-living) or unit stay in the wizard
 * so the target-type search can run without a preselected bed.
 */
export function allocateNeedsVacantBedPick(
  mode: string,
  ids?: { bedId?: string | null; roomId?: string | null; unitId?: string | null },
  spaceType?: SpaceType | null,
): boolean {
  if (mode !== 'ALLOCATE') {
    return false;
  }
  if (ids?.bedId || ids?.unitId || ids?.roomId) {
    return false;
  }
  if (!spaceType) {
    // Wait for space type before forcing the bed-inventory detour.
    return false;
  }
  const allowed = getAllowedTargetTypes(spaceType);
  return allowed.length === 1 && allowed[0] === 'BED';
}

export function bedIsSelectableForMoveIn(status: string | null | undefined): boolean {
  return status === 'AVAILABLE';
}
