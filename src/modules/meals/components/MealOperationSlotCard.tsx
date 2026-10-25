import { Box, Typography } from '@mui/material';
import { Moon, Sun, SunMedium } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MealType } from '@/shared/types/meals';
import { colors } from '@/shared/theme/colors';
import type { DashboardMealSlotCaptionTone } from '../utils/dashboardMealSlotDisplay';
import { MENU_PLANNING_POLL_OPEN_COLOR, type MealStatusKind } from '../utils/mealStatusTheme';
import { mealTypeTheme } from '../utils/mealTypeTheme';
import { MealStatusBadge } from './MealStatusBadge';

const ICONS: Record<MealType, LucideIcon> = {
  BREAKFAST: Sun,
  LUNCH: SunMedium,
  DINNER: Moon,
};

function captionToneColor(tone: DashboardMealSlotCaptionTone): string {
  switch (tone) {
    case 'complete':
      return colors.success;
    case 'progress':
      return MENU_PLANNING_POLL_OPEN_COLOR;
    default:
      return colors.textSecondary;
  }
}

export type MealOperationSlotCardProps = {
  mealType: MealType;
  mealLabel: string;
  caption: string;
  countPrimary?: string;
  countUnit?: string;
  captionTone: DashboardMealSlotCaptionTone;
  statusKind: MealStatusKind;
  /** Omit when this viewer has no action for the card. */
  onPress?: () => void;
  selected?: boolean;
  compact?: boolean;
};

/**
 * Breakfast / Lunch / Dinner card shared by Dashboard Meal Operations and the Meals planner.
 * Visual values match mobile `MealOperationSlotCard`.
 */
export function MealOperationSlotCard({
  mealType,
  mealLabel,
  caption,
  countPrimary,
  countUnit,
  captionTone,
  statusKind,
  onPress,
  selected = false,
  compact = false,
}: MealOperationSlotCardProps) {
  const typeTheme = mealTypeTheme(mealType);
  const toneColor = captionToneColor(captionTone);
  const showMetric = countPrimary != null && countPrimary.length > 0;
  const Icon = ICONS[mealType];
  const interactive = onPress != null;
  const frame = 40;

  return (
    <Box
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={`${mealLabel}, ${caption}`}
      aria-pressed={selected ? true : undefined}
      onClick={interactive ? onPress : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onPress();
              }
            }
          : undefined
      }
      sx={{
        position: 'relative',
        flex: '1 1 0',
        minWidth: 0,
        minHeight: compact ? (selected ? 88 : 80) : 104,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? '2px' : '4px',
        px: '4px',
        py: compact ? '4px' : '8px',
        overflow: 'hidden',
        borderRadius: '16px',
        border: '1px solid #E5E7EB',
        bgcolor: typeTheme.soft,
        boxShadow: selected || compact ? 'none' : '0 2px 10px rgba(16, 24, 40, 0.05)',
        opacity: !selected && compact ? 0.92 : 1,
        cursor: interactive ? 'pointer' : 'default',
        textAlign: 'center',
        '&:hover': interactive ? { opacity: 0.96 } : undefined,
        '&:active': interactive ? { opacity: 0.92 } : undefined,
        '&:focus-visible': {
          outline: `2px solid ${typeTheme.accent}`,
          outlineOffset: 2,
        },
      }}
    >
      {selected ? (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: typeTheme.accent,
          }}
        />
      ) : null}
      {compact ? null : (
        <Box
          aria-hidden
          sx={{
            width: frame,
            height: frame,
            borderRadius: '12px',
            bgcolor: `${typeTheme.accent}14`,
            color: typeTheme.accent,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={18} color={typeTheme.accent} strokeWidth={2.2} />
        </Box>
      )}
      <Typography
        noWrap
        sx={{
          width: '100%',
          color: typeTheme.accent,
          fontWeight: 700,
          fontSize: 15,
          lineHeight: '18px',
          textAlign: 'center',
        }}
      >
        {mealLabel}
      </Typography>
      <MealStatusBadge kind={statusKind} size="compact" />
      {showMetric ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', mt: '2px', minWidth: 0, maxWidth: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', minWidth: 0, maxWidth: '100%' }}>
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '4px',
                bgcolor: toneColor,
                flexShrink: 0,
              }}
            />
            <Typography
              noWrap
              sx={{ color: toneColor, fontWeight: 800, fontSize: 16, lineHeight: '20px' }}
            >
              {countPrimary}
            </Typography>
          </Box>
          {countUnit ? (
            <Typography
              noWrap
              sx={{ color: toneColor, fontWeight: 600, fontSize: 10, lineHeight: '12px' }}
            >
              {countUnit}
            </Typography>
          ) : null}
        </Box>
      ) : (
        <Typography
          sx={{
            width: '100%',
            color: colors.textSecondary,
            fontSize: 11,
            lineHeight: '14px',
            textAlign: 'center',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {caption}
        </Typography>
      )}
    </Box>
  );
}
