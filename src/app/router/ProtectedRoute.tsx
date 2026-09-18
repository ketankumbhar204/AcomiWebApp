import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { LoadingFallback } from '@/shared/components/LoadingBoundary';
import { useAuthSession } from '@/shared/hooks/useAuthSession';
import { authenticatedEntryPath } from '@/shared/utils/authenticatedEntryPath';
import { returnPathFromLocation } from '@/shared/utils/safeReturnPath';
import { isPlatformAdmin } from '@/store/adminStore';

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
  const location = useLocation();

  if (isBootstrapping) {
    return <LoadingFallback />;
  }

  if (isAuthenticated) {
    // Platform admins always enter the admin console — never restore a space deep-link.
    if (isPlatformAdmin(user?.systemRole)) {
      return <Navigate to={authenticatedEntryPath(user)} replace />;
    }
    const safeFrom = returnPathFromLocation(location);
    return (
      <Navigate
        to={safeFrom || authenticatedEntryPath(user) || redirectTo}
        replace
      />
    );
  }

  return <Outlet />;
}
