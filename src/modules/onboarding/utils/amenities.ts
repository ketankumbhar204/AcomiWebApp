import type { AmenityAssignment, SpaceType } from '@/shared/types/space';

export type AmenityCode =
  | 'WIFI'
  | 'FOOD_INCLUDED'
  | 'WASHING_MACHINE'
  | 'HOT_WATER'
  | 'PARKING'
  | 'REFRIGERATOR'
  | 'HOUSEKEEPING'
  | 'CCTV'
  | 'POWER_BACKUP'
  | 'RO_WATER'
  | 'CUSTOM';

export const PRESET_AMENITY_CODES: readonly AmenityCode[] = [
  'WIFI',
  'FOOD_INCLUDED',
  'WASHING_MACHINE',
  'HOT_WATER',
  'PARKING',
  'REFRIGERATOR',
  'HOUSEKEEPING',
  'CCTV',
  'POWER_BACKUP',
  'RO_WATER',
] as const;

export const MAX_SPACE_AMENITIES = 20;
export const MAX_CUSTOM_AMENITY_LABEL_LENGTH = 120;

export function supportsSpaceAmenities(spaceType: SpaceType | null | undefined): boolean {
  return spaceType === 'PG' || spaceType === 'HOSTEL' || spaceType === 'CO_LIVING';
}

export function presetAmenityLabelKey(code: AmenityCode): string {
  return `spaces.amenities.codes.${code}`;
}

export function normalizeAmenityAssignments(
  amenities: AmenityAssignment[] | null | undefined,
): AmenityAssignment[] {
  if (!amenities?.length) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: AmenityAssignment[] = [];

  for (const raw of amenities) {
    if (!raw?.code?.trim()) {
      continue;
    }
    const code = raw.code.trim().toUpperCase() as AmenityCode;
    const label =
      code === 'CUSTOM'
        ? raw.label?.trim() ?? ''
        : raw.label?.trim() || code.replaceAll('_', ' ');
    if (code === 'CUSTOM' && !label) {
      continue;
    }
    const key = code === 'CUSTOM' ? `CUSTOM::${label.toLowerCase()}` : code;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push({ code, label });
    if (normalized.length >= MAX_SPACE_AMENITIES) {
      break;
    }
  }

  return normalized;
}

export function amenityKey(amenity: AmenityAssignment): string {
  if (amenity.code === 'CUSTOM') {
    return `CUSTOM::${amenity.label.trim().toLowerCase()}`;
  }
  return amenity.code;
}
