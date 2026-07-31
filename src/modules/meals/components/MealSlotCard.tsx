import { Box, Button, Link, Stack, Typography, useTheme } from '@mui/material';
import { Moon, Sun, Sunrise } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DailyMenuResponse, MealPollSlot, MealType } from '@/shared/types/meals';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';

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

type MealSlotCardProps = {
  mealType: MealType;
  menu?: DailyMenuResponse | null;
  poll?: MealPollSlot | null;
  headcount?: number | null;
  canManage: boolean;
  onEdit: () => void;
  onPublish?: () => void;
  onOpenPoll?: () => void;
  onClosePoll?: () => void;
};

/**
 * Compact Dashboard-language meal slot (~90–110px).
 * Presentation only — same edit/publish/poll callbacks as before.
 */
export function MealSlotCard({
  mealType,
  menu,
  poll,
  headcount,
  canManage,
  onEdit,
  onPublish,
  onOpenPoll,
  onClosePoll,
}: MealSlotCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const Icon = ICONS[mealType];
  const accent = ACCENTS[mealType];
  const options = menu?.options?.filter((o) => o.isAvailable) ?? [];
  const planned = options.length > 0;

  const statusTone =
    !menu || !planned
      ? 'neutral'
      : menu.status === 'PUBLISHED'
        ? 'success'
        : menu.status === 'DRAFT'
          ? 'warning'
          : 'info';

  const statusLabel =
    !menu || !planned
      ? t('meals.planning.emptySlot')
      : t(`meals.status.${menu.status}`);

  const description = !planned
    ? t('meals.planning.noOptions')
    : options
        .slice(0, 2)
        .map((opt) => opt.label)
        .join(' · ') + (options.length > 2 ? ` · +${options.length - 2}` : '');

  return (
    <Box
      sx={{
        p: `${DASHBOARD_UX.metricPadding}px`,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        minHeight: 90,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        transition: DASHBOARD_UX.transition,
        '&:hover': {
          boxShadow: s.shadowHover,
        },
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
        <IconBadge accent={accent}>
          <Icon />
        </IconBadge>
        <Typography
          sx={{
            ...DASHBOARD_UX.spaceName,
            fontWeight: 600,
            color: s.textPrimary,
            flex: 1,
            minWidth: 0,
          }}
          noWrap
        >
          {t(`meals.mealType.${mealType}`)}
        </Typography>
        <StatusChip label={statusLabel} tone={statusTone} />
      </Stack>

      <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }} noWrap>
        {description}
      </Typography>

      <Stack
        direction="row"
        spacing={0.75}
        useFlexGap
        sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 'auto', minHeight: 28 }}
      >
        {poll ? (
          <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}>
            {t(`meals.poll.status.${poll.status}`)} · {poll.responseCount}
          </Typography>
        ) : null}
        {headcount != null ? (
          <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}>
            {t('meals.planning.headcount', { count: headcount })}
          </Typography>
        ) : null}

        <Box sx={{ flex: 1 }} />

        {canManage ? (
          <>
            {!planned ? (
              <Link
                component="button"
                type="button"
                underline="hover"
                onClick={onEdit}
                sx={{ ...DASHBOARD_UX.button, color: colors.primaryDark, whiteSpace: 'nowrap' }}
              >
                {t('meals.planning.cardHintEmpty')} →
              </Link>
            ) : null}
            <Button size="small" onClick={onEdit} sx={{ ...dashOutlinedButtonSx, px: 1 }}>
              {t('common.edit')}
            </Button>
            {menu && menu.status !== 'PUBLISHED' && onPublish ? (
              <Button
                size="small"
                onClick={onPublish}
                sx={{
                  ...dashOutlinedButtonSx,
                  px: 1,
                  color: colors.primaryDark,
                  borderColor: colors.primaryDark,
                }}
              >
                {t('meals.planning.publish')}
              </Button>
            ) : null}
            {menu?.status === 'PUBLISHED' && poll?.status !== 'OPEN' && onOpenPoll ? (
              <Button size="small" onClick={onOpenPoll} sx={{ ...dashOutlinedButtonSx, px: 1 }}>
                {t('meals.poll.open')}
              </Button>
            ) : null}
            {poll?.status === 'OPEN' && onClosePoll ? (
              <Button size="small" onClick={onClosePoll} sx={{ ...dashOutlinedButtonSx, px: 1 }}>
                {t('meals.poll.close')}
              </Button>
            ) : null}
          </>
        ) : null}
      </Stack>
    </Box>
  );
}
