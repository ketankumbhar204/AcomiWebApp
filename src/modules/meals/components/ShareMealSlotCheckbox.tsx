import { Box, Typography, useTheme } from '@mui/material';
import { Check, Moon, Sun, Sunrise } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import type { DailyMenuResponse, MealType } from '@/shared/types/meals';
import {
  getSlotShareState,
  resolveMealStatusKind,
  type SlotShareState,
} from '../utils/shareMenuSelection';

const ICONS: Record<MealType, LucideIcon> = {
  BREAKFAST: Sunrise,
  LUNCH: Sun,
  DINNER: Moon,
};

const ACCENTS: Record<MealType, string> = {
  BREAKFAST: '#D97706',
  LUNCH: colors.primaryDark,
  DINNER: '#7C3AED',
};

type ShareMealSlotCheckboxProps = {
  mealType: MealType;
  menu?: DailyMenuResponse | null;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

/** Mobile-parity share slot row with meal icon + status. */
export function ShareMealSlotCheckbox({
  mealType,
  menu,
  selected,
  onToggle,
  disabled = false,
}: ShareMealSlotCheckboxProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const state: SlotShareState = getSlotShareState(menu);
  const statusKind = resolveMealStatusKind(menu);
  const shareable = state === 'shareable' && !disabled;
  const Icon = ICONS[mealType];
  const accent = ACCENTS[mealType];
  const mealLabel = t(`meals.mealType.${mealType}`);

  const statusTone =
    statusKind === 'shared'
      ? 'success'
      : statusKind === 'draft' || statusKind === 'needs_reshare'
        ? 'warning'
        : 'neutral';

  const statusLabel =
    statusKind === 'empty'
      ? t('meals.planning.emptySlot')
      : statusKind === 'needs_reshare'
        ? t('meals.status.needsReshare', { defaultValue: 'Needs reshare' })
        : statusKind === 'shared'
          ? t('meals.status.shared', { defaultValue: 'Shared' })
          : t('meals.status.notShared', { defaultValue: 'Draft' });

  const hint = !shareable
    ? state === 'empty' || state === 'draft'
      ? t('meals.planning.shareEmptySlot', { meal: mealLabel })
      : t('meals.planning.shareNotPublished', { meal: mealLabel })
    : statusKind === 'needs_reshare'
      ? t('meals.planning.shareNeedsReshareHint')
      : statusKind === 'shared'
        ? t('meals.planning.shareAlreadySharedHint')
        : null;

  return (
    <Box
      component="button"
      type="button"
      disabled={!shareable}
      onClick={shareable ? onToggle : undefined}
      aria-pressed={selected}
      sx={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        p: 1.5,
        mb: 1,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${selected && shareable ? colors.primary : s.border}`,
        bgcolor: shareable ? s.surface : s.elevated,
        boxShadow: shareable ? s.shadow : 'none',
        cursor: shareable ? 'pointer' : 'default',
        opacity: shareable ? 1 : 0.75,
        transition: DASHBOARD_UX.transition,
        '&:hover': shareable
          ? { bgcolor: selected ? s.successTint : s.hover, borderColor: colors.primary }
          : undefined,
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: `${DASHBOARD_UX.iconWellRadius}px`,
          bgcolor: `${accent}18`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} strokeWidth={2.2} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
            {mealLabel}
          </Typography>
          <StatusChip label={statusLabel} tone={statusTone} />
        </Box>
        {hint ? (
          <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted, mt: 0.35 }}>
            {hint}
          </Typography>
        ) : null}
      </Box>
      <Box
        sx={{
          width: 22,
          height: 22,
          borderRadius: 1,
          border: `2px solid ${selected && shareable ? colors.primary : s.border}`,
          bgcolor: selected && shareable ? colors.primary : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {selected && shareable ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
      </Box>
    </Box>
  );
}
