import {
  Box,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { mealsApi } from '@/modules/meals/api/mealsApi';
import { useMealHeadcountDay } from '@/modules/meals/hooks/useMeals';
import { todayIsoDate } from '@/modules/meals/utils/mealDates';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatusChip } from '@/shared/components/StatusChip';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import type { MealType } from '@/shared/types/meals';
import { ROUTES, spaceDashboardPath, spaceMealsPath } from '@/routes/paths';

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

/**
 * Meal headcount detail — parity with mobile MealHeadcountBottomSheet / MealHeadcountPanel
 * (GET day + detail; opened from dashboard shared meal / mess headcount metric).
 */
export function MealHeadcountPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const navigate = useNavigate();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const permissions = useSpacePermissions(spaceId);
  const canManage = permissions.canManageMeals === true;

  const menuDate = searchParams.get('date') || todayIsoDate();
  const mealParam = searchParams.get('mealType') as MealType | null;

  const day = useMealHeadcountDay(spaceId, menuDate, canManage);
  const slots = day.headcount?.slots ?? [];

  const availableTypes = useMemo(() => {
    const fromSlots = slots.map((slot) => slot.mealType);
    return MEAL_TYPES.filter((type) => fromSlots.includes(type));
  }, [slots]);

  const activeMealType: MealType =
    mealParam && MEAL_TYPES.includes(mealParam)
      ? mealParam
      : availableTypes[0] ?? 'LUNCH';

  const detailQuery = useQuery({
    queryKey: ['meal-headcount-detail', spaceId, menuDate, activeMealType],
    queryFn: () => mealsApi.getMealHeadcountDetail(spaceId, menuDate, activeMealType),
    enabled: Boolean(canManage && spaceId && availableTypes.length > 0),
    staleTime: 15_000,
  });

  const totalMeals = useMemo(
    () => slots.reduce((sum, slot) => sum + (slot.mealsToPrepare ?? 0), 0),
    [slots],
  );

  if (!spaceId) {
    return <Navigate to={ROUTES.root} replace />;
  }

  if (!canManage) {
    return <Navigate to={spaceDashboardPath(spaceId)} replace />;
  }

  const setMealType = (mealType: MealType) => {
    const next = new URLSearchParams(searchParams);
    next.set('date', menuDate);
    next.set('mealType', mealType);
    setSearchParams(next, { replace: true });
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('dashboard.headcount.title', { defaultValue: 'Meal headcount' })}
        description={t('dashboard.headcount.forDate', {
          defaultValue: 'Meals to prepare for {{date}}',
          date: menuDate,
        })}
        breadcrumbs={[
          {
            label: permissions.space?.spaceName ?? t('navigation.space'),
            to: spaceDashboardPath(spaceId),
          },
          { label: t('navigation.dashboard'), to: spaceDashboardPath(spaceId) },
          { label: t('dashboard.headcount.title', { defaultValue: 'Meal headcount' }) },
        ]}
        actions={
          <Typography
            component="button"
            onClick={() => navigate(spaceMealsPath(spaceId, menuDate))}
            sx={{
              ...DASHBOARD_UX.link,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'primary.dark',
            }}
          >
            {t('dashboard.mealOperations.planMenu')} →
          </Typography>
        }
      />

      {day.loading && slots.length === 0 ? <LoadingState /> : null}

      {!day.loading && availableTypes.length === 0 ? (
        <EmptyState
          title={t('dashboard.headcount.emptyTitle', { defaultValue: 'No headcount yet' })}
          description={t('dashboard.headcount.emptyBody', {
            defaultValue: 'Share a meal menu to start collecting responses and headcount.',
          })}
          action={
            <Typography
              component="button"
              onClick={() => navigate(spaceMealsPath(spaceId, menuDate))}
              sx={{
                ...DASHBOARD_UX.link,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: 'primary.dark',
              }}
            >
              {t('dashboard.mealOperations.planMenu')} →
            </Typography>
          }
        />
      ) : null}

      {availableTypes.length > 0 ? (
        <Stack spacing={2}>
          <Box
            sx={{
              p: 2,
              borderRadius: `${DASHBOARD_UX.radius}px`,
              border: `1px solid ${s.border}`,
              bgcolor: s.surface,
              boxShadow: s.shadow,
            }}
          >
            <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
              {t('dashboard.headcount.totalMeals', {
                defaultValue: 'Total meals to prepare',
              })}
            </Typography>
            <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: s.textPrimary }}>
              {totalMeals}
            </Typography>
          </Box>

          <Tabs
            value={activeMealType}
            onChange={(_, value: MealType) => setMealType(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {availableTypes.map((mealType) => {
              const slot = slots.find((row) => row.mealType === mealType);
              return (
                <Tab
                  key={mealType}
                  value={mealType}
                  label={`${t(`meals.mealType.${mealType}`)} (${slot?.mealsToPrepare ?? 0})`}
                />
              );
            })}
          </Tabs>

          {detailQuery.isLoading ? <LoadingState minHeight={160} /> : null}
          {detailQuery.error ? (
            <ErrorState
              title={t('common.errors.generic')}
              message={
                detailQuery.error instanceof Error
                  ? detailQuery.error.message
                  : t('common.errors.generic')
              }
              onRetry={() => void detailQuery.refetch()}
            />
          ) : null}

          {detailQuery.data ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                  {t(`meals.mealType.${detailQuery.data.mealType}`)}
                </Typography>
                <StatusChip
                  label={
                    detailQuery.data.pollStatus === 'CLOSED'
                      ? t('dashboard.operations.pollClosed')
                      : t('dashboard.operations.pollOpen')
                  }
                  tone={detailQuery.data.pollStatus === 'CLOSED' ? 'neutral' : 'success'}
                />
                <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                  {detailQuery.data.mealsToPrepare} / {detailQuery.data.eligibleCount}
                </Typography>
              </Stack>

              {detailQuery.data.options.map((option) => (
                <Box
                  key={option.optionId}
                  sx={{
                    p: 1.5,
                    borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                    border: `1px solid ${s.border}`,
                    bgcolor: s.elevated,
                  }}
                >
                  <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
                    <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                      {option.label}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                      {option.count}
                    </Typography>
                  </Stack>
                  {option.members.length > 0 ? (
                    <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textMuted, mt: 0.5 }}>
                      {option.members.map((m) => m.memberName).join(', ')}
                    </Typography>
                  ) : null}
                </Box>
              ))}

              {detailQuery.data.deliveryBreakdown &&
              detailQuery.data.deliveryBreakdown.length > 0 ? (
                <Box>
                  <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary, mb: 1 }}>
                    {t('dashboard.headcount.byLocation', {
                      defaultValue: 'By serving location',
                    })}
                  </Typography>
                  <Stack spacing={1}>
                    {detailQuery.data.deliveryBreakdown.map((loc) => (
                      <Stack
                        key={loc.locationId}
                        direction="row"
                        sx={{ justifyContent: 'space-between' }}
                      >
                        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}>
                          {loc.locationName}
                        </Typography>
                        <Typography sx={{ ...DASHBOARD_UX.body, fontWeight: 700 }}>
                          {loc.totalPlates}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              ) : null}

              {detailQuery.data.noResponseMembers.length > 0 ? (
                <Box>
                  <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary, mb: 1 }}>
                    {t('dashboard.headcount.noResponse', {
                      defaultValue: 'No response',
                    })}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                    {detailQuery.data.noResponseMembers.map((m) => m.memberName).join(', ')}
                  </Typography>
                </Box>
              ) : null}
            </Stack>
          ) : null}
        </Stack>
      ) : null}
    </PageContainer>
  );
}
