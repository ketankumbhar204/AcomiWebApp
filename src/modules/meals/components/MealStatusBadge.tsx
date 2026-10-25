import { Box, Typography } from '@mui/material';
import { AlertTriangle, Check, Circle, CircleDot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  mealStatusTheme,
  resolveMealStatusKind,
  type MealStatusKind,
} from '../utils/mealStatusTheme';
import type { DailyMenuResponse, MealPollSlot } from '@/shared/types/meals';

const STATUS_DEFAULTS: Record<MealStatusKind, string> = {
  empty: 'Empty',
  draft: 'Not shared',
  shared: 'Shared',
  needs_reshare: 'Needs reshare',
};

type MealStatusBadgeProps = {
  kind?: MealStatusKind;
  menu?: DailyMenuResponse | null;
  poll?: Pick<MealPollSlot, 'status'> | null;
  size?: 'compact' | 'default';
};

/**
 * Publication badge used on Dashboard and Meals meal cards.
 * Matches mobile `MealStatusBadge`.
 */
export function MealStatusBadge({
  kind: kindProp,
  menu,
  poll,
  size = 'default',
}: MealStatusBadgeProps) {
  const { t } = useTranslation();
  const kind = kindProp ?? resolveMealStatusKind(menu, poll);
  const theme = mealStatusTheme(kind);
  const label = t(theme.labelKey, { defaultValue: STATUS_DEFAULTS[kind] });
  const compact = size === 'compact';
  const StatusIcon =
    kind === 'shared' ? Check : kind === 'needs_reshare' ? AlertTriangle : kind === 'draft' ? CircleDot : Circle;

  return (
    <Box
      component="span"
      aria-label={label}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '100%',
        gap: compact ? '3px' : '4px',
        border: `1px solid ${theme.color}`,
        bgcolor: theme.background,
        borderRadius: '999px',
        px: compact ? '4px' : '8px',
        py: compact ? '2px' : '3px',
        minWidth: 0,
      }}
    >
      <StatusIcon size={compact ? 11 : 12} color={theme.color} strokeWidth={2.4} />
      <Typography
        component="span"
        noWrap
        sx={{
          color: theme.color,
          fontWeight: 700,
          fontSize: compact ? 10 : 11,
          lineHeight: compact ? '12px' : '14px',
          minWidth: 0,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
