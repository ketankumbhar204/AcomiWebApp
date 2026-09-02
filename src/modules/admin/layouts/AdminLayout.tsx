import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { Building2, ChefHat, LayoutDashboard, LogOut, MapPin, Users } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';

const navItems = [
  { to: ROUTES.adminDashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.adminRegisteredUsers, label: 'Users', icon: Users },
  { to: ROUTES.adminProperties, label: 'Properties', icon: Building2 },
  { to: ROUTES.adminMess, label: 'Mess', icon: ChefHat },
  { to: ROUTES.adminSavedAddresses, label: 'Addresses', icon: MapPin },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setAdminMode = useAdminStore((state) => state.setAdminMode);

  async function handleLogout() {
    setAdminMode(false);
    clearSession();
    navigate(ROUTES.login, { replace: true });
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', minWidth: 0 }}>
      <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap', minHeight: { xs: 56, sm: 64 } }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mr: { xs: 0, sm: 1 }, flexShrink: 0 }}>
            Acomi Admin
          </Typography>
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              flex: 1,
              minWidth: 0,
              overflowX: 'auto',
              flexWrap: { xs: 'nowrap', md: 'wrap' },
            }}>
            {navItems.map(({ to, label, icon: Icon }) => (
              <Button
                key={to}
                component={NavLink}
                to={to}
                startIcon={<Icon size={16} />}
                end={to === ROUTES.adminDashboard}
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  '&.active': { color: 'primary.main', bgcolor: 'action.selected' },
                }}>
                {label}
              </Button>
            ))}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {user?.fullName ?? 'Admin'}
          </Typography>
          <Button color="inherit" startIcon={<LogOut size={16} />} onClick={() => void handleLogout()}>
            Sign out
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3, minWidth: 0 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
