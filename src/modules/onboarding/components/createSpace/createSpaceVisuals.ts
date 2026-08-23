import type { ComponentType } from 'react';
import {
  BedDouble,
  Building2,
  Car,
  Cctv,
  Droplets,
  GlassWater,
  House,
  KeyRound,
  Refrigerator,
  Shirt,
  Sparkles,
  Users,
  UtensilsCrossed,
  WashingMachine,
  Wifi,
  Zap,
  type LucideProps,
} from 'lucide-react';
import type { SpaceType } from '@/shared/types/space';
import type { AmenityCode } from '@/modules/onboarding/utils/amenities';
import { colors, spaceTypePalette } from '@/shared/theme/colors';

export const SPACE_TYPE_ORDER: SpaceType[] = ['PG', 'MESS', 'HOSTEL', 'CO_LIVING', 'RENTAL'];

export type SpaceTypeVisual = {
  icon: ComponentType<LucideProps>;
  accent: string;
  tint: string;
  selectedTint: string;
};

export const SPACE_TYPE_VISUAL: Record<SpaceType, SpaceTypeVisual> = {
  PG: { icon: House, ...spaceTypePalette.PG },
  MESS: { icon: UtensilsCrossed, ...spaceTypePalette.MESS },
  HOSTEL: { icon: Building2, ...spaceTypePalette.HOSTEL },
  CO_LIVING: { icon: Users, ...spaceTypePalette.CO_LIVING },
  RENTAL: { icon: KeyRound, ...spaceTypePalette.RENTAL },
};

export type AmenityVisual = {
  icon: ComponentType<LucideProps>;
  accent: string;
  tint: string;
};

export const AMENITY_VISUAL: Record<Exclude<AmenityCode, 'CUSTOM'>, AmenityVisual> = {
  WIFI: { icon: Wifi, accent: '#2563EB', tint: '#EFF6FF' },
  FOOD_INCLUDED: { icon: UtensilsCrossed, accent: '#C2410C', tint: '#FFF7ED' },
  WASHING_MACHINE: { icon: WashingMachine, accent: colors.teal, tint: '#F0FDFA' },
  HOT_WATER: { icon: Droplets, accent: '#0891B2', tint: '#ECFEFF' },
  PARKING: { icon: Car, accent: '#4338CA', tint: '#EEF2FF' },
  REFRIGERATOR: { icon: Refrigerator, accent: '#0369A1', tint: '#F0F9FF' },
  HOUSEKEEPING: { icon: Sparkles, accent: '#BE185D', tint: '#FDF2F8' },
  CCTV: { icon: Cctv, accent: '#7C3AED', tint: '#F5F3FF' },
  POWER_BACKUP: { icon: Zap, accent: '#D97706', tint: '#FFFBEB' },
  RO_WATER: { icon: GlassWater, accent: '#0E7490', tint: '#ECFEFF' },
  BEDS: { icon: BedDouble, accent: '#4F46E5', tint: '#EEF2FF' },
  WARDROBE: { icon: Shirt, accent: colors.teal, tint: '#F0FDFA' },
};

export function spaceTypeI18nKey(type: SpaceType): 'pg' | 'mess' | 'hostel' | 'coLiving' | 'rental' {
  if (type === 'CO_LIVING') return 'coLiving';
  return type.toLowerCase() as 'pg' | 'mess' | 'hostel' | 'rental';
}

export function spaceTypeLabelKey(type: SpaceType): string {
  return `spaces.types.${spaceTypeI18nKey(type)}.label`;
}

export function spaceTypeDescriptionKey(type: SpaceType): string {
  return `spaces.types.${spaceTypeI18nKey(type)}.description`;
}

export type CreateSpaceStepId = 'type' | 'details' | 'amenities' | 'confirm';

export function createSpaceSteps(includeAmenities: boolean): CreateSpaceStepId[] {
  return includeAmenities
    ? ['type', 'details', 'amenities', 'confirm']
    : ['type', 'details', 'confirm'];
}
