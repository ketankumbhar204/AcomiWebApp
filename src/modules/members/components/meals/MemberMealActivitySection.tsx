import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';
import { StatCard } from '@/shared/components/StatCard';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import type {
  MemberMealActivityDay,
  MemberMealActivitySlotStatus,
  MealBillingType,
  MealType,
} from '@/shared/types/meals';
import {
  useMemberMealActivity,
  useMemberMealActivityDay,
  useMemberMealPaymentEvents,
} from '@/modules/meals/hooks/useMemberMealActivity';
import {
  buildCalendarWeeks,
  dayHasActivity,
  formatMonthLabel,
  MEAL_ACTIVITY_SLOT_COLORS,
  normalizeActivityDate,
  todayIsoDate,
} from '@/modules/meals/utils/memberMealActivityCalendar';
import {
  dayHasListActivity,
  dayMatchesActivityFilter,
  formatActivityListDate,
  mealSlotPrefix,
  resolveActivityPaymentDisplay,
  sortActivityDays,
  type ActivityHistoryFilter,
} from '@/modules/meals/utils/memberMealActivityHistory';

type ActivityView = 'history' | 'calendar';

type MemberMealActivitySectionProps = {
  spaceId: string;
  memberId: string;
  effectiveMealBillingType?: MealBillingType | null;
};

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MEAL_ORDER: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

function SlotDot({ status }: { status: MemberMealActivitySlotStatus }) {
  return (
    <Box
      sx={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        bgcolor: MEAL_ACTIVITY_SLOT_COLORS[status] ?? '#9CA3AF',
      }}
    />
  );
}

/**
 * Member Meals → Activity / Calendar — parity with mobile MemberMealActivitySection.
 */
export function MemberMealActivitySection({
  spaceId,
  memberId,
  effectiveMealBillingType,
}: MemberMealActivitySectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const [view, setView] = useState<ActivityView>('history');
  const [filter, setFilter] = useState<ActivityHistoryFilter>('ALL');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const isPrepaid = effectiveMealBillingType === 'PREPAID_BALANCE';
  const {
    month,
    loading,
    error,
    activity,
    reload,
    goToPreviousMonth,
    goToNextMonth,
  } = useMemberMealActivity(spaceId, memberId, true);

  const paymentEvents = useMemberMealPaymentEvents(
    spaceId,
    memberId,
    month,
    !isPrepaid,
  );

  const dayDetail = useMemberMealActivityDay(
    spaceId,
    memberId,
    selectedDate,
    Boolean(selectedDate),
  );

  const todayIso = todayIsoDate();

  const summaryCards = useMemo(() => {
    if (!activity) return [];
    const summary = activity.summary;
    const currency = summary.currencyCode ?? 'INR';

    if (view === 'calendar') {
      return [
        {
          label: t('meals.activity.acceptedMeals'),
          value: String(summary.acceptedMeals),
        },
        {
          label: t('meals.activity.pendingResponses'),
          value: String(summary.pendingResponses),
        },
        {
          label: t('meals.activity.skippedMeals'),
          value: String(summary.skippedMeals),
        },
      ];
    }

    if (isPrepaid) {
      return [
        {
          label: t('meals.activity.history.mealsPurchased', {
            defaultValue: 'Meals purchased',
          }),
          value:
            summary.balancePurchased != null ? String(summary.balancePurchased) : '—',
        },
        {
          label: t('meals.activity.history.mealsConsumed', {
            defaultValue: 'Meals consumed',
          }),
          value: summary.balanceConsumed != null ? String(summary.balanceConsumed) : '—',
        },
        {
          label: t('meals.activity.history.mealsRemaining', {
            defaultValue: 'Remaining',
          }),
          value:
            summary.balanceRemaining != null ? String(summary.balanceRemaining) : '—',
        },
      ];
    }

    return [
      {
        label: t('meals.activity.history.amountGenerated', {
          defaultValue: 'Amount generated',
        }),
        value: formatCurrency(summary.amountGenerated, currency),
      },
      {
        label: t('meals.activity.history.paid', { defaultValue: 'Paid' }),
        value: formatCurrency(summary.paidAmount, currency),
      },
      {
        label: t('meals.activity.history.pending', { defaultValue: 'Pending' }),
        value: formatCurrency(summary.pendingAmount, currency),
      },
      {
        label: t('meals.activity.history.mealsAccepted', {
          defaultValue: 'Meals accepted',
        }),
        value: String(summary.acceptedMeals),
      },
    ];
  }, [activity, isPrepaid, t, view]);

  const historyDays = useMemo(() => {
    const days = (activity?.days ?? []).filter((day) =>
      dayMatchesActivityFilter(day, filter, todayIso),
    );
    return sortActivityDays(days, 'desc');
  }, [activity?.days, filter, todayIso]);

  const dayMap = useMemo(() => {
    const map = new Map<string, MemberMealActivityDay>();
    for (const day of activity?.days ?? []) {
      const key = normalizeActivityDate(day.date);
      if (key) map.set(key, day);
    }
    return map;
  }, [activity?.days]);

  const weeks = useMemo(() => buildCalendarWeeks(month), [month]);

  return (
    <Stack spacing={`${DASHBOARD_UX.cardGap}px`}>
      <Tabs
        value={view}
        onChange={(_, next: ActivityView) => setView(next)}
        aria-label={t('meals.activity.title')}
        sx={{
          minHeight: DASHBOARD_UX.buttonHeight,
          borderBottom: `1px solid ${s.border}`,
          '& .MuiTab-root': {
            minHeight: DASHBOARD_UX.buttonHeight,
            ...DASHBOARD_UX.button,
            textTransform: 'none',
            color: s.textMuted,
          },
          '& .Mui-selected': { color: `${colors.primaryDark} !important` },
          '& .MuiTabs-indicator': { bgcolor: colors.primaryDark, height: 2 },
        }}
      >
        <Tab value="history" label={t('meals.activity.viewHistory')} />
        <Tab value="calendar" label={t('meals.activity.viewCalendar')} />
      </Tabs>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: 1,
          py: 0.75,
          borderRadius: `${DASHBOARD_UX.tileRadius}px`,
          border: `1px solid ${s.border}`,
          bgcolor: s.surface,
        }}
      >
        <IconButton
          size="small"
          aria-label={t('common.back')}
          onClick={goToPreviousMonth}
          sx={{ width: 28, height: 28 }}
        >
          <ChevronLeft size={16} />
        </IconButton>
        <Typography sx={{ ...DASHBOARD_UX.body, fontWeight: 600, color: s.textPrimary }}>
          {formatMonthLabel(month)}
        </Typography>
        <IconButton
          size="small"
          aria-label={t('common.continue')}
          onClick={goToNextMonth}
          sx={{ width: 28, height: 28 }}
        >
          <ChevronRight size={16} />
        </IconButton>
      </Box>

      {summaryCards.length > 0 ? (
        <Box
          sx={{
            display: 'grid',
            gap: 1,
            gridTemplateColumns: {
              xs: '1fr',
              sm: `repeat(${Math.min(summaryCards.length, 3)}, minmax(0, 1fr))`,
            },
          }}
        >
          {summaryCards.map((card) => (
            <StatCard key={card.label} dense label={card.label} value={card.value} />
          ))}
        </Box>
      ) : null}

      {!isPrepaid ? (
        <Box
          sx={{
            p: `${DASHBOARD_UX.metricPadding}px`,
            borderRadius: `${DASHBOARD_UX.radius}px`,
            border: `1px solid ${s.border}`,
            bgcolor: s.surface,
            boxShadow: s.shadow,
          }}
        >
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 1 }}>
            {t('meals.paymentTimeline.title')}
          </Typography>
          {paymentEvents.loading ? (
            <LoadingState />
          ) : paymentEvents.events.length === 0 ? (
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
              {t('meals.paymentTimeline.empty')}
            </Typography>
          ) : (
            <Stack spacing={1}>
              {paymentEvents.events.map((event) => (
                <Box
                  key={event.eventId}
                  sx={{
                    display: 'flex',
                    gap: 1,
                    p: 1,
                    borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                    border: `1px solid ${s.border}`,
                    bgcolor: s.elevated,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: colors.success,
                      mt: 0.6,
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      sx={{ ...DASHBOARD_UX.body, fontWeight: 600, color: s.textPrimary }}
                    >
                      {t(`meals.paymentTimeline.events.${event.eventType}`, {
                        date: event.pollDate,
                      })}
                    </Typography>
                    {event.amount != null ? (
                      <Typography
                        sx={{
                          ...DASHBOARD_UX.body,
                          fontWeight: 600,
                          color: colors.success,
                          mt: 0.15,
                        }}
                      >
                        {formatCurrency(event.amount, 'INR')}
                      </Typography>
                    ) : null}
                    <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                      {new Date(event.createdAt).toLocaleString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      ) : null}

      {loading && !activity ? <LoadingState /> : null}
      {error && !activity ? (
        <ErrorState
          title={t('meals.activity.loadError')}
          message={t('meals.activity.loadError')}
          onRetry={() => void reload()}
        />
      ) : null}

      {view === 'calendar' && activity ? (
        <Box
          sx={{
            p: `${DASHBOARD_UX.metricPadding}px`,
            borderRadius: `${DASHBOARD_UX.radius}px`,
            border: `1px solid ${s.border}`,
            bgcolor: s.surface,
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.5,
              mb: 0.75,
            }}
          >
            {WEEKDAY_LABELS.map((label, index) => (
              <Typography
                key={`${label}-${index}`}
                sx={{
                  ...DASHBOARD_UX.smallCaption,
                  color: s.textMuted,
                  textAlign: 'center',
                }}
              >
                {label}
              </Typography>
            ))}
          </Box>
          {weeks.map((week, weekIndex) => (
            <Box
              key={`week-${weekIndex}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 0.5,
                mb: 0.5,
              }}
            >
              {week.map((date, dayIndex) => {
                if (!date) {
                  return <Box key={`empty-${weekIndex}-${dayIndex}`} sx={{ minHeight: 44 }} />;
                }
                const day = dayMap.get(date);
                const hasActivity = dayHasActivity(day);
                const isToday = date === todayIso;
                const isSelected = selectedDate === date;
                const dayNumber = Number(date.slice(-2));
                return (
                  <Box
                    key={date}
                    component="button"
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    aria-label={date}
                    sx={{
                      minHeight: 44,
                      borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                      border: `1px solid ${
                        isSelected
                          ? colors.primaryDark
                          : isToday
                            ? `${colors.primaryDark}55`
                            : s.border
                      }`,
                      bgcolor: isSelected ? `${colors.primaryDark}14` : s.elevated,
                      cursor: 'pointer',
                      p: 0.5,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 0.35,
                    }}
                  >
                    <Typography
                      sx={{
                        ...DASHBOARD_UX.smallCaption,
                        fontWeight: hasActivity ? 700 : 500,
                        color: s.textPrimary,
                      }}
                    >
                      {dayNumber}
                    </Typography>
                    <Stack direction="row" spacing={0.25}>
                      {MEAL_ORDER.map((mealType) => {
                        const slot = day?.slots?.find((entry) => entry.mealType === mealType);
                        return slot ? <SlotDot key={mealType} status={slot.status} /> : (
                          <Box key={mealType} sx={{ width: 6, height: 6 }} />
                        );
                      })}
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          ))}
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 1 }}>
            {(
              [
                ['ACCEPTED', t('meals.activity.legendAccepted')],
                ['PENDING', t('meals.activity.legendPending')],
                ['SKIPPED', t('meals.activity.legendSkipped')],
                ['NO_MENU', t('meals.activity.legendNoMenu')],
              ] as const
            ).map(([status, label]) => (
              <Stack key={status} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <SlotDot status={status} />
                <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                  {label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      ) : null}

      {view === 'history' && activity ? (
        <Stack spacing={1}>
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {(['ALL', 'PAID', 'PENDING', 'SKIPPED'] as ActivityHistoryFilter[]).map((item) => (
              <Chip
                key={item}
                size="small"
                label={
                  item === 'ALL'
                    ? t('meals.activity.history.filterAll')
                    : item === 'PAID'
                      ? t('meals.activity.history.filterPaid')
                      : item === 'PENDING'
                        ? t('meals.activity.history.filterPending')
                        : t('meals.activity.history.filterSkipped')
                }
                onClick={() => setFilter(item)}
                color={filter === item ? 'primary' : 'default'}
                variant={filter === item ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
          {historyDays.length === 0 ? (
            <EmptyState
              title={t('meals.activity.title')}
              description={t('meals.paymentTimeline.empty')}
            />
          ) : (
            historyDays.filter(dayHasListActivity).map((day) => {
              const dateKey = normalizeActivityDate(day.date) ?? day.date;
              const paymentDisplay = resolveActivityPaymentDisplay(day, todayIso);
              return (
                <Box
                  key={dateKey}
                  component="button"
                  type="button"
                  onClick={() => setSelectedDate(dateKey)}
                  sx={{
                    textAlign: 'left',
                    width: '100%',
                    p: 1.25,
                    borderRadius: `${DASHBOARD_UX.radius}px`,
                    border: `1px solid ${s.border}`,
                    bgcolor: s.surface,
                    boxShadow: s.shadow,
                    cursor: 'pointer',
                    '&:hover': { boxShadow: s.shadowHover },
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{ ...DASHBOARD_UX.body, fontWeight: 600, color: s.textPrimary }}
                      >
                        {formatActivityListDate(dateKey)}
                      </Typography>
                      <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}>
                        {(day.slots ?? [])
                          .map(
                            (slot) =>
                              `${mealSlotPrefix(slot.mealType)}:${slot.status.slice(0, 1)}`,
                          )
                          .join(' · ')}
                      </Typography>
                    </Box>
                    <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
                      {day.dayTotal != null && day.dayTotal > 0 ? (
                        <Typography
                          sx={{
                            ...DASHBOARD_UX.body,
                            fontWeight: 600,
                            color: colors.success,
                          }}
                        >
                          {formatCurrency(day.dayTotal, day.currencyCode)}
                        </Typography>
                      ) : null}
                      {paymentDisplay !== 'NONE' ? (
                        <StatusChip
                          label={paymentDisplay.replace('_', ' ')}
                          tone={
                            paymentDisplay === 'PAID'
                              ? 'success'
                              : paymentDisplay === 'REJECTED' || paymentDisplay === 'OVERDUE'
                                ? 'error'
                                : 'warning'
                          }
                        />
                      ) : null}
                    </Stack>
                  </Stack>
                </Box>
              );
            })
          )}
        </Stack>
      ) : null}

      <Dialog
        open={Boolean(selectedDate)}
        onClose={() => setSelectedDate(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
          {selectedDate ? formatActivityListDate(selectedDate) : t('meals.activity.title')}
        </DialogTitle>
        <DialogContent>
          {dayDetail.loading ? (
            <LoadingState />
          ) : dayDetail.detail ? (
            <Stack spacing={1.25} sx={{ pt: 0.5 }}>
              {(dayDetail.detail.slots ?? []).map((slot) => (
                <Box
                  key={slot.mealType}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 1,
                    p: 1,
                    borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                    border: `1px solid ${s.border}`,
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <IconBadge accent={MEAL_ACTIVITY_SLOT_COLORS[slot.status]}>
                      <SlotDot status={slot.status} />
                    </IconBadge>
                    <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}>
                      {t(`meals.mealType.${slot.mealType}`)}
                    </Typography>
                  </Stack>
                  <StatusChip
                    label={
                      slot.status === 'ACCEPTED'
                        ? t('meals.activity.statusAccepted')
                        : slot.status === 'PENDING'
                          ? t('meals.activity.statusPending')
                          : slot.status === 'SKIPPED'
                            ? t('meals.activity.statusSkipped')
                            : slot.status === 'NO_MENU'
                              ? t('meals.activity.statusNoMenu')
                              : t('meals.activity.statusInactive')
                    }
                    tone={
                      slot.status === 'ACCEPTED'
                        ? 'success'
                        : slot.status === 'SKIPPED'
                          ? 'error'
                          : slot.status === 'PENDING'
                            ? 'warning'
                            : 'neutral'
                    }
                  />
                </Box>
              ))}
              {dayDetail.detail.dayTotal != null ? (
                <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                  {formatCurrency(
                    dayDetail.detail.dayTotal,
                    dayDetail.detail.currencyCode,
                  )}
                </Typography>
              ) : null}
            </Stack>
          ) : (
            <EmptyState title={t('meals.activity.loadError')} />
          )}
          <Button onClick={() => setSelectedDate(null)} sx={{ ...dashOutlinedButtonSx, mt: 2 }}>
            {t('common.close')}
          </Button>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
