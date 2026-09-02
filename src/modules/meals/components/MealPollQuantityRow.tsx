import { Box, IconButton, Stack, Typography, useTheme } from '@mui/material';
import { Check, CircleSlash, Drumstick, Egg, Leaf, Minus, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import type { FoodType, MealPollOption } from '@/shared/types/meals';

type MealPollQuantityRowProps = {
  option: MealPollOption;
  quantity: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
  showPrice?: boolean;
  variant?: 'default' | 'extra';
};

function foodTypeIcon(foodType?: FoodType | null): LucideIcon {
  if (foodType === 'EGG') return Egg;
  if (foodType === 'NON_VEG') return Drumstick;
  return Leaf;
}

/**
 * Meal option card — mock layout:
 * wide horizontal tile, checkbox + icon + name,
 * ₹N each + green calc line when selected, stepper on the right.
 */
export function MealPollQuantityRow({
  option,
  quantity,
  onChange,
  disabled = false,
  showPrice = true,
  variant = 'default',
}: MealPollQuantityRowProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const selected = quantity > 0;
  const isExtra = variant === 'extra';
  const unavailable = option.optionType === 'NOT_AVAILABLE';
  const FoodIcon = unavailable ? CircleSlash : foodTypeIcon(option.foodType);
  const unitPrice = option.price != null ? Number(option.price) : null;
  const unitLabel =
    showPrice && unitPrice != null && !Number.isNaN(unitPrice) && !unavailable
      ? formatCurrency(unitPrice, option.currencyCode || 'INR')
      : null;

  const toggle = () => {
    if (disabled || unavailable) return;
    onChange(selected ? 0 : 1);
  };

  return (
    <Box
      role="checkbox"
      aria-checked={selected}
      aria-disabled={disabled || unavailable}
      tabIndex={disabled || unavailable ? -1 : 0}
      onClick={toggle}
      onKeyDown={(e) => {
        if (disabled || unavailable) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      }}
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 0.85,
        width: '100%',
        minHeight: 76,
        p: 1.1,
        borderRadius: 2,
        border: `1.5px solid ${selected ? colors.primary : s.border}`,
        borderStyle: isExtra && !selected ? 'dashed' : 'solid',
        bgcolor: selected ? colors.selected : colors.surface,
        boxShadow: selected ? '0 2px 10px rgba(37, 211, 102, 0.18)' : 'none',
        cursor: disabled || unavailable ? 'not-allowed' : 'pointer',
        opacity: disabled && !selected ? 0.65 : unavailable ? 0.7 : 1,
        transition: DASHBOARD_UX.transition,
        '&:hover':
          disabled || unavailable
            ? undefined
            : {
                borderColor: selected ? colors.primary : `${colors.primary}88`,
                bgcolor: selected ? colors.selected : s.hover,
              },
        '&:focus-visible': {
          outline: `2px solid ${colors.primaryDark}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box
        sx={{
          width: 18,
          height: 18,
          mt: 0.2,
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

      <Stack spacing={0.65} sx={{ flex: 1, minWidth: 0, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={0.65} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: 1.25,
              bgcolor: selected ? `${colors.primary}22` : `${s.textMuted}14`,
              color: selected ? colors.primaryDark : s.textMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FoodIcon size={13} />
          </Box>
          <Typography
            sx={{
              ...DASHBOARD_UX.link,
              fontSize: 13,
              fontWeight: 700,
              color: selected ? colors.primaryDark : s.textPrimary,
              minWidth: 0,
              flex: 1,
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            noWrap
          >
            {option.label}
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={0.75}
          sx={{ alignItems: 'flex-end', justifyContent: 'space-between', gap: 0.75 }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {unitLabel ? (
              <Stack spacing={0.1}>
                <Typography
                  sx={{
                    ...DASHBOARD_UX.badge,
                    color: s.textSecondary,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minWidth: 0,
                    display: 'block',
                  }}
                >
                  {t('meals.poll.priceEach', {
                    defaultValue: '{{price}} each',
                    price: unitLabel,
                  })}
                </Typography>
                {selected && unitPrice != null ? (
                  <Typography
                    sx={{
                      ...DASHBOARD_UX.smallCaption,
                      fontSize: 11,
                      color: colors.success,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      minWidth: 0,
                      display: 'block',
                    }}
                  >
                    {t('meals.poll.priceTimesQty', {
                      defaultValue: '{{unit}} × {{qty}} = {{total}}',
                      unit: unitLabel,
                      qty: quantity,
                      total: formatCurrency(unitPrice * quantity, option.currencyCode || 'INR'),
                    })}
                  </Typography>
                ) : null}
              </Stack>
            ) : unavailable ? (
              <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                {t('meals.poll.notAvailableShort', { defaultValue: 'Skip' })}
              </Typography>
            ) : null}
          </Box>

          {selected && !disabled && !unavailable ? (
            <Stack
              direction="row"
              spacing={0.2}
              sx={{
                alignItems: 'center',
                px: 0.25,
                py: 0.1,
                borderRadius: 999,
                border: `1px solid ${s.border}`,
                bgcolor: colors.surface,
                flexShrink: 0,
                boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <IconButton
                size="small"
                disabled={quantity <= 1}
                aria-label={t('meals.poll.decreaseQty', { defaultValue: 'Decrease quantity' })}
                onClick={(e) => {
                  e.stopPropagation();
                  if (quantity > 1) onChange(quantity - 1);
                }}
                sx={{
                  width: 24,
                  height: 24,
                  color: colors.primaryDark,
                }}
              >
                <Minus size={12} />
              </IconButton>
              <Typography
                sx={{
                  ...DASHBOARD_UX.link,
                  fontWeight: 700,
                  color: s.textPrimary,
                  minWidth: 16,
                  textAlign: 'center',
                }}
              >
                {quantity}
              </Typography>
              <IconButton
                size="small"
                aria-label={t('meals.poll.increaseQty', { defaultValue: 'Increase quantity' })}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(quantity + 1);
                }}
                sx={{
                  width: 24,
                  height: 24,
                  color: colors.primaryDark,
                }}
              >
                <Plus size={12} />
              </IconButton>
            </Stack>
          ) : null}

          {selected && disabled ? (
            <Typography sx={{ ...DASHBOARD_UX.badge, color: s.textMuted, flexShrink: 0 }}>
              × {quantity}
            </Typography>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
}
