import type { AccommodationStatus, PropertyLayoutMode } from '@/shared/types/accommodation';

import building from '@/assets/accommodation/illustrations/buildings/building.png';
import floor from '@/assets/accommodation/illustrations/floors/floor.png';
import corridorFloor from '@/assets/accommodation/illustrations/floors/corridor_floor.png';
import unitSmall from '@/assets/accommodation/illustrations/units/small_unit.png';
import unitMedium from '@/assets/accommodation/illustrations/units/unit_medium.png';
import unitLarge from '@/assets/accommodation/illustrations/units/unit_large.png';
import roomSingle from '@/assets/accommodation/illustrations/rooms/room_single.png';
import roomDouble from '@/assets/accommodation/illustrations/rooms/room_double.png';
import roomTriple from '@/assets/accommodation/illustrations/rooms/room_tripple.png';
import roomQuad from '@/assets/accommodation/illustrations/rooms/room_qaud.png';
import roomFiveBeds from '@/assets/accommodation/illustrations/rooms/room_five_beds.png';
import roomSixBeds from '@/assets/accommodation/illustrations/rooms/room_six_bed.png';
import bedAvailable from '@/assets/accommodation/illustrations/beds/bed-available.png';
import bedReserved from '@/assets/accommodation/illustrations/beds/bed-reserved.png';
import bedOccupied from '@/assets/accommodation/illustrations/beds/bed-occupied.png';
import bedMaintenance from '@/assets/accommodation/illustrations/beds/bed-maintenance.png';

/** Existing illustration library — do not generate or substitute icons. Ported from Mobile. */
export const accommodationIllustrations = {
  building,
  floor,
  corridorFloor,
  unitSmall,
  unitMedium,
  unitLarge,
  roomSingle,
  roomDouble,
  roomTriple,
  roomQuad,
  roomFiveBeds,
  roomSixBeds,
  bedAvailable,
  bedReserved,
  bedOccupied,
  bedMaintenance,
} as const;

export type IllustrationSrc = string;

export function getBuildingIllustration(): IllustrationSrc {
  return accommodationIllustrations.building;
}

export function getFloorIllustration(layoutMode?: PropertyLayoutMode | string): IllustrationSrc {
  if (layoutMode === 'CORRIDOR_PG') {
    return accommodationIllustrations.corridorFloor;
  }
  return accommodationIllustrations.floor;
}

/** Corridor floor art is panoramic (~3:1) — use the wide LayoutIllustration frame. */
export function isWideFloorIllustration(layoutMode?: PropertyLayoutMode | string): boolean {
  return layoutMode === 'CORRIDOR_PG';
}

export function getUnitIllustration(roomCount: number, bedCount: number): IllustrationSrc {
  if (roomCount <= 4 || bedCount <= 20) {
    return accommodationIllustrations.unitSmall;
  }
  if (roomCount <= 8 || bedCount <= 40) {
    return accommodationIllustrations.unitMedium;
  }
  return accommodationIllustrations.unitLarge;
}

export function getRoomIllustration(capacity: number): IllustrationSrc {
  switch (capacity) {
    case 1:
      return accommodationIllustrations.roomSingle;
    case 2:
      return accommodationIllustrations.roomDouble;
    case 3:
      return accommodationIllustrations.roomTriple;
    case 4:
      return accommodationIllustrations.roomQuad;
    case 5:
      return accommodationIllustrations.roomFiveBeds;
    default:
      return accommodationIllustrations.roomSixBeds;
  }
}

export function getBedIllustration(status: AccommodationStatus): IllustrationSrc {
  switch (status) {
    case 'AVAILABLE':
      return accommodationIllustrations.bedAvailable;
    case 'RESERVED':
      return accommodationIllustrations.bedReserved;
    case 'OCCUPIED':
      return accommodationIllustrations.bedOccupied;
    case 'MAINTENANCE':
    case 'BLOCKED':
      return accommodationIllustrations.bedMaintenance;
    default:
      return accommodationIllustrations.bedAvailable;
  }
}

/** Layout mode picker preview — mirrors Mobile PropertyLayoutModePicker. */
export function getLayoutModeIllustration(mode: PropertyLayoutMode): IllustrationSrc {
  if (mode === 'CORRIDOR_PG') {
    return accommodationIllustrations.corridorFloor;
  }
  return accommodationIllustrations.floor;
}
