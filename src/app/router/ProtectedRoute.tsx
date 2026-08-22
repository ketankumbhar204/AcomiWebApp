import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { LoadingFallback } from '@/shared/components/LoadingBoundary';
import { useAuthSession } from '@/shared/hooks/useAuthSession';

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
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

/** Redirects authenticated users away from login/register. */
export function GuestRoute({ redirectTo = ROUTES.root }: { redirectTo?: string }) {
  const { isAuthenticated, isBootstrapping } = useAuthSession();

  if (isBootstrapping) {
    return <LoadingFallback />;
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
