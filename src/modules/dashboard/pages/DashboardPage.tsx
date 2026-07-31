import { Box, Typography, useTheme } from '@mui/material';
import { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router-dom';
import { AccommodationOpsWidget } from '../components/AccommodationOpsWidget';
import { DashboardQuickActions } from '../components/DashboardQuickActions';
import { DashboardScaleShell } from '../components/DashboardScaleShell';
import { FinancialSummaryWidget } from '../components/FinancialSummaryWidget';
import { MealOperationsTodayCard } from '../components/MealOperationsTodayCard';
import { MessOperationsWidget } from '../components/MessOperationsWidget';
import { PendingActionsPanel } from '../components/PendingActionsPanel';
import { SpaceOverviewCard } from '../components/SpaceOverviewCard';
import { usePendingActions } from '../hooks/usePendingActions';
import { useSpaceDashboard } from '../hooks/useSpaceDashboard';
import { useSpaceLifecycleSignals } from '../hooks/useSpaceLifecycleSignals';
import { DASHBOARD_UX, dashSurfaces } from '../theme/dashboardUx';
import { todayIsoDate } from '@/modules/meals/utils/mealDates';
import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { ROUTES, spaceDashboardPath } from '@/routes/paths';
import { isAccommodationApplicable } from '@/shared/utils/spacePermissions';
import { canManageNotifications } from '@/shared/utils/spaceOperator';
import { useSpaceStore } from '@/store/spaceStore';
import { useSpaceHealth, useSpaceLifecycle } from '@/spaceLifecycle';

/**
 * Operations dashboard layout:
 * Row1: Space Overview (greeting+health+refresh) | Meal Operations (Today) | Pending
 * Row2: Mess — Payment 4 cards (+ Mess ops); PG — Payment | Property
 * Row3: Quick actions (full width)
 */
export function DashboardPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const selectSpace = useSpaceStore((state) => state.selectSpace);
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const permissions = useSpacePermissions(spaceId);
  const space = permissions.space;
  const spaceType = space?.spaceType;
  const isOperator = canManageNotifications(permissions);
  const isMess = spaceType === 'MESS';
  const accommodationApplicable = spaceType ? isAccommodationApplicable(spaceType) : true;
  const showMealDay = isOperator && (isMess || permissions.canManageMeals === true);

  const dashboard = useSpaceDashboard(spaceId, spaceType, isOperator);
  const pending = usePendingActions(spaceId, true);
  const pendingCount = isOperator
    ? (dashboard.pendingActions?.totalCount ?? pending.totalCount)
    : pending.totalCount;
  const pendingGroups = isOperator
    ? (dashboard.pendingActions?.groups ?? pending.groups)
    : pending.groups;

  const hasOperationalSignal = useMemo(() => {
    const occupied = dashboard.accommodationOperations?.occupiedBeds ?? 0;
    const moveIns = dashboard.accommodationOperations?.moveInsThisMonth ?? 0;
    const collected = dashboard.financial?.collected ?? 0;
    return occupied > 0 || moveIns > 0 || collected > 0;
  }, [
    dashboard.accommodationOperations?.moveInsThisMonth,
    dashboard.accommodationOperations?.occupiedBeds,
    dashboard.financial?.collected,
  ]);

  const lifecycleSignals = useSpaceLifecycleSignals({
    spaceId,
    spaceType,
    permissions,
    enabled: isOperator,
    pendingActionCount: pendingCount,
    hasOperationalSignal,
  });

  const { evaluation } = useSpaceLifecycle({
    spaceType,
    context: lifecycleSignals.context,
    enabled: isOperator,
  });

  const healthExtras = useMemo(() => {
    const reviewFromPending =
      dashboard.pendingActions?.groups?.find((g) => g.actionType === 'PAYMENT_NEEDS_REVIEW')
        ?.count ?? 0;
    const underReviewAmount = dashboard.financial?.underReview ?? 0;
    return {
      occupiedBeds: dashboard.accommodationOperations?.occupiedBeds,
      vacantBeds: dashboard.accommodationOperations?.vacantBeds,
      underReviewPaymentCount:
        reviewFromPending > 0 ? reviewFromPending : underReviewAmount > 0 ? 1 : 0,
    };
  }, [
    dashboard.accommodationOperations?.occupiedBeds,
    dashboard.accommodationOperations?.vacantBeds,
    dashboard.financial?.underReview,
    dashboard.pendingActions?.groups,
  ]);

  const { health } = useSpaceHealth({
    evaluation,
    context: lifecycleSignals.context,
    extras: healthExtras,
    enabled: isOperator,
  });

  useEffect(() => {
    if (spaceId) selectSpace(spaceId);
  }, [selectSpace, spaceId]);

  useEffect(() => {
    document.title = `${t('navigation.dashboard')} · ${t('common.appName')}`;
  }, [t]);

  if (!spaceId) {
    return <Navigate to={ROUTES.root} replace />;
  }

  if (mySpaces.length > 0 && !space) {
    const fallback = mySpaces[0]!;
    return <Navigate to={spaceDashboardPath(fallback.spaceId)} replace />;
  }

  const showInitialLoader = isOperator && dashboard.loading && dashboard.summary == null;
  const error = isOperator ? dashboard.error : pending.error;
  const canDrillDown =
    permissions.canManageOccupancy || permissions.canViewSpaceOccupancies === true;

  const handleRefresh = () => {
    void dashboard.reload();
    void pending.reload();
    void lifecycleSignals.refresh();
  };

  const menuDate = todayIsoDate();

  return (
    <Box
      sx={{
        mx: { xs: -1.5, md: -3 },
        mt: { xs: -1.5, md: -1.75 },
        mb: { xs: -1.5, md: -1.75 },
        px: `${DASHBOARD_UX.pagePadding}px`,
        py: `${DASHBOARD_UX.pagePadding}px`,
        minHeight: `calc(100vh - ${DASHBOARD_UX.headerHeight}px)`,
        bgcolor: s.pageBg,
        width: '100%',
      }}
    >
      <DashboardScaleShell>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: `${DASHBOARD_UX.sectionGap}px`,
            width: '100%',
          }}
        >
          {showInitialLoader ? <LoadingState label={t('common.loading')} /> : null}

          {error && !showInitialLoader ? (
            <ErrorState
              title={t('common.errors.generic')}
              message={error instanceof Error ? error.message : String(error)}
              onRetry={handleRefresh}
            />
          ) : null}

          {!showInitialLoader && !error && isOperator ? (
            <>
              {/* Row 1 — Space Overview | Meal Operations (Today) | Pending */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '0.85fr 1.35fr 0.85fr',
                  gap: `${DASHBOARD_UX.cardGap}px`,
                  width: '100%',
                  alignItems: 'stretch',
                }}
              >
                {space ? (
                  <SpaceOverviewCard
                    spaceId={spaceId}
                    spaceName={space.spaceName}
                    spaceType={spaceType}
                    membershipRole={permissions.membershipRole ?? space.membershipRole}
                    health={health}
                    pendingCount={pendingCount}
                    onRefresh={handleRefresh}
                  />
                ) : null}
                {showMealDay ? (
                  <MealOperationsTodayCard
                    spaceId={spaceId}
                    menuDate={menuDate}
                    enabled={showMealDay}
                  />
                ) : (
                  <Box
                    sx={{
                      p: `${DASHBOARD_UX.cardPadding}px`,
                      borderRadius: `${DASHBOARD_UX.radius}px`,
                      bgcolor: s.surface,
                      boxShadow: s.shadow,
                      border: `1px solid ${s.border}`,
                      height: DASHBOARD_UX.summaryCardHeight,
                      minHeight: DASHBOARD_UX.summaryCardMinHeight,
                      maxHeight: DASHBOARD_UX.summaryCardMaxHeight,
                      display: 'flex',
                      alignItems: 'center',
                      boxSizing: 'border-box',
                    }}
                  >
                    <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                      {t('dashboard.owner.heroSubtitle')}
                    </Typography>
                  </Box>
                )}
                <PendingActionsPanel
                  spaceId={spaceId}
                  totalCount={pendingCount}
                  groups={pendingGroups}
                />
              </Box>

              {/* Row 2 — Mess: Payment 4-card strip (+ Mess ops). PG: Payment | Property */}
              {isMess ? (
                <>
                  {dashboard.financial ? (
                    <FinancialSummaryWidget
                      spaceId={spaceId}
                      financial={dashboard.financial}
                      emptyHint={t('dashboard.financial.emptyHintMess')}
                      layout="row"
                    />
                  ) : null}
                  {dashboard.messOperations ? (
                    <MessOperationsWidget
                      spaceId={spaceId}
                      operations={dashboard.messOperations}
                    />
                  ) : null}
                </>
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns:
                      accommodationApplicable && dashboard.accommodationOperations
                        ? '1fr 1fr'
                        : '1fr',
                    gap: `${DASHBOARD_UX.cardGap}px`,
                    width: '100%',
                    alignItems: 'stretch',
                  }}
                >
                  {dashboard.financial ? (
                    <FinancialSummaryWidget
                      spaceId={spaceId}
                      financial={dashboard.financial}
                      layout="board"
                    />
                  ) : (
                    <Box />
                  )}
                  {accommodationApplicable && dashboard.accommodationOperations ? (
                    <AccommodationOpsWidget
                      spaceId={spaceId}
                      operations={dashboard.accommodationOperations}
                      canDrillDown={canDrillDown}
                    />
                  ) : null}
                </Box>
              )}

              {/* Row 3 — Quick actions (full width) */}
              <DashboardQuickActions
                spaceId={spaceId}
                spaceType={spaceType}
                permissions={permissions}
                isOperator={isOperator}
                pendingCount={pendingCount}
                layout="row"
              />
            </>
          ) : null}

          {!showInitialLoader && !error && !isOperator ? (
            <Typography sx={{ color: s.textSecondary }}>
              {t('dashboard.owner.heroSubtitle')}
            </Typography>
          ) : null}
        </Box>
      </DashboardScaleShell>
    </Box>
  );
}

export default memo(DashboardPage);
