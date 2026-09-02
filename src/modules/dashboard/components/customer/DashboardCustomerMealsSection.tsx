import {
  Box,
  Button,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  CalendarDays,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Info,
  IndianRupee,
  Moon,
  RefreshCw,
  Sun,
  Sunrise,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { useCustomerSubscriptionStatus } from '@/modules/meals/hooks/useCustomerSubscriptionStatus';
import { useMemberMealActivity } from '@/modules/meals/hooks/useMemberMealActivity';
import { useMealPolls } from '@/modules/meals/hooks/useMeals';
import {
  buildRecentOrdersFromActivity,
  countMenuItemsFromPolls,
  countUpcomingPayments,
} from '@/modules/meals/utils/customerDashboardStats';
import { addDaysIso, formatMenuDateLabel, isPastMenuDate, MEAL_TYPES, todayIsoDate } from '@/modules/meals/utils/mealDates';
import {
  canShiftCustomerMealDate,
  customerMealDateBounds,
  resolveCustomerMealFocusDate,
} from '@/modules/meals/utils/customerMealFocusDate';
import { buildMealSummaryFromPolls } from '@/modules/meals/utils/mealSelectionSummary';
import { showMealPrices } from '@/modules/meals/utils/mealPricingPolicy';
import { ContentCard } from '@/shared/components/ContentCard';
import { PeriodDayNav } from '@/shared/components/PeriodDayNav';
import { StatusChip } from '@/shared/components/StatusChip';
import { useAuthSession } from '@/shared/hooks/useAuthSession';
import { useLinkedMember } from '@/shared/hooks/useLinkedMember';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import type { MealPollSlot, MealType } from '@/shared/types/meals';
import {
  spaceComplaintsPath,
  spaceDayMealsPath,
  spaceMealsPlansCustomerPath,
  spaceMealsPath,
  spaceMealsPollPath,
  spacePaymentsPath,
} from '@/routes/paths';

type DashboardPollCardState = 'empty' | 'active' | 'partial' | 'complete';

type DashboardCustomerMealsSectionProps = {
  spaceId: string;
  /**
   * `dashboard` — full home section (default).
   * `orders` — same poll picker + stats; skip greeting/recent/quick-actions that duplicate My Orders.
   */
  variant?: 'dashboard' | 'orders';
};

const MEAL_ICONS: Record<MealType, LucideIcon> = {
  BREAKFAST: Sunrise,
  LUNCH: Sun,
  DINNER: Moon,
};

const MEAL_ACCENTS: Record<MealType, string> = {
  BREAKFAST: '#D97706',
  LUNCH: colors.primaryDark,
  DINNER: '#7C3AED',
};

/** Meal-tinted card fills (customer dashboard meal columns) — light washes. */
const MEAL_CARD_SURFACE: Record<
  MealType,
  { light: string; dark: string; borderLight: string; borderDark: string; hoverLight: string; hoverDark: string }
> = {
  BREAKFAST: {
    light: '#FFF7ED',
    dark: 'rgba(217, 119, 6, 0.14)',
    borderLight: '#FED7AA',
    borderDark: 'rgba(251, 191, 36, 0.28)',
    hoverLight: '#FFEDD5',
    hoverDark: 'rgba(217, 119, 6, 0.22)',
  },
  LUNCH: {
    light: '#ECFDF5',
    dark: 'rgba(5, 150, 105, 0.12)',
    borderLight: '#A7F3D0',
    borderDark: 'rgba(52, 211, 153, 0.28)',
    hoverLight: '#D1FAE5',
    hoverDark: 'rgba(5, 150, 105, 0.2)',
  },
  DINNER: {
    light: '#F5F3FF',
    dark: 'rgba(124, 58, 237, 0.14)',
    borderLight: '#DDD6FE',
    borderDark: 'rgba(167, 139, 250, 0.28)',
    hoverLight: '#EDE9FE',
    hoverDark: 'rgba(124, 58, 237, 0.22)',
  },
};

function firstName(fullName: string | null | undefined): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function pollHasResponse(poll: MealPollSlot, multiQuantity: boolean): boolean {
  if (multiQuantity) {
    return (poll.mySelections ?? []).some((selection) => selection.quantity > 0);
  }
  return poll.mySelectedOptionId != null;
}

function platesForPoll(poll: MealPollSlot, multiQuantity: boolean): number {
  if (multiQuantity) {
    return (poll.mySelections ?? []).reduce((sum, row) => sum + (row.quantity > 0 ? row.quantity : 0), 0);
  }
  return poll.mySelectedOptionId ? 1 : 0;
}

function resolveCardState(
  loading: boolean,
  pollCount: number,
  allResponded: boolean,
  hasPartialSubmission: boolean,
  hasPaymentContext = false,
  hasOrderPlates = false,
): DashboardPollCardState {
  if (!loading && pollCount === 0) return 'empty';
  if (allResponded || (hasPaymentContext && !hasPartialSubmission && hasOrderPlates)) {
    return 'complete';
  }
  if (hasPartialSubmission || hasOrderPlates) return 'partial';
  if (hasPaymentContext) return 'complete';
  return 'active';
}

function greetingKey(hour: number): string {
  if (hour < 12) return 'dashboard.customer.greetingMorning';
  if (hour < 17) return 'dashboard.customer.greetingAfternoon';
  return 'dashboard.customer.greetingEvening';
}

function formatUpdatedAt(ms: number | undefined, locale?: string): string {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

function menuPreview(
  poll: MealPollSlot | undefined,
  showPrices: boolean,
  maxVisible = 2,
): { lines: string[]; moreCount: number } {
  if (!poll) return { lines: [], moreCount: 0 };
  const entries = poll.options.filter((o) => o.optionType === 'MENU_ENTRY');
  const lines = entries.slice(0, maxVisible).map((o) =>
    showPrices && o.price != null
      ? `${o.label} (${formatCurrency(Number(o.price), o.currencyCode || 'INR')})`
      : o.label,
  );
  return { lines, moreCount: Math.max(0, entries.length - maxVisible) };
}

/** Customer order preview for a poll slot (selected items only). */
function selectionPreview(
  poll: MealPollSlot | undefined,
  multiQuantity: boolean,
  showPrices: boolean,
  maxVisible = 2,
): { lines: string[]; moreCount: number } {
  if (!poll) return { lines: [], moreCount: 0 };

  const items: { label: string; quantity: number; price: number | null; currency: string }[] = [];
  if (multiQuantity) {
    for (const selection of poll.mySelections ?? []) {
      if (selection.quantity <= 0) continue;
      const option = poll.options.find((row) => row.id === selection.optionId);
      if (!option || option.optionType !== 'MENU_ENTRY') continue;
      items.push({
        label: option.label,
        quantity: selection.quantity,
        price: option.price != null ? Number(option.price) : null,
        currency: option.currencyCode || 'INR',
      });
    }
  } else if (poll.mySelectedOptionId) {
    const option = poll.options.find((row) => row.id === poll.mySelectedOptionId);
    if (option && option.optionType === 'MENU_ENTRY') {
      items.push({
        label: option.label,
        quantity: 1,
        price: option.price != null ? Number(option.price) : null,
        currency: option.currencyCode || 'INR',
      });
    }
  }

  const lines = items.slice(0, maxVisible).map((item) => {
    const qty = item.quantity > 1 ? ` ×${item.quantity}` : '';
    if (showPrices && item.price != null) {
      return `${item.label}${qty} (${formatCurrency(item.price * item.quantity, item.currency)})`;
    }
    return `${item.label}${qty}`;
  });
  return { lines, moreCount: Math.max(0, items.length - maxVisible) };
}

/**
 * Customer dashboard — matches approved customer mock (interactive parity with owner ops board).
 * Also reused on My Orders so members can open menu selection from both pages.
 */
export function DashboardCustomerMealsSection({
  spaceId,
  variant = 'dashboard',
}: DashboardCustomerMealsSectionProps) {
  const embeddedOnOrders = variant === 'orders';
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const navigate = useNavigate();
  const { user } = useAuthSession();
  const permissions = useSpacePermissions(spaceId);
  const { memberId: linkedMemberId } = useLinkedMember(spaceId);
  const { status: subscriptionStatus } = useCustomerSubscriptionStatus(spaceId, linkedMemberId);

  const [menuDate, setMenuDate] = useState(todayIsoDate);
  const [userPickedDate, setUserPickedDate] = useState(false);
  const pollsQuery = useMealPolls(spaceId, menuDate, true);

  useEffect(() => {
    if (userPickedDate || !spaceId) return;
    let cancelled = false;
    void resolveCustomerMealFocusDate(spaceId).then((date) => {
      if (!cancelled) setMenuDate(date);
    });
    return () => {
      cancelled = true;
    };
  }, [spaceId, userPickedDate]);

  const activity = useMemberMealActivity(
    spaceId,
    linkedMemberId ?? spaceId,
    linkedMemberId != null,
  );

  const multiQuantity = permissions.space?.spaceType === 'MESS';
  const pollDay = pollsQuery.pollDay;
  const displayPolls = useMemo(
    () => (pollDay?.polls ?? []).filter((p) => p.status === 'OPEN' || p.status === 'CLOSED'),
    [pollDay?.polls],
  );
  const pollByType = useMemo(() => {
    const map: Partial<Record<MealType, MealPollSlot>> = {};
    for (const poll of displayPolls) map[poll.mealType] = poll;
    return map;
  }, [displayPolls]);

  const openPolls = useMemo(
    () => displayPolls.filter((p) => p.status === 'OPEN'),
    [displayPolls],
  );

  const allResponded =
    displayPolls.length > 0 && displayPolls.every((p) => pollHasResponse(p, multiQuantity));
  const anyResponded = displayPolls.some((p) => pollHasResponse(p, multiQuantity));
  const hasPartialSubmission = anyResponded && !allResponded;

  const orderSummary = useMemo(
    () => buildMealSummaryFromPolls(displayPolls, multiQuantity),
    [displayPolls, multiQuantity],
  );

  const myPaymentStatus = pollDay?.myPaymentStatus ?? null;
  const cardState = useMemo(
    () =>
      resolveCardState(
        pollsQuery.loading,
        displayPolls.length,
        allResponded,
        hasPartialSubmission,
        myPaymentStatus != null,
        orderSummary.totalPlates > 0,
      ),
    [
      allResponded,
      displayPolls.length,
      hasPartialSubmission,
      myPaymentStatus,
      orderSummary.totalPlates,
      pollsQuery.loading,
    ],
  );

  const isPastDate = isPastMenuDate(menuDate);
  const reviewOnly =
    isPastDate || (!pollsQuery.loading && openPolls.length === 0 && displayPolls.length > 0);

  const totalMenuItems = useMemo(() => countMenuItemsFromPolls(displayPolls), [displayPolls]);
  const recentOrders = useMemo(
    () => buildRecentOrdersFromActivity(activity.activity, 4),
    [activity.activity],
  );

  const dueAmount = useMemo(() => {
    const pending = activity.activity?.summary?.pendingAmount;
    if (pending != null && Number(pending) > 0) return Number(pending);
    if (
      myPaymentStatus === 'PENDING' ||
      myPaymentStatus === 'REJECTED' ||
      (myPaymentStatus as string) === 'UPDATE_REQUESTED'
    ) {
      if (pollDay?.myPaymentChargedAmount != null) return Number(pollDay.myPaymentChargedAmount);
      return orderSummary.totalAmount > 0 ? orderSummary.totalAmount : null;
    }
    return null;
  }, [
    activity.activity?.summary?.pendingAmount,
    myPaymentStatus,
    orderSummary.totalAmount,
    pollDay?.myPaymentChargedAmount,
  ]);

  const upcomingPayments = useMemo(() => {
    const fromActivity = countUpcomingPayments(activity.activity);
    if (fromActivity > 0) return fromActivity;
    return myPaymentStatus === 'PENDING' ||
      myPaymentStatus === 'REJECTED' ||
      (myPaymentStatus as string) === 'UPDATE_REQUESTED'
      ? 1
      : 0;
  }, [activity.activity, myPaymentStatus]);

  const yourOrders = activity.activity?.summary?.acceptedMeals ?? orderSummary.totalPlates;

  const mealSelectionBlocked = useMemo(() => {
    if (!subscriptionStatus?.prepaidBilling) return false;
    if (subscriptionStatus.pendingActivationStatus === 'PENDING') return true;
    return !subscriptionStatus.subscriptionActive;
  }, [subscriptionStatus]);

  const shiftDate = (delta: number) => {
    if (!canShiftCustomerMealDate(menuDate, delta)) return;
    setUserPickedDate(true);
    setMenuDate((prev) => addDaysIso(prev, delta));
  };

  const openPoll = (date = menuDate, mealType?: MealType) => {
    if (mealSelectionBlocked && !reviewOnly && date === menuDate) return;
    navigate(spaceMealsPollPath(spaceId, date, mealType));
  };

  const refreshAll = () => {
    void pollsQuery.reload();
    void activity.reload();
  };

  const goPlans = () => navigate(spaceMealsPlansCustomerPath(spaceId));
  const goMeals = () => navigate(spaceMealsPath(spaceId));
  const goPayments = () =>
    navigate(
      permissions.space?.spaceType === 'MESS'
        ? spaceDayMealsPath(spaceId)
        : spacePaymentsPath(spaceId),
    );
  const goComplaints = () => navigate(spaceComplaintsPath(spaceId));

  const spaceName = permissions.space?.spaceName ?? t('navigation.dashboard');
  const spaceType = permissions.space?.spaceType;
  const name = firstName(user?.fullName) || t('dashboard.customer.guest', { defaultValue: 'there' });
  const showPrices = showMealPrices({ spaceType });
  const { minDate, maxDate } = customerMealDateBounds();

  const chooseLabel = isPastDate
    ? t('dashboard.pollCard.viewFullMenu', { defaultValue: 'View menus' })
    : cardState === 'complete'
      ? t('dashboard.pollCard.updateChoices', { defaultValue: 'Update choices' })
      : cardState === 'partial'
        ? t('dashboard.pollCard.continueSelection', { defaultValue: 'Continue selection' })
        : t('dashboard.pollCard.chooseNow', { defaultValue: 'Choose your meals now' });

  const headerChooseLabel = t('dashboard.customer.chooseMeals', {
    defaultValue: 'Choose your meals',
  });

  const lastUpdatedMs =
    Math.max(pollsQuery.dataUpdatedAt || 0, activity.dataUpdatedAt || 0) || undefined;

  const pollBadge = (poll: MealPollSlot | undefined, selected: boolean) => {
    if (!poll) return null;
    // Prefer customer selection state over kitchen/poll-status copy.
    if (selected) {
      return {
        label: t('meals.poll.selectedShort', { defaultValue: 'Selected' }),
        tone: 'success' as const,
      };
    }
    if (poll.status === 'OPEN') {
      return {
        label: t('meals.poll.pollOpenShort', { defaultValue: 'Poll open' }),
        tone: 'warning' as const,
      };
    }
    return {
      label: t('dashboard.pollCard.notSelected', { defaultValue: 'Not selected' }),
      tone: 'neutral' as const,
    };
  };

  return (
    <Stack spacing={1.5} sx={{ width: '100%' }}>
      {/* Hero — compact greeting row (mock) */}
      <Box
        sx={{
          px: 1.5,
          py: 1.25,
          borderRadius: `${DASHBOARD_UX.radius}px`,
          bgcolor: s.successTint,
          border: `1px solid ${s.border}`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.25,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
            bgcolor: `${colors.primary}22`,
            color: colors.primaryDark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mt: 0.15,
          }}
        >
          <UtensilsCrossed size={18} strokeWidth={2.2} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 13, color: s.textSecondary, fontWeight: 600, lineHeight: 1.3 }}>
            {t(greetingKey(new Date().getHours()))}, {name}! 👋
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 0.15 }}>
            <Typography
              sx={{
                fontSize: 18,
                lineHeight: 1.3,
                fontWeight: 700,
                color: colors.primaryDark,
              }}
            >
              {spaceName}
            </Typography>
            {spaceType ? (
              <Box
                sx={{
                  px: 0.85,
                  py: 0.2,
                  borderRadius: 999,
                  bgcolor: colors.primaryDark,
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.35,
                  textTransform: 'uppercase',
                  lineHeight: 1.4,
                }}
              >
                {spaceType}
              </Box>
            ) : null}
          </Stack>
          <Typography sx={{ fontSize: 12, color: s.textMuted, mt: 0.2, lineHeight: 1.35 }}>
            {t('dashboard.customer.heroSubtitle', {
              defaultValue: "Here's what's cooking today",
            })}
          </Typography>
        </Box>
      </Box>

      {/* Subscription banner */}
      {subscriptionStatus?.prepaidBilling && !subscriptionStatus.subscriptionActive ? (
        <ContentCard>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Box>
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                {subscriptionStatus.pendingActivationStatus === 'PENDING'
                  ? t('meals.subscription.customer.pendingTitle', {
                      defaultValue: 'Activation pending',
                    })
                  : t('meals.subscription.customer.requiredTitle', {
                      defaultValue: 'Subscription required',
                    })}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.5 }}>
                {subscriptionStatus.pendingActivationStatus === 'PENDING'
                  ? t('meals.subscription.customer.pendingBody', {
                      defaultValue: 'Your plan request is waiting for approval.',
                      plan: subscriptionStatus.pendingPlanName ?? '',
                    })
                  : t('meals.subscription.customer.requiredBody', {
                      defaultValue: 'Choose a meal plan to start ordering.',
                    })}
              </Typography>
            </Box>
            <Button variant="contained" onClick={goPlans} sx={dashContainedButtonSx}>
              {t('meals.subscription.customer.viewPlans', { defaultValue: 'View plans' })}
            </Button>
          </Stack>
        </ContentCard>
      ) : null}

      {/* Date + meals + CTA in one panel */}
      <ContentCard padded={false}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{
            alignItems: { sm: 'center' },
            justifyContent: 'space-between',
            px: 1.5,
            py: 1,
            borderBottom: `1px solid ${s.divider}`,
          }}
        >
          <PeriodDayNav
            date={menuDate}
            onPrevious={() => shiftDate(-1)}
            onNext={() => shiftDate(1)}
            disablePrevious={!canShiftCustomerMealDate(menuDate, -1)}
            disableNext={!canShiftCustomerMealDate(menuDate, 1)}
            onDateSelect={(next) => {
              if (next >= minDate && next <= maxDate) {
                setUserPickedDate(true);
                setMenuDate(next);
              }
            }}
            minDate={minDate}
            maxDate={maxDate}
            size="compact"
          />
          <Button
            variant="outlined"
            disabled={mealSelectionBlocked && !isPastDate && cardState === 'empty'}
            onClick={() => openPoll()}
            endIcon={<ChevronRight size={14} />}
            sx={{
              ...dashOutlinedButtonSx,
              minHeight: 28,
              height: 28,
              px: 1.25,
              fontSize: 13,
              py: 0,
            }}
          >
            {headerChooseLabel}
          </Button>
        </Stack>

        <Box sx={{ p: 1.5, pt: 1.25 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1 }}
          >
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 700,
                color: s.textPrimary,
                lineHeight: 1.3,
                minWidth: 0,
              }}
            >
              {formatMenuDateLabel(menuDate, i18n.language)}
            </Typography>
            {cardState === 'complete' || cardState === 'partial' ? (
              <StatusChip
                label={
                  cardState === 'complete'
                    ? t('dashboard.pollCard.statusSelected', {
                        defaultValue: '✓ Meals selected',
                      })
                    : t('dashboard.pollCard.statusPartial', {
                        defaultValue: 'Selection incomplete',
                      })
                }
                tone={cardState === 'complete' ? 'success' : 'warning'}
              />
            ) : null}
          </Stack>
          {pollsQuery.loading && displayPolls.length === 0 ? (
            <Typography sx={{ fontSize: 13, color: s.textMuted }}>{t('common.loading')}</Typography>
          ) : cardState === 'empty' ? (
            <Typography sx={{ fontSize: 13, color: s.textMuted, py: 1.5, textAlign: 'center' }}>
              {t('dashboard.pollCard.notPublished', {
                defaultValue: 'Menus are not planned yet.',
              })}
            </Typography>
          ) : (
            <Stack spacing={1.25}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                  gap: 1,
                }}
              >
                {MEAL_TYPES.map((mealType) => {
                  const poll = pollByType[mealType];
                  const Icon = MEAL_ICONS[mealType];
                  const accent = MEAL_ACCENTS[mealType];
                  const cardSurface = MEAL_CARD_SURFACE[mealType];
                  const isDark = theme.palette.mode === 'dark';
                  const cardBg = isDark ? cardSurface.dark : cardSurface.light;
                  const cardBorder = isDark ? cardSurface.borderDark : cardSurface.borderLight;
                  const cardHover = isDark ? cardSurface.hoverDark : cardSurface.hoverLight;
                  const plates = poll ? platesForPoll(poll, multiQuantity) : 0;
                  const selected = plates > 0;
                  const preview = selected
                    ? selectionPreview(poll, multiQuantity, showPrices, 2)
                    : menuPreview(poll, showPrices, 2);
                  const { lines, moreCount } = preview;
                  const hasSlot = Boolean(poll);
                  const badge = pollBadge(poll, selected);
                  return (
                    <Box
                      key={mealType}
                      role="button"
                      tabIndex={hasSlot ? 0 : undefined}
                      onClick={() => (hasSlot ? openPoll(menuDate, mealType) : undefined)}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && hasSlot) {
                          e.preventDefault();
                          openPoll(menuDate, mealType);
                        }
                      }}
                      sx={{
                        p: 1.1,
                        borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                        border: `1px solid ${cardBorder}`,
                        bgcolor: cardBg,
                        cursor: hasSlot ? 'pointer' : 'default',
                        opacity: hasSlot ? 1 : 0.55,
                        transition: DASHBOARD_UX.transition,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.6,
                        minHeight: 108,
                        '&:hover': hasSlot ? { bgcolor: cardHover } : undefined,
                        '&:focus-visible': {
                          outline: `2px solid ${accent}`,
                          outlineOffset: 1,
                        },
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={0.6}
                        sx={{ alignItems: 'center', minHeight: 24 }}
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: 1,
                            bgcolor: `${accent}18`,
                            color: accent,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={11} strokeWidth={2.2} />
                        </Box>
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: s.textPrimary,
                            flex: 1,
                            minWidth: 0,
                            lineHeight: 1.2,
                          }}
                          noWrap
                        >
                          {t(`meals.mealType.${mealType}`)}
                        </Typography>
                        {badge ? (
                          <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                            <StatusChip label={badge.label} tone={badge.tone} />
                          </Box>
                        ) : null}
                        {hasSlot ? (
                          <Box
                            sx={{
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              lineHeight: 0,
                            }}
                          >
                            <ChevronRight size={14} color={s.textMuted} />
                          </Box>
                        ) : null}
                      </Stack>

                      <Box sx={{ flex: 1, minHeight: 52, display: 'flex', flexDirection: 'column' }}>
                        {selected ? (
                          <Typography
                            sx={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: colors.primaryDark,
                              mt: 0.15,
                              mb: 0.25,
                              lineHeight: 1.3,
                            }}
                          >
                            {t('dashboard.pollCard.youHaveSelected', {
                              defaultValue: 'You have selected',
                            })}
                          </Typography>
                        ) : null}
                        {lines.length > 0 ? (
                          <Stack spacing={0.35} sx={{ mt: selected ? 0 : 0.15 }}>
                            {lines.map((line) => (
                              <Stack
                                key={line}
                                direction="row"
                                spacing={0.75}
                                sx={{
                                  alignItems: 'center',
                                  minWidth: 0,
                                  minHeight: 18,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                  aria-hidden
                                >
                                  <Box
                                    sx={{
                                      width: 5,
                                      height: 5,
                                      borderRadius: '50%',
                                      bgcolor: accent,
                                    }}
                                  />
                                </Box>
                                <Typography
                                  sx={{
                                    fontSize: 12,
                                    lineHeight: '18px',
                                    color: s.textSecondary,
                                    minWidth: 0,
                                    flex: 1,
                                    fontWeight: selected ? 600 : 400,
                                  }}
                                  noWrap
                                >
                                  {line}
                                </Typography>
                              </Stack>
                            ))}
                            <Typography
                              sx={{
                                fontSize: 12,
                                lineHeight: '18px',
                                minHeight: 18,
                                color: moreCount > 0 ? colors.primaryDark : 'transparent',
                                fontWeight: 600,
                                pl: 'calc(10px + 6px)',
                                userSelect: moreCount > 0 ? 'auto' : 'none',
                              }}
                              aria-hidden={moreCount <= 0}
                            >
                              {moreCount > 0
                                ? t('dashboard.pollCard.previewMore', {
                                    defaultValue: '+{{count}} more',
                                    count: moreCount,
                                  })
                                : '\u00a0'}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography sx={{ fontSize: 12, color: s.textMuted, mt: 0.15 }}>
                            {selected
                              ? t('dashboard.pollCard.notSelected', {
                                  defaultValue: 'Not selected',
                                })
                              : t('dashboard.customer.noMenuItems', {
                                  defaultValue: 'No menu items',
                                })}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>

              <Button
                variant="contained"
                disabled={mealSelectionBlocked && !isPastDate}
                onClick={() => openPoll()}
                sx={{
                  ...dashContainedButtonSx,
                  alignSelf: { xs: 'stretch', sm: 'flex-start' },
                  width: { xs: '100%', sm: 'auto' },
                  minWidth: { xs: 0, sm: 180 },
                  minHeight: '32px !important',
                  height: '32px !important',
                  py: 0,
                  px: 2,
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: 'none',
                  lineHeight: 1.2,
                  '&:hover': { boxShadow: 'none' },
                }}
              >
                {chooseLabel}
              </Button>

              {mealSelectionBlocked && !isPastDate ? (
                <Typography sx={{ fontSize: 12, color: s.textMuted }}>
                  {subscriptionStatus?.pendingActivationStatus === 'PENDING'
                    ? t('meals.subscription.customer.selectionPendingHint', {
                        defaultValue: 'Meal selection unlocks after your plan is approved.',
                      })
                    : t('meals.subscription.customer.selectionRequiredHint', {
                        defaultValue: 'Activate a subscription plan to select meals.',
                      })}
                </Typography>
              ) : null}
            </Stack>
          )}
        </Box>
      </ContentCard>

      {/* Quick stats — compact tiles with value + label (mock) */}
      <Box>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: s.textPrimary, mb: 1 }}>
          {t('dashboard.customer.stats.title', { defaultValue: 'Quick stats' })}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' },
            gap: 1,
          }}
        >
          {(
            [
              {
                id: 'menu',
                label: t('dashboard.customer.stats.menuItems', { defaultValue: 'Total menu items' }),
                value: String(totalMenuItems),
                icon: UtensilsCrossed,
                accent: colors.primaryDark,
              },
              {
                id: 'orders',
                label: t('dashboard.customer.stats.yourOrders', { defaultValue: 'Your orders' }),
                value: String(yourOrders),
                icon: ClipboardList,
                accent: '#2563EB',
              },
              {
                id: 'due',
                label: t('dashboard.customer.stats.dueAmount', { defaultValue: 'Due amount' }),
                value:
                  dueAmount == null || dueAmount <= 0
                    ? formatCurrency(0, 'INR')
                    : formatCurrency(
                        dueAmount,
                        activity.activity?.summary?.currencyCode ||
                          orderSummary.currencyCode ||
                          'INR',
                      ),
                icon: IndianRupee,
                accent: '#D97706',
              },
              {
                id: 'upcoming',
                label: t('dashboard.customer.stats.upcomingPayments', {
                  defaultValue: 'Upcoming payments',
                }),
                value: String(upcomingPayments),
                icon: CalendarDays,
                accent: '#7C3AED',
              },
            ] as const
          ).map((stat) => {
            const Icon = stat.icon;
            return (
              <Box
                key={stat.id}
                sx={{
                  px: 1.25,
                  py: 1.1,
                  borderRadius: `${DASHBOARD_UX.radius}px`,
                  border: `1px solid ${s.border}`,
                  bgcolor: s.surface,
                  boxShadow: s.shadow,
                  textAlign: 'center',
                  minHeight: 96,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.35,
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                    bgcolor: `${stat.accent}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: stat.accent,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={14} />
                </Box>
                <Typography
                  component="div"
                  sx={{
                    fontSize: 22,
                    fontWeight: 700,
                    lineHeight: 1.15,
                    color: s.textPrimary,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  component="div"
                  sx={{
                    fontSize: 12,
                    color: s.textMuted,
                    lineHeight: 1.25,
                    fontWeight: 500,
                  }}
                >
                  {stat.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Recent orders */}
      {!embeddedOnOrders ? (
      <Box>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.85 }}
        >
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: s.textPrimary }}>
            {t('dashboard.customer.recentOrders.title', { defaultValue: 'Recent orders' })}
          </Typography>
          <Button
            size="small"
            onClick={goMeals}
            sx={{
              ...dashOutlinedButtonSx,
              minHeight: 28,
              height: 28,
              border: 'none',
              color: colors.primaryDark,
              fontSize: 13,
              '&:hover': { bgcolor: s.hover, border: 'none' },
            }}
          >
            {t('dashboard.customer.recentOrders.viewAll', { defaultValue: 'View all' })}
          </Button>
        </Stack>
        {recentOrders.length === 0 ? (
          <ContentCard>
            <Typography sx={{ fontSize: 13, color: s.textMuted, textAlign: 'center' }}>
              {t('dashboard.customer.recentOrders.empty', {
                defaultValue: 'No recent orders yet. Choose meals to get started.',
              })}
            </Typography>
          </ContentCard>
        ) : (
          <Stack spacing={0.85}>
            {recentOrders.map((order) => (
              <ContentCard key={order.date} onClick={() => openPoll(order.date)}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <IconBadge accent={colors.primaryDark}>
                    <ClipboardList />
                  </IconBadge>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: s.textPrimary }}>
                      {formatMenuDateLabel(order.date, i18n.language)}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: s.textMuted }}>
                      {t('dashboard.customer.recentOrders.itemCount', {
                        defaultValue: '{{count}} items',
                        count: order.itemCount,
                      })}
                    </Typography>
                  </Box>
                  <ChevronRight size={16} color={s.textMuted} />
                </Stack>
              </ContentCard>
            ))}
          </Stack>
        )}
      </Box>
      ) : null}

      {/* Quick actions */}
      <Box>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: s.textPrimary, mb: 0.85 }}>
          {t('dashboard.customer.quickActions.title', { defaultValue: 'Quick actions' })}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: embeddedOnOrders ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
            },
            gap: 1,
          }}
        >
          {(
            [
              {
                id: 'orders',
                label: t('dashboard.customer.quickActions.myOrders', { defaultValue: 'My Orders' }),
                hint: t('dashboard.customer.quickActions.myOrdersHint', {
                  defaultValue: 'View your past & upcoming orders',
                }),
                icon: ClipboardList,
                accent: colors.primaryDark,
                onClick: goMeals,
                hideOnOrders: true,
              },
              {
                id: 'payments',
                label: t('dashboard.customer.quickActions.payments', { defaultValue: 'Payments' }),
                hint: t('dashboard.customer.quickActions.paymentsHint', {
                  defaultValue: 'View bills and payment history',
                }),
                icon: Wallet,
                accent: '#D97706',
                onClick: goPayments,
                hideOnOrders: false,
              },
              {
                id: 'complaints',
                label: t('dashboard.customer.quickActions.complaints', {
                  defaultValue: 'Complaints',
                }),
                hint: t('dashboard.customer.quickActions.complaintsHint', {
                  defaultValue: 'Raise or track your complaints',
                }),
                icon: CircleAlert,
                accent: '#DC2626',
                onClick: goComplaints,
                hideOnOrders: false,
              },
            ] as const
          )
            .filter((action) => !(embeddedOnOrders && action.hideOnOrders))
            .map((action) => {
            const Icon = action.icon;
            return (
              <ContentCard key={action.id} onClick={action.onClick}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                      bgcolor: `${action.accent}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: action.accent,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: s.textPrimary }}>
                      {action.label}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: s.textMuted }} noWrap>
                      {action.hint}
                    </Typography>
                  </Box>
                  <ChevronRight size={16} color={s.textMuted} />
                </Stack>
              </ContentCard>
            );
          })}
        </Box>
      </Box>

      {/* Footer strip */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { sm: 'center' },
          justifyContent: 'space-between',
          gap: 1,
          px: 1.5,
          py: 1.1,
          borderRadius: `${DASHBOARD_UX.radius}px`,
          border: `1px solid ${s.border}`,
          bgcolor: s.successTint,
        }}
      >
        <Stack direction="row" spacing={0.85} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Info size={15} color={colors.primaryDark} />
          <Typography sx={{ fontSize: 13, color: s.textSecondary }}>
            {t('dashboard.customer.pollsCloseHint', {
              defaultValue: 'Polls close before meal time. Please submit your responses on time.',
            })}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flexShrink: 0 }}>
          <Typography sx={{ fontSize: 12, color: s.textMuted }}>
            {t('dashboard.headcount.lastUpdated', {
              defaultValue: 'Last updated: {{time}}',
              time: formatUpdatedAt(lastUpdatedMs, i18n.language),
            })}
          </Typography>
          <Button
            size="small"
            startIcon={<RefreshCw size={14} />}
            onClick={refreshAll}
            sx={{
              ...dashOutlinedButtonSx,
              minHeight: 28,
              height: 28,
              fontSize: 13,
              py: 0,
            }}
          >
            {t('common.refresh')}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
