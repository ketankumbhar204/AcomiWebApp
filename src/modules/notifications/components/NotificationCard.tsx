import { Box, Stack, Typography, useTheme } from '@mui/material';
import { ChevronRight } from 'lucide-react';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { StatusChip } from '@/shared/components/StatusChip';
import type { SpaceNotification } from '@/shared/types/dashboard';
import {
  getNotificationCategoryColor,
  getNotificationIcon,
} from '@/shared/utils/notificationVisuals';

type NotificationCardProps = {
  notification: SpaceNotification;
  timeLabel: string;
  selected?: boolean;
  onClick: () => void;
};

/** Compact Dashboard notification row card (72–84px). */
export function NotificationCard({
  notification,
  timeLabel,
  selected = false,
  onClick,
}: NotificationCardProps) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const accent = getNotificationCategoryColor(notification.category);
  const Icon = getNotificationIcon(notification.notificationType, notification.category);
  const isUnread = notification.status === 'UNREAD';

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label={notification.title}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        width: '100%',
        minWidth: 0,
        minHeight: 72,
        maxHeight: { xs: 'none', sm: 84 },
        px: `${DASHBOARD_UX.metricPadding}px`,
        py: 1.25,
        textAlign: 'left',
        cursor: 'pointer',
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${selected ? `${accent}66` : s.border}`,
        bgcolor: selected
          ? theme.palette.mode === 'dark'
            ? s.elevated
            : `${accent}0D`
          : isUnread
            ? theme.palette.mode === 'dark'
              ? s.elevated
              : `${accent}08`
            : s.surface,
        boxShadow: s.shadow,
        borderLeft: isUnread ? `3px solid ${accent}` : `3px solid transparent`,
        transition: DASHBOARD_UX.transition,
        '&:hover': {
          boxShadow: s.shadowHover,
          transform: 'translateY(-1px)',
          borderColor: `${accent}55`,
        },
        '&:focus-visible': {
          outline: `2px solid ${accent}`,
          outlineOffset: 2,
        },
      }}
    >
      <IconBadge accent={accent}>
        <Icon />
      </IconBadge>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', gap: 0.75 }}>
          <Typography
            sx={{
              ...DASHBOARD_UX.link,
              color: s.textPrimary,
              flex: 1,
              minWidth: 0,
            }}
            noWrap
          >
            {notification.title}
          </Typography>
          {timeLabel ? (
            <Typography
              sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted, flexShrink: 0 }}
            >
              {timeLabel}
            </Typography>
          ) : null}
          {isUnread ? (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: accent,
                flexShrink: 0,
              }}
              aria-hidden
            />
          ) : null}
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', mt: 0.35, minWidth: 0 }}
        >
          {notification.message ? (
            <Typography
              sx={{
                ...DASHBOARD_UX.smallCaption,
                color: s.textSecondary,
                flex: 1,
                minWidth: 0,
                whiteSpace: { xs: 'normal', sm: 'nowrap' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {notification.message}
            </Typography>
          ) : (
            <Box sx={{ flex: 1 }} />
          )}
          {notification.actionLabel ? (
            <StatusChip label={notification.actionLabel} tone="info" />
          ) : null}
        </Stack>
      </Box>

      <ChevronRight size={16} color={s.textMuted} aria-hidden style={{ flexShrink: 0 }} />
    </Box>
  );
}
