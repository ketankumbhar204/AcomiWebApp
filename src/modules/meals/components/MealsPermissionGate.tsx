import { Box } from '@mui/material';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LockedCapabilityFromAccess } from '@/modules/dashboard/components/LockedCapabilityPanel';
import { useSpaceProgressiveAccess } from '@/modules/dashboard/hooks/useSpaceProgressiveAccess';
import { LoadingFallback } from '@/shared/components/LoadingBoundary';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { ROUTES } from '@/routes/paths';
import { useSpaceStore } from '@/store/spaceStore';

/** Requires `canViewMeals` + progressive MEAL_CONFIG / MEAL_OPS for operators. */
export function MealsPermissionGate() {
  const { t } = useTranslation();
  const location = useLocation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const bootstrapped = useSpaceStore((state) => state.bootstrapped);
  const permissions = useSpacePermissions(spaceId);
  const { getCapability, loading, spaceType } = useSpaceProgressiveAccess(spaceId);

  if (!bootstrapped) {
    return <LoadingFallback />;
  }

  if (permissions.canViewMeals !== true) {
    return <Navigate to={ROUTES.forbidden} replace />;
  }

  const mealConfig = getCapability('MEAL_CONFIG');
  const mealOps = getCapability('MEAL_OPS');
  if (permissions.canManageMeals && !loading && mealConfig?.mode === 'LOCKED') {
    return (
      <LockedCapabilityFromAccess
        access={mealConfig}
        featureTitle={t('navigation.meals')}
        spaceId={spaceId}
        spaceType={spaceType}
      />
    );
  }

  const isOpsRoute =
    /\/meals\/(share|poll|participation|edit|plans\/customer)/.test(location.pathname) ||
    /\/meal-headcount/.test(location.pathname);
  if (
    permissions.canManageMeals &&
    !loading &&
    isOpsRoute &&
    mealOps?.mode === 'LOCKED'
  ) {
    return (
      <LockedCapabilityFromAccess
        access={mealOps}
        featureTitle={t('navigation.meals')}
        spaceId={spaceId}
        spaceType={spaceType}
      />
    );
  }

  if (!loading && mealConfig?.mode === 'HIDDEN' && mealOps?.mode === 'HIDDEN') {
    return <Navigate to={ROUTES.forbidden} replace />;
  }

  return (
    <Box
      sx={{
        width: '100%',
        minWidth: 0,
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        '& > *': {
          flex: 1,
          minHeight: 0,
          minWidth: 0,
        },
      }}
    >
      <Outlet />
    </Box>
  );
}
