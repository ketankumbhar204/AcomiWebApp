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
    value.minPrice != null ||
    value.maxPrice != null;

  const amenities = useMemo(() => {
    if (amenityOptions.length > 0) return amenityOptions;
    return DEFAULT_DISCOVER_AMENITIES.map((item) => ({ code: item.code, label: item.label }));
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
      <Typography sx={{ fontSize: '0.8125rem', lineHeight: 1.6, color: colors.textSecondary }}>
        {t('spaces.findPlace.tabs.messFiltersHint')}
      </Typography>
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
  if (category === 'mess') {
    return null;
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
