import type { PropertyLayoutMode } from '@/shared/types/accommodation';
import type { SpaceType } from '@/shared/types/space';

export type AccommodationUiProfile = {
  layoutMode: PropertyLayoutMode;
  showFloors: boolean;
  showUnits: boolean;
  showUnitsOnFloor: boolean;
  showRoomsUnderFloor: boolean;
  showRoomsUnderUnit: boolean;
  showBeds: boolean;
};

export function defaultLayoutModeForSpaceType(spaceType: SpaceType): PropertyLayoutMode {
  switch (spaceType) {
    case 'PG':
    case 'HOSTEL':
      return 'CORRIDOR_PG';
    case 'CO_LIVING':
      return 'CO_LIVING';
    case 'RENTAL':
      return 'RENTAL';
    default:
      return 'CORRIDOR_PG';
  }
}

export function getAccommodationUiProfile(
  spaceType: SpaceType,
  layoutMode?: PropertyLayoutMode | null,
): AccommodationUiProfile | null {
  if (spaceType === 'MESS') {
    return null;
  }

  const mode = layoutMode ?? defaultLayoutModeForSpaceType(spaceType);

  switch (mode) {
    case 'CORRIDOR_PG':
      return {
        layoutMode: mode,
        showFloors: true,
        showUnits: false,
        showUnitsOnFloor: false,
        showRoomsUnderFloor: true,
        showRoomsUnderUnit: false,
        showBeds: true,
      };
    case 'APARTMENT_PG':
      return {
        layoutMode: mode,
        showFloors: true,
        showUnits: false,
        showUnitsOnFloor: true,
        showRoomsUnderFloor: false,
        showRoomsUnderUnit: true,
        showBeds: true,
      };
    case 'CO_LIVING':
      return {
        layoutMode: mode,
        showFloors: false,
        showUnits: true,
        showUnitsOnFloor: false,
        showRoomsUnderFloor: false,
        showRoomsUnderUnit: true,
        showBeds: true,
      };
    case 'RENTAL':
      return {
        layoutMode: mode,
        showFloors: false,
        showUnits: true,
        showUnitsOnFloor: false,
        showRoomsUnderFloor: false,
        showRoomsUnderUnit: false,
        showBeds: false,
      };
    default:
      return null;
  }
}

export function selectableLayoutModes(spaceType: SpaceType): PropertyLayoutMode[] {
  if (spaceType === 'PG' || spaceType === 'HOSTEL') {
    return ['CORRIDOR_PG', 'APARTMENT_PG'];
  }
  if (spaceType === 'CO_LIVING') {
    return ['CO_LIVING'];
  }
  if (spaceType === 'RENTAL') {
    return ['RENTAL'];
  }
  return [];
}
