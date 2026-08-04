import { Box } from '@mui/material';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { LoadingFallback } from '@/shared/components/LoadingBoundary';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { ROUTES } from '@/routes/paths';
import { useSpaceStore } from '@/store/spaceStore';

/** Requires `canViewMeals` for the current space. */
export function MealsPermissionGate() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const bootstrapped = useSpaceStore((state) => state.bootstrapped);
  const permissions = useSpacePermissions(spaceId);

  if (!bootstrapped) {
    return <LoadingFallback />;
  }

  if (permissions.canViewMeals !== true) {
    return <Navigate to={ROUTES.forbidden} replace />;
  }

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        '& > *': {
          flex: 1,
          minHeight: 0,
          minWidth: 0,
        },
      }}
    >
      <Outlet />
    </Box>
  );
}
