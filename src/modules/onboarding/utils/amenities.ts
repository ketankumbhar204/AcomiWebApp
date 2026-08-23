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
  | 'BEDS'
  | 'WARDROBE'
  | 'CUSTOM';

export const PRESET_AMENITY_CODES: readonly Exclude<AmenityCode, 'CUSTOM'>[] = [
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
  'BEDS',
  'WARDROBE',
] as const;

export const MAX_SPACE_AMENITIES = 20;
export const MAX_CUSTOM_AMENITY_LABEL_LENGTH = 120;

export const PRESET_AMENITY_LABELS: Record<Exclude<AmenityCode, 'CUSTOM'>, string> = {
  WIFI: 'WiFi',
  FOOD_INCLUDED: 'Food',
  WASHING_MACHINE: 'Washing Machine',
  HOT_WATER: 'Hot Water',
  PARKING: 'Parking',
  REFRIGERATOR: 'Refrigerator',
  HOUSEKEEPING: 'Housekeeping',
  CCTV: 'CCTV',
  POWER_BACKUP: 'Power Backup',
  RO_WATER: 'RO Water',
  BEDS: 'Beds',
  WARDROBE: 'Wardrobe / Cupboard',
};

export function supportsSpaceAmenities(spaceType: SpaceType | null | undefined): boolean {
  return spaceType === 'PG' || spaceType === 'HOSTEL' || spaceType === 'CO_LIVING';
}

export function presetAmenityLabelKey(code: AmenityCode): string {
  return `spaces.amenities.codes.${code}`;
}

export function resolvePresetAmenityLabel(
  code: Exclude<AmenityCode, 'CUSTOM'>,
  translate: (key: string, options?: { defaultValue: string }) => string,
): string {
  const fallback = PRESET_AMENITY_LABELS[code];
  const resolved = translate(presetAmenityLabelKey(code), { defaultValue: fallback });
  return !resolved || resolved.startsWith('spaces.amenities.codes.') ? fallback : resolved;
}

function isUnresolvedAmenityLabel(label: string): boolean {
  return label.startsWith('spaces.amenities.codes.');
}

function presetFallbackLabel(code: AmenityCode): string {
  if (code === 'CUSTOM') return '';
  return PRESET_AMENITY_LABELS[code] ?? code.replaceAll('_', ' ');
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
    const trimmed = raw.label?.trim() ?? '';
    const label =
      code === 'CUSTOM'
        ? trimmed
        : !trimmed || isUnresolvedAmenityLabel(trimmed)
          ? presetFallbackLabel(code)
          : trimmed;
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

/** Mobile create-space default: every preset amenity starts selected. */
export function buildAllPresetAmenities(
  labelFor: (code: (typeof PRESET_AMENITY_CODES)[number]) => string,
): AmenityAssignment[] {
  return PRESET_AMENITY_CODES.map((code) => ({
    code,
    label: labelFor(code),
  }));
}
