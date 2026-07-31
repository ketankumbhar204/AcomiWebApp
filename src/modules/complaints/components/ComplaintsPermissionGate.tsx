import { Navigate, Outlet, useParams } from 'react-router-dom';
import { LoadingFallback } from '@/shared/components/LoadingBoundary';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { ROUTES } from '@/routes/paths';
import { useSpaceStore } from '@/store/spaceStore';
import { canRaiseComplaint } from '../utils/complaintHelpers';

/** Members who can raise or view complaints (own or all). */
export function ComplaintsPermissionGate() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const bootstrapped = useSpaceStore((state) => state.bootstrapped);
  const permissions = useSpacePermissions(spaceId);

  if (!bootstrapped) {
    return <LoadingFallback />;
  }

  const mayEnter =
    Boolean(permissions.membershipRole) &&
    (permissions.canViewAllComplaints === true ||
      permissions.canManageComplaints === true ||
      canRaiseComplaint(permissions.membershipRole, permissions.canRaiseComplaint));

  if (!mayEnter) {
    return <Navigate to={ROUTES.forbidden} replace />;
  }

  return <Outlet />;
}
