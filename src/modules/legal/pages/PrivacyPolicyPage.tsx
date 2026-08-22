import { Box, Link, Typography, useTheme } from '@mui/material';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { AuthCard } from '@/modules/auth/components/AuthCard';

export function PrivacyPolicyPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  useEffect(() => {
    document.title = `${t('legal.privacy.title')} · ${t('common.appName')}`;
  }, [t]);

  const sections = [
    'intro',
    'account',
    'dataWeCollect',
    'howWeUse',
    'sharing',
    'retention',
    'deletion',
    'contact',
  ] as const;

  return (
    <AuthCard>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
          {t('legal.privacy.heading')}
        </Typography>
        <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted }}>
          {t('legal.privacy.lastUpdated')}
        </Typography>

        {sections.map((section) => (
          <Box key={section}>
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, mb: 0.5 }}>
              {t(`legal.privacy.sections.${section}.title`)}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted, whiteSpace: 'pre-line' }}>
              {t(`legal.privacy.sections.${section}.body`)}
            </Typography>
          </Box>
        ))}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          <Link component={RouterLink} to={ROUTES.deleteAccount} underline="hover">
            {t('legal.deleteAccount.linkLabel')}
          </Link>
          <Link component={RouterLink} to={ROUTES.login} underline="hover">
            {t('legal.deleteAccount.backToSignIn')}
          </Link>
        </Box>
      </Box>
    </AuthCard>
  );
}
