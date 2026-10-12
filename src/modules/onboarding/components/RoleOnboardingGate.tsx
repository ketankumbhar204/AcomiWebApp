import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { resolveRoleOnboardingAccess } from '@/modules/onboarding/utils/roleOnboardingAccess';
import { ROUTES, spaceDashboardPath } from '@/routes/paths';
import { LoadingFallback } from '@/shared/components/LoadingBoundary';
import { useSpaceStore } from '@/store/spaceStore';

/**
 * Route guard for `/onboarding`.
 * Space bootstrap finishes before this outlet renders, so an onboarded
 * account is redirected on the first paint and the choice screen is not mounted.
 */
export function RoleOnboardingGate({ children }: { children: ReactNode }) {
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const selectedSpaceId = useSpaceStore((state) => state.selectedSpaceId);
  const bootstrapped = useSpaceStore((state) => state.bootstrapped);
  const error = useSpaceStore((state) => state.error);
  const loading = useSpaceStore((state) => state.loading);

  if (!bootstrapped || (loading && mySpaces.length === 0)) {
    return <LoadingFallback />;
  }

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

  if (error) {
    return <LoadingFallback />;
  }

  return children;
}
