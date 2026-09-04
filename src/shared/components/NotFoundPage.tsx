import { Box, Button, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { BlankLayout } from '@/layouts/BlankLayout';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx } from '@/shared/theme/dashButtonSx';
import { ROUTES } from '@/routes/paths';

/** System 404 page — not a business module. */
export function NotFoundPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <BlankLayout>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: `${DASHBOARD_UX.sectionGap}px`,
          px: 2,
        }}
      >
        <Typography component="h1" sx={{ ...DASHBOARD_UX.pageTitle, color: s.textPrimary }}>
          404
        </Typography>
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
          {t('common.pageNotFound')}
        </Typography>
        <Button
          component={RouterLink}
          to={ROUTES.root}
          variant="contained"
          color="primary"
          sx={{ ...dashContainedButtonSx, height: DASHBOARD_UX.buttonHeight }}
        >
          {t('common.goHome')}
        </Button>
      </Box>
    </BlankLayout>
  );
}
