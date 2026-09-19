import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Bell, Home, LogOut, MessageCircle, Moon, Search, Sun, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/i18n';
import { LAYOUT } from '@/layouts/layoutConstants';
import { useLogout } from '@/modules/auth/hooks/useLogout';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { useGlobalDashboard } from '@/modules/global/hooks/useGlobalDashboard';
import { LanguagePicker } from '@/modules/profile/components/LanguagePicker';
import { RequesterNotificationBell } from '@/modules/onboarding/components/RequesterNotificationBell';
import { ROUTES } from '@/routes/paths';
import { SkipLink, MAIN_CONTENT_ID } from '@/shared/components/SkipLink';
import { useAuthSession } from '@/shared/hooks/useAuthSession';
import { colors } from '@/shared/theme/colors';
import { useAppStore } from '@/store/appStore';
import { useSpaceStore } from '@/store/spaceStore';

function resolveAppLanguage(raw: string | undefined): AppLanguage {
  const code = (raw?.split('-')[0] ?? 'en') as AppLanguage;
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code) ? code : 'en';
}

/**
 * Marketplace-style chrome for member discovery / zero-space flows — no app sidebar.
 * Nav is membership-aware: My Spaces only when the user has connected spaces.
 */
export function DiscoverShellLayout() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();
  const { user } = useAuthSession();
  const themeMode = useAppStore((state) => state.themeMode);
  const toggleThemeMode = useAppStore((state) => state.toggleThemeMode);
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const hasSpaces = mySpaces.length > 0;
  const currentLanguage = resolveAppLanguage(i18n.language);
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const displayName = user?.fullName?.trim() || user?.mobileNumber || '';
  const initial = (user?.fullName?.trim()?.[0] || user?.mobileNumber?.[0] || 'A').toUpperCase();

  const { data: globalDash } = useGlobalDashboard(true);
  const badgeCount = globalDash?.totalAttentionCount ?? globalDash?.unreadNotificationCount ?? 0;

  const homePath = hasSpaces ? ROUTES.mySpaces : ROUTES.memberHome;

  const navItems = useMemo(() => {
    const home = {
      id: 'home',
      label: hasSpaces ? t('navigation.mySpaces') : t('navigation.home', { defaultValue: 'Home' }),
      to: hasSpaces ? ROUTES.mySpaces : ROUTES.memberHome,
      icon: Home,
    };
    const find = { id: 'find', label: t('navigation.findAPlace'), to: ROUTES.findAPlace, icon: Search };
    const enquiries = {
      id: 'enquiries',
      label: t('navigation.enquiries', { defaultValue: 'Enquiries' }),
      to: ROUTES.myEnquiries,
      icon: MessageCircle,
    };
    return [home, find, enquiries];
  }, [hasSpaces, t]);

  const pageBg = isDark ? colors.background : '#F4F7F8';
  const surface = isDark ? theme.palette.background.paper : colors.surface;
  const border = isDark ? theme.palette.divider : colors.border;
  const textPrimary = isDark ? theme.palette.text.primary : colors.textPrimary;
  const textSecondary = isDark ? theme.palette.text.secondary : colors.textSecondary;

  const themeLabel =
    themeMode === 'light'
      ? t('settings.profile.themeDark', { defaultValue: 'Switch to dark mode' })
      : t('settings.profile.themeLight', { defaultValue: 'Switch to light mode' });

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: pageBg,
        color: textPrimary,
      }}
    >
      <SkipLink />
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: surface,
          color: textPrimary,
          borderBottom: `1px solid ${border}`,
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${LAYOUT.headerHeight}px !important`,
            px: { xs: 2, md: 3.5 },
            gap: { xs: 1, md: 2 },
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.1,
              minWidth: 0,
              cursor: 'pointer',
            }}
            onClick={() => navigate(homePath)}
            role="link"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                navigate(homePath);
              }
            }}
            aria-label={t('common.appName')}
          >
            <Box
              aria-hidden
              sx={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                bgcolor: colors.primary,
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
                fontWeight: 800,
                fontSize: '1rem',
              }}
            >
              A
            </Box>
            <Typography
              sx={{
                fontSize: '1.05rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: colors.tealDark,
                lineHeight: 1,
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {t('common.appName')}
            </Typography>
          </Box>

          <Box
            component="nav"
            aria-label={t('navigation.findAPlace')}
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 0.5,
              mx: 'auto',
            }}
          >
            {navItems.map((item) => {
              const active =
                location.pathname === item.to ||
                (item.to === ROUTES.findAPlace && location.pathname.startsWith(ROUTES.findAPlace)) ||
                (item.to === ROUTES.myEnquiries && location.pathname.startsWith(ROUTES.myEnquiries)) ||
                (item.to === ROUTES.memberHome &&
                  (location.pathname === ROUTES.memberHome || location.pathname === ROUTES.joinSpace));
              return (
                <Box
                  key={item.id}
                  component={NavLink}
                  to={item.to}
                  sx={{
                    position: 'relative',
                    px: 1.75,
                    py: 1,
                    textDecoration: 'none',
                    color: active ? colors.teal : textSecondary,
                    fontWeight: active ? 700 : 600,
                    fontSize: '0.92rem',
                    borderRadius: '10px',
                    '&:hover': { color: colors.teal, bgcolor: colors.mintSubtle },
                    '&::after': active
                      ? {
                          content: '""',
                          position: 'absolute',
                          left: 12,
                          right: 12,
                          bottom: 2,
                          height: 3,
                          borderRadius: 999,
                          bgcolor: colors.primary,
                        }
                      : undefined,
                  }}
                >
                  {item.label}
                </Box>
              );
            })}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 'auto' }}>
            <RequesterNotificationBell />
            <Tooltip title={t('notifications.title')}>
              <IconButton
                size="small"
                aria-label={t('notifications.title')}
                onClick={() => navigate(hasSpaces ? ROUTES.globalAttention : ROUTES.memberHome)}
                sx={{ color: textSecondary }}
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
                  <Bell size={18} />
                </Badge>
              </IconButton>
            </Tooltip>

            {!isCompact ? (
              <>
                <LanguagePicker value={currentLanguage} compact />
                <Tooltip title={themeLabel}>
                  <IconButton
                    size="small"
                    onClick={toggleThemeMode}
                    aria-label={themeLabel}
                    sx={{ color: textSecondary }}
                  >
                    {themeMode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                  </IconButton>
                </Tooltip>
              </>
            ) : null}

            <Button
              onClick={(event) => setMenuAnchor(event.currentTarget)}
              sx={{
                textTransform: 'none',
                color: textPrimary,
                borderRadius: 999,
                px: 0.75,
                py: 0.5,
                minWidth: 0,
                gap: 1,
                '&:hover': { bgcolor: colors.mintSubtle },
              }}
              aria-haspopup="menu"
              aria-expanded={Boolean(menuAnchor)}
            >
              <Avatar
                src={user?.profilePhotoUrl ?? undefined}
                alt={displayName}
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: colors.mintSubtle,
                  color: colors.teal,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: `1px solid ${border}`,
                }}
              >
                {initial}
              </Avatar>
              <Typography
                sx={{
                  display: { xs: 'none', sm: 'block' },
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  maxWidth: 140,
                }}
                noWrap
              >
                {displayName || t('navigation.profile')}
              </Typography>
            </Button>

            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              {isCompact
                ? navItems.map((item) => (
                    <MenuItem
                      key={item.id}
                      selected={location.pathname === item.to}
                      onClick={() => {
                        setMenuAnchor(null);
                        navigate(item.to);
                      }}
                    >
                      {item.label}
                    </MenuItem>
                  ))
                : null}
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  navigate(ROUTES.profile);
                }}
              >
                <UserRound size={16} style={{ marginRight: 8 }} />
                {t('navigation.profile')}
              </MenuItem>
              {isCompact ? (
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    toggleThemeMode();
                  }}
                >
                  {themeLabel}
                </MenuItem>
              ) : null}
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  void logout();
                }}
              >
                <LogOut size={16} style={{ marginRight: 8 }} />
                {t('common.logout')}
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        sx={{ flex: 1, minHeight: 0, outline: 'none', display: 'flex', flexDirection: 'column' }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
