import { Box, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { colors } from '@/shared/theme/colors';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

/** Desktop branding panel — Dashboard pageBg + primaryDark type. */
export function AuthIllustration() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100%',
        px: { md: 6, lg: 10 },
        py: 6,
        bgcolor: s.pageBg,
        borderRight: `1px solid ${s.border}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          width: 240,
          height: 240,
          borderRadius: '50%',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(18, 140, 126, 0.12)' : 'rgba(18, 140, 126, 0.08)',
          top: -60,
          right: -40,
        }}
      />
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: `${DASHBOARD_UX.tileRadius}px`,
          bgcolor: colors.primaryDark,
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2.5,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: 'inherit' }}>C</Typography>
      </Box>
      <Typography
        sx={{
          ...DASHBOARD_UX.pageTitle,
          color: s.textPrimary,
          mb: 1,
          position: 'relative',
          zIndex: 1,
          maxWidth: 420,
        }}
      >
        {t('auth.login.brandPanelTitle')}
      </Typography>
      <Typography
        sx={{
          ...DASHBOARD_UX.inputText,
          color: s.textSecondary,
          maxWidth: 420,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {t('auth.login.brandPanelSubtitle')}
      </Typography>
    </Box>
  );
}
