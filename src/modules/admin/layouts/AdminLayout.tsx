import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { Building2, ChefHat, LayoutDashboard, LogOut } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { useAuthStore } from '@/store/authStore';
import { useAdminStore } from '@/store/adminStore';

const navItems = [
  { to: ROUTES.adminDashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.adminProperties, label: 'Properties', icon: Building2 },
  { to: ROUTES.adminMess, label: 'Mess', icon: ChefHat },
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mr: 2 }}>
            Acomi Admin
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
            {navItems.map(({ to, label, icon: Icon }) => (
              <Button
                key={to}
                component={NavLink}
                to={to}
                startIcon={<Icon size={16} />}
                sx={{
                  color: 'text.secondary',
                  fontWeight: 600,
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
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
