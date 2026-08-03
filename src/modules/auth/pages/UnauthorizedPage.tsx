import { Box, Button, useTheme } from '@mui/material';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { BlankLayout } from '@/layouts/BlankLayout';
import { ROUTES } from '@/routes/paths';
import { colors } from '@/shared/theme/colors';
import { EmptyState } from '@/shared/components/EmptyState';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { dashContainedButtonSx } from '@/shared/theme/dashButtonSx';

export function UnauthorizedPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  return (
    <BlankLayout>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          bgcolor: s.pageBg,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 440,
            p: `${DASHBOARD_UX.sectionPadding + 4}px`,
            borderRadius: `${DASHBOARD_UX.radius}px`,
            border: `1px solid ${s.border}`,
            bgcolor: s.surface,
            boxShadow: s.shadow,
          }}
        >
          <EmptyState
            icon={
              <IconBadge accent={colors.primaryDark}>
                <ShieldAlert />
              </IconBadge>
            }
            title={t('auth.unauthorized.title')}
            description={t('auth.unauthorized.body')}
            action={
              <Button
                component={RouterLink}
                to={ROUTES.login}
                variant="contained"
                color="primary"
                sx={dashContainedButtonSx}
              >
                {t('auth.unauthorized.action')}
              </Button>
            }
          />
        </Box>
      </Box>
    </BlankLayout>
  );
}
