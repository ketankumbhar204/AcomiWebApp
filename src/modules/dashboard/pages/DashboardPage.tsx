import { Box, Button, Stack, Typography, useTheme } from '@mui/material';
import { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AccommodationOpsWidget } from '../components/AccommodationOpsWidget';
import { DashboardCustomerMealsSection } from '../components/customer/DashboardCustomerMealsSection';
import { DashboardQuickActions } from '../components/DashboardQuickActions';
import { FinancialSummaryWidget } from '../components/FinancialSummaryWidget';
import { MealOperationsTodayCard } from '../components/MealOperationsTodayCard';
import { MessOperationsWidget } from '../components/MessOperationsWidget';
import { PendingActionsPanel } from '../components/PendingActionsPanel';
import { SpaceOverviewCard } from '../components/SpaceOverviewCard';
import { usePendingActions } from '../hooks/usePendingActions';
import { useSpaceDashboard } from '../hooks/useSpaceDashboard';
import { useSpaceLifecycleSignals } from '../hooks/useSpaceLifecycleSignals';
import { DASHBOARD_UX, dashSurfaces } from '../theme/dashboardUx';
import { ScaleShell } from '@/layouts/ScaleShell';
import { todayIsoDate } from '@/modules/meals/utils/mealDates';
import { ContentCard } from '@/shared/components/ContentCard';
import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';
import { useLinkedMember } from '@/shared/hooks/useLinkedMember';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import {
  ROUTES,
  spaceComplaintsPath,
  spaceDashboardPath,
  spaceMemberPath,
  spacePaymentsPath,
  spacePendingActionsPath,
} from '@/routes/paths';
import { isAccommodationApplicable } from '@/shared/utils/spacePermissions';
import { canManageNotifications } from '@/shared/utils/spaceOperator';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useAuthStore } from '@/store/authStore';
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
  const navigate = useNavigate();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const selectSpace = useSpaceStore((state) => state.selectSpace);
  const mySpaces = useSpaceStore((state) => state.mySpaces);
  const userFullName = useAuthStore((state) => state.user?.fullName);
  const permissions = useSpacePermissions(spaceId);
  const space = permissions.space;
  const spaceType = space?.spaceType;
  const isOperator = canManageNotifications(permissions);
  const isMess = spaceType === 'MESS';
  const accommodationApplicable = spaceType ? isAccommodationApplicable(spaceType) : true;
  const showMealDay = isOperator && (isMess || permissions.canManageMeals === true);

  const isTenant = permissions.membershipRole === 'TENANT';
  const isCustomer = permissions.membershipRole === 'CUSTOMER';
  const isMealParticipant =
    !isOperator &&
    permissions.canViewMeals === true &&
    (isTenant || isCustomer);
  const { memberId: linkedMemberId } = useLinkedMember(
    !isOperator && (isTenant || isCustomer) ? spaceId : null,
  );

  const dashboard = useSpaceDashboard(spaceId, spaceType, isOperator);
  const pending = usePendingActions(
    spaceId,
    true,
    isOperator,
  );
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

  const pageBody = (
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
                    userFullName={userFullName}
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

          {!showInitialLoader && !error && !isOperator && isMealParticipant ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
              <DashboardCustomerMealsSection spaceId={spaceId} />
              {pending.totalCount > 0 ? (
                <ContentCard onClick={() => navigate(spacePendingActionsPath(spaceId))}>
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Box>
                      <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                        {t('dashboard.attention.pendingActions')}
                      </Typography>
                      <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                        {t('dashboard.attention.pendingActionsSubtitle', {
                          count: pending.totalCount,
                        })}
                      </Typography>
                    </Box>
                    <Button size="small" sx={dashOutlinedButtonSx}>
                      {t('common.viewAll', { defaultValue: 'View all' })} →
                    </Button>
                  </Stack>
                </ContentCard>
              ) : null}
            </Box>
          ) : null}

          {!showInitialLoader && !error && !isOperator && !isMealParticipant ? (
            <Stack spacing={`${DASHBOARD_UX.cardGap}px`}>
              <Typography sx={{ ...DASHBOARD_UX.pageTitle, color: s.textPrimary }}>
                {space?.spaceName ?? t('navigation.dashboard')}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                {t('dashboard.customer.tenantHomeSubtitle', {
                  defaultValue: 'Quick links for your stay and payments.',
                })}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: `${DASHBOARD_UX.cardGap}px`,
                }}
              >
                {isTenant && linkedMemberId ? (
                  <ContentCard onClick={() => navigate(spaceMemberPath(spaceId, linkedMemberId))}>
                    <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                      {t('dashboard.customer.myStay', { defaultValue: 'My stay' })}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
                      {t('dashboard.customer.myStayHint', {
                        defaultValue: 'View your occupancy and profile',
                      })}
                    </Typography>
                  </ContentCard>
                ) : null}
                {linkedMemberId ? (
                  <ContentCard onClick={() => navigate(spacePaymentsPath(spaceId))}>
                    <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                      {t('dashboard.customer.quickActions.payments', { defaultValue: 'Payments' })}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
                      {t('dashboard.customer.myPaymentsHint', {
                        defaultValue: 'Review dues and submit proof',
                      })}
                    </Typography>
                  </ContentCard>
                ) : null}
                <ContentCard onClick={() => navigate(spaceComplaintsPath(spaceId))}>
                  <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                    {t('dashboard.customer.quickActions.complaints', {
                      defaultValue: 'Complaints',
                    })}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
                    {t('dashboard.customer.complaintsHint', {
                      defaultValue: 'Raise or track service requests',
                    })}
                  </Typography>
                </ContentCard>
              </Box>
              {pending.totalCount > 0 ? (
                <Button
                  variant="contained"
                  onClick={() => navigate(spacePendingActionsPath(spaceId))}
                  sx={dashContainedButtonSx}
                >
                  {t('dashboard.attention.pendingActions')} ({pending.totalCount})
                </Button>
              ) : null}
            </Stack>
          ) : null}
        </Box>
  );

  return (
    <Box
      sx={{
        px: { xs: 2, md: isOperator ? `${DASHBOARD_UX.pagePadding}px` : 3 },
        py: { xs: 2, md: isOperator ? `${DASHBOARD_UX.pagePadding}px` : 3 },
        minHeight: `calc(100vh - ${DASHBOARD_UX.headerHeight}px)`,
        bgcolor: s.pageBg,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* ScaleShell is for owner ops canvas; consumers need natural scroll to match mock. */}
      {isOperator ? <ScaleShell>{pageBody}</ScaleShell> : pageBody}
    </Box>
  );
}

export default memo(DashboardPage);
