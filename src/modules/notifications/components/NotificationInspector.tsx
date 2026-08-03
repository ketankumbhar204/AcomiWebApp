import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { Bell, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { EmptyState } from '@/shared/components/EmptyState';
import { SidePanel } from '@/shared/components/SidePanel';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx } from '@/shared/theme/dashButtonSx';
import type { SpaceNotification } from '@/shared/types/dashboard';
import { isOwnerOnlyNotificationType } from '@/shared/utils/ownerOnlyNotifications';
import {
  getNotificationCategoryColor,
  getNotificationIcon,
} from '@/shared/utils/notificationVisuals';

type NotificationInspectorProps = {
  notification: SpaceNotification | null;
  isOperator: boolean;
  framed?: boolean;
  onClose: () => void;
  onOpenRelated: (notification: SpaceNotification) => void;
};

function categoryTone(
  category: SpaceNotification['category'],
): 'success' | 'error' | 'warning' | 'info' | 'neutral' {
  if (category === 'SUCCESS') return 'success';
  if (category === 'ERROR') return 'error';
  if (category === 'WARNING' || category === 'ACTION_REQUIRED') return 'warning';
  if (category === 'INFORMATION') return 'info';
  return 'neutral';
}

function statusTone(
  status: SpaceNotification['status'],
): 'success' | 'error' | 'warning' | 'info' | 'neutral' {
  if (status === 'UNREAD') return 'info';
  if (status === 'RESOLVED') return 'success';
  if (status === 'DISMISSED') return 'neutral';
  return 'neutral';
}

function formatDetailWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function canOpenRelated(notification: SpaceNotification, isOperator: boolean): boolean {
  if (!isOperator && isOwnerOnlyNotificationType(notification.notificationType)) {
    return false;
  }
  return true;
}

/**
 * Right-side notification detail inspector (master-detail parity with payments / My Orders).
 */
export function NotificationInspector({
  notification,
  isOperator,
  framed = true,
  onClose,
  onOpenRelated,
}: NotificationInspectorProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  if (!notification) {
    return (
      <SidePanel
        title={t('notifications.inspector.title', { defaultValue: 'Notification details' })}
        onClose={onClose}
        framed={framed}
      >
        <EmptyState
          icon={
            <IconBadge accent={colors.primaryDark}>
              <Bell />
            </IconBadge>
          }
          title={t('notifications.inspector.selectTitle', {
            defaultValue: 'Select a notification',
          })}
          description={t('notifications.inspector.selectBody', {
            defaultValue: 'Choose an item to view the full message and open related screens.',
          })}
        />
      </SidePanel>
    );
  }

  const accent = getNotificationCategoryColor(notification.category);
  const Icon = getNotificationIcon(notification.notificationType, notification.category);
  const showOpen = canOpenRelated(notification, isOperator);
  const actionLabel =
    notification.actionLabel?.trim() ||
    t('notifications.inspector.openRelated', { defaultValue: 'Open related' });

  return (
    <SidePanel
      title={notification.title}
      subtitle={formatDetailWhen(notification.createdAt)}
      onClose={onClose}
      framed={framed}
      footer={
        showOpen ? (
          <Button
            variant="contained"
            fullWidth
            startIcon={<ExternalLink size={16} />}
            onClick={() => onOpenRelated(notification)}
            sx={dashContainedButtonSx}
          >
            {actionLabel}
          </Button>
        ) : null
      }
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <IconBadge accent={accent}>
            <Icon />
          </IconBadge>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <StatusChip
                label={t(`notifications.category.${notification.category}`, {
                  defaultValue: notification.category.replace(/_/g, ' '),
                })}
                tone={categoryTone(notification.category)}
              />
              <StatusChip
                label={
                  notification.status === 'UNREAD'
                    ? t('notifications.filters.unread', { defaultValue: 'Unread' })
                    : t('notifications.status.read', { defaultValue: 'Read' })
                }
                tone={statusTone(notification.status)}
              />
            </Stack>
          </Box>
        </Stack>

        <Box
          sx={{
            px: 1.25,
            py: 1.1,
            borderRadius: `${DASHBOARD_UX.tileRadius}px`,
            border: `1px solid ${s.border}`,
            bgcolor: theme.palette.mode === 'dark' ? s.elevated : `${accent}0A`,
          }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: s.textMuted, mb: 0.5 }}>
            {t('notifications.inspector.message', { defaultValue: 'Message' })}
          </Typography>
          <Typography sx={{ fontSize: 14, color: s.textPrimary, lineHeight: 1.5 }}>
            {notification.message?.trim() ||
              t('notifications.inspector.noMessage', {
                defaultValue: 'No additional details for this notification.',
              })}
          </Typography>
        </Box>

        <Box
          sx={{
            borderRadius: `${DASHBOARD_UX.tileRadius}px`,
            border: `1px solid ${s.border}`,
            overflow: 'hidden',
          }}
        >
          <MetaRow
            label={t('notifications.inspector.type', { defaultValue: 'Type' })}
            value={notification.notificationType.replace(/_/g, ' ')}
          />
          <MetaRow
            label={t('notifications.inspector.priority', { defaultValue: 'Priority' })}
            value={notification.priority}
          />
          {notification.entityType ? (
            <MetaRow
              label={t('notifications.inspector.entity', { defaultValue: 'Related to' })}
              value={notification.entityType}
              last={!notification.entityId}
            />
          ) : null}
          {notification.entityId ? (
            <MetaRow
              label={t('notifications.inspector.reference', { defaultValue: 'Reference' })}
              value={notification.entityId}
              mono
              last
            />
          ) : null}
        </Box>
      </Stack>
    </SidePanel>
  );
}

function MetaRow({
  label,
  value,
  mono,
  last,
}: {
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 1,
        px: 1.25,
        py: 0.9,
        borderBottom: last ? 'none' : `1px solid ${s.border}`,
      }}
    >
      <Typography sx={{ fontSize: 12, color: s.textMuted, flexShrink: 0 }}>{label}</Typography>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 600,
          color: s.textPrimary,
          textAlign: 'right',
          wordBreak: 'break-word',
          fontFamily: mono
            ? 'ui-monospace, SFMono-Regular, Menlo, monospace'
            : undefined,
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
