import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { Building2, MailPlus, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { useLogout } from '@/modules/auth/hooks/useLogout';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { resolveStartupSpace } from '@/modules/onboarding/utils/resolveStartupSpace';
import { ContentCard } from '@/shared/components/ContentCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StickyFooter, StickyFooterClearance } from '@/shared/components/StickyFooter';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { ROUTES, spaceDashboardPath } from '@/routes/paths';
import { useAuthSession } from '@/shared/hooks/useAuthSession';
import { useSpaceStore } from '@/store/spaceStore';

/**
 * Join Space — invitation wait only (no join codes).
 * Intentionally mirrors mobile JoinSpaceScreen; documented in ACCOUNT_ONBOARDING.md.
 */
export function JoinSpacePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useLogout();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { user } = useAuthSession();
  const selectSpace = useSpaceStore((state) => state.selectSpace);
  const loadMySpaces = useSpaceStore((state) => state.loadMySpaces);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    document.title = `${t('onboarding.join.title')} · ${t('common.appName')}`;
  }, [t]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadMySpaces();
      const resolved = await resolveStartupSpace();
      if (resolved.kind === 'dashboard') {
        selectSpace(resolved.spaceId);
        navigate(spaceDashboardPath(resolved.spaceId), { replace: true });
        return;
      }
      if (resolved.kind === 'invitations') {
        navigate(ROUTES.acceptInvitations, { replace: true });
        return;
      }
      if (resolved.kind === 'picker') {
        navigate(ROUTES.mySpaces, { replace: true });
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <AppLayout
      headerTitle={t('onboarding.join.title')}
      headerSubtitle={user?.fullName?.trim() || user?.mobileNumber || ''}
      headerActions={
        <Button variant="outlined" onClick={() => void logout()} sx={dashOutlinedButtonSx}>
          {t('common.logout')}
        </Button>
      }
      contentDense
      contentMaxWidth={720}
    >
      <PageContainer gap={0}>
        <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
          <PageHeader
            title={t('onboarding.join.heading')}
            description={t('onboarding.join.body')}
          />

          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.25,
              p: `${DASHBOARD_UX.metricPadding}px`,
              borderRadius: `${DASHBOARD_UX.tileRadius}px`,
              border: `1px solid ${s.border}`,
              bgcolor: s.elevated,
            }}
          >
            <IconBadge accent={colors.primaryDark}>
              <UsersRound />
            </IconBadge>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, pt: 0.35 }}>
              {t('onboarding.join.eyebrow')}
            </Typography>
          </Box>

          <ContentCard>
            <EmptyState
              title={t('onboarding.join.emptyTitle')}
              description={t('onboarding.join.emptyDescription')}
              icon={<MailPlus size={28} />}
            />
          </ContentCard>

          <Button
            variant="outlined"
            startIcon={<Building2 size={16} />}
            onClick={() => navigate(ROUTES.onboarding)}
            disabled={refreshing}
            sx={{ ...dashOutlinedButtonSx, alignSelf: 'flex-start' }}
          >
            {t('onboarding.join.manageInstead')}
          </Button>
        </Stack>
        <StickyFooterClearance height={{ xs: 88, md: 80 }} />
      </PageContainer>

      <StickyFooter pin="fixed">
        <Button
          variant="contained"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          aria-busy={refreshing}
          sx={dashContainedButtonSx}
        >
          {refreshing ? t('onboarding.join.refreshing') : t('onboarding.join.refresh')}
        </Button>
      </StickyFooter>
    </AppLayout>
  );
}
