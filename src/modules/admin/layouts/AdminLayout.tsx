import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { Building2, ChefHat, CreditCard, LayoutDashboard, LogOut, MapPin, MessageCircle, Receipt, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AdminNotificationBell } from '@/modules/admin/components/AdminNotificationBell';
import { inquiryCreditsAdminApi } from '@/modules/admin/api/inquiryCreditsAdminApi';
import { ROUTES } from '@/routes/paths';
import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';

function initials(name?: string | null): string {
  if (!name?.trim()) return 'AA';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'AA';
}

export function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setAdminMode = useAdminStore((state) => state.setAdminMode);
  const [pendingCredits, setPendingCredits] = useState(0);

  useEffect(() => {
    inquiryCreditsAdminApi
      .getPurchasesSummary()
      .then((s) => setPendingCredits(s.pendingCount))
      .catch(() => { /* non-critical */ });
  }, []);

  const navItems = [
    { to: ROUTES.adminDashboard, label: t('admin.nav.dashboard'), icon: LayoutDashboard, badge: 0 },
    { to: ROUTES.adminEnquiries, label: t('admin.nav.enquiries'), icon: MessageCircle, badge: 0 },
    { to: ROUTES.adminRegisteredUsers, label: t('admin.nav.users'), icon: Users, badge: 0 },
    { to: ROUTES.adminProperties, label: t('admin.nav.properties'), icon: Building2, badge: 0 },
    { to: ROUTES.adminMess, label: t('admin.nav.mess'), icon: ChefHat, badge: 0 },
    { to: ROUTES.adminSavedAddresses, label: t('admin.nav.addresses'), icon: MapPin, badge: 0 },
    { to: ROUTES.adminInquiryCredits, label: 'Credits config', icon: CreditCard, badge: 0 },
    { to: ROUTES.adminInquiryPayments, label: 'Credit payments', icon: Receipt, badge: pendingCredits },
  ];

  async function handleLogout() {
    setAdminMode(false);
    clearSession();
    navigate(ROUTES.login, { replace: true });
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F5F7FA', minWidth: 0 }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}>
        <Toolbar
          sx={{
            gap: 1.5,
            flexWrap: 'wrap',
            minHeight: { xs: 64, sm: 68 },
            px: { xs: 2, md: 3 },
          }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flexShrink: 0 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: '#22C55E',
                fontSize: 15,
                fontWeight: 800,
              }}>
              A
            </Avatar>
            <Typography sx={{ fontWeight: 800, fontSize: 17, color: 'text.primary' }}>
              {t('admin.brand')}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              flex: 1,
              minWidth: 0,
              overflowX: 'auto',
              py: 0.5,
            }}>
            {navItems.map(({ to, label, icon: Icon, badge }) => (
              <Badge
                key={to}
                badgeContent={badge || null}
                color="error"
                sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16, px: 0.5 } }}
              >
                <Button
                  component={NavLink}
                  to={to}
                  startIcon={<Icon size={16} />}
                  end={to === ROUTES.adminDashboard}
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                    fontSize: 13.5,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    borderRadius: '999px',
                    px: 1.75,
                    py: 0.75,
                    minHeight: 36,
                    '&.active': {
                      color: '#15803D',
                      bgcolor: '#DCFCE7',
                      '& .MuiButton-startIcon': { color: '#16A34A' },
                    },
                  }}>
                  {label}
                </Button>
              </Badge>
            ))}
          </Stack>

          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flexShrink: 0 }}>
            <AdminNotificationBell />
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', display: { xs: 'none', sm: 'flex' } }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
                {user?.fullName ?? t('admin.dashboard.welcome')}
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
              color="inherit"
              startIcon={<LogOut size={16} />}
              onClick={() => void handleLogout()}
              sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {t('admin.dashboard.signOut')}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 3.5 }, px: { xs: 2, md: 3 }, minWidth: 0 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
