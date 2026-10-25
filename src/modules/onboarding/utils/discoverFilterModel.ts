import type { GenderPolicy, SpaceType } from '@/shared/types/space';

/** Stay listings (public /places) — excludes Mess. */
export const PLACE_SPACE_TYPES: SpaceType[] = [
  'PG',
  'HOSTEL',
  'CO_LIVING',
  'RENTAL',
  'CORPORATE_STAY',
];

/** Same amenity list as public PropertyFilters when API returns none yet. */
export const DEFAULT_DISCOVER_AMENITIES = [
  { code: 'WIFI', label: 'Wi-Fi' },
  { code: 'FOOD_INCLUDED', label: 'Meals' },
  { code: 'WASHING_MACHINE', label: 'Laundry / Washing machine' },
  { code: 'PARKING', label: 'Parking' },
  { code: 'HOUSEKEEPING', label: 'Housekeeping' },
  { code: 'POWER_BACKUP', label: 'Power Backup' },
  { code: 'AC', label: 'AC' },
  { code: 'KITCHEN', label: 'Kitchen' },
  { code: 'CCTV', label: 'CCTV / Security' },
  { code: 'RO_WATER', label: 'RO water' },
  { code: 'HOT_WATER', label: 'Hot water' },
  { code: 'REFRIGERATOR', label: 'Refrigerator' },
  { code: 'WARDROBE', label: 'Wardrobe' },
] as const;

export const DISCOVER_GENDERS: readonly { id: GenderPolicy; label: string }[] = [
  { id: 'MALE', label: 'Gents' },
  { id: 'FEMALE', label: 'Ladies' },
  { id: 'MIXED', label: 'Gents & Ladies' },
];

export const DISCOVER_SHARINGS = [
  { id: 'SINGLE', label: 'Single' },
  { id: 'TWO', label: '2 Sharing' },
  { id: 'THREE', label: '3 Sharing' },
  { id: 'FOUR', label: '4 Sharing' },
  { id: 'FIVE', label: '5 Sharing' },
  { id: 'SIX_PLUS', label: '6+ Sharing' },
] as const;

export const DISCOVER_FOODS = [
  { id: 'INCLUDED', label: 'Food Included' },
  { id: 'AVAILABLE', label: 'Food Available' },
  { id: 'NONE', label: 'No Food' },
] as const;

export const DISCOVER_FURNISHINGS = [
  { id: 'FULL', label: 'Fully Furnished' },
  { id: 'SEMI', label: 'Semi Furnished' },
  { id: 'UNFURNISHED', label: 'Unfurnished' },
] as const;

export type DiscoverCategory = 'places' | 'mess';

export type DiscoverFilterState = {
  types: SpaceType[];
  amenities: string[];
  genders: GenderPolicy[];
  sharings: string[];
  foods: string[];
  furnishings: string[];
  contactAvailable: boolean;
  servicedApartment: boolean;
  mealTypes: Array<'BREAKFAST' | 'LUNCH' | 'DINNER'>;
  foodTypes: Array<'VEG' | 'NON_VEG' | 'EGG'>;
  minPrice: number | null;
  maxPrice: number | null;
};

export const EMPTY_DISCOVER_FILTERS: DiscoverFilterState = {
  types: [],
  amenities: [],
  genders: [],
  sharings: [],
  foods: [],
  furnishings: [],
  contactAvailable: false,
  servicedApartment: false,
  mealTypes: [],
  foodTypes: [],
  minPrice: null,
  maxPrice: null,
};
