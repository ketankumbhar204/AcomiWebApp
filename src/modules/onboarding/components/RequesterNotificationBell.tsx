import { Badge, IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { enquiryApi } from '@/shared/api/enquiryApi';
import { myEnquiriesPath } from '@/routes/paths';
import type { UserNotification } from '@/shared/types/enquiry';

function isSafeEnquiryId(value: string | null | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  );
}

export function RequesterNotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    void enquiryApi
      .listNotifications({ size: 12 })
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

  async function openNotification(item: UserNotification) {
    setAnchor(null);
    try {
      if (!item.read) {
        await enquiryApi.markNotificationRead(item.notificationId);
        setNotifications((current) =>
          current.map((n) => (n.notificationId === item.notificationId ? { ...n, read: true } : n)),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch {
      // Navigation still proceeds; read-state is best-effort.
    }
    navigate(myEnquiriesPath(isSafeEnquiryId(item.enquiryId) ? item.enquiryId : undefined));
  }

  const label =
    unreadCount > 0
      ? `${t('notifications.title')} (${unreadCount > 9 ? '9+' : unreadCount})`
      : t('notifications.title');

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          aria-label={t('spaces.enquiries.notificationsOpen', { defaultValue: 'Open enquiry notifications' })}
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
            <Typography variant="body2">
              {t('spaces.enquiries.notificationsEmpty', { defaultValue: 'No enquiry notifications yet.' })}
            </Typography>
          </MenuItem>
        ) : (
          notifications.map((item) => (
            <MenuItem key={item.notificationId} onClick={() => void openNotification(item)}>
              <Typography variant="body2" sx={{ fontWeight: item.read ? 500 : 700, whiteSpace: 'normal', maxWidth: 360 }}>
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
