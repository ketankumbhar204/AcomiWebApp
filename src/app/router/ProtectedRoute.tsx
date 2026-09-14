import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { LoadingFallback } from '@/shared/components/LoadingBoundary';
import { useAuthSession } from '@/shared/hooks/useAuthSession';
import { authenticatedEntryPath } from '@/shared/utils/authenticatedEntryPath';
import { returnPathFromLocation } from '@/shared/utils/safeReturnPath';
import { useAdminStore } from '@/store/adminStore';

type ProtectedRouteProps = {
  redirectTo?: string;
};

/** Requires an authenticated session. */
export function ProtectedRoute({ redirectTo = ROUTES.login }: ProtectedRouteProps) {
  const { isAuthenticated, isBootstrapping } = useAuthSession();
  const location = useLocation();

  if (isBootstrapping) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <Outlet />;
}

/** Redirects authenticated users away from login/register. */
export function GuestRoute({ redirectTo = ROUTES.root }: { redirectTo?: string }) {
  const { isAuthenticated, isBootstrapping, user } = useAuthSession();
  const adminMode = useAdminStore((state) => state.adminMode);
  const location = useLocation();

  if (isBootstrapping) {
    return <LoadingFallback />;
  }

  if (isAuthenticated) {
    const safeFrom = returnPathFromLocation(location);
    return (
      <Navigate
        to={safeFrom || authenticatedEntryPath(user, adminMode) || redirectTo}
        replace
      />
    );
  }

  return <Outlet />;
}
