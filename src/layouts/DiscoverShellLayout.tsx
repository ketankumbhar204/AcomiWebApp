import { Avatar, Badge, Box, Button, IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import { Bell, Heart, Home, LogOut, MessageCircle, Search, UserRound, UtensilsCrossed } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import type { AppNavSection } from '@/layouts/navTypes';
import { useLogout } from '@/modules/auth/hooks/useLogout';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { useGlobalDashboard } from '@/modules/global/hooks/useGlobalDashboard';
import { RequesterNotificationBell } from '@/modules/onboarding/components/RequesterNotificationBell';
import { ROUTES } from '@/routes/paths';
import { useAuthSession } from '@/shared/hooks/useAuthSession';
import { colors } from '@/shared/theme/colors';
import { useSpaceStore } from '@/store/spaceStore';

/**
 * Logged-in customer chrome. Primary navigation lives in the sidebar.
 * The header keeps brand and account utilities only.
 */
export function DiscoverShellLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();
  const { user } = useAuthSession();
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const hasSpaces = mySpaces.length > 0;
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const displayName = user?.fullName?.trim() || user?.mobileNumber || '';
  const initial = (user?.fullName?.trim()?.[0] || user?.mobileNumber?.[0] || 'A').toUpperCase();
  const homePath = hasSpaces ? ROUTES.mySpaces : ROUTES.memberHome;
  const isSearch =
    location.pathname.startsWith(ROUTES.findAPlace) || location.pathname.startsWith(ROUTES.findAMeal);

  const { data: globalDash } = useGlobalDashboard(true);
  const badgeCount = globalDash?.totalAttentionCount ?? globalDash?.unreadNotificationCount ?? 0;

  const navSections: AppNavSection[] = useMemo(
    () => [
      {
        id: 'discover',
        items: [
          {
            id: 'home',
            label: t('navigation.home', { defaultValue: 'Home' }),
            to: homePath,
            icon: <Home size={16} />,
            end: true,
          },
          {
            id: 'findAPlace',
            label: t('navigation.findAPlace'),
            to: ROUTES.findAPlace,
            icon: <Search size={16} />,
            end: true,
          },
          {
            id: 'findAMeal',
            label: t('navigation.findAMeal', { defaultValue: 'Search for a meal' }),
            to: ROUTES.findAMeal,
            icon: <UtensilsCrossed size={16} />,
            end: true,
          },
          {
            id: 'enquiries',
            label: t('navigation.enquiries', { defaultValue: 'Enquiries' }),
            to: ROUTES.myEnquiries,
            icon: <MessageCircle size={16} />,
            end: true,
          },
          {
            id: 'favorites',
            label: t('navigation.favorites', { defaultValue: 'Favorites' }),
            to: ROUTES.favorites,
            icon: <Heart size={16} />,
            end: true,
          },
          {
            id: 'profile',
            label: t('navigation.profile'),
            to: ROUTES.profile,
            icon: <UserRound size={16} />,
            end: true,
          },
        ],
      },
    ],
    [homePath, t],
  );

  const headerLeading = (
    <Box
      sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', minWidth: 0 }}
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
          width: 32,
          height: 32,
          borderRadius: '8px',
          bgcolor: colors.primary,
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 800,
          fontSize: '0.85rem',
          flexShrink: 0,
        }}
      >
        A
      </Box>
      <Typography
        sx={{
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: colors.tealDark,
          display: { xs: 'none', sm: 'block' },
        }}
      >
        {t('common.appName')}
      </Typography>
    </Box>
  );

  const headerActions = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <RequesterNotificationBell />
      <Tooltip title={t('notifications.title')}>
        <IconButton
          size="small"
          aria-label={t('notifications.title')}
          onClick={() => navigate(hasSpaces ? ROUTES.globalAttention : ROUTES.memberHome)}
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
      <Button
        onClick={(event) => setMenuAnchor(event.currentTarget)}
        sx={{
          textTransform: 'none',
          color: 'text.primary',
          borderRadius: 999,
          px: 0.75,
          py: 0.5,
          minWidth: 0,
          gap: 1,
        }}
        aria-haspopup="menu"
        aria-expanded={Boolean(menuAnchor)}
      >
        <Avatar
          src={user?.profilePhotoUrl ?? undefined}
          alt={displayName}
          sx={{
            width: 32,
            height: 32,
            bgcolor: colors.mintSubtle,
            color: colors.teal,
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          {initial}
        </Avatar>
        <Typography sx={{ display: { xs: 'none', md: 'block' }, fontWeight: 600, fontSize: '0.88rem', maxWidth: 140 }} noWrap>
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
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            navigate(ROUTES.profile);
          }}
        >
          <UserRound size={16} style={{ marginRight: 8 }} />
          {t('navigation.profile')}
        </MenuItem>
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
  );

  return (
    <AppLayout
      navSections={navSections}
      sidebarExpandMode="hover"
      padded={!isSearch}
      contentMaxWidth={isSearch ? false : undefined}
      headerLeading={headerLeading}
      headerActions={headerActions}
    >
      <Outlet />
    </AppLayout>
  );
}
