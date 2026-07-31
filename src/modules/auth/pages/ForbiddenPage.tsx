import { Box, Button, useTheme } from '@mui/material';
import { Ban } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { BlankLayout } from '@/layouts/BlankLayout';
import { ROUTES } from '@/routes/paths';
import { colors } from '@/shared/theme/colors';
import { EmptyState } from '@/shared/components/EmptyState';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';

export function ForbiddenPage() {
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
              <IconBadge accent={colors.danger}>
                <Ban />
              </IconBadge>
            }
            title={t('auth.forbidden.title')}
            description={t('auth.forbidden.body')}
            action={
              <Button
                component={RouterLink}
                to={ROUTES.root}
                variant="contained"
                color="primary"
                sx={{
                  minHeight: 40,
                  borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                  fontSize: DASHBOARD_UX.button.fontSize,
                  fontWeight: DASHBOARD_UX.button.fontWeight,
                  textTransform: 'none',
                  boxShadow: 'none',
                }}
              >
                {t('auth.forbidden.action')}
              </Button>
            }
          />
        </Box>
      </Box>
    </BlankLayout>
  );
}
