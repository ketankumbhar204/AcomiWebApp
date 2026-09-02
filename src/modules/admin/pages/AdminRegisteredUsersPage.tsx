import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { adminApi } from '@/modules/admin/api/adminApi';
import {
  formatAdminAssociatedSpaces,
  formatAdminDate,
  formatAdminOnboardingStatus,
  formatAdminUserName,
  formatAdminUserRole,
} from '@/modules/admin/utils/adminLabels';
import { ROUTES } from '@/routes/paths';
import type { AdminRegisteredUser } from '@/shared/types/admin';

const headerSx = {
  px: 2,
  py: 1,
  display: { xs: 'none' as const, md: 'flex' as const },
  color: 'text.secondary',
  typography: 'caption',
  fontWeight: 600,
};

export function AdminRegisteredUsersPage() {
  const [users, setUsers] = useState<AdminRegisteredUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const page = await adminApi.listRegisteredUsers({ size: 100 });
        if (!cancelled) setUsers(page.content);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Registered Users
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Phone-verified accounts. Owner/Member selection and property or mess creation are not required.
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Typography color="text.secondary">No registered users found.</Typography>
      ) : (
        <Stack spacing={1.5}>
          <Stack direction="row" sx={headerSx}>
            <Box sx={{ flex: 1.2, minWidth: 0 }}>User</Box>
            <Box sx={{ width: 120, flexShrink: 0 }}>Phone</Box>
            <Box sx={{ width: 88, flexShrink: 0 }}>Verified</Box>
            <Box sx={{ width: 120, flexShrink: 0 }}>Role</Box>
            <Box sx={{ width: 104, flexShrink: 0 }}>Onboarding</Box>
            <Box sx={{ width: 112, flexShrink: 0 }}>Registered</Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>Space</Box>
          </Stack>
          {users.map((user) => (
            <Box
              key={user.id}
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                minWidth: 0,
              }}>
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                <Typography sx={{ fontWeight: 700 }}>{formatAdminUserName(user.fullName)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.mobileNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.mobileVerified ? 'Verified' : 'Not verified'} · {formatAdminUserRole(user.selectedRole)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Onboarding: {formatAdminOnboardingStatus(user.onboardingStatus)} ·{' '}
                  {formatAdminDate(user.registeredAt)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                  {formatAdminAssociatedSpaces(user.spaces)}
                </Typography>
              </Box>
              <Stack
                direction="row"
                sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'flex-start', minWidth: 0 }}>
                <Box sx={{ flex: 1.2, minWidth: 0, pr: 1 }}>
                  <Typography sx={{ fontWeight: 700 }} noWrap>
                    {formatAdminUserName(user.fullName)}
                  </Typography>
                </Box>
                <Box sx={{ width: 120, flexShrink: 0 }}>
                  <Typography variant="body2">{user.mobileNumber}</Typography>
                </Box>
                <Box sx={{ width: 88, flexShrink: 0 }}>
                  <Typography variant="body2">{user.mobileVerified ? 'Verified' : 'No'}</Typography>
                </Box>
                <Box sx={{ width: 120, flexShrink: 0 }}>
                  <Typography variant="body2">{formatAdminUserRole(user.selectedRole)}</Typography>
                </Box>
                <Box sx={{ width: 104, flexShrink: 0 }}>
                  <Typography variant="body2">
                    {formatAdminOnboardingStatus(user.onboardingStatus)}
                  </Typography>
                </Box>
                <Box sx={{ width: 112, flexShrink: 0 }}>
                  <Typography variant="body2">{formatAdminDate(user.registeredAt)}</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                    {formatAdminAssociatedSpaces(user.spaces)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
      <Button component={RouterLink} to={ROUTES.adminDashboard} sx={{ mt: 3 }}>
        Back to dashboard
      </Button>
    </Box>
  );
}
