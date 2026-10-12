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
import {
  DEFAULT_DISCOVER_AMENITIES,
  DISCOVER_FOODS,
  DISCOVER_FURNISHINGS,
  DISCOVER_GENDERS,
  DISCOVER_SHARINGS,
  PLACE_SPACE_TYPES,
  type DiscoverCategory,
  type DiscoverFilterState,
} from '@/modules/onboarding/utils/discoverFilterModel';
import { colors } from '@/shared/theme/colors';

type DiscoverFiltersPanelProps = {
  category: DiscoverCategory;
  value: DiscoverFilterState;
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
          const range = next as number[];
          const nextMin = range[0];
          const nextMax = range[1];
          if (nextMin === undefined || nextMax === undefined) return;
          onChange(nextMin <= minBound ? null : nextMin, nextMax >= maxBound ? null : nextMax);
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
 * Places filters that the discover API can apply. Mess uses location + search only.
 */
export function DiscoverFiltersPanel({
  category,
  value,
  amenityOptions,
  onChange,
  onClear,
}: DiscoverFiltersPanelProps) {
  const { t } = useTranslation();
  const hasActive =
    value.types.length > 0 ||
    value.amenities.length > 0 ||
    value.genders.length > 0 ||
    value.sharings.length > 0 ||
    value.foods.length > 0 ||
    value.furnishings.length > 0 ||
    value.contactAvailable ||
    value.servicedApartment ||
    value.mealTypes.length > 0 ||
    value.foodTypes.length > 0 ||
    value.minPrice != null ||
    value.maxPrice != null;

  const amenities = useMemo(() => {
    const fixed: Array<{ code: string; label: string }> = DEFAULT_DISCOVER_AMENITIES.map((item) => ({
      code: item.code,
      label: item.label,
    }));
    const known = new Set(fixed.map((item) => item.code));
    for (const extra of amenityOptions) {
      if (extra.code && !known.has(extra.code)) {
        fixed.push(extra);
      }
    }
    return fixed;
  }, [amenityOptions]);

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

  if (category === 'mess') {
    return (
      <Stack spacing={3}>
        <FilterGroup legend={t('spaces.findPlace.filters.priceRangeMonth')}>
          <DualRangeSlider
            minBound={500}
            maxBound={10000}
            minValue={value.minPrice}
            maxValue={value.maxPrice}
            step={100}
            format={formatInr}
            onChange={(minPrice, maxPrice) => onChange({ ...value, minPrice, maxPrice })}
          />
        </FilterGroup>
        <FilterGroup legend={t('spaces.findPlace.filters.mealType', { defaultValue: 'Meal type' })}>
          <Stack spacing={0.75}>
            {(
              [
                ['BREAKFAST', 'Breakfast'],
                ['LUNCH', 'Lunch'],
                ['DINNER', 'Dinner'],
              ] as const
            ).map(([id, label]) => (
              <FormControlLabel
                key={id}
                sx={checkSx}
                control={
                  <Checkbox
                    size="small"
                    checked={value.mealTypes.includes(id)}
                    onChange={() =>
                      onChange({ ...value, mealTypes: toggleValue(value.mealTypes, id) })
                    }
                  />
                }
                label={label}
              />
            ))}
          </Stack>
        </FilterGroup>
        <FilterGroup legend={t('spaces.findPlace.filters.foodType', { defaultValue: 'Food type' })}>
          <Stack spacing={0.75}>
            {(
              [
                ['VEG', 'Vegetarian'],
                ['NON_VEG', 'Non-vegetarian'],
                ['EGG', 'Egg'],
              ] as const
            ).map(([id, label]) => (
              <FormControlLabel
                key={id}
                sx={checkSx}
                control={
                  <Checkbox
                    size="small"
                    checked={value.foodTypes.includes(id)}
                    onChange={() =>
                      onChange({ ...value, foodTypes: toggleValue(value.foodTypes, id) })
                    }
                  />
                }
                label={label}
              />
            ))}
          </Stack>
        </FilterGroup>
        <FilterGroup legend={t('spaces.findPlace.filters.more', { defaultValue: 'Contact' })}>
          <FormControlLabel
            sx={checkSx}
            control={
              <Checkbox
                size="small"
                checked={value.contactAvailable}
                onChange={() => onChange({ ...value, contactAvailable: !value.contactAvailable })}
              />
            }
            label={t('spaces.findPlace.filters.contactAvailable', { defaultValue: 'Contact Available' })}
          />
        </FilterGroup>
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

  return (
    <Stack spacing={3}>
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

      <FilterGroup legend={t('spaces.findPlace.filters.gender', { defaultValue: 'Gender' })}>
        <Stack spacing={0.75}>
          {DISCOVER_GENDERS.map((option) => (
            <FormControlLabel
              key={option.id}
              sx={checkSx}
              control={
                <Checkbox
                  size="small"
                  checked={value.genders.includes(option.id)}
                  onChange={() =>
                    onChange({ ...value, genders: toggleValue(value.genders, option.id) })
                  }
                />
              }
              label={option.label}
            />
          ))}
        </Stack>
      </FilterGroup>

      <FilterGroup legend={t('spaces.findPlace.filters.sharing', { defaultValue: 'Sharing' })}>
        <Stack spacing={0.75}>
          {DISCOVER_SHARINGS.map((option) => (
            <FormControlLabel
              key={option.id}
              sx={checkSx}
              control={
                <Checkbox
                  size="small"
                  checked={value.sharings.includes(option.id)}
                  onChange={() =>
                    onChange({ ...value, sharings: toggleValue(value.sharings, option.id) })
                  }
                />
              }
              label={option.label}
            />
          ))}
        </Stack>
      </FilterGroup>

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

      <FilterGroup legend={t('spaces.findPlace.filters.food', { defaultValue: 'Food' })}>
        <Stack spacing={0.75}>
          {DISCOVER_FOODS.map((option) => (
            <FormControlLabel
              key={option.id}
              sx={checkSx}
              control={
                <Checkbox
                  size="small"
                  checked={value.foods.includes(option.id)}
                  onChange={() =>
                    onChange({ ...value, foods: toggleValue(value.foods, option.id) })
                  }
                />
              }
              label={option.label}
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

      <FilterGroup legend={t('spaces.findPlace.filters.furnishing', { defaultValue: 'Furnishing' })}>
        <Stack spacing={0.75}>
          {DISCOVER_FURNISHINGS.map((option) => (
            <FormControlLabel
              key={option.id}
              sx={checkSx}
              control={
                <Checkbox
                  size="small"
                  checked={value.furnishings.includes(option.id)}
                  onChange={() =>
                    onChange({ ...value, furnishings: toggleValue(value.furnishings, option.id) })
                  }
                />
              }
              label={option.label}
            />
          ))}
        </Stack>
      </FilterGroup>

      <FilterGroup legend={t('spaces.findPlace.filters.more', { defaultValue: 'More' })}>
        <Stack spacing={0.75}>
          <FormControlLabel
            sx={checkSx}
            control={
              <Checkbox
                size="small"
                checked={value.contactAvailable}
                onChange={() => onChange({ ...value, contactAvailable: !value.contactAvailable })}
              />
            }
            label={t('spaces.findPlace.filters.contactAvailable', { defaultValue: 'Contact Available' })}
          />
          <FormControlLabel
            sx={checkSx}
            control={
              <Checkbox
                size="small"
                checked={value.servicedApartment}
                onChange={() => onChange({ ...value, servicedApartment: !value.servicedApartment })}
              />
            }
            label={t('spaces.findPlace.filters.servicedApartment', {
              defaultValue: 'Serviced / Corporate Apartment',
            })}
          />
        </Stack>
      </FilterGroup>

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
  if (category === 'mess') {
    const messChips: Array<{ key: string; label: string; onDelete: () => void }> = [];
    if (value.minPrice != null || value.maxPrice != null) {
      messChips.push({
        key: 'price',
        label: `${formatInr(value.minPrice ?? 500)} – ${formatInr(value.maxPrice ?? 10000)}`,
        onDelete: () => onChange({ ...value, minPrice: null, maxPrice: null }),
      });
    }
    const mealLabel: Record<string, string> = { BREAKFAST: 'Breakfast', LUNCH: 'Lunch', DINNER: 'Dinner' };
    const foodLabel: Record<string, string> = { VEG: 'Vegetarian', NON_VEG: 'Non-vegetarian', EGG: 'Egg' };
    for (const slot of value.mealTypes) {
      messChips.push({
        key: `meal-${slot}`,
        label: mealLabel[slot] ?? slot,
        onDelete: () => onChange({ ...value, mealTypes: value.mealTypes.filter((item) => item !== slot) }),
      });
    }
    for (const food of value.foodTypes) {
      messChips.push({
        key: `food-${food}`,
        label: foodLabel[food] ?? food,
        onDelete: () => onChange({ ...value, foodTypes: value.foodTypes.filter((item) => item !== food) }),
      });
    }
    if (value.contactAvailable) {
      messChips.push({
        key: 'contact',
        label: t('spaces.findPlace.filters.contactAvailable', { defaultValue: 'Contact Available' }),
        onDelete: () => onChange({ ...value, contactAvailable: false }),
      });
    }
    if (messChips.length === 0) {
      return null;
    }
    return (
      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        {messChips.map((chip) => (
          <Chip key={chip.key} label={chip.label} onDelete={chip.onDelete} size="small" />
        ))}
        <Button size="small" onClick={onClearAll} sx={{ textTransform: 'none', fontWeight: 700 }}>
          {t('spaces.findPlace.filters.clearAll')}
        </Button>
      </Stack>
    );
  }

  const amenityLabel = (code: string) =>
    amenityOptions.find((item) => item.code === code)?.label ??
    DEFAULT_DISCOVER_AMENITIES.find((item) => item.code === code)?.label ??
    code;

  const chips: Array<{ key: string; label: string; onDelete: () => void }> = [];

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
  for (const code of value.amenities) {
    chips.push({
      key: `amenity-${code}`,
      label: amenityLabel(code),
      onDelete: () =>
        onChange({ ...value, amenities: value.amenities.filter((item) => item !== code) }),
    });
  }
  for (const gender of value.genders) {
    chips.push({
      key: `gender-${gender}`,
      label: DISCOVER_GENDERS.find((item) => item.id === gender)?.label ?? gender,
      onDelete: () => onChange({ ...value, genders: value.genders.filter((item) => item !== gender) }),
    });
  }
  for (const sharing of value.sharings) {
    chips.push({
      key: `sharing-${sharing}`,
      label: DISCOVER_SHARINGS.find((item) => item.id === sharing)?.label ?? sharing,
      onDelete: () => onChange({ ...value, sharings: value.sharings.filter((item) => item !== sharing) }),
    });
  }
  for (const food of value.foods) {
    chips.push({
      key: `food-${food}`,
      label: DISCOVER_FOODS.find((item) => item.id === food)?.label ?? food,
      onDelete: () => onChange({ ...value, foods: value.foods.filter((item) => item !== food) }),
    });
  }
  for (const furnishing of value.furnishings) {
    chips.push({
      key: `furnishing-${furnishing}`,
      label: DISCOVER_FURNISHINGS.find((item) => item.id === furnishing)?.label ?? furnishing,
      onDelete: () =>
        onChange({ ...value, furnishings: value.furnishings.filter((item) => item !== furnishing) }),
    });
  }
  if (value.contactAvailable) {
    chips.push({
      key: 'contact',
      label: t('spaces.findPlace.filters.contactAvailable', { defaultValue: 'Contact Available' }),
      onDelete: () => onChange({ ...value, contactAvailable: false }),
    });
  }
  if (value.servicedApartment) {
    chips.push({
      key: 'serviced',
      label: t('spaces.findPlace.filters.servicedApartment', {
        defaultValue: 'Serviced / Corporate Apartment',
      }),
      onDelete: () => onChange({ ...value, servicedApartment: false }),
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
