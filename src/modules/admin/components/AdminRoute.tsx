import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { LoadingFallback } from '@/shared/components/LoadingBoundary';
import { useAuthSession } from '@/shared/hooks/useAuthSession';
import { isPlatformAdmin } from '@/store/adminStore';

/** Requires authenticated platform admin. Uses the same login as operators. */
export function AdminRoute() {
  const { isAuthenticated, isBootstrapping, user } = useAuthSession();
  const location = useLocation();

  if (isBootstrapping) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
    );
  }

  if (!isPlatformAdmin(user?.systemRole)) {
    return <Navigate to={ROUTES.forbidden} replace />;
  }

  return <Outlet />;
}
