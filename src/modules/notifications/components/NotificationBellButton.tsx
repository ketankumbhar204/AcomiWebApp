import { Badge, IconButton, Tooltip } from '@mui/material';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { usePendingActions } from '@/modules/dashboard/hooks/usePendingActions';
import { useSpaceNotifications } from '@/modules/notifications/hooks/useSpaceNotifications';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { spaceNotificationsPath } from '@/routes/paths';
import { canManageNotifications } from '@/shared/utils/spaceOperator';

type NotificationBellButtonProps = {
  spaceId: string;
};

/**
 * Operators: badge from pending-actions count.
 * Tenants: unread inbox count.
 * Mirrors mobile `NotificationBellButton`.
 */
export function NotificationBellButton({ spaceId }: NotificationBellButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const permissions = useSpacePermissions(spaceId);
  const isOperator = canManageNotifications(permissions);
  const pending = usePendingActions(spaceId, isOperator);
  const { unreadCount } = useSpaceNotifications(spaceId, !isOperator);

  const badgeCount = isOperator ? pending.totalCount : unreadCount;
  const label =
    badgeCount > 0
      ? `${t('notifications.title')} (${badgeCount > 9 ? '9+' : badgeCount})`
      : t('notifications.title');

  return (
    <Tooltip title={label}>
      <IconButton
        onClick={() => navigate(spaceNotificationsPath(spaceId))}
        aria-label={label}
        size="small"
      >
        <Badge
          badgeContent={badgeCount > 9 ? '9+' : badgeCount}
          color="error"
          invisible={badgeCount <= 0}
          max={9}
          sx={{
            '& .MuiBadge-badge': {
              minWidth: 14,
              height: 14,
              fontSize: 10,
              fontWeight: 600,
            },
          }}
        >
          <Bell size={16} />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}
