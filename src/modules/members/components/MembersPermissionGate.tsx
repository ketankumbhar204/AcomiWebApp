import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LockedCapabilityFromAccess } from '@/modules/dashboard/components/LockedCapabilityPanel';
import { useSpaceProgressiveAccess } from '@/modules/dashboard/hooks/useSpaceProgressiveAccess';
import { LoadingFallback } from '@/shared/components/LoadingBoundary';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { ROUTES } from '@/routes/paths';
import { useSpaceStore } from '@/store/spaceStore';

/** Requires `canManageMembers` + progressive MEMBERS capability. */
export function MembersPermissionGate() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const bootstrapped = useSpaceStore((state) => state.bootstrapped);
  const permissions = useSpacePermissions(spaceId);
  const { getCapability, loading, spaceType } = useSpaceProgressiveAccess(spaceId);

  if (!bootstrapped) {
    return <LoadingFallback />;
  }

  if (!permissions.canManageMembers) {
    return <Navigate to={ROUTES.forbidden} replace />;
  }

  const membersAccess = getCapability('MEMBERS');
  if (!loading && membersAccess?.mode === 'LOCKED') {
    return (
      <LockedCapabilityFromAccess
        access={membersAccess}
        featureTitle={t('navigation.members')}
        spaceId={spaceId}
        spaceType={spaceType}
      />
    );
  }

  if (loading && !membersAccess) {
    return <LoadingFallback />;
  }

  return <Outlet />;
}
