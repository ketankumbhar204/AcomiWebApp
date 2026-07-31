import { Navigate, Outlet, useParams } from 'react-router-dom';
import { LoadingFallback } from '@/shared/components/LoadingBoundary';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { ROUTES } from '@/routes/paths';
import { useSpaceStore } from '@/store/spaceStore';

/** OWNER / MANAGER / STAFF can view inventory. */
export function InventoryPermissionGate() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const bootstrapped = useSpaceStore((state) => state.bootstrapped);
  const permissions = useSpacePermissions(spaceId);

  if (!bootstrapped) {
    return <LoadingFallback />;
  }

  if (permissions.canViewInventory !== true) {
    return <Navigate to={ROUTES.forbidden} replace />;
  }

  return <Outlet />;
}
