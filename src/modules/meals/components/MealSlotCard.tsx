import { Box, Button, Link, Stack, Typography, useTheme } from '@mui/material';
import { Moon, Sun, Sunrise } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DailyMenuResponse, MealPollSlot, MealType } from '@/shared/types/meals';
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
  onShare?: () => void;
  onPublish?: () => void;
  onOpenPoll?: () => void;
  onClosePoll?: () => void;
};

/**
 * Selected-day meal slot — Dashboard cards, mobile-parity actions.
 */
export function MealSlotCard({
  mealType,
  menu,
  poll,
  headcount,
  canManage,
  onEdit,
  onShare,
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
        .slice(0, 3)
        .map((opt) => opt.label)
        .join(' · ') + (options.length > 3 ? ` · +${options.length - 3}` : '');

  const showShare = Boolean(canManage && planned && onShare);

  return (
    <Box
      sx={{
        p: `${DASHBOARD_UX.cardPadding}px`,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        minHeight: 96,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 1.25, sm: `${DASHBOARD_UX.cardGap}px` },
        transition: DASHBOARD_UX.transition,
        '&:hover': {
          boxShadow: s.shadowHover,
        },
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: 'flex-start', minWidth: 0, flex: 1 }}
      >
        <Box
          sx={{
            width: DASHBOARD_UX.iconWell + 6,
            height: DASHBOARD_UX.iconWell + 6,
            borderRadius: `${DASHBOARD_UX.tileRadius}px`,
            bgcolor: theme.palette.mode === 'dark' ? s.elevated : `${accent}1A`,
            color: accent,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            '& svg': {
              width: DASHBOARD_UX.iconSize + 4,
              height: DASHBOARD_UX.iconSize + 4,
              strokeWidth: 1.75,
            },
          }}
        >
          <Icon />
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}
          >
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
              {t(`meals.mealType.${mealType}`)}
            </Typography>
            <StatusChip label={statusLabel} tone={statusTone} />
          </Stack>

          <Typography sx={{ ...DASHBOARD_UX.cardSubtitle, color: s.textSecondary }}>
            {description}
          </Typography>

          {(poll || headcount != null) && (
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 0.75 }}
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
            </Stack>
          )}
        </Box>
      </Stack>

      {canManage ? (
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
            flexShrink: 0,
          }}
        >
          {!planned ? (
            <Button
              size="small"
              variant="outlined"
              onClick={onEdit}
              sx={{
                ...dashOutlinedButtonSx,
                ...DASHBOARD_UX.button,
                color: colors.primaryDark,
                borderColor: `${colors.primaryDark}88`,
                px: 1.5,
                '&:hover': {
                  borderColor: colors.primaryDark,
                  bgcolor: `${colors.primaryDark}0F`,
                },
              }}
            >
              {t('meals.planning.cardHintEmpty')} →
            </Button>
          ) : null}

          <Link
            component="button"
            type="button"
            underline="hover"
            onClick={onEdit}
            sx={{ ...DASHBOARD_UX.link, color: colors.primaryDark, whiteSpace: 'nowrap', px: 0.5 }}
          >
            {t('common.edit')}
          </Link>

          {showShare ? (
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={onShare}
              sx={{ ...DASHBOARD_UX.link, color: colors.primaryDark, whiteSpace: 'nowrap', px: 0.5 }}
            >
              {t('meals.planning.share')}
            </Link>
          ) : null}

          {menu && menu.status !== 'PUBLISHED' && planned && onPublish ? (
            <Button
              size="small"
              onClick={onPublish}
              sx={{
                ...dashOutlinedButtonSx,
                ...DASHBOARD_UX.button,
                px: 1.25,
                color: colors.primaryDark,
                borderColor: colors.primaryDark,
              }}
            >
              {t('meals.planning.publish')}
            </Button>
          ) : null}
          {menu?.status === 'PUBLISHED' && poll?.status !== 'OPEN' && onOpenPoll ? (
            <Button
              size="small"
              onClick={onOpenPoll}
              sx={{ ...dashOutlinedButtonSx, ...DASHBOARD_UX.button, px: 1.25 }}
            >
              {t('meals.poll.open')}
            </Button>
          ) : null}
          {poll?.status === 'OPEN' && onClosePoll ? (
            <Button
              size="small"
              onClick={onClosePoll}
              sx={{ ...dashOutlinedButtonSx, ...DASHBOARD_UX.button, px: 1.25 }}
            >
              {t('meals.poll.close')}
            </Button>
          ) : null}
        </Stack>
      ) : null}
    </Box>
  );
}
