import { Badge, IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { adminEnquiryApi } from '@/shared/api/enquiryApi';
import { adminEnquiryDetailPath } from '@/routes/paths';
import type { SpaceNotification } from '@/shared/types/dashboard';

export function AdminNotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<SpaceNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    void adminEnquiryApi
      .listNotifications()
      .then((data) => {
        if (!active) return;
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function openNotification(item: SpaceNotification) {
    setAnchor(null);
    try {
      await adminEnquiryApi.markNotificationRead(item.notificationId);
      setNotifications((current) =>
        current.map((n) =>
          n.notificationId === item.notificationId ? { ...n, status: 'READ' } : n,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - (item.status === 'UNREAD' ? 1 : 0)));
    } catch {
      // Navigation still proceeds; read-state is best-effort.
    }
    if (item.actionRoute === 'AdminEnquiryDetail' && item.entityId) {
      navigate(adminEnquiryDetailPath(item.entityId));
    }
  }

  const label =
    unreadCount > 0
      ? `${t('admin.notifications.title')} (${unreadCount > 9 ? '9+' : unreadCount})`
      : t('admin.notifications.title');

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          aria-label={t('admin.notifications.open')}
          onClick={(event) => setAnchor(event.currentTarget)}
          size="small"
        >
          <Badge
            badgeContent={unreadCount > 9 ? '9+' : unreadCount}
            color="error"
            invisible={unreadCount <= 0}
            max={9}
          >
            <Bell size={18} />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2">{t('admin.notifications.empty')}</Typography>
          </MenuItem>
        ) : (
          notifications.slice(0, 12).map((item) => (
            <MenuItem key={item.notificationId} onClick={() => void openNotification(item)}>
              <Typography variant="body2" sx={{ fontWeight: item.status === 'UNREAD' ? 700 : 500 }}>
                {item.title}
                {item.message ? ` — ${item.message}` : ''}
              </Typography>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}
