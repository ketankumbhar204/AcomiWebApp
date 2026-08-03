import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  Package,
  UtensilsCrossed,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import type {
  NotificationPriority,
  PendingActionGroup,
  SpaceNotification,
} from '@/shared/types/dashboard';
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

function itemIcon(item: SpaceNotification): { Icon: LucideIcon; accent: string } {
  const type = (item.notificationType ?? '').toUpperCase();
  const title = (item.title ?? '').toLowerCase();
  if (type.includes('INVENTORY') || title.includes('stock') || title.includes('inventory')) {
    return { Icon: Package, accent: '#D97706' };
  }
  if (type.includes('MEAL') || type.includes('MENU') || title.includes('menu')) {
    return { Icon: UtensilsCrossed, accent: '#D97706' };
  }
  if (item.priority === 'CRITICAL' || item.priority === 'HIGH') {
    return { Icon: AlertTriangle, accent: '#EA580C' };
  }
  return { Icon: Bell, accent: '#D97706' };
}

function priorityStyle(priority: NotificationPriority, dark: boolean) {
  switch (priority) {
    case 'CRITICAL':
      return {
        bgcolor: dark ? 'rgba(220, 38, 38, 0.2)' : '#FEE2E2',
        color: dark ? '#FCA5A5' : '#B91C1C',
      };
    case 'HIGH':
      return {
        bgcolor: dark ? 'rgba(234, 88, 12, 0.2)' : '#FFEDD5',
        color: dark ? '#FDBA74' : '#C2410C',
      };
    case 'MEDIUM':
      return {
        bgcolor: dark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7',
        color: dark ? '#FBBF24' : '#B45309',
      };
    default:
      return {
        bgcolor: dark ? 'rgba(100, 116, 139, 0.2)' : '#F1F5F9',
        color: dark ? '#CBD5E1' : '#475569',
      };
  }
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
  const previewLimit = 2;
  const preview = flattenItems(groups, previewLimit);
  const remaining = Math.max(0, totalCount - preview.length);
  const pendingPath = spacePendingActionsPath(spaceId);
  const dark = theme.palette.mode === 'dark';

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
      <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted, mb: 0.75 }}>
        {totalCount > 0
          ? t('dashboard.attention.pendingActionsSubtitle', { count: totalCount })
          : t('dashboard.pendingActions.empty')}
      </Typography>

      {totalCount === 0 ? (
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, py: 1 }}>
          {t('dashboard.pendingActions.emptyTitle', { defaultValue: 'All clear' })}
        </Typography>
      ) : (
        <Stack spacing={0.75} sx={{ flex: 1, minHeight: 0, justifyContent: 'flex-start' }}>
          {preview.map((item) => {
            const { Icon, accent } = itemIcon(item);
            const badge = priorityStyle(item.priority, dark);
            return (
              <Box
                key={item.notificationId}
                component={RouterLink}
                to={pendingPath}
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                  minHeight: 52,
                  px: 0.75,
                  py: 0.6,
                  borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                  border: `1px solid ${s.border}`,
                  bgcolor: s.elevated,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: DASHBOARD_UX.transition,
                  '&:hover': {
                    bgcolor: s.surface,
                    boxShadow: s.shadow,
                  },
                }}
              >
                <IconBadge accent={accent}>
                  <Icon />
                </IconBadge>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                    <Typography
                      sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, flex: 1 }}
                      noWrap
                    >
                      {item.title}
                    </Typography>
                    <Box
                      sx={{
                        px: 0.55,
                        py: 0.15,
                        borderRadius: 999,
                        bgcolor: badge.bgcolor,
                        color: badge.color,
                        ...DASHBOARD_UX.badge,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        flexShrink: 0,
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
                      mt: 0.15,
                    }}
                  >
                    {item.message}
                  </Typography>
                </Box>
                <ChevronRight size={16} color={s.textMuted} aria-hidden />
              </Box>
            );
          })}

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
                defaultValue: '+ {{count}} more →',
              })}
            </Button>
          ) : null}
        </Stack>
      )}
    </Box>
  );
}
