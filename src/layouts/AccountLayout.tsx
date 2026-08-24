import {
  AppBar,
  Badge,
  Box,
  Button,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { Bell, Moon, Sun, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useLogout } from '@/modules/auth/hooks/useLogout';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { useGlobalDashboard } from '@/modules/global/hooks/useGlobalDashboard';
import { SkipLink, MAIN_CONTENT_ID } from '@/shared/components/SkipLink';
import { APP_NAME } from '@/shared/constants/app';
import { colors } from '@/shared/theme/colors';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { ROUTES } from '@/routes/paths';
import { useAppStore } from '@/store/appStore';
import { ContentLayout } from './ContentLayout';
import { LAYOUT } from './layoutConstants';

type AccountLayoutProps = {
  children: ReactNode;
  headerActions?: ReactNode;
  showNotifications?: boolean;
  contentDense?: boolean;
  contentMaxWidth?: number | false;
};

const primaryOutlinedSx = {
  ...dashOutlinedButtonSx,
  color: colors.primaryDark,
  borderColor: colors.primaryDark,
  '&:hover': {
    borderColor: colors.primaryDark,
    bgcolor: `${colors.primaryDark}0F`,
  },
} as const;

function AccountNotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data } = useGlobalDashboard(true);
  const badgeCount = data?.totalAttentionCount ?? data?.unreadNotificationCount ?? 0;
  const label =
    badgeCount > 0
      ? `${t('notifications.title')} (${badgeCount > 9 ? '9+' : badgeCount})`
      : t('notifications.title');

  return (
    <Tooltip title={label}>
      <IconButton
        onClick={() => navigate(ROUTES.globalAttention)}
        aria-label={label}
        size="small"
      >
        <Badge
          badgeContent={badgeCount > 9 ? '9+' : badgeCount}
          color="error"
          invisible={badgeCount <= 0}
          max={9}
          sx={{
            '& .MuiBadge-badge': {
              minWidth: 14,
              height: 14,
              ...DASHBOARD_UX.badge,
            },
          }}
        >
          <Bell size={16} />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}

/**
 * Account-level shell — top header only, no space sidebar.
 * Brand mark left; utilities right. Page title lives in content.
 */
export function AccountLayout({
  children,
  headerActions,
  showNotifications = true,
  contentDense = true,
  contentMaxWidth = false,
}: AccountLayoutProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const navigate = useNavigate();
  const logout = useLogout();
  const themeMode = useAppStore((state) => state.themeMode);
  const toggleThemeMode = useAppStore((state) => state.toggleThemeMode);
  const themeLabel =
    themeMode === 'light'
      ? t('settings.profile.themeDark', { defaultValue: 'Switch to dark mode' })
      : t('settings.profile.themeLight', { defaultValue: 'Switch to light mode' });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: s.pageBg,
        color: 'text.primary',
      }}
    >
      <SkipLink />
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          borderBottom: `1px solid ${s.border}`,
          bgcolor: s.surface,
          color: s.textPrimary,
          zIndex: (z) => z.zIndex.appBar,
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${LAYOUT.headerHeight}px !important`,
            height: LAYOUT.headerHeight,
            gap: 2,
            px: { xs: 1.5, md: 3 },
          }}
        >
          <Box
            component={RouterLink}
            to={ROUTES.mySpaces}
            aria-label={APP_NAME}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              textDecoration: 'none',
              color: 'inherit',
              minWidth: 0,
              flexShrink: 0,
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: colors.teal,
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                ...DASHBOARD_UX.sidebarAccount,
                flexShrink: 0,
              }}
            >
              c
            </Box>
            <Typography
              sx={{
                ...DASHBOARD_UX.spaceName,
                color: s.textPrimary,
                letterSpacing: '-0.01em',
              }}
            >
              {APP_NAME}
            </Typography>
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }} />

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexShrink: 0,
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            {showNotifications ? <AccountNotificationBell /> : null}
            {headerActions}
            <Button
              variant="outlined"
              color="primary"
              startIcon={<UserRound size={14} />}
              onClick={() => navigate(ROUTES.profile)}
              sx={{ ...primaryOutlinedSx, display: { xs: 'none', sm: 'inline-flex' } }}
            >
              {t('navigation.profile')}
            </Button>
            <IconButton
              onClick={() => navigate(ROUTES.profile)}
              aria-label={t('navigation.profile')}
              size="small"
              sx={{ display: { xs: 'inline-flex', sm: 'none' }, color: colors.primaryDark }}
            >
              <UserRound size={16} />
            </IconButton>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => void logout()}
              sx={{ ...primaryOutlinedSx, display: { xs: 'none', md: 'inline-flex' } }}
            >
              {t('common.logout')}
            </Button>
            <Tooltip title={themeLabel}>
              <IconButton onClick={toggleThemeMode} aria-label={themeLabel} size="small">
                {themeMode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        sx={{ flex: 1, minWidth: 0, outline: 'none' }}
      >
        <ContentLayout maxWidth={contentMaxWidth} dense={contentDense}>
          {children}
        </ContentLayout>
      </Box>
    </Box>
  );
}
