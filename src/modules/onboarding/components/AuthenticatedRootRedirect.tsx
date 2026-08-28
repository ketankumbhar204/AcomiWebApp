import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LoadingFallback } from '@/shared/components/LoadingBoundary';
import { resolveStartupSpace } from '@/modules/onboarding/utils/resolveStartupSpace';
import {
  ROUTES,
  spaceDashboardPath,
} from '@/routes/paths';
import { isPlatformAdmin, useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { useSpaceStore } from '@/store/spaceStore';

/** Redirect `/` using the same startup resolution as mobile. */
export function AuthenticatedRootRedirect() {
  const user = useAuthStore((state) => state.user);
  const adminMode = useAdminStore((state) => state.adminMode);
  const selectSpace = useSpaceStore((state) => state.selectSpace);
  const [target, setTarget] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (isPlatformAdmin(user?.systemRole) && adminMode) {
      return;
    }

    let active = true;
    void (async () => {
      try {
        const resolved = await resolveStartupSpace();
        if (!active) return;

        if (resolved.kind === 'dashboard') {
          selectSpace(resolved.spaceId);
          setTarget(spaceDashboardPath(resolved.spaceId));
          return;
        }
        if (resolved.kind === 'picker') {
          setTarget(ROUTES.mySpaces);
          return;
        }
        if (resolved.kind === 'invitations') {
          setTarget(ROUTES.acceptInvitations);
          return;
        }
        setTarget(ROUTES.onboarding);
      } catch {
        if (active) setFailed(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [adminMode, selectSpace, user?.systemRole]);

  if (isPlatformAdmin(user?.systemRole) && adminMode) {
    return <Navigate to={ROUTES.adminDashboard} replace />;
  }

  if (failed) {
    return <Navigate to={ROUTES.onboarding} replace />;
  }

  if (!target) {
    return <LoadingFallback />;
  }

  return <Navigate to={target} replace />;
}
