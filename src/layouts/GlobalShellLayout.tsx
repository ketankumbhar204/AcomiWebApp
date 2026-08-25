import { Avatar, Badge, Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import {
  Bell,
  Building2,
  ClipboardList,
  FileBarChart,
  Megaphone,
  UserRound,
  Users,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import type { AppNavSection } from '@/layouts/navTypes';
import { useLogout } from '@/modules/auth/hooks/useLogout';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { useGlobalDashboard } from '@/modules/global/hooks/useGlobalDashboard';
import { useAuthSession } from '@/shared/hooks/useAuthSession';
import { colors } from '@/shared/theme/colors';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { ROUTES } from '@/routes/paths';

function GlobalNotificationBell() {
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

function headerCopy(pathname: string, t: (key: string) => string) {
  if (pathname === ROUTES.profile) return t('navigation.profile');
  if (pathname === ROUTES.globalMembers) return t('navigation.members');
  if (pathname === ROUTES.globalMeals) return t('navigation.meals');
  if (pathname === ROUTES.globalPayments) return t('navigation.payments');
  if (pathname === ROUTES.globalComplaints) return t('navigation.complaints');
  if (pathname === ROUTES.globalNotices) return t('navigation.notices');
  if (pathname === ROUTES.globalReports) return t('navigation.reports');
  if (pathname === ROUTES.globalAttention) return t('navigation.globalAttention');
  if (pathname === ROUTES.globalActivity) return t('navigation.globalActivity');
  return t('navigation.mySpaces');
}

/**
 * Account-level chrome for My Spaces and cross-space directories.
 * Dashboard stays inside each space shell — it is not listed here.
 */
export function GlobalShellLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useLogout();
  const { user } = useAuthSession();
  const displayName = user?.fullName?.trim() || user?.mobileNumber || '';
  const initial = (user?.fullName?.trim()?.[0] || user?.mobileNumber?.[0] || 'A').toUpperCase();
  const isMySpaces = location.pathname === ROUTES.mySpaces;
  const isProfile = location.pathname === ROUTES.profile;
  const pageTitle = headerCopy(location.pathname, t);

  useEffect(() => {
    document.title = `${pageTitle} · ${t('common.appName')}`;
  }, [pageTitle, t]);

  const navSections: AppNavSection[] = useMemo(
    () => [
      {
        id: 'account',
        items: [
          {
            id: 'spaces',
            label: t('navigation.mySpaces'),
            to: ROUTES.mySpaces,
            icon: <Building2 size={16} />,
          },
          {
            id: 'members',
            label: t('navigation.members'),
            to: ROUTES.globalMembers,
            icon: <Users size={16} />,
          },
          {
            id: 'meals',
            label: t('navigation.meals'),
            to: ROUTES.globalMeals,
            icon: <UtensilsCrossed size={16} />,
          },
          {
            id: 'payments',
            label: t('navigation.payments'),
            to: ROUTES.globalPayments,
            icon: <Wallet size={16} />,
          },
          {
            id: 'complaints',
            label: t('navigation.complaints'),
            to: ROUTES.globalComplaints,
            icon: <ClipboardList size={16} />,
          },
          {
            id: 'notices',
            label: t('navigation.notices'),
            to: ROUTES.globalNotices,
            icon: <Megaphone size={16} />,
          },
          {
            id: 'reports',
            label: t('navigation.reports'),
            to: ROUTES.globalReports,
            icon: <FileBarChart size={16} />,
          },
          {
            id: 'profile',
            label: t('navigation.profile'),
            to: ROUTES.profile,
            icon: <UserRound size={16} />,
          },
        ],
      },
    ],
    [t],
  );

  const profileLeading = (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Avatar
        src={user?.profilePhotoUrl ?? undefined}
        alt={displayName}
        sx={{
          width: 36,
          height: 36,
          bgcolor: colors.primary,
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.95rem',
        }}
      >
        {initial}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ ...DASHBOARD_UX.spaceName, color: 'text.primary' }} noWrap>
          {t('navigation.profile')}
        </Typography>
        {displayName ? (
          <Typography sx={{ ...DASHBOARD_UX.spaceRole, color: 'text.secondary' }} noWrap>
            {displayName}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );

  const headerActions = isProfile ? (
    <Button
      variant="outlined"
      color="primary"
      onClick={() => navigate(ROUTES.mySpaces)}
      sx={dashOutlinedButtonSx}
    >
      {t('navigation.mySpaces')}
    </Button>
  ) : (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
      }}
    >
      <GlobalNotificationBell />
      <Button
        variant="outlined"
        color="primary"
        startIcon={<UserRound size={14} />}
        onClick={() => navigate(ROUTES.profile)}
        sx={{ ...dashOutlinedButtonSx, display: { xs: 'none', sm: 'inline-flex' } }}
      >
        {t('navigation.profile')}
      </Button>
      <Button
        variant="outlined"
        color="primary"
        onClick={() => void logout()}
        sx={{ ...dashOutlinedButtonSx, display: { xs: 'none', md: 'inline-flex' } }}
      >
        {t('common.logout')}
      </Button>
    </Box>
  );

  return (
    <AppLayout
      navSections={navSections}
      sidebarExpandMode="hover"
      contentDense
      contentMaxWidth={isMySpaces ? false : undefined}
      headerLeading={isProfile ? profileLeading : undefined}
      headerTitle={isMySpaces || isProfile ? undefined : pageTitle}
      headerActions={headerActions}
      sidebarFooter={
        displayName ? (
          <Typography
            sx={{
              ...DASHBOARD_UX.sidebarAccount,
              color: 'text.primary',
              px: 0.5,
            }}
          >
            {displayName}
          </Typography>
        ) : null
      }
    >
      <Outlet />
    </AppLayout>
  );
}
