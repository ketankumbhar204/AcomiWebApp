import { Box, Typography, useTheme } from '@mui/material';
import { Calendar, CheckCircle2, Moon, Sun, Sunrise } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DailyMenuResponse, MealPollSlot, MealType } from '@/shared/types/meals';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { mealTypeTheme } from '../utils/mealTypeTheme';
import { isMealPlanned } from '../utils/dayShareAction';

const ICONS: Record<MealType, LucideIcon> = {
  BREAKFAST: Sunrise,
  LUNCH: Sun,
  DINNER: Moon,
};

type MealSlotCardProps = {
  mealType: MealType;
  menu?: DailyMenuResponse | null;
  poll?: MealPollSlot | null;
  headcount?: number | null;
  canManage: boolean;
  /** Opens the menu editor for this meal. */
  onEdit: () => void;
  /** @deprecated Kept for call-site compatibility; secondary actions live in the editor. */
  onShare?: () => void;
  onPublish?: () => void;
  onOpenPoll?: () => void;
  onClosePoll?: () => void;
};

/**
 * Compact Breakfast / Lunch / Dinner cell — tap opens the menu editor (mobile parity).
 */
export function MealSlotCard({ mealType, menu, canManage, onEdit }: MealSlotCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const mealTheme = mealTypeTheme(mealType);
  const Icon = ICONS[mealType];
  const planned = isMealPlanned(menu);
  const StatusIcon = planned ? CheckCircle2 : Calendar;
  const statusColor = planned ? '#047857' : '#4B5563';

  const statusLabel = planned
    ? t('meals.planning.selector.planned', { defaultValue: 'Planned' })
    : t('meals.planning.selector.notPlanned', { defaultValue: 'Not planned' });

  const actionLabel = planned
    ? t('meals.planning.selector.viewMenu', { defaultValue: 'View menu' })
    : t('meals.planning.selector.planMenu', { defaultValue: 'Plan menu' });

  return (
    <Box
      role={canManage ? 'button' : undefined}
      tabIndex={canManage ? 0 : undefined}
      onClick={canManage ? onEdit : undefined}
      onKeyDown={
        canManage
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onEdit();
              }
            }
          : undefined
      }
      sx={{
        p: 1.5,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid #E5E7EB`,
        bgcolor: mealTheme.soft,
        boxShadow: s.shadow,
        minHeight: 132,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.75,
        cursor: canManage ? 'pointer' : 'default',
        transition: DASHBOARD_UX.transition,
        textAlign: 'center',
        '&:hover': canManage
          ? {
              boxShadow: s.shadowHover,
              transform: 'translateY(-1px)',
            }
          : undefined,
        '&:focus-visible': {
          outline: `2px solid ${mealTheme.accent}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '12px',
          bgcolor: `${mealTheme.accent}1A`,
          color: mealTheme.accent,
          display: 'grid',
          placeItems: 'center',
          '& svg': { width: 20, height: 20, strokeWidth: 2.2 },
        }}
      >
        <Icon />
      </Box>

      <Typography
        sx={{
          fontSize: '0.9375rem',
          fontWeight: 700,
          lineHeight: 1.2,
          color: mealTheme.accent,
        }}
      >
        {t(`meals.mealType.${mealType}`)}
      </Typography>

      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          maxWidth: '100%',
          minHeight: 24,
          px: 1,
          py: 0.25,
          borderRadius: '999px',
          border: '1px solid',
          borderColor: planned ? '#6EE7B7' : '#D1D5DB',
          bgcolor: planned ? '#ECFDF5' : '#F3F4F6',
          color: statusColor,
        }}
      >
        <StatusIcon size={12} strokeWidth={2.4} />
        <Typography sx={{ fontSize: 11, lineHeight: '14px', fontWeight: 700, color: statusColor }}>
          {statusLabel}
        </Typography>
      </Box>

      <Typography
        sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: mealTheme.accent,
          lineHeight: 1.2,
        }}
      >
        {actionLabel}
      </Typography>
    </Box>
  );
}
