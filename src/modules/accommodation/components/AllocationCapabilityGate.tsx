import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LockedCapabilityFromAccess } from '@/modules/dashboard/components/LockedCapabilityPanel';
import { useSpaceProgressiveAccess } from '@/modules/dashboard/hooks/useSpaceProgressiveAccess';
import { LoadingFallback } from '@/shared/components/LoadingBoundary';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { ROUTES } from '@/routes/paths';
import { useSpaceStore } from '@/store/spaceStore';

/** Progressive ALLOCATION gate for occupancy / bed-inventory / move-in routes. */
export function AllocationCapabilityGate() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const bootstrapped = useSpaceStore((state) => state.bootstrapped);
  const permissions = useSpacePermissions(spaceId);
  const { getCapability, loading, spaceType } = useSpaceProgressiveAccess(spaceId);

  if (!bootstrapped) {
    return <LoadingFallback />;
  }

  if (!permissions.canManageOccupancy && permissions.canViewSpaceOccupancies !== true) {
    return <Navigate to={ROUTES.forbidden} replace />;
  }

  const allocation = getCapability('ALLOCATION');
  if (!loading && allocation?.mode === 'HIDDEN') {
    return <Navigate to={ROUTES.forbidden} replace />;
  }
  if (!loading && allocation?.mode === 'LOCKED') {
    return (
      <LockedCapabilityFromAccess
        access={allocation}
        featureTitle={t('navigation.allocate', { defaultValue: 'Allocate' })}
        spaceId={spaceId}
        spaceType={spaceType}
      />
    );
  }

  if (loading && !allocation) {
    return <LoadingFallback />;
  }

  return <Outlet />;
}
