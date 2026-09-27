import { Box, Stack, Typography } from '@mui/material';
import {
  CalendarDays,
  ClipboardList,
  Clock3,
  IndianRupee,
  Leaf,
  Map,
  MapPin,
  Phone,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  CARD_INFO_KEYS,
  EXTRA_INFO_KEYS,
  MEAL_EXTRA_INFO_KEYS,
  listingInfoFlags,
  listingMealInfoFlags,
  type ListingInfoFlags,
  type ListingInfoSource,
  type MealInfoFlags,
} from '@/shared/utils/listingInfo';

type ListingInfoChipsProps = {
  listing: ListingInfoSource;
  variant: 'card' | 'detail';
  surface?: 'places' | 'meals';
  onEnquire?: () => void;
};

const PLACE_LABELS: Record<keyof ListingInfoFlags, string> = {
  contact: 'spaces.findPlace.infoContact',
  address: 'spaces.findPlace.infoAddress',
  map: 'spaces.findPlace.infoMap',
  rent: 'spaces.findPlace.infoRent',
  amenities: 'spaces.findPlace.infoAmenities',
  food: 'spaces.findPlace.infoFood',
};

const MEAL_LABELS: Record<keyof MealInfoFlags, string> = {
  contact: 'spaces.findPlace.infoContact',
  address: 'spaces.findPlace.infoAddress',
  map: 'spaces.findPlace.infoMap',
  rent: 'spaces.findPlace.infoPrice',
  amenities: 'spaces.findPlace.infoAmenities',
  food: 'spaces.findPlace.infoFood',
  menu: 'spaces.findPlace.infoMenu',
  mealTiming: 'spaces.findPlace.infoMealTiming',
  foodType: 'spaces.findPlace.infoFoodType',
  subscription: 'spaces.findPlace.infoSubscription',
};

const CHIP_ICONS: Record<string, LucideIcon> = {
  contact: Phone,
  address: MapPin,
  map: Map,
  rent: IndianRupee,
  amenities: Sparkles,
  food: UtensilsCrossed,
  menu: ClipboardList,
  mealTiming: Clock3,
  foodType: Leaf,
  subscription: CalendarDays,
};

export function ListingInfoChips({ listing, variant, surface = 'places', onEnquire }: ListingInfoChipsProps) {
  const { t } = useTranslation();
  const compact = variant === 'card';
  const meals = surface === 'meals';
  const mealFlags = meals ? listingMealInfoFlags(listing) : null;
  const placeFlags = meals ? null : listingInfoFlags(listing);
  const flags = mealFlags ?? placeFlags;
  if (!flags) {
    return null;
  }
  const extras = mealFlags
    ? MEAL_EXTRA_INFO_KEYS.filter((key) => mealFlags[key]).map((key) => ({
        key,
        available: true,
        show: true,
      }))
    : EXTRA_INFO_KEYS.filter((key) => placeFlags?.[key]).map((key) => ({
        key,
        available: true,
        show: true,
      }));
  const chips = [
    ...CARD_INFO_KEYS.map((key) => ({
      key,
      available: flags[key],
      show: variant === 'card' || flags[key],
    })),
    ...extras,
  ].filter((item) => item.show);
  if (chips.length === 0) {
    return null;
  }

  return (
    <Stack
      direction="row"
      useFlexGap
      spacing={1}
      sx={{ flexWrap: 'wrap' }}
      aria-label={t('spaces.findPlace.infoAvailable', { defaultValue: 'Information available' })}
    >
      {chips.map((chip) => {
        const label = t(
          meals
            ? MEAL_LABELS[chip.key as keyof MealInfoFlags]
            : PLACE_LABELS[chip.key as keyof ListingInfoFlags],
          { defaultValue: chip.key },
        );
        const Icon = CHIP_ICONS[chip.key] ?? Sparkles;
        return (
          <Stack
            key={chip.key}
            component={onEnquire ? 'button' : 'div'}
            type={onEnquire ? 'button' : undefined}
            onClick={onEnquire}
            direction="row"
            spacing={0.75}
            sx={{
              alignItems: 'center',
              border: chip.available ? '1px solid #C6EBD7' : '1px solid transparent',
              bgcolor: chip.available ? '#fff' : 'rgba(255,255,255,0.5)',
              px: compact ? 1 : 1.25,
              py: compact ? 0.5 : 0.75,
              boxShadow: chip.available ? '0 1px 2px rgba(11,28,22,0.04)' : 'none',
              cursor: onEnquire ? 'pointer' : 'default',
              '&:hover': onEnquire ? { bgcolor: '#F3FBF7' } : undefined,
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: compact ? 20 : 24,
                height: compact ? 20 : 24,
                borderRadius: '8px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: chip.available ? '#E8F8EF' : 'rgba(15,23,42,0.04)',
                color: chip.available ? '#059669' : '#94A3B8',
              }}
            >
              <Icon size={compact ? 12 : 14} />
            </Box>
            <Typography
              sx={{
                fontSize: compact ? '0.6875rem' : '0.75rem',
                fontWeight: 600,
                color: chip.available ? '#0F172A' : '#94A3B8',
                lineHeight: 1.2,
              }}
            >
              {label}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
