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
  { code: 'WIFI', label: 'Wi-Fi', labelKey: 'spaces.findPlace.filterOptions.amenity.WIFI' },
  { code: 'FOOD_INCLUDED', label: 'Meals', labelKey: 'spaces.findPlace.filterOptions.amenity.FOOD_INCLUDED' },
  {
    code: 'WASHING_MACHINE',
    label: 'Laundry / Washing machine',
    labelKey: 'spaces.findPlace.filterOptions.amenity.WASHING_MACHINE',
  },
  { code: 'PARKING', label: 'Parking', labelKey: 'spaces.findPlace.filterOptions.amenity.PARKING' },
  { code: 'HOUSEKEEPING', label: 'Housekeeping', labelKey: 'spaces.findPlace.filterOptions.amenity.HOUSEKEEPING' },
  { code: 'POWER_BACKUP', label: 'Power Backup', labelKey: 'spaces.findPlace.filterOptions.amenity.POWER_BACKUP' },
  { code: 'AC', label: 'AC', labelKey: 'spaces.findPlace.filterOptions.amenity.AC' },
  { code: 'KITCHEN', label: 'Kitchen', labelKey: 'spaces.findPlace.filterOptions.amenity.KITCHEN' },
  { code: 'CCTV', label: 'CCTV / Security', labelKey: 'spaces.findPlace.filterOptions.amenity.CCTV' },
  { code: 'RO_WATER', label: 'RO water', labelKey: 'spaces.findPlace.filterOptions.amenity.RO_WATER' },
  { code: 'HOT_WATER', label: 'Hot water', labelKey: 'spaces.findPlace.filterOptions.amenity.HOT_WATER' },
  { code: 'REFRIGERATOR', label: 'Refrigerator', labelKey: 'spaces.findPlace.filterOptions.amenity.REFRIGERATOR' },
  { code: 'WARDROBE', label: 'Wardrobe', labelKey: 'spaces.findPlace.filterOptions.amenity.WARDROBE' },
] as const;

export const DISCOVER_GENDERS: readonly { id: GenderPolicy; label: string; labelKey: string }[] = [
  { id: 'MALE', label: 'Gents', labelKey: 'spaces.findPlace.filterOptions.gender.MALE' },
  { id: 'FEMALE', label: 'Ladies', labelKey: 'spaces.findPlace.filterOptions.gender.FEMALE' },
  { id: 'MIXED', label: 'Gents & Ladies', labelKey: 'spaces.findPlace.filterOptions.gender.MIXED' },
];

export const DISCOVER_SHARINGS = [
  { id: 'SINGLE', label: 'Single', labelKey: 'spaces.findPlace.filterOptions.sharing.SINGLE' },
  { id: 'TWO', label: '2 Sharing', labelKey: 'spaces.findPlace.filterOptions.sharing.TWO' },
  { id: 'THREE', label: '3 Sharing', labelKey: 'spaces.findPlace.filterOptions.sharing.THREE' },
  { id: 'FOUR', label: '4 Sharing', labelKey: 'spaces.findPlace.filterOptions.sharing.FOUR' },
  { id: 'FIVE', label: '5 Sharing', labelKey: 'spaces.findPlace.filterOptions.sharing.FIVE' },
  { id: 'SIX_PLUS', label: '6+ Sharing', labelKey: 'spaces.findPlace.filterOptions.sharing.SIX_PLUS' },
] as const;

export const DISCOVER_FOODS = [
  { id: 'INCLUDED', label: 'Food Included', labelKey: 'spaces.findPlace.filterOptions.food.INCLUDED' },
  { id: 'AVAILABLE', label: 'Food Available', labelKey: 'spaces.findPlace.filterOptions.food.AVAILABLE' },
  { id: 'NONE', label: 'No Food', labelKey: 'spaces.findPlace.filterOptions.food.NONE' },
] as const;

export const DISCOVER_FURNISHINGS = [
  { id: 'FULL', label: 'Fully Furnished', labelKey: 'spaces.findPlace.filterOptions.furnishing.FULL' },
  { id: 'SEMI', label: 'Semi Furnished', labelKey: 'spaces.findPlace.filterOptions.furnishing.SEMI' },
  {
    id: 'UNFURNISHED',
    label: 'Unfurnished',
    labelKey: 'spaces.findPlace.filterOptions.furnishing.UNFURNISHED',
  },
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
