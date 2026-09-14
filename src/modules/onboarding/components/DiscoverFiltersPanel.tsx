import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { spaceTypeLabelKey } from '@/modules/onboarding/components/createSpace/createSpaceVisuals';
import { colors } from '@/shared/theme/colors';
import type { SpaceType } from '@/shared/types/space';

/** Stay listings (public /places) — excludes Mess. */
export const PLACE_SPACE_TYPES: SpaceType[] = ['PG', 'HOSTEL', 'CO_LIVING', 'RENTAL'];

/** Same Pune areas as public /places and /meals filter sidebars. */
export const PUNE_DISCOVER_LOCALITIES = [
  'Aundh',
  'Balewadi',
  'Baner',
  'Hadapsar',
  'Hinjawadi',
  'Kharadi',
  'Kothrud',
  'Shivajinagar',
  'Viman Nagar',
  'Wakad',
] as const;

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

export const RATING_PRESETS = [
  { id: '45', label: '4.5+', value: 4.5 },
  { id: '40', label: '4.0+', value: 4.0 },
  { id: '35', label: '3.5+', value: 3.5 },
] as const;

export type DiscoverCategory = 'places' | 'mess';

export type DiscoverFilterState = {
  types: SpaceType[];
  localities: string[];
  amenities: string[];
  /** Places monthly price bounds (null = unbound). */
  minPrice: number | null;
  maxPrice: number | null;
  /** Mess monthly / per-meal bounds. */
  minMonthly: number | null;
  maxMonthly: number | null;
  minMeal: number | null;
  maxMeal: number | null;
  minRating: number | null;
};

export const EMPTY_DISCOVER_FILTERS: DiscoverFilterState = {
  types: [],
  localities: [],
  amenities: [],
  minPrice: null,
  maxPrice: null,
  minMonthly: null,
  maxMonthly: null,
  minMeal: null,
  maxMeal: null,
  minRating: null,
};

type DiscoverFiltersPanelProps = {
  category: DiscoverCategory;
  value: DiscoverFilterState;
  localities?: string[];
  amenityOptions: Array<{ code: string; label: string }>;
  onChange: (next: DiscoverFilterState) => void;
  onClear?: () => void;
};

function toggleValue<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
}

function formatInr(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

function FilterGroup({
  legend,
  children,
}: {
  legend: string;
  children: ReactNode;
}) {
  return (
    <Box component="fieldset" sx={{ border: 0, m: 0, p: 0 }}>
      <Typography
        component="legend"
        sx={{
          fontSize: '0.68rem',
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: colors.muted,
          mb: 1.25,
        }}
      >
        {legend}
      </Typography>
      <Box sx={{ mt: 0.5 }}>{children}</Box>
    </Box>
  );
}

function DualRangeSlider({
  minBound,
  maxBound,
  minValue,
  maxValue,
  step,
  format,
  onChange,
}: {
  minBound: number;
  maxBound: number;
  minValue: number | null;
  maxValue: number | null;
  step: number;
  format: (value: number) => string;
  onChange: (min: number | null, max: number | null) => void;
}) {
  const min = minValue ?? minBound;
  const max = maxValue ?? maxBound;

  return (
    <Box sx={{ px: 0.5 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textPrimary }}>
          {format(min)}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: colors.textPrimary }}>
          {format(max)}
        </Typography>
      </Stack>
      <Slider
        value={[min, max]}
        min={minBound}
        max={maxBound}
        step={step}
        onChange={(_, next) => {
          const [nextMin, nextMax] = next as number[];
          onChange(
            nextMin <= minBound ? null : nextMin,
            nextMax >= maxBound ? null : nextMax,
          );
        }}
        valueLabelDisplay="off"
        sx={{
          color: colors.primary,
          height: 6,
          '& .MuiSlider-thumb': {
            width: 18,
            height: 18,
            bgcolor: colors.primary,
            border: '2px solid #fff',
          },
          '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.7)', opacity: 1 },
          '& .MuiSlider-track': { bgcolor: colors.primary, border: 'none' },
        }}
      />
    </Box>
  );
}

/**
 * Public-website filters including price range + rating (UI parity with /places & /meals).
 */
export function DiscoverFiltersPanel({
  category,
  value,
  localities = [],
  amenityOptions,
  onChange,
  onClear,
}: DiscoverFiltersPanelProps) {
  const { t } = useTranslation();
  const hasActive =
    value.types.length > 0 ||
    value.localities.length > 0 ||
    value.amenities.length > 0 ||
    value.minPrice != null ||
    value.maxPrice != null ||
    value.minMonthly != null ||
    value.maxMonthly != null ||
    value.minMeal != null ||
    value.maxMeal != null ||
    value.minRating != null;

  const locationOptions = useMemo(() => {
    const merged = new Set<string>([...PUNE_DISCOVER_LOCALITIES, ...localities]);
    return [...merged].sort((a, b) => a.localeCompare(b));
  }, [localities]);

  const amenities = useMemo(() => {
    if (amenityOptions.length > 0) return amenityOptions;
    if (category === 'places') {
      return DEFAULT_DISCOVER_AMENITIES.map((item) => ({ code: item.code, label: item.label }));
    }
    return [];
  }, [amenityOptions, category]);

  const checkSx = {
    py: 0,
    ml: 0,
    mr: 0,
    display: 'flex',
    '& .MuiFormControlLabel-label': {
      fontSize: '0.8125rem',
      color: colors.textPrimary,
    },
    '& .MuiCheckbox-root': {
      color: colors.primary,
      p: 0.5,
      mr: 0.75,
    },
  } as const;

  return (
    <Stack spacing={3}>
      <FilterGroup legend={t('spaces.findPlace.filters.location')}>
        <Stack spacing={0.75}>
          {locationOptions.map((locality) => (
            <FormControlLabel
              key={locality}
              sx={checkSx}
              control={
                <Checkbox
                  size="small"
                  checked={value.localities.includes(locality)}
                  onChange={() =>
                    onChange({
                      ...value,
                      localities: toggleValue(value.localities, locality),
                    })
                  }
                />
              }
              label={locality}
            />
          ))}
        </Stack>
      </FilterGroup>

      {category === 'places' ? (
        <FilterGroup legend={t('spaces.findPlace.filters.propertyType')}>
          <Stack spacing={0.75}>
            {PLACE_SPACE_TYPES.map((type) => (
              <FormControlLabel
                key={type}
                sx={checkSx}
                control={
                  <Checkbox
                    size="small"
                    checked={value.types.includes(type)}
                    onChange={() =>
                      onChange({
                        ...value,
                        types: toggleValue(value.types, type),
                      })
                    }
                  />
                }
                label={t(spaceTypeLabelKey(type))}
              />
            ))}
          </Stack>
        </FilterGroup>
      ) : null}

      {category === 'places' ? (
        <FilterGroup legend={t('spaces.findPlace.filters.priceRangeMonth')}>
          <DualRangeSlider
            minBound={2000}
            maxBound={25000}
            minValue={value.minPrice}
            maxValue={value.maxPrice}
            step={500}
            format={formatInr}
            onChange={(minPrice, maxPrice) => onChange({ ...value, minPrice, maxPrice })}
          />
        </FilterGroup>
      ) : (
        <>
          <FilterGroup legend={t('spaces.findPlace.filters.monthlyPrice')}>
            <DualRangeSlider
              minBound={1000}
              maxBound={6000}
              minValue={value.minMonthly}
              maxValue={value.maxMonthly}
              step={100}
              format={formatInr}
              onChange={(minMonthly, maxMonthly) =>
                onChange({ ...value, minMonthly, maxMonthly })
              }
            />
          </FilterGroup>
          <FilterGroup legend={t('spaces.findPlace.filters.perMealPrice')}>
            <DualRangeSlider
              minBound={40}
              maxBound={200}
              minValue={value.minMeal}
              maxValue={value.maxMeal}
              step={5}
              format={(v) => `₹${v}`}
              onChange={(minMeal, maxMeal) => onChange({ ...value, minMeal, maxMeal })}
            />
          </FilterGroup>
        </>
      )}

      <FilterGroup legend={t('spaces.findPlace.filters.rating')}>
        <Stack spacing={0.75}>
          {RATING_PRESETS.map((preset) => (
            <FormControlLabel
              key={preset.id}
              sx={checkSx}
              control={
                <Checkbox
                  size="small"
                  checked={value.minRating === preset.value}
                  onChange={() =>
                    onChange({
                      ...value,
                      minRating: value.minRating === preset.value ? null : preset.value,
                    })
                  }
                />
              }
              label={preset.label}
            />
          ))}
        </Stack>
      </FilterGroup>

      {amenities.length > 0 ? (
        <FilterGroup legend={t('spaces.findPlace.filters.amenities')}>
          <Stack spacing={0.75}>
            {amenities.map((amenity) => (
              <FormControlLabel
                key={amenity.code}
                sx={checkSx}
                control={
                  <Checkbox
                    size="small"
                    checked={value.amenities.includes(amenity.code)}
                    onChange={() =>
                      onChange({
                        ...value,
                        amenities: toggleValue(value.amenities, amenity.code),
                      })
                    }
                  />
                }
                label={amenity.label}
              />
            ))}
          </Stack>
        </FilterGroup>
      ) : null}

      {hasActive && onClear ? (
        <Button
          size="small"
          onClick={onClear}
          sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 700, color: colors.teal }}
        >
          {t('spaces.findPlace.filters.clearAll')}
        </Button>
      ) : null}
    </Stack>
  );
}

type ActiveDiscoverFilterChipsProps = {
  category: DiscoverCategory;
  value: DiscoverFilterState;
  amenityOptions: Array<{ code: string; label: string }>;
  onChange: (next: DiscoverFilterState) => void;
  onClearAll: () => void;
};

export function ActiveDiscoverFilterChips({
  category,
  value,
  amenityOptions,
  onChange,
  onClearAll,
}: ActiveDiscoverFilterChipsProps) {
  const { t } = useTranslation();
  const amenityLabel = (code: string) =>
    amenityOptions.find((item) => item.code === code)?.label ??
    DEFAULT_DISCOVER_AMENITIES.find((item) => item.code === code)?.label ??
    code;

  const chips: Array<{ key: string; label: string; onDelete: () => void }> = [];

  if (category === 'places') {
    for (const type of value.types) {
      chips.push({
        key: `type-${type}`,
        label: t(spaceTypeLabelKey(type)),
        onDelete: () => onChange({ ...value, types: value.types.filter((item) => item !== type) }),
      });
    }
    if (value.minPrice != null || value.maxPrice != null) {
      chips.push({
        key: 'price',
        label: `${formatInr(value.minPrice ?? 2000)} – ${formatInr(value.maxPrice ?? 25000)}`,
        onDelete: () => onChange({ ...value, minPrice: null, maxPrice: null }),
      });
    }
  } else {
    if (value.minMonthly != null || value.maxMonthly != null) {
      chips.push({
        key: 'monthly',
        label: `${formatInr(value.minMonthly ?? 1000)} – ${formatInr(value.maxMonthly ?? 6000)}/mo`,
        onDelete: () => onChange({ ...value, minMonthly: null, maxMonthly: null }),
      });
    }
    if (value.minMeal != null || value.maxMeal != null) {
      chips.push({
        key: 'meal',
        label: `₹${value.minMeal ?? 40} – ₹${value.maxMeal ?? 200}/meal`,
        onDelete: () => onChange({ ...value, minMeal: null, maxMeal: null }),
      });
    }
  }

  if (value.minRating != null) {
    chips.push({
      key: 'rating',
      label: `${value.minRating}+`,
      onDelete: () => onChange({ ...value, minRating: null }),
    });
  }

  for (const locality of value.localities) {
    chips.push({
      key: `loc-${locality}`,
      label: locality,
      onDelete: () =>
        onChange({ ...value, localities: value.localities.filter((item) => item !== locality) }),
    });
  }

  for (const code of value.amenities) {
    chips.push({
      key: `amenity-${code}`,
      label: amenityLabel(code),
      onDelete: () =>
        onChange({ ...value, amenities: value.amenities.filter((item) => item !== code) }),
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
      {chips.map((chip) => (
        <Chip
          key={chip.key}
          size="small"
          label={chip.label}
          onDelete={chip.onDelete}
          sx={{
            bgcolor: colors.mintSubtle,
            border: `1px solid ${colors.primary}40`,
            fontWeight: 600,
          }}
        />
      ))}
      <Button
        size="small"
        onClick={onClearAll}
        sx={{ textTransform: 'none', fontWeight: 700, color: colors.teal, minWidth: 0 }}
      >
        {t('spaces.findPlace.filters.clearAll')}
      </Button>
    </Stack>
  );
}
