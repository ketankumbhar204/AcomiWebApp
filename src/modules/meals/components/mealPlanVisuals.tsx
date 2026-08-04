import { Box, Stack, Typography, useTheme } from '@mui/material';
import { Check, Drumstick, Egg, Leaf, Sparkles, UtensilsCrossed, X } from 'lucide-react';
import type { LucideIcon, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';

export function foodTypeTone(foodType?: string | null): 'success' | 'warning' | 'info' | 'neutral' {
  if (foodType === 'VEG') return 'success';
  if (foodType === 'EGG') return 'warning';
  if (foodType === 'NON_VEG') return 'info';
  return 'neutral';
}

export function foodTypeIcon(foodType?: string | null): LucideIcon {
  if (foodType === 'EGG') return Egg;
  if (foodType === 'NON_VEG') return Drumstick;
  return Leaf;
}

export const MEAL_PLAN_NOTES_MAX = 250;

const hideScrollbarSx = {
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
} as const;

export { hideScrollbarSx };

type MealPlanSelectableCardProps = {
  selected: boolean;
  disabled?: boolean;
  onToggle?: () => void;
  /** `extra` uses dashed border + Extra pill + soft amber/mint tint. */
  variant?: 'menu' | 'extra';
  name: string;
  foodType?: string | null;
  subtitle?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  /** Custom leading icon; defaults to food-type / utensils. */
  icon?: LucideIcon;
  showCheckbox?: boolean;
};

/** Modern selectable meal / extra card — Dashboard surfaces + 150ms hover elevation. */
export function MealPlanSelectableCard({
  selected,
  disabled = false,
  onToggle,
  variant = 'menu',
  name,
  foodType,
  subtitle,
  meta,
  trailing,
  icon,
  showCheckbox = true,
}: MealPlanSelectableCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const isExtra = variant === 'extra';
  const FoodIcon = icon ?? (isExtra ? Sparkles : foodType ? foodTypeIcon(foodType) : UtensilsCrossed);
  const interactive = Boolean(onToggle) && !disabled;

  return (
    <Box
      component={interactive ? 'button' : 'div'}
      type={interactive ? 'button' : undefined}
      disabled={interactive ? disabled : undefined}
      onClick={interactive ? onToggle : undefined}
      sx={{
        all: interactive ? 'unset' : undefined,
        boxSizing: 'border-box',
        width: '100%',
        cursor: interactive ? 'pointer' : 'default',
        display: 'flex',
        gap: 1.1,
        alignItems: 'center',
        p: 1.25,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1.5px solid ${selected ? colors.primary : s.border}`,
        borderStyle: isExtra && !selected ? 'dashed' : 'solid',
        bgcolor: selected
          ? s.selected
          : isExtra
            ? theme.palette.mode === 'dark'
              ? s.elevated
              : `${colors.primary}08`
            : s.surface,
        boxShadow: selected ? s.shadow : 'none',
        transition: DASHBOARD_UX.transition,
        opacity: disabled ? 0.65 : 1,
        '&:hover': interactive
          ? {
              boxShadow: s.shadowHover,
              borderColor: selected ? colors.primary : `${colors.primary}88`,
              bgcolor: selected ? s.selected : s.hover,
            }
          : undefined,
      }}
    >
      {showCheckbox ? (
        <Box
          sx={{
            width: 18,
            height: 18,
            borderRadius: '5px',
            border: `2px solid ${selected ? colors.primary : s.textMuted}`,
            bgcolor: selected ? colors.primary : 'transparent',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {selected ? <Check size={11} strokeWidth={3} /> : null}
        </Box>
      ) : null}

      <Box
        sx={{
          width: DASHBOARD_UX.iconWell + 14,
          height: DASHBOARD_UX.iconWell + 14,
          borderRadius: `${DASHBOARD_UX.tileRadius}px`,
          bgcolor: selected ? `${colors.primary}22` : s.elevated,
          color: selected ? colors.primaryDark : colors.primaryDark,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <FoodIcon size={18} />
      </Box>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }} noWrap>
            {name}
          </Typography>
          {isExtra ? (
            <StatusChip
              label={t('meals.library.extras', { defaultValue: 'Extra' })}
              tone="info"
              size="small"
            />
          ) : null}
          {foodType ? (
            <StatusChip
              label={t(`meals.foodType.${foodType}`, { defaultValue: String(foodType) })}
              tone={foodTypeTone(foodType)}
            />
          ) : null}
        </Stack>
        {subtitle ? (
          typeof subtitle === 'string' ? (
            <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted, mt: 0.2 }} noWrap>
              {subtitle}
            </Typography>
          ) : (
            subtitle
          )
        ) : null}
        {meta ? (
          typeof meta === 'string' ? (
            <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted, mt: 0.25 }} noWrap>
              {meta}
            </Typography>
          ) : (
            meta
          )
        ) : null}
      </Box>

      {trailing ? <Box sx={{ flexShrink: 0 }}>{trailing}</Box> : null}
    </Box>
  );
}

type MealPlanCompactSelectedCardProps = {
  name: string;
  foodType?: string | null;
  isExtra?: boolean;
  includes?: string;
  priceSlot?: ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
};

/** Compact card for Selected Menu / selected extras list. */
export function MealPlanCompactSelectedCard({
  name,
  foodType,
  isExtra = false,
  includes,
  priceSlot,
  onRemove,
  removeLabel,
}: MealPlanCompactSelectedCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const FoodIcon = isExtra ? Sparkles : foodType ? foodTypeIcon(foodType) : UtensilsCrossed;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.1,
        alignItems: 'center',
        p: 1.25,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        transition: DASHBOARD_UX.transition,
        '&:hover': { boxShadow: s.shadowHover },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: `${DASHBOARD_UX.tileRadius}px`,
          bgcolor: isExtra ? `${colors.primary}12` : `${colors.primary}14`,
          color: colors.primaryDark,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <FoodIcon size={18} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }} noWrap>
            {name}
          </Typography>
          {isExtra ? (
            <StatusChip label={t('meals.library.extras', { defaultValue: 'Extra' })} tone="info" />
          ) : null}
          {foodType ? (
            <StatusChip
              label={t(`meals.foodType.${foodType}`, { defaultValue: String(foodType) })}
              tone={foodTypeTone(foodType)}
            />
          ) : null}
        </Stack>
        {includes ? (
          <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted, mt: 0.2 }} noWrap>
            {includes}
          </Typography>
        ) : null}
      </Box>
      {priceSlot}
      {onRemove ? (
        <Box
          component="button"
          type="button"
          aria-label={removeLabel ?? t('common.remove', { defaultValue: 'Remove' })}
          onClick={onRemove}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            width: 28,
            height: 28,
            borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
            color: s.textMuted,
            transition: DASHBOARD_UX.transition,
            '&:hover': { bgcolor: s.errorTint, color: colors.danger },
          }}
        >
          <X size={16} />
        </Box>
      ) : null}
    </Box>
  );
}

export function formatUnitEach(
  price: number | null | undefined,
  currencyCode?: string | null,
  t?: (key: string, opts?: Record<string, unknown>) => string,
): string | null {
  if (price == null || !(price > 0)) return null;
  const formatted = formatCurrency(price, currencyCode ?? 'INR');
  if (t) {
    return t('meals.poll.priceEach', { defaultValue: '{{price}} each', price: formatted });
  }
  return `${formatted} each`;
}
