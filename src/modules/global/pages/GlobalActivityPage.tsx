import {
  Button,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { Clock3 } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useGlobalDashboard } from '@/modules/global/hooks/useGlobalDashboard';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import type { GlobalActivityItem } from '@/shared/types/dashboard';
import { navigateFromNotificationType } from '@/shared/utils/notificationDeepLinks';
import { canManageNotifications } from '@/shared/utils/spaceOperator';
import { findMySpaceEntry, resolveSpacePermissions } from '@/shared/utils/spacePermissions';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useSpaceStore } from '@/store/spaceStore';

export function GlobalActivityPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const switchSpace = useSpaceStore((state) => state.switchSpace);
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const { data, loading, error, reload } = useGlobalDashboard(true);

  useEffect(() => {
    document.title = `${t('spaces.globalDashboard.activityListTitle')} · ${t('common.appName')}`;
  }, [t]);

  const items = data?.recentActivity ?? [];

  const onPressItem = async (item: GlobalActivityItem) => {
    const success = await switchSpace(item.spaceId);
    if (!success) return;

    const entry = findMySpaceEntry(mySpaces, item.spaceId);
    const permissions = resolveSpacePermissions(entry);
    const isOperator = canManageNotifications(permissions);

    navigateFromNotificationType(
      navigate,
      item.spaceId,
      {
        notificationType: item.notificationType,
        entityId: item.entityId,
        actionRoute: item.actionRoute,
        message: item.message,
        title: item.title,
      },
      isOperator,
    );
  };

  return (
    <PageContainer gap={0}>
        <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
          <PageHeader
            title={t('spaces.globalDashboard.activityTitle')}
            description={t('spaces.globalDashboard.activityEmptyBody')}
            actions={
              <Button variant="outlined" onClick={() => void reload()} sx={dashOutlinedButtonSx}>
                {t('common.refresh', { defaultValue: 'Refresh' })}
              </Button>
            }
          />

          {loading && items.length === 0 ? (
            <LoadingState label={t('common.loading')} />
          ) : error && items.length === 0 ? (
            <ErrorState
              title={t('common.errors.generic')}
              message={t('spaces.globalDashboard.activityEmptyBody')}
              onRetry={() => void reload()}
            />
          ) : items.length === 0 ? (
            <ContentCard>
              <EmptyState
                icon={<Clock3 size={28} />}
                title={t('spaces.globalDashboard.activityEmptyTitle')}
                description={t('spaces.globalDashboard.activityEmptyBody')}
              />
            </ContentCard>
          ) : (
            <ContentCard padded={false}>
              <List disablePadding>
                {items.map((item) => (
                  <ListItemButton
                    key={item.notificationId}
                    onClick={() => void onPressItem(item)}
                    aria-label={item.title}
                    sx={{
                      minHeight: DASHBOARD_UX.pendingItemHeight,
                      px: `${DASHBOARD_UX.cardPadding}px`,
                      borderBottom: `1px solid ${s.border}`,
                      '&:last-of-type': { borderBottom: 0 },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Typography
                            sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, flex: 1 }}
                            noWrap
                          >
                            {item.title}
                          </Typography>
                          <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                            {new Date(item.createdAt).toLocaleString()}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }} noWrap>
                          {[item.spaceName, item.message].filter(Boolean).join(' · ')}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            </ContentCard>
          )}
        </Stack>
      </PageContainer>
  );
}
