import { Box, Button, Stack } from '@mui/material';
import { Building2, Sparkles, UsersRound } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthHero } from '@/modules/auth/components/AuthHero';
import { useLogout } from '@/modules/auth/hooks/useLogout';
import { OnboardingChoiceCard } from '@/modules/onboarding/components/OnboardingChoiceCard';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { PageContainer } from '@/shared/components/PageContainer';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { ROUTES } from '@/routes/paths';
import { useAuthSession } from '@/shared/hooks/useAuthSession';

export function OnboardingChoicePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useLogout();
  const { user } = useAuthSession();
  const displayName = user?.fullName?.trim() || user?.mobileNumber || '';

  useEffect(() => {
    document.title = `${t('onboarding.choice.title')} · ${t('common.appName')}`;
  }, [t]);

  return (
    <AppLayout
      headerTitle={t('common.appName')}
      headerSubtitle={displayName}
      headerActions={
        <Button variant="outlined" onClick={() => void logout()} sx={dashOutlinedButtonSx}>
          {t('common.logout')}
        </Button>
      }
      contentDense
      contentMaxWidth={880}
    >
      <PageContainer gap={0}>
        <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
          <AuthHero
            icon={Sparkles}
            eyebrow={t('onboarding.choice.eyebrow')}
            heading={t('onboarding.choice.heading')}
            subheading={t('onboarding.choice.subheading')}
          />

          <Box
            sx={{
              display: 'grid',
              gap: `${DASHBOARD_UX.cardGap}px`,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            }}
          >
            <OnboardingChoiceCard
              icon={Building2}
              title={t('onboarding.choice.manageTitle')}
              description={t('onboarding.choice.manageSubtitle')}
              benefits={[
                t('onboarding.choice.manageBenefit1'),
                t('onboarding.choice.manageBenefit2'),
                t('onboarding.choice.manageBenefit3'),
              ]}
              onClick={() => navigate(ROUTES.createSpace)}
            />

            <OnboardingChoiceCard
              icon={UsersRound}
              title={t('onboarding.choice.memberTitle')}
              description={t('onboarding.choice.memberSubtitle')}
              benefits={[
                t('onboarding.choice.joinBenefit1'),
                t('onboarding.choice.joinBenefit2'),
                t('onboarding.choice.joinBenefit3'),
              ]}
              accent="#1D4ED8"
              onClick={() => navigate(ROUTES.joinSpace)}
            />
          </Box>
        </Stack>
      </PageContainer>
    </AppLayout>
  );
}
