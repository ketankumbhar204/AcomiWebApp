import type { SpaceType } from '@/shared/types/space';

/** Stay listings (public /places) — excludes Mess. */
export const PLACE_SPACE_TYPES: SpaceType[] = ['PG', 'HOSTEL', 'CO_LIVING', 'RENTAL'];

/** Same amenity list as public PropertyFilters when API returns none yet. */
export const DEFAULT_DISCOVER_AMENITIES = [
  { code: 'WIFI', label: 'Wi-Fi' },
  { code: 'FOOD_INCLUDED', label: 'Meals' },
  { code: 'WASHING_MACHINE', label: 'Laundry' },
  { code: 'PARKING', label: 'Parking' },
  { code: 'HOUSEKEEPING', label: 'Housekeeping' },
  { code: 'POWER_BACKUP', label: 'Power backup' },
  { code: 'CCTV', label: 'CCTV' },
  { code: 'HOT_WATER', label: 'Hot water' },
  { code: 'REFRIGERATOR', label: 'Refrigerator' },
  { code: 'WARDROBE', label: 'Wardrobe' },
] as const;

export type DiscoverCategory = 'places' | 'mess';

export type DiscoverFilterState = {
  types: SpaceType[];
  amenities: string[];
  minPrice: number | null;
  maxPrice: number | null;
};

export const EMPTY_DISCOVER_FILTERS: DiscoverFilterState = {
  types: [],
  amenities: [],
  minPrice: null,
  maxPrice: null,
};
