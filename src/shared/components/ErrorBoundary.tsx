import { Box, Button, Typography } from '@mui/material';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { i18n } from '@/i18n';
import { APP_NAME } from '@/shared/constants/app';
import { DASHBOARD_UX, DASH_LIGHT } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string | null;
};

/**
 * Catches render errors in the application tree.
 * Lazy-load / route errors use `RouteErrorPage` via react-router `errorElement`.
 * Uses light Dashboard tokens (may render outside ThemeProvider).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || i18n.t('common.unexpectedError'),
    };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[${APP_NAME}] Uncaught render error`, error, info);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleHome = (): void => {
    window.location.assign('/');
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box
          component="main"
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            px: 2,
            bgcolor: DASH_LIGHT.pageBg,
            color: DASH_LIGHT.textPrimary,
          }}
        >
          <Typography component="h1" sx={{ ...DASHBOARD_UX.sectionHeading, color: DASH_LIGHT.textPrimary }}>
            {i18n.t('common.errors.generic')}
          </Typography>
          <Typography
            sx={{
              ...DASHBOARD_UX.body,
              color: DASH_LIGHT.textSecondary,
              textAlign: 'center',
              maxWidth: 420,
            }}
          >
            {i18n.t('common.unexpectedError')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button variant="contained" onClick={this.handleReload} sx={dashContainedButtonSx}>
              {i18n.t('common.reload')}
            </Button>
            <Button
              variant="outlined"
              onClick={this.handleHome}
              sx={{
                ...dashOutlinedButtonSx,
                borderColor: DASH_LIGHT.border,
                color: colors.primaryDark,
              }}
            >
              {i18n.t('common.home')}
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
