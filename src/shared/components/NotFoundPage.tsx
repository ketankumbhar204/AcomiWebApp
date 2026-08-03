import { Box, Button, Typography, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { BlankLayout } from '@/layouts/BlankLayout';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx } from '@/shared/theme/dashButtonSx';
import { ROUTES } from '@/routes/paths';

/** System 404 page — not a business module. */
export function NotFoundPage() {
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
          Page not found
        </Typography>
        <Button
          component={RouterLink}
          to={ROUTES.root}
          variant="contained"
          color="primary"
          sx={{ ...dashContainedButtonSx, height: DASHBOARD_UX.buttonHeight }}
        >
          Go home
        </Button>
      </Box>
    </BlankLayout>
  );
}
