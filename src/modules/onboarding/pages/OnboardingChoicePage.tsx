import { Box, Typography, useTheme } from '@mui/material';
import { Building2, Clock3, LayoutGrid, Lock, ShieldCheck, UsersRound } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '@/layouts/OnboardingLayout';
import { AUTH_UX, authSurfaces } from '@/modules/auth/theme/authUx';
import { OnboardingChoiceCard } from '@/modules/onboarding/components/OnboardingChoiceCard';
import { OnboardingHeroVisual } from '@/modules/onboarding/components/OnboardingHeroVisual';
import { ROUTES } from '@/routes/paths';
import { colors } from '@/shared/theme/colors';

export function OnboardingChoicePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const a = authSurfaces(theme.palette.mode);

  useEffect(() => {
    document.title = `${t('onboarding.choice.title')} · ${t('common.appName')}`;
  }, [t]);

  const perks = [
    {
      Icon: LayoutGrid,
      color: colors.teal,
      bg: colors.lightGreen,
      title: t('onboarding.choice.perkAllInOne'),
      body: t('onboarding.choice.perkAllInOneBody'),
    },
    {
      Icon: Clock3,
      color: '#D97706',
      bg: '#FFF4E5',
      title: t('onboarding.choice.perkSaveTime'),
      body: t('onboarding.choice.perkSaveTimeBody'),
    },
    {
      Icon: ShieldCheck,
      color: '#2563EB',
      bg: '#E8F0FF',
      title: t('onboarding.choice.perkSecure'),
      body: t('onboarding.choice.perkSecureBody'),
    },
    {
      Icon: UsersRound,
      color: '#7C3AED',
      bg: '#F3E8FF',
      title: t('onboarding.choice.perkOperators'),
      body: t('onboarding.choice.perkOperatorsBody'),
    },
  ];

  return (
    <OnboardingLayout>
      <Box
        sx={{
          maxWidth: 1240,
          mx: 'auto',
          width: '100%',
          flex: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 0.92fr) minmax(0, 1.18fr)' },
          gap: { xs: 2, lg: 4 },
          alignItems: 'stretch',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            pr: { lg: 1 },
          }}
        >
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: a.brand, mb: 0.6 }}>
            {t('onboarding.choice.welcome')}
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1.7rem', md: '2rem' },
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              color: a.textPrimary,
            }}
          >
            {t('onboarding.choice.headingLead')}{' '}
            <Box component="span" sx={{ color: a.brand }}>
              {t('common.appName')}
            </Box>
            ?
          </Typography>
          <Typography sx={{ ...AUTH_UX.support, color: a.textSecondary, mt: 0.85, maxWidth: 420 }}>
            {t('onboarding.choice.subheading')}
          </Typography>

          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.15 }}>
            {perks.map((item) => (
              <Box key={item.title} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.15 }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '12px',
                    bgcolor: item.bg,
                    color: item.color,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <item.Icon size={18} strokeWidth={2.2} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: a.textPrimary, lineHeight: 1.25 }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: a.textSecondary, lineHeight: 1.4, mt: 0.2 }}>
                    {item.body}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: { xs: 'none', lg: 'block' }, mt: 2, flexShrink: 0 }}>
            <OnboardingHeroVisual />
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.75,
            minWidth: 0,
            minHeight: 0,
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
              t('onboarding.choice.manageBenefit4'),
              t('onboarding.choice.manageBenefit5'),
            ]}
            proof={t('onboarding.choice.manageProof')}
            accent={a.brand}
            accentSoft={a.brandSoft}
            illustration="owner"
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
              t('onboarding.choice.joinBenefit4'),
              t('onboarding.choice.joinBenefit5'),
            ]}
            proof={t('onboarding.choice.memberProof')}
            accent="#2563EB"
            accentSoft={theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.18)' : '#E8F0FF'}
            illustration="member"
            onClick={() => navigate(ROUTES.joinSpace)}
          />

          <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
            <OnboardingHeroVisual />
          </Box>

          <Box
            sx={{
              mt: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1.1,
              borderRadius: '14px',
              border: `1px solid ${a.brandSoftBorder}`,
              bgcolor: a.brandSoft,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: a.surface,
                color: a.brand,
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={18} strokeWidth={2.2} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: a.textPrimary }}>
                {t('onboarding.choice.trustTitle')}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: a.textSecondary }}>
                {t('onboarding.choice.trustBody')}
              </Typography>
            </Box>
            <Box
              aria-hidden
              sx={{
                width: 36,
                height: 36,
                borderRadius: '12px',
                bgcolor: theme.palette.mode === 'dark' ? a.elevated : '#D8F3E6',
                color: a.brand,
                display: { xs: 'none', sm: 'grid' },
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              <Lock size={16} strokeWidth={2.2} />
            </Box>
          </Box>
        </Box>
      </Box>
    </OnboardingLayout>
  );
}
