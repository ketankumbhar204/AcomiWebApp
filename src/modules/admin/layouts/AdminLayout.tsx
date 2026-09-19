import { Avatar, Box, Button, Stack, Typography } from '@mui/material';
import {
  Building2,
  ChefHat,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageCircle,
  Receipt,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AdminNotificationBell } from '@/modules/admin/components/AdminNotificationBell';
import { inquiryCreditsAdminApi } from '@/modules/admin/api/inquiryCreditsAdminApi';
import { AppLayout } from '@/layouts/AppLayout';
import type { AppNavSection } from '@/layouts/navTypes';
import { DASHBOARD_UX } from '@/modules/dashboard/theme/dashboardUx';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { ROUTES } from '@/routes/paths';
import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';

function initials(name?: string | null): string {
  if (!name?.trim()) return 'AA';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'AA';
}

function adminPageTitle(pathname: string, t: (key: string) => string): string {
  if (pathname.startsWith(ROUTES.adminEnquiries)) return t('admin.nav.enquiries');
  if (pathname.startsWith(ROUTES.adminRegisteredUsers)) return t('admin.nav.users');
  if (pathname.startsWith(ROUTES.adminProperties)) return t('admin.nav.properties');
  if (pathname.startsWith(ROUTES.adminMess)) return t('admin.nav.mess');
  if (pathname.startsWith(ROUTES.adminSavedAddresses)) return t('admin.nav.addresses');
  if (pathname.startsWith(ROUTES.adminInquiryPayments)) {
    return t('admin.nav.creditPayments');
  }
  if (pathname.startsWith(ROUTES.adminInquiryCredits)) {
    return t('admin.nav.creditsConfig');
  }
  return t('admin.nav.dashboard');
}

/**
 * Platform-admin chrome only. Mounted under {@link AdminRoute}, so member
 * Global/Space sidebars are untouched.
 */
export function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setAdminMode = useAdminStore((state) => state.setAdminMode);
  const [pendingCredits, setPendingCredits] = useState(0);

  useEffect(() => {
    inquiryCreditsAdminApi
      .getPurchasesSummary()
      .then((s) => setPendingCredits(s.pendingCount))
      .catch(() => {
        /* non-critical */
      });
  }, []);

  const pageTitle = adminPageTitle(location.pathname, t);

  useEffect(() => {
    document.title = `${pageTitle} · ${t('admin.brand')}`;
  }, [pageTitle, t]);

  const navSections: AppNavSection[] = useMemo(
    () => [
      {
        id: 'admin',
        items: [
          {
            id: 'dashboard',
            label: t('admin.nav.dashboard'),
            to: ROUTES.adminDashboard,
            icon: <LayoutDashboard size={16} />,
            end: true,
          },
          {
            id: 'enquiries',
            label: t('admin.nav.enquiries'),
            to: ROUTES.adminEnquiries,
            icon: <MessageCircle size={16} />,
          },
          {
            id: 'users',
            label: t('admin.nav.users'),
            to: ROUTES.adminRegisteredUsers,
            icon: <Users size={16} />,
          },
          {
            id: 'properties',
            label: t('admin.nav.properties'),
            to: ROUTES.adminProperties,
            icon: <Building2 size={16} />,
          },
          {
            id: 'mess',
            label: t('admin.nav.mess'),
            to: ROUTES.adminMess,
            icon: <ChefHat size={16} />,
          },
          {
            id: 'addresses',
            label: t('admin.nav.addresses'),
            to: ROUTES.adminSavedAddresses,
            icon: <MapPin size={16} />,
          },
          {
            id: 'creditsConfig',
            label: t('admin.nav.creditsConfig'),
            to: ROUTES.adminInquiryCredits,
            icon: <CreditCard size={16} />,
            end: true,
          },
          {
            id: 'creditPayments',
            label: t('admin.nav.creditPayments'),
            to: ROUTES.adminInquiryPayments,
            icon: <Receipt size={16} />,
            badgeCount: pendingCredits,
          },
        ],
      },
    ],
    [pendingCredits, t],
  );

  async function handleLogout() {
    setAdminMode(false);
    clearSession();
    navigate(ROUTES.login, { replace: true });
  }

  const displayName = user?.fullName?.trim() || t('admin.dashboard.welcome');

  const headerLeading = (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Avatar
        sx={{
          width: 36,
          height: 36,
          bgcolor: '#22C55E',
          color: '#fff',
          fontWeight: 800,
          fontSize: '0.95rem',
        }}>
        A
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ ...DASHBOARD_UX.spaceName, color: 'text.primary' }} noWrap>
          {t('admin.brand')}
        </Typography>
        <Typography sx={{ ...DASHBOARD_UX.spaceRole, color: 'text.secondary' }} noWrap>
          {displayName}
        </Typography>
      </Box>
    </Stack>
  );

  const headerActions = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
      }}>
      <AdminNotificationBell />
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', display: { xs: 'none', sm: 'flex' } }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
          {displayName}
        </Typography>
        <Avatar
          sx={{
            width: 34,
            height: 34,
            bgcolor: '#DBEAFE',
            color: '#1D4ED8',
            fontSize: 12,
            fontWeight: 700,
          }}>
          {initials(user?.fullName)}
        </Avatar>
      </Stack>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<LogOut size={14} />}
        onClick={() => void handleLogout()}
        sx={{ ...dashOutlinedButtonSx, display: { xs: 'none', md: 'inline-flex' } }}>
        {t('admin.dashboard.signOut')}
      </Button>
    </Box>
  );

  return (
    <AppLayout
      navSections={navSections}
      sidebarExpandMode="pinned"
      contentDense
      contentMaxWidth={false}
      headerLeading={headerLeading}
      headerTitle={pageTitle}
      headerActions={headerActions}
      sidebarFooter={
        <Box>
          <Typography
            sx={{
              ...DASHBOARD_UX.sidebarAccount,
              color: 'text.primary',
              px: 0.5,
            }}
            noWrap>
            {displayName}
          </Typography>
          <Button
            fullWidth
            variant="text"
            color="primary"
            startIcon={<LogOut size={16} />}
            onClick={() => void handleLogout()}
            sx={{
              display: { xs: 'inline-flex', md: 'none' },
              mt: 1,
              justifyContent: 'flex-start',
              ...DASHBOARD_UX.button,
              textTransform: 'none',
            }}>
            {t('admin.dashboard.signOut')}
          </Button>
        </Box>
      }>
      <Outlet />
    </AppLayout>
  );
}
