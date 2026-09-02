import {
  Box,
  Chip,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Bell, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { SearchToolbar } from '@/shared/components/SearchToolbar';
import { colors } from '@/shared/theme/colors';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import type { SpaceNotification } from '@/shared/types/dashboard';
import { navigateFromNotificationType } from '@/shared/utils/notificationDeepLinks';
import {
  notificationMatchesFilter,
  type NotificationFilterId,
} from '@/shared/utils/notificationVisuals';
import { NotificationCard } from '../components/NotificationCard';
import { NotificationInspector } from '../components/NotificationInspector';
import { useSpaceNotifications } from '../hooks/useSpaceNotifications';

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const today = startOfDay(new Date());
  const day = startOfDay(date);
  if (day === today) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString();
}

type NotificationBucket = 'today' | 'yesterday' | 'earlier';

function bucketFor(value: string): NotificationBucket {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'earlier';
  }
  const today = startOfDay(new Date());
  const day = startOfDay(date);
  const oneDay = 24 * 60 * 60 * 1000;
  if (day === today) return 'today';
  if (day === today - oneDay) return 'yesterday';
  return 'earlier';
}

const FILTER_ACCENTS: Record<NotificationFilterId, string> = {
  all: colors.primaryDark,
  unread: '#3B82F6',
  action: '#F59E0B',
  billing: '#7C3AED',
  meals: colors.success,
  general: colors.muted,
};

export function NotificationsPage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const isLgDown = useMediaQuery(theme.breakpoints.down('lg'));
  const permissions = useSpacePermissions(spaceId);
  const { notifications, unreadCount, loading, error, markRead, isOperator, reload } =
    useSpaceNotifications(spaceId, Boolean(spaceId));

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<NotificationFilterId>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [didAutoSelect, setDidAutoSelect] = useState(false);

  useEffect(() => {
    document.title = `${t('notifications.title')} · ${t('common.appName')}`;
  }, [t]);

  const filterOptions: { id: NotificationFilterId; label: string }[] = useMemo(
    () => [
      { id: 'all', label: t('list.filters.all') },
      {
        id: 'unread',
        label: t('notifications.filters.unread', { defaultValue: 'Unread' }),
      },
      {
        id: 'action',
        label: t('notifications.filters.action', { defaultValue: 'Action needed' }),
      },
      {
        id: 'billing',
        label: t('notifications.filters.billing', { defaultValue: 'Billing' }),
      },
      {
        id: 'meals',
        label: t('notifications.filters.meals', { defaultValue: 'Meals' }),
      },
      {
        id: 'general',
        label: t('notifications.filters.general', { defaultValue: 'General' }),
      },
    ],
    [t],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notifications.filter((n) => {
      const matchesFilter = notificationMatchesFilter(
        filter,
        n.notificationType,
        n.category,
        n.status === 'UNREAD',
      );
      if (!matchesFilter) return false;
      if (!query) return true;
      return (
        n.title.toLowerCase().includes(query) ||
        (n.message?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [filter, notifications, search]);

  const buckets = useMemo(() => {
    const groups: Record<NotificationBucket, SpaceNotification[]> = {
      today: [],
      yesterday: [],
      earlier: [],
    };
    for (const item of filtered) {
      groups[bucketFor(item.createdAt)].push(item);
    }
    return groups;
  }, [filtered]);

  const selectedNotification = useMemo(
    () => notifications.find((n) => n.notificationId === selectedId) ?? null,
    [notifications, selectedId],
  );

  // Keep selection valid when filter/search changes
  useEffect(() => {
    if (!selectedId) return;
    if (!filtered.some((n) => n.notificationId === selectedId)) {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  // Auto-open first row on desktop once list is ready
  useEffect(() => {
    if (isLgDown || didAutoSelect || selectedId || filtered.length === 0) return;
    setSelectedId(filtered[0]!.notificationId);
    setDidAutoSelect(true);
  }, [didAutoSelect, filtered, isLgDown, selectedId]);

  const selectNotification = async (notification: SpaceNotification) => {
    setSelectedId(notification.notificationId);
    if (notification.status === 'UNREAD') {
      try {
        await markRead(notification.notificationId);
      } catch {
        // Keep selection even if mark-read fails.
      }
    }
  };

  const openRelated = (notification: SpaceNotification) => {
    navigateFromNotificationType(navigate, spaceId, notification, isOperator);
  };

  const showDesktopPanel = !isLgDown;

  const inspector = (
    <NotificationInspector
      notification={selectedNotification}
      isOperator={isOperator}
      framed={!isLgDown}
      onClose={() => setSelectedId(null)}
      onOpenRelated={openRelated}
    />
  );

  const renderBucket = (key: NotificationBucket, items: SpaceNotification[]) => {
    if (items.length === 0) return null;
    const title =
      key === 'today'
        ? t('notifications.today', { defaultValue: 'Today' })
        : key === 'yesterday'
          ? t('notifications.yesterday', { defaultValue: 'Yesterday' })
          : t('notifications.earlier', { defaultValue: 'Earlier' });

    return (
      <Box key={key}>
        <Typography
          sx={{
            ...DASHBOARD_UX.sidebarSection,
            color: s.textMuted,
            px: 0.25,
            mb: 1,
          }}
        >
          {title}
        </Typography>
        <Stack spacing={1}>
          {items.map((notification) => (
            <NotificationCard
              key={notification.notificationId}
              notification={notification}
              timeLabel={formatTime(notification.createdAt)}
              selected={selectedId === notification.notificationId}
              onClick={() => void selectNotification(notification)}
            />
          ))}
        </Stack>
      </Box>
    );
  };

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('notifications.title')}
          description={
            unreadCount > 0
              ? t('notifications.unreadBadge', {
                  count: unreadCount,
                  defaultValue: '{{count}} unread',
                })
              : t('notifications.emptyDescription')
          }
          breadcrumbs={[
            { label: permissions.space?.spaceName ?? t('navigation.space') },
            { label: t('notifications.title') },
          ]}
          actions={
            <IconButton
              onClick={() => void reload()}
              aria-label={t('common.refresh', { defaultValue: 'Refresh' })}
              size="small"
              sx={{
                width: DASHBOARD_UX.buttonHeight,
                height: DASHBOARD_UX.buttonHeight,
                border: `1px solid ${s.border}`,
                borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                bgcolor: s.surface,
              }}
            >
              <RefreshCw size={14} />
            </IconButton>
          }
        />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Box
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 220px' },
              maxWidth: { xs: '100%', sm: 360 },
              minWidth: { xs: 0, sm: 180 },
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <SearchToolbar
              value={search}
              onChange={setSearch}
              placeholder={t('notifications.searchPlaceholder', {
                defaultValue: 'Search notifications',
              })}
            />
          </Box>
          <Stack
            direction="row"
            spacing={0.75}
            useFlexGap
            sx={{ flexWrap: 'wrap', alignItems: 'center', ml: { sm: 'auto' } }}
          >
            {filterOptions.map((option) => {
              const active = filter === option.id;
              const accent = FILTER_ACCENTS[option.id];
              const label =
                option.id === 'unread' && unreadCount > 0
                  ? `${option.label} (${unreadCount})`
                  : option.label;
              return (
                <Chip
                  key={option.id}
                  size="small"
                  label={label}
                  onClick={() => setFilter(option.id)}
                  clickable
                  sx={{
                    height: DASHBOARD_UX.buttonHeight,
                    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                    ...DASHBOARD_UX.button,
                    bgcolor: active ? accent : `${accent}1A`,
                    color: active ? '#FFFFFF' : accent,
                    border: 'none',
                    '&:hover': {
                      bgcolor: active ? accent : `${accent}2E`,
                    },
                    '& .MuiChip-label': { px: 1.25 },
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        {loading && notifications.length === 0 ? (
          <LoadingState />
        ) : error && notifications.length === 0 ? (
          <ErrorState
            title={t('common.errors.generic')}
            message={String((error as Error)?.message ?? t('common.errors.generic'))}
            onRetry={() => void reload()}
          />
        ) : filtered.length === 0 ? (
          <Box
            sx={{
              display: 'grid',
              gap: `${DASHBOARD_UX.cardGap}px`,
              gridTemplateColumns: showDesktopPanel
                ? 'minmax(0, 1.85fr) minmax(0, 0.95fr)'
                : '1fr',
              alignItems: 'start',
            }}
          >
            <EmptyState
              icon={
                <IconBadge accent={colors.primaryDark}>
                  <Bell />
                </IconBadge>
              }
              title={t('notifications.emptyTitle')}
              description={t('notifications.emptyDescription')}
            />
            {showDesktopPanel ? (
              <Box
                sx={{
                  position: 'sticky',
                  top: 12,
                  alignSelf: 'start',
                  height: 'calc(100vh - 112px)',
                  maxHeight: 'calc(100vh - 112px)',
                  minHeight: 360,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {inspector}
              </Box>
            ) : null}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: `${DASHBOARD_UX.cardGap}px`,
              gridTemplateColumns: showDesktopPanel
                ? 'minmax(0, 1.85fr) minmax(0, 0.95fr)'
                : '1fr',
              alignItems: 'start',
            }}
          >
            <Stack spacing={`${DASHBOARD_UX.cardGap}px`} sx={{ minWidth: 0 }}>
              {renderBucket('today', buckets.today)}
              {renderBucket('yesterday', buckets.yesterday)}
              {renderBucket('earlier', buckets.earlier)}
            </Stack>

            {showDesktopPanel ? (
              <Box
                sx={{
                  position: 'sticky',
                  top: 12,
                  alignSelf: 'start',
                  height: 'calc(100vh - 112px)',
                  maxHeight: 'calc(100vh - 112px)',
                  minHeight: 360,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {inspector}
              </Box>
            ) : null}
          </Box>
        )}
      </Stack>

      <AppDrawer
        open={Boolean(selectedId) && isLgDown}
        onClose={() => setSelectedId(null)}
        width={400}
      >
        {inspector}
      </AppDrawer>
    </PageContainer>
  );
}
