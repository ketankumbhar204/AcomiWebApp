import {
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  IndianRupee,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PeriodMonthNav } from '@/shared/components/PeriodMonthNav';
import { SidePanel } from '@/shared/components/SidePanel';
import { StatCard } from '@/shared/components/StatCard';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import type {
  MemberMealActivityDay,
  MemberMealActivityDayDetail,
  MemberMealActivitySlotStatus,
  MealBillingType,
  MealType,
} from '@/shared/types/meals';
import { MealSlotAccordions } from '@/modules/meals/components/MealSlotAccordions';
import {
  useMemberMealActivity,
  useMemberMealActivityDay,
  useMemberMealPaymentEvents,
} from '@/modules/meals/hooks/useMemberMealActivity';
import {
  buildCalendarWeeks,
  dayHasActivity,
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
  /** customer = My Orders mock presentation. */
  audience?: 'owner' | 'customer';
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

function slotStatusLetter(status: MemberMealActivitySlotStatus): string {
  if (status === 'ACCEPTED') return 'A';
  if (status === 'PENDING') return 'P';
  if (status === 'SKIPPED') return 'S';
  if (status === 'NO_MENU') return 'N';
  return status.slice(0, 1);
}

function DayActivityInspector({
  date,
  detail,
  loading,
  framed,
  onClose,
}: {
  date: string | null;
  detail: MemberMealActivityDayDetail | null | undefined;
  loading: boolean;
  framed: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);

  if (!date) {
    return (
      <SidePanel
        title={t('meals.activity.title')}
        onClose={onClose}
        framed={framed}
      >
        <EmptyState
          icon={
            <IconBadge accent={colors.primaryDark}>
              <CalendarDays />
            </IconBadge>
          }
          title={t('paymentCollection.dayMeals.selectDay', {
            defaultValue: 'Select a day',
          })}
          description={t('meals.activity.selectDayBody', {
            defaultValue: 'Choose a day to view meal status and totals.',
          })}
        />
      </SidePanel>
    );
  }

  return (
    <SidePanel
      title={formatActivityListDate(date)}
      subtitle={date}
      onClose={onClose}
      framed={framed}
    >
      {loading && !detail ? (
        <LoadingState />
      ) : detail ? (
        <Stack spacing={1.25}>
          <MealSlotAccordions
            slots={detail.slots ?? []}
            currencyCode={detail.currencyCode}
          />
          {detail.dayTotal != null ? (
            <Box
              sx={{
                p: `${DASHBOARD_UX.metricPadding}px`,
                borderRadius: `${DASHBOARD_UX.radius}px`,
                border: `1px solid ${s.border}`,
                bgcolor: s.surface,
              }}
            >
              <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                {t('meals.activity.dayTotal', { defaultValue: 'Day total' })}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.counterValue, color: s.textPrimary, mt: 0.25 }}>
                {formatCurrency(detail.dayTotal, detail.currencyCode)}
              </Typography>
            </Box>
          ) : null}
        </Stack>
      ) : (
        <EmptyState title={t('meals.activity.loadError')} />
      )}
    </SidePanel>
  );
}

type SummaryTile = {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
  accent: string;
  span?: number;
  muted?: boolean;
};

/**
 * Member Meals â†’ Activity / Calendar â€” parity with mobile MemberMealActivitySection.
 * Customer audience matches approved My Orders mock.
 */
export function MemberMealActivitySection({
  spaceId,
  memberId,
  effectiveMealBillingType,
  audience = 'owner',
}: MemberMealActivitySectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const isLgDown = useMediaQuery(theme.breakpoints.down('lg'));
  const isCustomer = audience === 'customer';
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

    if (view === 'calendar' && !isCustomer) {
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

    if (isPrepaid && !isCustomer) {
      return [
        {
          label: t('meals.activity.history.mealsPurchased', {
            defaultValue: 'Meals purchased',
          }),
          value:
            summary.balancePurchased != null ? String(summary.balancePurchased) : 'â€”',
        },
        {
          label: t('meals.activity.history.mealsConsumed', {
            defaultValue: 'Meals consumed',
          }),
          value: summary.balanceConsumed != null ? String(summary.balanceConsumed) : 'â€”',
        },
        {
          label: t('meals.activity.history.mealsRemaining', {
            defaultValue: 'Remaining',
          }),
          value:
            summary.balanceRemaining != null ? String(summary.balanceRemaining) : 'â€”',
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
  }, [activity, isCustomer, isPrepaid, t, view]);

  const customerTiles = useMemo((): SummaryTile[] => {
    if (!activity || !isCustomer) return [];
    const summary = activity.summary;
    const currency = summary.currencyCode ?? 'INR';

    if (view === 'calendar') {
      return [
        {
          id: 'accepted',
          label: t('meals.activity.acceptedMeals'),
          value: String(summary.acceptedMeals),
          icon: CheckCircle2,
          accent: '#7C3AED',
        },
        {
          id: 'pending',
          label: t('meals.activity.pendingResponses'),
          value: String(summary.pendingResponses),
          icon: Clock3,
          accent: '#D97706',
        },
        {
          id: 'skipped',
          label: t('meals.activity.skippedMeals'),
          value: String(summary.skippedMeals),
          icon: CalendarDays,
          accent: colors.primaryDark,
        },
      ];
    }

    if (isPrepaid) {
      return [
        {
          id: 'purchased',
          label: t('meals.activity.history.mealsPurchased', {
            defaultValue: 'Meals purchased',
          }),
          value:
            summary.balancePurchased != null ? String(summary.balancePurchased) : 'â€”',
          icon: UtensilsCrossed,
          accent: colors.primaryDark,
        },
        {
          id: 'consumed',
          label: t('meals.activity.history.mealsConsumed', {
            defaultValue: 'Meals consumed',
          }),
          value: summary.balanceConsumed != null ? String(summary.balanceConsumed) : 'â€”',
          icon: CheckCircle2,
          accent: '#7C3AED',
        },
        {
          id: 'remaining',
          label: t('meals.activity.history.mealsRemaining', {
            defaultValue: 'Remaining',
          }),
          value:
            summary.balanceRemaining != null ? String(summary.balanceRemaining) : 'â€”',
          icon: Wallet,
          accent: '#2563EB',
        },
      ];
    }

    const timelineText =
      paymentEvents.loading
        ? t('common.loading')
        : paymentEvents.events.length === 0
          ? t('meals.paymentTimeline.empty', {
              defaultValue: 'No payment events for this month yet.',
            })
          : t('meals.paymentTimeline.eventCount', {
              defaultValue: '{{count}} events this month',
              count: paymentEvents.events.length,
            });

    return [
      {
        id: 'generated',
        label: t('meals.activity.history.amountGenerated', {
          defaultValue: 'Amount generated',
        }),
        value: formatCurrency(summary.amountGenerated, currency),
        icon: IndianRupee,
        accent: colors.primaryDark,
      },
      {
        id: 'paid',
        label: t('meals.activity.history.paid', { defaultValue: 'Paid' }),
        value: formatCurrency(summary.paidAmount, currency),
        icon: Wallet,
        accent: colors.primaryDark,
      },
      {
        id: 'pending',
        label: t('meals.activity.history.pending', { defaultValue: 'Pending' }),
        value: formatCurrency(summary.pendingAmount, currency),
        icon: Clock3,
        accent: '#D97706',
      },
      {
        id: 'accepted',
        label: t('meals.activity.history.mealsAccepted', {
          defaultValue: 'Meals accepted',
        }),
        value: String(summary.acceptedMeals),
        icon: CheckCircle2,
        accent: '#7C3AED',
      },
      {
        id: 'timeline',
        label: t('meals.paymentTimeline.title', { defaultValue: 'Payment timeline' }),
        value: timelineText,
        icon: TrendingUp,
        accent: '#2563EB',
        span: 2,
        muted: true,
      },
    ];
  }, [activity, isCustomer, isPrepaid, paymentEvents.events.length, paymentEvents.loading, t, view]);

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

  const filters: ActivityHistoryFilter[] = ['ALL', 'PAID', 'PENDING', 'SKIPPED'];
  const showDesktopPanel = Boolean(selectedDate) && !isLgDown;

  const dayInspector = (
    <DayActivityInspector
      date={selectedDate}
      detail={dayDetail.detail}
      loading={dayDetail.loading}
      framed={!isLgDown}
      onClose={() => setSelectedDate(null)}
    />
  );

  const historyList = view === 'history' && activity ? (
        <Stack spacing={1}>
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {filters.map((item) => {
              const active = filter === item;
              const label =
                item === 'ALL'
                  ? t('meals.activity.history.filterAll')
                  : item === 'PAID'
                    ? t('meals.activity.history.filterPaid')
                    : item === 'PENDING'
                      ? t('meals.activity.history.filterPending')
                      : t('meals.activity.history.filterSkipped');
              return (
                <Box
                  key={item}
                  component="button"
                  type="button"
                  onClick={() => setFilter(item)}
                  sx={{
                    border: active ? 'none' : `1px solid ${s.border}`,
                    bgcolor: active ? colors.primary : s.surface,
                    color: active ? '#fff' : s.textSecondary,
                    borderRadius: 999,
                    px: 1.5,
                    py: 0.55,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    lineHeight: 1.2,
                    fontFamily: 'inherit',
                    '&:hover': {
                      bgcolor: active ? colors.primaryDark : s.hover,
                    },
                  }}
                >
                  {label}
                </Box>
              );
            })}
          </Stack>
          {historyDays.length === 0 ? (
            <EmptyState
              title={t('meals.activity.title')}
              description={t('meals.activity.history.empty')}
            />
          ) : (
            historyDays.filter(dayHasListActivity).map((day) => {
              const dateKey = normalizeActivityDate(day.date) ?? day.date;
              const paymentDisplay = resolveActivityPaymentDisplay(day, todayIso);
              const slotLine = (day.slots ?? [])
                .map(
                  (slot) =>
                    `${mealSlotPrefix(slot.mealType)}:${slotStatusLetter(slot.status)}`,
                )
                .join(' â€¢ ');
              const selected = selectedDate === dateKey;

              if (isCustomer) {
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
                      border: `1px solid ${selected ? colors.primaryDark : s.border}`,
                      bgcolor: selected ? `${colors.primaryDark}10` : s.surface,
                      boxShadow: s.shadow,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.25,
                      '&:hover': { boxShadow: s.shadowHover, bgcolor: s.hover },
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                        border: `1px solid ${colors.primaryDark}44`,
                        bgcolor: `${colors.primaryDark}12`,
                        color: colors.primaryDark,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <CalendarDays size={16} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: s.textPrimary }}>
                        {formatActivityListDate(dateKey)}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: s.textMuted, mt: 0.15 }}>
                        {slotLine}
                      </Typography>
                    </Box>
                    <ChevronRight size={16} color={s.textMuted} />
                  </Box>
                );
              }

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
                    border: `1px solid ${selected ? colors.primaryDark : s.border}`,
                    bgcolor: selected ? `${colors.primaryDark}10` : s.surface,
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
                      <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}>
                        {formatActivityListDate(dateKey)}
                      </Typography>
                      <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}>
                        {slotLine}
                      </Typography>
                    </Box>
                    <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
                      {day.dayTotal != null && day.dayTotal > 0 ? (
                        <Typography sx={{ ...DASHBOARD_UX.link, color: colors.success }}>
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
  ) : null;

  const calendarView = view === 'calendar' && activity ? (
        <Box
          sx={{
            p: `${DASHBOARD_UX.metricPadding}px`,
            borderRadius: `${DASHBOARD_UX.radius}px`,
            border: `1px solid ${s.border}`,
            bgcolor: s.surface,
            boxShadow: isCustomer ? s.shadow : undefined,
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
                        color: hasActivity ? s.textPrimary : s.textMuted,
                      }}
                    >
                      {dayNumber}
                    </Typography>
                    <Stack direction="row" spacing={0.25}>
                      {MEAL_ORDER.map((mealType) => {
                        const slot = day?.slots?.find((entry) => entry.mealType === mealType);
                        return slot ? (
                          <SlotDot key={mealType} status={slot.status} />
                        ) : (
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
  ) : null;

  return (
    <Stack spacing={isCustomer ? 1.25 : `${DASHBOARD_UX.cardGap}px`}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Tabs
          value={view}
          onChange={(_, next: ActivityView) => setView(next)}
          aria-label={t('meals.activity.title')}
          sx={{
            minHeight: 36,
            borderBottom: { xs: `1px solid ${s.border}`, sm: 'none' },
            flex: 1,
            minWidth: 0,
            '& .MuiTab-root': {
              minHeight: 36,
              fontSize: 14,
              fontWeight: 600,
              textTransform: 'none',
              color: s.textMuted,
              px: 1.5,
            },
            '& .Mui-selected': { color: `${colors.primaryDark} !important` },
            '& .MuiTabs-indicator': { bgcolor: colors.primaryDark, height: 2 },
          }}
        >
          <Tab value="history" label={t('meals.activity.viewHistory')} />
          <Tab value="calendar" label={t('meals.activity.viewCalendar')} />
        </Tabs>
        <PeriodMonthNav
          month={month}
          onPrevious={goToPreviousMonth}
          onNext={goToNextMonth}
          size="compact"
          sx={{
            alignSelf: { xs: 'stretch', sm: 'center' },
            width: { xs: '100%', sm: 'auto' },
            justifyContent: 'space-between',
          }}
        />
      </Stack>

      {/* Summary */}
      {isCustomer && customerTiles.length > 0 ? (
        <Box
          sx={{
            display: 'grid',
            gap: 1,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {customerTiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Box
                key={tile.id}
                sx={{
                  gridColumn: tile.span
                    ? { xs: 'auto', md: `span ${tile.span}` }
                    : undefined,
                  p: 1.25,
                  borderRadius: `${DASHBOARD_UX.radius}px`,
                  border: `1px solid ${s.border}`,
                  bgcolor: s.surface,
                  boxShadow: s.shadow,
                  minHeight: 72,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                      bgcolor: `${tile.accent}18`,
                      color: tile.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} />
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, color: s.textSecondary }}>
                    {tile.label}
                  </Typography>
                </Stack>
                <Typography
                  sx={{
                    fontSize: tile.muted ? 13 : 20,
                    fontWeight: tile.muted ? 500 : 700,
                    lineHeight: 1.25,
                    color: tile.muted ? s.textMuted : s.textPrimary,
                    fontVariantNumeric: 'tabular-nums',
                    pl: tile.muted ? 0 : '34px',
                  }}
                >
                  {tile.value}
                </Typography>
              </Box>
            );
          })}
        </Box>
      ) : null}

      {!isCustomer && summaryCards.length > 0 ? (
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

      {!isCustomer && !isPrepaid ? (
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
                    <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}>
                      {t(`meals.paymentTimeline.events.${event.eventType}`, {
                        date: event.pollDate,
                      })}
                    </Typography>
                    {event.amount != null ? (
                      <Typography sx={{ ...DASHBOARD_UX.link, color: colors.success, mt: 0.15 }}>
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

      <Box
        sx={{
          display: 'grid',
          gap: `${DASHBOARD_UX.cardGap}px`,
          gridTemplateColumns: showDesktopPanel
            ? 'minmax(0, 1.85fr) minmax(300px, 0.95fr)'
            : '1fr',
          alignItems: 'start',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {calendarView}
          {historyList}
        </Box>
        {showDesktopPanel ? (
          <Box
            sx={{
              position: 'sticky',
              top: 12,
              alignSelf: 'start',
              height: 'calc(100vh - 112px)',
              maxHeight: 'calc(100vh - 112px)',
              minHeight: 360,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {dayInspector}
          </Box>
        ) : null}
      </Box>

      <AppDrawer
        open={Boolean(selectedDate) && isLgDown}
        onClose={() => setSelectedDate(null)}
        width={400}
      >
        {dayInspector}
      </AppDrawer>
    </Stack>
  );
}
