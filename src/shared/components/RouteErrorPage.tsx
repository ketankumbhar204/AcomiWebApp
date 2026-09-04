import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { ROUTES } from '@/routes/paths';

function resolveMessage(
  error: unknown,
  t: (key: string) => string,
): { title: string; detail: string; status?: number } {
  if (isRouteErrorResponse(error)) {
    return {
      title: error.status === 404 ? t('common.pageNotFound') : t('common.errors.generic'),
      detail:
        error.statusText ||
        (typeof error.data === 'string' ? error.data : t('common.pleaseTryAgain')),
      status: error.status,
    };
  }
  if (error instanceof Error) {
    const isChunk =
      /Failed to fetch dynamically imported module/i.test(error.message) ||
      /Loading chunk/i.test(error.message) ||
      /Importing a module script failed/i.test(error.message);
    return {
      title: isChunk ? t('common.updateRequired') : t('common.errors.generic'),
      detail: isChunk ? t('common.updateRequiredDetail') : t('common.unexpectedError'),
    };
  }
  return {
    title: t('common.errors.generic'),
    detail: t('common.unexpectedError'),
  };
}

/**
 * React Router `errorElement` — catches lazy-load failures and route errors
 * (class ErrorBoundary does not catch these).
 */
export function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { title, detail, status } = resolveMessage(error, t);

  const handleReload = () => {
    window.location.reload();
  };

  const handleHome = () => {
    navigate(ROUTES.root, { replace: true });
  };

  return (
    <Box
      component="main"
      id="main-content"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 4,
        bgcolor: s.pageBg,
      }}
    >
      <ContentCard>
        <Stack
          spacing={`${DASHBOARD_UX.sectionGap}px`}
          sx={{ maxWidth: 440, width: '100%', alignItems: 'flex-start' }}
        >
          <IconBadge accent={colors.warning}>
            <AlertTriangle />
          </IconBadge>
          <Box>
            {status ? (
              <Typography sx={{ ...DASHBOARD_UX.spaceRole, color: s.textMuted, mb: 0.5 }}>
                {status}
              </Typography>
            ) : null}
            <Typography component="h1" sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
              {title}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.75 }}>
              {detail}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<RefreshCw size={14} />}
              onClick={handleReload}
              sx={dashContainedButtonSx}
            >
              {t('common.reload')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Home size={14} />}
              onClick={handleHome}
              sx={dashOutlinedButtonSx}
            >
              {t('common.home')}
            </Button>
          </Stack>
        </Stack>
      </ContentCard>
    </Box>
  );
}
