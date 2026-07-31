import { Button, Stack } from '@mui/material';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { useLogout } from '@/modules/auth/hooks/useLogout';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { ROUTES } from '@/routes/paths';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useAuthSession } from '@/shared/hooks/useAuthSession';

export function NoSpacesPage() {
  const { t } = useTranslation();
  const logout = useLogout();
  const navigate = useNavigate();
  const { user } = useAuthSession();
  const displayName = user?.fullName?.trim() || user?.mobileNumber || '';

  useEffect(() => {
    document.title = `${t('spaces.mySpaces.emptyTitle')} · ${t('common.appName')}`;
  }, [t]);

  return (
    <AppLayout
      headerTitle={t('common.appName')}
      headerSubtitle={displayName}
      headerActions={
        <Button variant="outlined" color="primary" onClick={() => void logout()} sx={dashOutlinedButtonSx}>
          {t('common.logout')}
        </Button>
      }
      contentDense
    >
      <PageContainer gap={0}>
        <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
          <PageHeader title={t('spaces.mySpaces.emptyTitle')} />
          <ContentCard>
            <EmptyState
              title={t('spaces.mySpaces.emptyTitle')}
              description={t('spaces.mySpaces.emptyDescription')}
              action={
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant="contained"
                    onClick={() => navigate(ROUTES.onboarding)}
                    sx={dashContainedButtonSx}
                  >
                    {t('navigation.onboarding')}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(ROUTES.createSpace)}
                    sx={dashOutlinedButtonSx}
                  >
                    {t('spaces.mySpaces.createFab')}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(ROUTES.joinSpace)}
                    sx={dashOutlinedButtonSx}
                  >
                    {t('navigation.joinSpace')}
                  </Button>
                  <Button
                    variant="text"
                    onClick={() => navigate(ROUTES.acceptInvitations)}
                    sx={dashOutlinedButtonSx}
                  >
                    {t('navigation.acceptInvitations')}
                  </Button>
                </Stack>
              }
            />
          </ContentCard>
        </Stack>
      </PageContainer>
    </AppLayout>
  );
}
