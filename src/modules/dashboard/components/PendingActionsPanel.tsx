import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { Bell, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import type { PendingActionGroup, SpaceNotification } from '@/shared/types/dashboard';
import { spacePendingActionsPath } from '@/routes/paths';
import { IconBadge } from './IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '../theme/dashboardUx';

type PendingActionsPanelProps = {
  spaceId: string;
  totalCount: number;
  groups: PendingActionGroup[];
  compact?: boolean;
  sticky?: boolean;
};

function flattenItems(groups: PendingActionGroup[], limit: number): SpaceNotification[] {
  const items: SpaceNotification[] = [];
  for (const group of groups) {
    for (const item of group.items ?? []) {
      items.push(item);
      if (items.length >= limit) return items;
    }
  }
  return items;
}

export function PendingActionsPanel({
  spaceId,
  totalCount,
  groups,
  sticky = false,
}: PendingActionsPanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const previewLimit = 1;
  const preview = flattenItems(groups, previewLimit);
  const remaining = Math.max(0, totalCount - preview.length);
  const pendingPath = spacePendingActionsPath(spaceId);

  return (
    <Box
      component="section"
      aria-label={t('dashboard.attention.pendingActions')}
      sx={{
        bgcolor: s.surface,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        boxShadow: s.shadow,
        border: `1px solid ${s.border}`,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        height: DASHBOARD_UX.summaryCardHeight,
        minHeight: DASHBOARD_UX.summaryCardMinHeight,
        maxHeight: DASHBOARD_UX.summaryCardMaxHeight,
        minWidth: 0,
        boxSizing: 'border-box',
        flex: sticky ? 1 : undefined,
      }}
    >
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.15 }}>
        <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
          {t('dashboard.attention.pendingActions')}
        </Typography>
        <Button
          component={RouterLink}
          to={pendingPath}
          size="small"
          variant="text"
          sx={{ ...DASHBOARD_UX.link, color: 'primary.dark', minWidth: 0, px: 0.5 }}
        >
          {t('common.viewAll')} →
        </Button>
      </Stack>
      <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted, mb: 0.5 }}>
        {totalCount > 0
          ? t('dashboard.attention.pendingActionsSubtitle', { count: totalCount })
          : t('dashboard.pendingActions.empty')}
      </Typography>

      {totalCount === 0 ? (
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, py: 1 }}>
          {t('dashboard.pendingActions.emptyTitle', { defaultValue: 'All clear' })}
        </Typography>
      ) : (
        <Stack spacing={0} sx={{ flex: 1, minHeight: 0, justifyContent: 'flex-start' }}>
          {preview.map((item) => (
            <Box
              key={item.notificationId}
              component={RouterLink}
              to={pendingPath}
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                height: DASHBOARD_UX.pendingItemHeight,
                maxHeight: DASHBOARD_UX.pendingItemMaxHeight,
                px: 0.5,
                borderRadius: 1.5,
                textDecoration: 'none',
                color: 'inherit',
                transition: DASHBOARD_UX.transition,
                '&:hover': {
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(15, 23, 42, 0.03)',
                },
              }}
            >
              <IconBadge accent="#D97706">
                <Bell />
              </IconBadge>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                  <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, flex: 1 }} noWrap>
                    {item.title}
                  </Typography>
                  <Box
                    sx={{
                      px: 0.5,
                      py: 0.1,
                      borderRadius: `${DASHBOARD_UX.tileRadius / 2}px`,
                      bgcolor:
                        theme.palette.mode === 'dark' ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7',
                      color: theme.palette.mode === 'dark' ? '#FBBF24' : '#B45309',
                      ...DASHBOARD_UX.badge,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.priority}
                  </Box>
                </Stack>
                <Typography
                  sx={{
                    ...DASHBOARD_UX.sectionSubtitle,
                    color: s.textMuted,
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.message}
                </Typography>
              </Box>
              <ChevronRight size={14} color={s.textMuted} aria-hidden />
            </Box>
          ))}

          {remaining > 0 ? (
            <Button
              component={RouterLink}
              to={pendingPath}
              size="small"
              variant="text"
              sx={{
                ...DASHBOARD_UX.link,
                color: 'primary.dark',
                alignSelf: 'flex-start',
                mt: 'auto',
                px: 0.5,
                minWidth: 0,
              }}
            >
              {t('dashboard.attention.morePending', {
                count: remaining,
                defaultValue: '+{{count}} more →',
              })}
            </Button>
          ) : null}
        </Stack>
      )}
    </Box>
  );
}
