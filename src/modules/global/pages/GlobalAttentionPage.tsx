import {
  Box,
  Button,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { AlertTriangle, ChevronRight } from 'lucide-react';
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
import { StatusChip } from '@/shared/components/StatusChip';
import type { GlobalAttentionItem, GlobalAttentionSpace } from '@/shared/types/dashboard';
import { navigateFromNotificationType } from '@/shared/utils/notificationDeepLinks';
import { canManageNotifications } from '@/shared/utils/spaceOperator';
import { findMySpaceEntry, resolveSpacePermissions } from '@/shared/utils/spacePermissions';
import { spacePendingActionsPath } from '@/routes/paths';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useSpaceStore } from '@/store/spaceStore';

export function GlobalAttentionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const switchSpace = useSpaceStore((state) => state.switchSpace);
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const { data, loading, error, reload } = useGlobalDashboard(true);

  useEffect(() => {
    document.title = `${t('spaces.globalDashboard.attentionListTitle')} · ${t('common.appName')}`;
  }, [t]);

  const spaces = data?.attentionRequired ?? [];

  const switchIntoSpace = async (spaceId: string) => {
    return switchSpace(spaceId);
  };

  const onPressHeader = async (space: GlobalAttentionSpace) => {
    const success = await switchIntoSpace(space.spaceId);
    if (success) {
      navigate(spacePendingActionsPath(space.spaceId));
    }
  };

  const onPressItem = async (space: GlobalAttentionSpace, item: GlobalAttentionItem) => {
    const success = await switchIntoSpace(space.spaceId);
    if (!success) return;

    const entry = findMySpaceEntry(mySpaces, space.spaceId);
    const permissions = resolveSpacePermissions(entry);
    const isOperator = canManageNotifications(permissions);

    navigateFromNotificationType(
      navigate,
      space.spaceId,
      {
        notificationType: item.actionType,
        entityId: item.sampleEntityId,
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
            title={t('spaces.globalDashboard.needsAttention')}
            description={t('spaces.globalDashboard.attentionTitle', {
              count: data?.totalAttentionCount ?? 0,
            })}
            actions={
              <Button variant="outlined" onClick={() => void reload()} sx={dashOutlinedButtonSx}>
                {t('common.refresh', { defaultValue: 'Refresh' })}
              </Button>
            }
          />

          {loading && spaces.length === 0 ? (
            <LoadingState label={t('common.loading')} />
          ) : error && spaces.length === 0 ? (
            <ErrorState
              title={t('common.errors.generic')}
              message={t('spaces.globalDashboard.attentionEmptyBody')}
              onRetry={() => void reload()}
            />
          ) : spaces.length === 0 ? (
            <ContentCard>
              <EmptyState
                icon={<AlertTriangle size={28} />}
                title={t('spaces.globalDashboard.attentionEmptyTitle')}
                description={t('spaces.globalDashboard.attentionEmptyBody')}
              />
            </ContentCard>
          ) : (
            <Stack spacing={`${DASHBOARD_UX.cardGap}px`}>
              {spaces.map((space) => (
                <ContentCard key={space.spaceId}>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => void onPressHeader(space)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      width: '100%',
                      p: 0,
                      mb: 1,
                      border: 0,
                      bgcolor: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'inherit',
                      font: 'inherit',
                      '&:hover .space-title': { color: 'primary.main' },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        className="space-title"
                        sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}
                        noWrap
                      >
                        {space.spaceName}
                      </Typography>
                      <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                        {t('spaces.globalDashboard.pendingActions', { count: space.count })}
                      </Typography>
                    </Box>
                    <StatusChip label={String(space.count)} tone="warning" />
                    <ChevronRight size={18} color={s.textMuted} />
                  </Box>
                  <Stack spacing={0.5}>
                    {space.items.map((item) => (
                      <Button
                        key={`${space.spaceId}-${item.actionType}-${item.title}`}
                        variant="text"
                        sx={{
                          justifyContent: 'space-between',
                          textAlign: 'left',
                          minHeight: DASHBOARD_UX.pendingItemHeight,
                          borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                          px: 1,
                        }}
                        onClick={() => void onPressItem(space, item)}
                        endIcon={<ChevronRight size={16} />}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }} noWrap>
                            {item.title}
                          </Typography>
                          {item.message ? (
                            <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textSecondary }} noWrap>
                              {item.message}
                            </Typography>
                          ) : null}
                        </Box>
                        <StatusChip label={String(item.count)} tone="neutral" />
                      </Button>
                    ))}
                  </Stack>
                </ContentCard>
              ))}
            </Stack>
          )}
        </Stack>
      </PageContainer>
  );
}
