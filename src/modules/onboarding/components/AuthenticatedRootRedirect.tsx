import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LoadingFallback } from '@/shared/components/LoadingBoundary';
import { resolveRoleOnboardingAccess } from '@/modules/onboarding/utils/roleOnboardingAccess';
import { resolveStartupSpace } from '@/modules/onboarding/utils/resolveStartupSpace';
import {
  ROUTES,
  spaceDashboardPath,
} from '@/routes/paths';
import { isPlatformAdmin } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { useSpaceStore } from '@/store/spaceStore';

/** Redirect `/` using the same startup resolution as mobile. */
export function AuthenticatedRootRedirect() {
  const user = useAuthStore((state) => state.user);
  const selectSpace = useSpaceStore((state) => state.selectSpace);
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const selectedSpaceId = useSpaceStore((state) => state.selectedSpaceId);
  const spaceError = useSpaceStore((state) => state.error);
  const [target, setTarget] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (isPlatformAdmin(user?.systemRole)) {
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
          setTarget(ROUTES.memberHome);
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
  }, [selectSpace, user?.systemRole]);

  if (isPlatformAdmin(user?.systemRole)) {
    return <Navigate to={ROUTES.adminDashboard} replace />;
  }

  if (failed) {
    const access = resolveRoleOnboardingAccess(
      mySpaces.map((space) => space.spaceId),
      selectedSpaceId,
    );
    if (access.status === 'space') {
      return <Navigate to={spaceDashboardPath(access.spaceId)} replace />;
    }
    if (access.status === 'picker') {
      return <Navigate to={ROUTES.mySpaces} replace />;
    }
    if (spaceError) {
      return <LoadingFallback />;
    }
    return <Navigate to={ROUTES.onboarding} replace />;
  }

  if (!target) {
    return <LoadingFallback />;
  }

  return <Navigate to={target} replace />;
}
