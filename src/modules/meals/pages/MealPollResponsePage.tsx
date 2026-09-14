import {
  Box,
  Button,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  CircleSlash,
  Clock3,
  CreditCard,
  Drumstick,
  Egg,
  Info,
  Leaf,
  Moon,
  Receipt,
  RefreshCw,
  Sparkles,
  Sun,
  Sunrise,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PeriodDayNav } from '@/shared/components/PeriodDayNav';
import { StatusChip } from '@/shared/components/StatusChip';
import { StickyFooter, StickyFooterClearance } from '@/shared/components/StickyFooter';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import {
  EMPTY_PAYMENT_PROOF,
  toSubmitPaymentProofBody,
  UniversalPaymentProofForm,
  validatePaymentProofSubmission,
  type PaymentProofSubmission,
} from '@/modules/payments';
import { spaceMealsPath, spaceMealsPollPath } from '@/routes/paths';
import type {
  FoodType,
  MealDeliveryLocation,
  MealPollOption,
  MealPollPaymentChoice,
  MealPollSlot,
  MealType,
  SubmitMealPollSelection,
} from '@/shared/types/meals';
import { MealPollDeliveryPicker } from '../components/MealPollDeliveryPicker';
import { MealPollQuantityRow } from '../components/MealPollQuantityRow';
import { mealsApi } from '../api/mealsApi';
import { useMealPolls } from '../hooks/useMeals';
import { formatMenuDateLabel, MEAL_TYPES, addDaysIso, isPastMenuDate, todayIsoDate } from '../utils/mealDates';
import {
  canShiftCustomerMealDate,
  customerMealDateBounds,
  resolveCustomerMealFocusDate,
} from '../utils/customerMealFocusDate';
import { resolvePreferredDeliveryLocationId } from '../utils/mealPollDeliveryLocations';
import { platesForSingleSelectOption } from '../utils/mealSelectionSummary';
import { showMealPrices } from '../utils/mealPricingPolicy';
import {
  earliestOpenPollCloseAt,
  formatPollClosesIn,
  formatPollDeadline,
  formatPollRemaining,
  timezoneForPollClose,
} from '../utils/pollCountdown';

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

/** Soft band tints so Breakfast / Lunch / Dinner stay distinct without collapsing. */
const MEAL_BAND_BG: Record<MealType, string> = {
  BREAKFAST: '#FFF7ED',
  LUNCH: '#F0FDF4',
  DINNER: '#FAF5FF',
};

const MEAL_BAND_BG_DARK: Record<MealType, string> = {
  BREAKFAST: 'rgba(217, 119, 6, 0.14)',
  LUNCH: 'rgba(16, 185, 129, 0.12)',
  DINNER: 'rgba(124, 58, 237, 0.14)',
};

type QuantitySelections = Partial<Record<MealType, Record<string, number>>>;
type DeliverySelections = Partial<Record<MealType, string>>;

function accentForFood(foodType?: FoodType | null): string {
  if (foodType === 'EGG') return '#D97706';
  if (foodType === 'NON_VEG') return '#B45309';
  if (foodType === 'VEG') return colors.primaryDark;
  return '#64748B';
}

function aggregatePollStatus(
  polls: MealPollSlot[],
): { labelKey: string; defaultLabel: string; tone: 'success' | 'warning' | 'neutral' } {
  const open = polls.filter((p) => p.status === 'OPEN');
  if (polls.length === 0 || open.length === 0) {
    return { labelKey: 'meals.poll.statusClosed', defaultLabel: 'Closed', tone: 'neutral' };
  }
  const soon = open.some((p) => {
    if (!p.pollCloseAt) return false;
    const ms = new Date(p.pollCloseAt).getTime() - Date.now();
    return Number.isFinite(ms) && ms > 0 && ms <= 2 * 60 * 60 * 1000;
  });
  if (soon) {
    return {
      labelKey: 'meals.poll.closingSoon',
      defaultLabel: 'Closing soon',
      tone: 'warning',
    };
  }
  return { labelKey: 'meals.poll.pollOpen', defaultLabel: 'Poll open', tone: 'success' };
}

function buildInitialQuantities(poll: MealPollSlot): Record<string, number> {
  const quantities: Record<string, number> = {};
  for (const option of poll.options ?? []) {
    if (option.optionType === 'MENU_ENTRY') quantities[option.id] = 0;
  }
  for (const selection of poll.mySelections ?? []) {
    quantities[selection.optionId] = selection.quantity;
  }
  return quantities;
}

function sumQuantities(quantities: Record<string, number> | undefined): number {
  if (!quantities) return 0;
  return Object.values(quantities).reduce((total, qty) => total + qty, 0);
}

function menuOptions(poll: MealPollSlot): MealPollOption[] {
  return (poll.options ?? []).filter((o) => o.optionType === 'MENU_ENTRY' && !o.isExtra);
}

function extraOptions(poll: MealPollSlot): MealPollOption[] {
  return (poll.options ?? []).filter((o) => o.optionType === 'MENU_ENTRY' && o.isExtra);
}

function MetaChip({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  return (
    <Stack
      direction="row"
      spacing={0.6}
      sx={{
        alignItems: 'center',
        px: 0.9,
        py: 0.4,
        borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
      }}
    >
      <Icon size={14} color={s.textMuted} />
      <Typography sx={{ ...DASHBOARD_UX.badge, color: s.textPrimary }}>{label}</Typography>
    </Stack>
  );
}

function OptionMiniCard({
  option,
  selected,
  disabled,
  showPrice,
  onSelect,
}: {
  option: MealPollOption;
  selected: boolean;
  disabled: boolean;
  showPrice: boolean;
  onSelect: () => void;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const unavailable = option.optionType === 'NOT_AVAILABLE';
  const priceLabel =
    showPrice && option.price != null && !unavailable
      ? formatCurrency(Number(option.price), option.currencyCode || 'INR')
      : null;

  return (
    <Box
      component="button"
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        width: '100%',
        textAlign: 'center',
        p: 0.7,
        minHeight: 0,
        borderRadius: `${DASHBOARD_UX.tileRadius}px`,
        border: `1.5px solid ${selected ? colors.primary : disabled ? s.divider : s.border}`,
        bgcolor: selected ? s.selected : disabled ? s.elevated : s.surface,
        boxShadow: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !selected ? 0.65 : 1,
        transition: DASHBOARD_UX.transition,
        fontFamily: 'inherit',
        color: 'inherit',
        '&:hover': disabled
          ? undefined
          : {
              borderColor: selected ? colors.primary : `${colors.primaryDark}66`,
              bgcolor: selected ? s.selected : s.hover,
            },
        '&:focus-visible': {
          outline: `2px solid ${colors.primaryDark}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', minHeight: 16, mb: 0.15 }}>
        {selected ? (
          <CheckCircle2 size={15} color={colors.primaryDark} />
        ) : (
          <Circle size={15} color={s.textMuted} />
        )}
      </Box>
      <Box
        sx={{
          height: 44,
          borderRadius: 1.25,
          bgcolor: selected ? `${colors.primaryDark}14` : s.elevated,
          color: unavailable ? s.textMuted : selected ? colors.primaryDark : accentForFood(option.foodType),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 0.5,
        }}
      >
        {unavailable ? (
          <CircleSlash size={22} />
        ) : option.foodType === 'EGG' ? (
          <Egg size={22} />
        ) : option.foodType === 'NON_VEG' ? (
          <Drumstick size={22} />
        ) : (
          <Leaf size={22} />
        )}
      </Box>
      <Typography
        sx={{
          ...DASHBOARD_UX.smallCaption,
          fontWeight: 600,
          color: disabled && !selected ? s.textMuted : s.textPrimary,
          lineHeight: 1.25,
        }}
        noWrap
        title={option.label}
      >
        {option.label}
      </Typography>
      {priceLabel ? (
        <Typography sx={{ ...DASHBOARD_UX.badge, color: s.textMuted, mt: 0.1 }} noWrap>
          {priceLabel}
        </Typography>
      ) : null}
    </Box>
  );
}

function PaymentChoiceCard({
  selected,
  icon: Icon,
  title,
  subtitle,
  onSelect,
}: {
  selected: boolean;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onSelect: () => void;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  return (
    <Box
      component="button"
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      sx={{
        width: '100%',
        minWidth: 0,
        textAlign: 'left',
        p: `${DASHBOARD_UX.cardPadding}px`,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${selected ? colors.primary : s.border}`,
        bgcolor: selected ? colors.selected : s.surface,
        boxShadow: selected ? '0 2px 10px rgba(37, 211, 102, 0.16)' : s.shadow,
        cursor: 'pointer',
        transition: DASHBOARD_UX.transition,
        fontFamily: 'inherit',
        color: 'inherit',
        '&:hover': {
          borderColor: `${colors.primaryDark}66`,
          bgcolor: selected ? s.selected : s.hover,
        },
        '&:focus-visible': {
          outline: `2px solid ${colors.primaryDark}`,
          outlineOffset: 2,
        },
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <IconBadge accent={selected ? colors.primaryDark : s.textMuted}>
          <Icon />
        </IconBadge>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>{title}</Typography>
            {selected ? <CheckCircle2 size={18} color={colors.primaryDark} /> : null}
          </Stack>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.35 }}>
            {subtitle}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

/**
 * Customer meal poll response — PG single-select + MESS multi-quantity parity with mobile.
 */
export function MealPollResponsePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const [searchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const permissions = useSpacePermissions(spaceId);
  const dateFromQuery = searchParams.get('date');
  const focusMealParam = searchParams.get('meal');
  const focusMealType = useMemo((): MealType | null => {
    if (
      focusMealParam === 'BREAKFAST' ||
      focusMealParam === 'LUNCH' ||
      focusMealParam === 'DINNER'
    ) {
      return focusMealParam;
    }
    return null;
  }, [focusMealParam]);
  const [menuDate, setMenuDate] = useState(dateFromQuery || todayIsoDate());
  const pollsQuery = useMealPolls(spaceId, menuDate, permissions.canViewMeals);
  const multiQuantity = permissions.space?.spaceType === 'MESS';
  const { minDate, maxDate } = customerMealDateBounds();

  // When opened without ?date=, skip empty today → next planned menu day (mobile SoT).
  useEffect(() => {
    if (dateFromQuery || !spaceId) return;
    let cancelled = false;
    void resolveCustomerMealFocusDate(spaceId).then((date) => {
      if (cancelled) return;
      setMenuDate(date);
      navigate(spaceMealsPollPath(spaceId, date, focusMealType ?? undefined), { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [dateFromQuery, focusMealType, navigate, spaceId]);

  // Keep local date in sync when query changes (day nav / meal deep-links).
  useEffect(() => {
    if (dateFromQuery) setMenuDate(dateFromQuery);
  }, [dateFromQuery]);

  const [selections, setSelections] = useState<Partial<Record<MealType, string>>>({});
  const [quantitySelections, setQuantitySelections] = useState<QuantitySelections>({});
  const [deliverySelections, setDeliverySelections] = useState<DeliverySelections>({});
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState<MealPollPaymentChoice>('PAY_LATER');
  const [paymentTouched, setPaymentTouched] = useState(false);
  const [paymentHighlight, setPaymentHighlight] = useState(false);
  const [paymentProof, setPaymentProof] = useState<PaymentProofSubmission>(EMPTY_PAYMENT_PROOF);
  const [hydratedAt, setHydratedAt] = useState(0);
  const paymentSectionRef = useRef<HTMLDivElement | null>(null);
  const mealSectionRefs = useRef<Partial<Record<MealType, HTMLDivElement | null>>>({});

  useEffect(() => {
    document.title = `${t('meals.poll.respondTitle')} · ${t('common.appName')}`;
  }, [t]);

  // Clamp out-of-range deep links to the same bounds as mobile customer meal browsing.
  useEffect(() => {
    if (menuDate < minDate) {
      navigate(spaceMealsPollPath(spaceId, minDate), { replace: true });
      return;
    }
    if (menuDate > maxDate) {
      navigate(spaceMealsPollPath(spaceId, maxDate), { replace: true });
    }
  }, [maxDate, menuDate, minDate, navigate, spaceId]);

  // Reset local draft when changing days (mobile remounts poll state per date).
  useEffect(() => {
    setTouched(false);
    setHydratedAt(0);
    setPaymentProof(EMPTY_PAYMENT_PROOF);
    setPaymentTouched(false);
    setPaymentHighlight(false);
  }, [menuDate]);

  const goToDate = (next: string) => {
    if (next < minDate || next > maxDate || next === menuDate) return;
    navigate(spaceMealsPollPath(spaceId, next));
  };

  const shiftDate = (delta: number) => {
    if (!canShiftCustomerMealDate(menuDate, delta)) return;
    goToDate(addDaysIso(menuDate, delta));
  };

  const polls = useMemo(() => {
    const list = pollsQuery.pollDay?.polls ?? [];
    return [...list].sort(
      (a, b) => MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType),
    );
  }, [pollsQuery.pollDay?.polls]);

  const openPolls = useMemo(() => polls.filter((p) => p.status === 'OPEN'), [polls]);
  const deliveryLocations: MealDeliveryLocation[] =
    pollsQuery.pollDay?.deliveryLocations ?? [];
  const lastDeliveryLocations = pollsQuery.pollDay?.myLastDeliveryLocationIds ?? {};
  const requiresDeliveryLocation = multiQuantity && deliveryLocations.length > 0;
  const mealEditsLocked = pollsQuery.pollDay?.myPaymentStatus === 'PENDING_APPROVAL';
  const dateReadOnly = isPastMenuDate(menuDate);
  const pollsClosedOnly =
    !pollsQuery.loading && openPolls.length === 0 && polls.length > 0;
  const viewOnly = dateReadOnly || mealEditsLocked || pollsClosedOnly;

  // Deep-link ?meal= scrolls that band into view (all meals stay expanded).
  useEffect(() => {
    if (!focusMealType || polls.length === 0) return;
    const el = mealSectionRefs.current[focusMealType];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusMealType, polls.length]);

  useEffect(() => {
    const choice = pollsQuery.pollDay?.myPaymentChoice;
    if (choice === 'MARK_AS_PAID' || choice === 'PAY_LATER') {
      setPaymentChoice(choice);
    }
  }, [pollsQuery.pollDay?.myPaymentChoice]);

  // Hydrate single / quantity / delivery from API when poll day loads (unless editing).
  useEffect(() => {
    if (!pollsQuery.dataUpdatedAt || pollsQuery.dataUpdatedAt === hydratedAt) return;
    if (touched) {
      setHydratedAt(pollsQuery.dataUpdatedAt);
      return;
    }

    const nextSingle: Partial<Record<MealType, string>> = {};
    const nextQty: QuantitySelections = {};
    const nextDelivery: DeliverySelections = {};
    const catalog = pollsQuery.pollDay?.deliveryLocations ?? [];
    const lastUsed = pollsQuery.pollDay?.myLastDeliveryLocationIds ?? {};

    for (const poll of polls) {
      if (poll.mySelectedOptionId) nextSingle[poll.mealType] = poll.mySelectedOptionId;
      if (multiQuantity || poll.multiQuantityEnabled) {
        const qty = buildInitialQuantities(poll);
        nextQty[poll.mealType] = qty;
        const plates = sumQuantities(qty);
        if (plates > 0 && catalog.length > 0) {
          const preferred =
            poll.myDeliveryLocationId &&
            catalog.some((location) => location.id === poll.myDeliveryLocationId)
              ? poll.myDeliveryLocationId
              : resolvePreferredDeliveryLocationId(catalog, lastUsed[poll.mealType]);
          if (preferred) nextDelivery[poll.mealType] = preferred;
        }
      }
    }

    setSelections(nextSingle);
    setQuantitySelections(nextQty);
    setDeliverySelections(nextDelivery);
    setHydratedAt(pollsQuery.dataUpdatedAt);
  }, [
    hydratedAt,
    multiQuantity,
    polls,
    pollsQuery.dataUpdatedAt,
    pollsQuery.pollDay?.deliveryLocations,
    pollsQuery.pollDay?.myLastDeliveryLocationIds,
    touched,
  ]);

  const isPayPerMeal = pollsQuery.pollDay?.myMealBillingType !== 'PREPAID_BALANCE';
  const pricesVisible = showMealPrices({ spaceType: permissions.space?.spaceType });

  const effectiveSelections = useMemo(() => {
    if (touched) return selections;
    const next: Partial<Record<MealType, string>> = {};
    for (const poll of polls) {
      if (poll.mySelectedOptionId) next[poll.mealType] = poll.mySelectedOptionId;
    }
    return { ...next, ...selections };
  }, [polls, selections, touched]);

  const mealProgress = useMemo(() => {
    return polls.map((poll) => {
      if (multiQuantity) {
        const items = (poll.options ?? [])
          .map((o) => {
            const qty = quantitySelections[poll.mealType]?.[o.id] ?? 0;
            if (qty <= 0 || o.optionType !== 'MENU_ENTRY') return null;
            const unit = o.price != null ? Number(o.price) : null;
            return {
              optionId: o.id,
              label: o.label,
              quantity: qty,
              unitPrice: unit,
              lineAmount: unit != null ? unit * qty : null,
              currencyCode: o.currencyCode || 'INR',
              isExtra: o.isExtra === true,
            };
          })
          .filter((row): row is NonNullable<typeof row> => Boolean(row));
        const plates = items.reduce((sum, item) => sum + item.quantity, 0);
        const mealTotal = items.reduce((sum, item) => sum + (item.lineAmount ?? 0), 0);
        const currencyCode = items[0]?.currencyCode || 'INR';
        const selected = plates > 0;
        const pending = poll.status === 'OPEN' && !selected;
        const labels = items.map((item) =>
          item.quantity > 1 ? `${item.label} ×${item.quantity}` : item.label,
        );
        return {
          mealType: poll.mealType,
          selected,
          pending,
          closed: poll.status !== 'OPEN' && !selected,
          summary: selected ? labels.join(', ') : '',
          plates,
          items,
          mealTotal,
          currencyCode,
        };
      }
      const id = effectiveSelections[poll.mealType];
      const option = (poll.options ?? []).find((o) => o.id === id);
      const selected = Boolean(option);
      const pending = poll.status === 'OPEN' && !selected;
      const plates = platesForSingleSelectOption(option);
      const unit =
        option && plates > 0 && option.price != null
          ? Number(option.price)
          : null;
      const items =
        selected && option
          ? [
              {
                optionId: option.id,
                label: option.label,
                quantity: plates,
                unitPrice: unit,
                lineAmount: unit,
                currencyCode: option.currencyCode || 'INR',
                isExtra: option.isExtra === true,
              },
            ]
          : [];
      return {
        mealType: poll.mealType,
        selected,
        pending,
        closed: poll.status !== 'OPEN' && !selected,
        summary: option?.label ?? '',
        plates,
        items,
        mealTotal: unit ?? 0,
        currencyCode: option?.currencyCode || 'INR',
      };
    });
  }, [effectiveSelections, multiQuantity, polls, quantitySelections]);

  const totalPlates = useMemo(
    () => mealProgress.reduce((sum, row) => sum + row.plates, 0),
    [mealProgress],
  );
  const mealsWithPlates = useMemo(
    () => mealProgress.filter((row) => row.plates > 0).map((row) => row.mealType),
    [mealProgress],
  );

  // Match mobile `requiresPayment`: meal payment UI is MESS + pay-per-meal only.
  // PG / Hostel / etc. are headcount polls — no Review & payment step.
  const showPayment =
    multiQuantity &&
    isPayPerMeal &&
    Boolean(pollsQuery.pollDay) &&
    (totalPlates > 0 || Boolean(pollsQuery.pollDay?.myPaymentStatus));

  const mealsSelectedCount = mealProgress.filter((row) => row.selected).length;
  const allOpenSelected =
    openPolls.length > 0 &&
    openPolls.every((poll) =>
      multiQuantity
        ? true
        : Boolean(effectiveSelections[poll.mealType]),
    );
  const canSubmit =
    !submitting &&
    !viewOnly &&
    openPolls.length > 0 &&
    (multiQuantity || allOpenSelected);

  const needsPaymentStep =
    Boolean(showPayment) &&
    !paymentTouched &&
    !viewOnly &&
    (multiQuantity ? totalPlates > 0 : mealsSelectedCount > 0);

  const focusPaymentSection = () => {
    paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setPaymentHighlight(true);
    window.setTimeout(() => setPaymentHighlight(false), 2200);
  };

  const earliestCloseAt = useMemo(() => earliestOpenPollCloseAt(openPolls), [openPolls]);
  const closeTimezone = useMemo(
    () => timezoneForPollClose(openPolls, earliestCloseAt),
    [earliestCloseAt, openPolls],
  );

  const pollStatus = aggregatePollStatus(polls);
  const responseCount = useMemo(
    () => Math.max(0, ...polls.map((p) => p.responseCount ?? 0), 0),
    [polls],
  );
  const countdown = formatPollClosesIn(earliestCloseAt, t, Date.now(), closeTimezone);
  const remaining = formatPollRemaining(earliestCloseAt, t, Date.now(), closeTimezone);
  const deadlineLabel = earliestCloseAt
    ? formatPollDeadline(earliestCloseAt, i18n.language, closeTimezone)
    : null;
  const dateLabel = formatMenuDateLabel(menuDate, i18n.language);

  const totalAmount = useMemo(() => {
    let sum = 0;
    let currency = 'INR';
    if (multiQuantity) {
      for (const poll of polls) {
        for (const option of poll.options ?? []) {
          if (option.optionType !== 'MENU_ENTRY') continue;
          const qty = quantitySelections[poll.mealType]?.[option.id] ?? 0;
          if (qty <= 0 || option.price == null) continue;
          sum += Number(option.price) * qty;
          currency = option.currencyCode || currency;
        }
      }
      return { sum, currency };
    }
    for (const poll of polls) {
      const optionId = effectiveSelections[poll.mealType];
      if (!optionId) continue;
      const option = (poll.options ?? []).find((o) => o.id === optionId);
      if (!option || option.optionType === 'NOT_AVAILABLE' || option.price == null) continue;
      sum += Number(option.price);
      currency = option.currencyCode || currency;
    }
    return { sum, currency };
  }, [effectiveSelections, multiQuantity, polls, quantitySelections]);

  const selectOption = (mealType: MealType, optionId: string, isOpen: boolean) => {
    if (!isOpen || viewOnly) return;
    setTouched(true);
    setSelections((prev) => ({ ...prev, [mealType]: optionId }));
  };

  const changeQuantity = (mealType: MealType, optionId: string, quantity: number, isOpen: boolean) => {
    if (!isOpen || viewOnly) return;
    setTouched(true);
    setQuantitySelections((prev) => {
      const nextMeal = { ...(prev[mealType] ?? {}), [optionId]: Math.max(0, quantity) };
      const mealTotal = sumQuantities(nextMeal);
      if (mealTotal > 0) {
        setDeliverySelections((deliveryPrev) => {
          if (deliveryPrev[mealType]) return deliveryPrev;
          const preferred = resolvePreferredDeliveryLocationId(
            deliveryLocations,
            lastDeliveryLocations[mealType],
          );
          return preferred ? { ...deliveryPrev, [mealType]: preferred } : deliveryPrev;
        });
      } else {
        setDeliverySelections((deliveryPrev) => {
          if (!deliveryPrev[mealType]) return deliveryPrev;
          const next = { ...deliveryPrev };
          delete next[mealType];
          return next;
        });
      }
      return { ...prev, [mealType]: nextMeal };
    });
  };

  const handleSubmit = async () => {
    if (viewOnly) {
      if (mealEditsLocked) {
        enqueueSnackbar(
          t('meals.poll.paymentUnderReviewLock', {
            defaultValue: 'Payment is under review. Choices are locked until approval.',
          }),
          { variant: 'warning' },
        );
      }
      return;
    }

    if (multiQuantity) {
      if (requiresDeliveryLocation && mealsWithPlates.length > 0) {
        const missing = mealsWithPlates.some((mealType) => !deliverySelections[mealType]);
        if (missing) {
          enqueueSnackbar(
            t('meals.poll.selectDeliveryLocation', {
              defaultValue: 'Select a delivery location for each meal with plates.',
            }),
            { variant: 'warning' },
          );
          return;
        }
      }
    } else if (!allOpenSelected) {
      enqueueSnackbar(t('meals.poll.selectRequired'), { variant: 'warning' });
      return;
    }

    let payload: SubmitMealPollSelection[] = [];
    if (multiQuantity) {
      payload = openPolls.map((poll) => ({
        mealType: poll.mealType,
        options: (poll.options ?? [])
          .filter((option) => option.optionType === 'MENU_ENTRY')
          .map((option) => ({
            optionId: option.id,
            quantity: quantitySelections[poll.mealType]?.[option.id] ?? 0,
          })),
        ...(sumQuantities(quantitySelections[poll.mealType]) > 0 &&
        deliverySelections[poll.mealType]
          ? { deliveryLocationId: deliverySelections[poll.mealType] }
          : {}),
      }));
    } else {
      for (const poll of openPolls) {
        const optionId = effectiveSelections[poll.mealType];
        if (!optionId) continue;
        payload.push({ mealType: poll.mealType, selectedOptionId: optionId });
      }
    }

    const paymentNeeded = Boolean(showPayment) && totalPlates > 0;
    if (paymentNeeded && paymentChoice === 'MARK_AS_PAID') {
      const validationError = validatePaymentProofSubmission(paymentProof);
      if (validationError) {
        enqueueSnackbar(t(`paymentCollection.proof.${validationError}`), { variant: 'warning' });
        return;
      }
    }

    setSubmitting(true);
    try {
      const proofBody =
        paymentNeeded && paymentChoice === 'MARK_AS_PAID'
          ? toSubmitPaymentProofBody(paymentProof)
          : undefined;
      await mealsApi.submitMealPollResponses(
        spaceId,
        menuDate,
        payload,
        paymentNeeded ? paymentChoice : undefined,
        proofBody,
      );
      enqueueSnackbar(t('meals.poll.submitSuccess'), { variant: 'success' });
      setTouched(false);
      void pollsQuery.reload();
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const footer = polls.length > 0 ? (
    <StickyFooter pin="fixed">
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack
          direction="row"
          spacing={1.25}
          useFlexGap
          sx={{ minWidth: 0, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}
        >
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, whiteSpace: 'nowrap' }}>
            {t('meals.poll.mealsSelectedLabel', {
              defaultValue: '{{count}} meals selected',
              count: mealsSelectedCount,
            })}
          </Typography>
          {mealProgress
            .filter((row) => row.selected && row.items.length > 0)
            .map((row) => {
            const MealIcon = MEAL_ICONS[row.mealType];
            const accent = MEAL_ACCENTS[row.mealType];
            const ordered = [
              ...row.items.filter((item) => !item.isExtra),
              ...row.items.filter((item) => item.isExtra),
            ];
            const itemLine = ordered
              .map((item) =>
                item.quantity > 1 ? `${item.label} ×${item.quantity}` : item.label,
              )
              .join(', ');
            return (
              <Stack
                key={row.mealType}
                direction="row"
                spacing={0.5}
                sx={{
                  alignItems: 'center',
                  maxWidth: 180,
                  px: 0.75,
                  py: 0.35,
                  borderRadius: 1.5,
                  border: `1px solid ${s.border}`,
                  bgcolor: s.surface,
                }}
              >
                <Box sx={{ color: accent, display: 'flex' }}>
                  <MealIcon size={12} />
                </Box>
                <Typography
                  sx={{ ...DASHBOARD_UX.smallCaption, color: s.textPrimary, fontWeight: 600 }}
                  noWrap
                  title={itemLine || t(`meals.mealType.${row.mealType}`)}
                >
                  {itemLine || t(`meals.mealType.${row.mealType}`)}
                </Typography>
              </Stack>
            );
          })}
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ alignItems: 'center', flexWrap: 'wrap', justifyContent: { xs: 'stretch', md: 'flex-end' } }}
        >
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {pricesVisible && totalAmount.sum > 0
              ? `${t('meals.poll.totalLabel', { defaultValue: 'Total' })} ${formatCurrency(totalAmount.sum, totalAmount.currency)}`
              : t('meals.poll.totalPlatesShort', {
                  defaultValue: 'Total {{count}} plates',
                  count: totalPlates,
                })}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate(spaceMealsPath(spaceId))}
            sx={dashOutlinedButtonSx}
          >
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            variant="contained"
            disabled={needsPaymentStep ? false : !canSubmit}
            endIcon={<ArrowRight size={14} />}
            onClick={() => {
              if (needsPaymentStep) {
                focusPaymentSection();
                return;
              }
              void handleSubmit();
            }}
            sx={dashContainedButtonSx}
          >
            {submitting
              ? t('common.pleaseWait')
              : needsPaymentStep
                ? t('meals.poll.selectPaymentMode', {
                    defaultValue: 'Select payment mode',
                  })
                : t('meals.poll.submit', { defaultValue: 'Save choices' })}
          </Button>
        </Stack>
      </Box>
    </StickyFooter>
  ) : null;

  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: `${DASHBOARD_UX.pagePadding}px`,
        width: '100%',
        boxSizing: 'border-box',
        bgcolor: s.pageBg,
        minHeight: '100%',
      }}
    >
      <Stack spacing={1} sx={{ width: '100%' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          useFlexGap
          sx={{ flexWrap: 'wrap', alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
        >
          <PeriodDayNav
            date={menuDate}
            onPrevious={() => shiftDate(-1)}
            onNext={() => shiftDate(1)}
            disablePrevious={!canShiftCustomerMealDate(menuDate, -1)}
            disableNext={!canShiftCustomerMealDate(menuDate, 1)}
            onDateSelect={goToDate}
            minDate={minDate}
            maxDate={maxDate}
            label={dateLabel}
          />
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ flexWrap: 'wrap', alignItems: 'center' }}
          >
            <StatusChip
              label={
                pollStatus.labelKey === 'meals.poll.pollOpen'
                  ? t('meals.poll.pollOpenShort', { defaultValue: 'Poll open' })
                  : pollStatus.labelKey === 'meals.poll.closingSoon'
                    ? t('meals.poll.closingSoon', { defaultValue: 'Closing soon' })
                    : t('meals.poll.statusClosed', { defaultValue: 'Closed' })
              }
              tone={pollStatus.tone}
            />
            <MetaChip
              icon={UtensilsCrossed}
              label={t('meals.poll.respondedCount', {
                defaultValue: '{{count}} responded',
                count: responseCount,
              })}
            />
            {countdown && openPolls.length > 0 ? (
              <MetaChip icon={Clock3} label={countdown} />
            ) : null}
            {viewOnly ? (
              <StatusChip
                label={
                  mealEditsLocked
                    ? t('meals.poll.paymentStatusPendingApproval', {
                        defaultValue: 'Under review',
                      })
                    : dateReadOnly
                      ? t('meals.poll.viewOnlyPast', { defaultValue: 'Past day · view only' })
                      : t('meals.poll.viewOnlyClosed', { defaultValue: 'Polls closed · view only' })
                }
                tone={mealEditsLocked ? 'warning' : 'neutral'}
              />
            ) : null}
          </Stack>
        </Stack>

        <Box>
          <Typography component="h1" sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
            {t('meals.poll.chooseTitle', { defaultValue: 'Choose your meals for this day' })}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textSecondary, mt: 0.25 }}>
            {multiQuantity
              ? t('meals.poll.responseHintMess', {
                  defaultValue:
                    'Choose items and set quantities for each meal. Your selections help the kitchen prepare better.',
                })
              : t('meals.poll.chooseSubtitle', {
                  defaultValue:
                    'Select one option for each meal. You can change your selection until the poll closes.',
                })}
          </Typography>
        </Box>

        {mealEditsLocked ? (
          <ContentCard>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
              {t('meals.poll.paymentUnderReviewLock', {
                defaultValue: 'Payment is under review. Choices are locked until approval.',
              })}
            </Typography>
          </ContentCard>
        ) : null}

        {pollsQuery.loading && polls.length === 0 ? (
          <LoadingState />
        ) : polls.length === 0 ? (
          <ContentCard>
            <EmptyState
              icon={
                <IconBadge accent={colors.primaryDark}>
                  <UtensilsCrossed />
                </IconBadge>
              }
              title={t('meals.poll.emptyTitle', {
                defaultValue: 'No meal polls available',
              })}
              description={t('meals.poll.emptyBody', {
                defaultValue: "Today's menu has not been published yet.",
              })}
              action={
                <Button
                  variant="outlined"
                  startIcon={<RefreshCw size={14} />}
                  onClick={() => void pollsQuery.reload()}
                  sx={dashOutlinedButtonSx}
                >
                  {t('common.refresh', { defaultValue: 'Refresh' })}
                </Button>
              }
            />
          </ContentCard>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 1,
              width: '100%',
              alignItems: 'start',
              gridTemplateColumns: {
                xs: '1fr',
                lg: 'minmax(0, 1fr) minmax(0, 340px)',
              },
            }}
          >
            <Stack spacing={1} sx={{ minWidth: 0 }}>
              {polls.map((poll) => {
                const MealIcon = MEAL_ICONS[poll.mealType];
                const accent = MEAL_ACCENTS[poll.mealType];
                const isOpen = poll.status === 'OPEN' && !viewOnly;
                const selectedId = effectiveSelections[poll.mealType];
                const mains = menuOptions(poll);
                const extras = extraOptions(poll);
                const plates = sumQuantities(quantitySelections[poll.mealType]);
                const optionCount = multiQuantity
                  ? mains.length + extras.length
                  : (poll.options ?? []).length;
                const progressRow = mealProgress.find((row) => row.mealType === poll.mealType);
                const mealTotal = progressRow?.mealTotal ?? 0;
                const mealCurrency = progressRow?.currencyCode ?? 'INR';
                const selectHint = multiQuantity
                  ? t('meals.poll.selectItemsHint', { defaultValue: 'Select items' })
                  : t('meals.poll.selectOneOption', { defaultValue: 'Select 1 option' });
                const optionLabel = t('meals.poll.optionCount', {
                  defaultValue: '{{count}} options',
                  count: optionCount,
                });
                const headerMeta = [
                  selectHint,
                  optionLabel,
                  multiQuantity && plates > 0
                    ? t('meals.poll.platesCount', {
                        defaultValue: '{{count}} plates',
                        count: plates,
                      })
                    : null,
                  pricesVisible && mealTotal > 0
                    ? formatCurrency(mealTotal, mealCurrency)
                    : null,
                  poll.status === 'CLOSED'
                    ? t('meals.poll.statusClosed', { defaultValue: 'Closed' })
                    : null,
                ]
                  .filter(Boolean)
                  .join(' • ');

                return (
                  <Box
                    key={poll.id}
                    ref={(el: HTMLDivElement | null) => {
                      mealSectionRefs.current[poll.mealType] = el;
                    }}
                    sx={{
                      borderRadius: `${DASHBOARD_UX.radius}px`,
                      border: `1px solid ${s.border}`,
                      bgcolor:
                        theme.palette.mode === 'dark'
                          ? MEAL_BAND_BG_DARK[poll.mealType]
                          : MEAL_BAND_BG[poll.mealType],
                      overflow: 'hidden',
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={0.75}
                      sx={{
                        alignItems: 'center',
                        px: 1.1,
                        py: 0.7,
                        minHeight: 36,
                      }}
                    >
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 1,
                          bgcolor: `${accent}22`,
                          color: accent,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <MealIcon size={14} />
                      </Box>
                      <Typography
                        sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, whiteSpace: 'nowrap' }}
                      >
                        {t(`meals.mealType.${poll.mealType}`)}
                      </Typography>
                      <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                        |
                      </Typography>
                      <Typography
                        sx={{ ...DASHBOARD_UX.smallCaption, color: s.textSecondary, minWidth: 0 }}
                        noWrap
                        title={headerMeta}
                      >
                        {headerMeta}
                      </Typography>
                    </Stack>

                    <Box sx={{ px: 1.1, pb: 1 }}>
                        {multiQuantity ? (
                          <Stack spacing={1}>
                            {requiresDeliveryLocation ? (
                              <MealPollDeliveryPicker
                                locations={deliveryLocations}
                                selectedId={deliverySelections[poll.mealType]}
                                lastUsedLocationId={lastDeliveryLocations[poll.mealType]}
                                disabled={!isOpen}
                                onSelect={(locationId) => {
                                  setTouched(true);
                                  setDeliverySelections((prev) => ({
                                    ...prev,
                                    [poll.mealType]: locationId,
                                  }));
                                }}
                              />
                            ) : null}

                            <Box>
                              <Typography
                                sx={{
                                  ...DASHBOARD_UX.smallCaption,
                                  color: s.textPrimary,
                                  fontWeight: 700,
                                  mb: 0.7,
                                }}
                              >
                                {t('meals.poll.mainItemsSection', {
                                  defaultValue: 'Main items (Choose one or more)',
                                })}
                              </Typography>
                              <Box
                                sx={{
                                  display: 'grid',
                                  gap: 0.85,
                                  gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(2, minmax(0, 1fr))',
                                    lg: 'repeat(3, minmax(0, 1fr))',
                                  },
                                }}
                              >
                                {mains.map((option) => (
                                  <MealPollQuantityRow
                                    key={option.id}
                                    option={option}
                                    quantity={quantitySelections[poll.mealType]?.[option.id] ?? 0}
                                    disabled={!isOpen}
                                    showPrice={pricesVisible}
                                    onChange={(qty) =>
                                      changeQuantity(poll.mealType, option.id, qty, isOpen)
                                    }
                                  />
                                ))}
                              </Box>
                            </Box>

                            {extras.length > 0 ? (
                              <Box
                                sx={{
                                  p: 1,
                                  borderRadius: 1.5,
                                  border: `1px solid ${colors.primaryDark}33`,
                                  bgcolor: colors.successTint,
                                }}
                              >
                                <Stack
                                  direction="row"
                                  spacing={0.75}
                                  sx={{ alignItems: 'center', mb: 0.75 }}
                                >
                                  <Sparkles size={14} color={colors.primaryDark} />
                                  <Typography
                                    sx={{
                                      ...DASHBOARD_UX.smallCaption,
                                      color: colors.primaryDark,
                                      fontWeight: 700,
                                      flex: 1,
                                    }}
                                  >
                                    {t('meals.poll.extrasSectionOptional', {
                                      defaultValue: 'Extras (Optional)',
                                    })}
                                  </Typography>
                                </Stack>
                                <Box
                                  sx={{
                                    display: 'grid',
                                    gap: 0.85,
                                    gridTemplateColumns: {
                                      xs: '1fr',
                                      sm: 'repeat(2, minmax(0, 1fr))',
                                      lg: 'repeat(3, minmax(0, 1fr))',
                                    },
                                  }}
                                >
                                  {extras.map((option) => (
                                    <MealPollQuantityRow
                                      key={option.id}
                                      option={option}
                                      quantity={
                                        quantitySelections[poll.mealType]?.[option.id] ?? 0
                                      }
                                      disabled={!isOpen}
                                      showPrice={pricesVisible}
                                      variant="extra"
                                      onChange={(qty) =>
                                        changeQuantity(poll.mealType, option.id, qty, isOpen)
                                      }
                                    />
                                  ))}
                                </Box>
                              </Box>
                            ) : null}
                          </Stack>
                        ) : (
                          <Box
                            sx={{
                              display: 'grid',
                              gap: 0.85,
                              gridTemplateColumns: {
                                xs: 'repeat(2, minmax(0, 1fr))',
                                sm: 'repeat(3, minmax(0, 1fr))',
                                md: 'repeat(4, minmax(0, 1fr))',
                              },
                            }}
                          >
                            {(poll.options ?? []).map((option) => (
                              <OptionMiniCard
                                key={option.id}
                                option={option}
                                selected={selectedId === option.id}
                                disabled={!isOpen}
                                showPrice={pricesVisible}
                                onSelect={() => selectOption(poll.mealType, option.id, isOpen)}
                              />
                            ))}
                          </Box>
                        )}
                    </Box>
                  </Box>
                );
              })}
            </Stack>

            <Stack
              spacing={1}
              sx={{
                minWidth: 0,
                alignSelf: 'start',
              }}
            >
              <ContentCard>
                <Stack
                  direction="row"
                  sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}
                >
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                    <Receipt size={16} color={colors.primaryDark} />
                    <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
                      {t('meals.poll.yourSelections', { defaultValue: 'Your selections' })}
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      px: 1,
                      py: 0.35,
                      borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                      bgcolor: s.elevated,
                      border: `1px solid ${s.border}`,
                    }}
                  >
                    <Typography sx={{ ...DASHBOARD_UX.badge, color: s.textPrimary }}>
                      {multiQuantity
                        ? t('meals.poll.platesCount', {
                            defaultValue: '{{count}} plates',
                            count: totalPlates,
                          })
                        : t('meals.poll.mealsSelectedCount', {
                            defaultValue: '{{count}} meals',
                            count: mealsSelectedCount,
                          })}
                    </Typography>
                  </Box>
                </Stack>
                <Stack spacing={0.75}>
                  {mealProgress.map((row) => {
                    const MealIcon = MEAL_ICONS[row.mealType];
                    const accent = MEAL_ACCENTS[row.mealType];
                    const mainItems = row.items.filter((item) => !item.isExtra);
                    const extraItems = row.items.filter((item) => item.isExtra);
                    const formatItem = (item: (typeof row.items)[number]) =>
                      item.quantity > 1 ? `${item.label} ×${item.quantity}` : item.label;
                    return (
                      <Stack key={row.mealType} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                        <IconBadge accent={accent}>
                          <MealIcon />
                        </IconBadge>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary, fontWeight: 600 }}>
                            {t(`meals.mealType.${row.mealType}`)}
                          </Typography>
                          {row.selected && row.items.length > 0 ? (
                            <Stack spacing={0.4} sx={{ mt: 0.35 }}>
                              {mainItems.length > 0 ? (
                                <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                                  {mainItems.map(formatItem).join(', ')}
                                </Typography>
                              ) : null}
                              {extraItems.length > 0 ? (
                                <Box sx={{ pt: 0.2 }}>
                                  <Typography
                                    sx={{
                                      ...DASHBOARD_UX.badge,
                                      color: colors.primaryDark,
                                      fontWeight: 700,
                                      mb: 0.15,
                                    }}
                                  >
                                    {t('meals.poll.extrasSection', { defaultValue: 'Extras' })}
                                  </Typography>
                                  <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                                    {extraItems.map(formatItem).join(', ')}
                                  </Typography>
                                </Box>
                              ) : null}
                            </Stack>
                          ) : (
                            <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                              {row.pending
                                ? multiQuantity
                                  ? t('meals.poll.skipShort', { defaultValue: 'Skip' })
                                  : t('meals.poll.pendingShort', { defaultValue: 'Pending' })
                                : t('meals.poll.statusClosed', { defaultValue: 'Closed' })}
                            </Typography>
                          )}
                        </Box>
                        <Stack spacing={0.15} sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
                          {row.plates > 0 ? (
                            <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                              {t('meals.poll.platesCount', {
                                defaultValue: '{{count}} plates',
                                count: row.plates,
                              })}
                            </Typography>
                          ) : null}
                          {pricesVisible && row.mealTotal > 0 ? (
                            <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textPrimary, fontWeight: 600 }}>
                              {formatCurrency(row.mealTotal, row.currencyCode)}
                            </Typography>
                          ) : null}
                        </Stack>
                      </Stack>
                    );
                  })}
                </Stack>
                {pricesVisible && totalAmount.sum > 0 ? (
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 1.25,
                      pt: 1.25,
                      borderTop: `1px solid ${s.divider}`,
                    }}
                  >
                    <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                      {t('meals.poll.totalAmount', { defaultValue: 'Total amount' })}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                      {formatCurrency(totalAmount.sum, totalAmount.currency)}
                    </Typography>
                  </Stack>
                ) : null}
              </ContentCard>

              {showPayment ? (
                <Box
                  ref={paymentSectionRef}
                  sx={
                    paymentHighlight
                      ? {
                          borderRadius: `${DASHBOARD_UX.radius}px`,
                          outline: `2px solid ${colors.primary}`,
                          outlineOffset: 2,
                          boxShadow: `0 0 0 4px ${colors.primary}22`,
                          transition: DASHBOARD_UX.transition,
                        }
                      : undefined
                  }
                >
                <ContentCard>
                  <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary, mb: 0.35 }}>
                    {t('meals.poll.reviewPayment', { defaultValue: 'Review & payment' })}
                  </Typography>
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 1.25 }}>
                    {needsPaymentStep
                      ? t('meals.poll.selectPaymentHint', {
                          defaultValue:
                            'Meals selected — choose a payment mode to continue, then save.',
                        })
                      : t('meals.poll.paymentChoiceSubtitle', {
                          defaultValue: 'Choose how you want to proceed',
                        })}
                  </Typography>
                  {pollsQuery.pollDay?.myPaymentStatus ? (
                    <Box sx={{ mb: 1.25 }}>
                      <StatusChip
                        label={String(pollsQuery.pollDay.myPaymentStatus).replace(/_/g, ' ')}
                        tone={
                          pollsQuery.pollDay.myPaymentStatus === 'PAID'
                            ? 'success'
                            : pollsQuery.pollDay.myPaymentStatus === 'REJECTED'
                              ? 'error'
                              : 'warning'
                        }
                      />
                    </Box>
                  ) : null}
                  <Stack spacing={1.25} sx={{ alignItems: 'stretch' }}>
                    <PaymentChoiceCard
                      selected={paymentChoice === 'PAY_LATER'}
                      icon={Wallet}
                      title={t('meals.poll.payLater', { defaultValue: 'Pay later' })}
                      subtitle={t('meals.poll.payLaterHint', {
                        defaultValue: 'Pay during billing',
                      })}
                      onSelect={() => {
                        setPaymentTouched(true);
                        setPaymentChoice('PAY_LATER');
                      }}
                    />
                    <PaymentChoiceCard
                      selected={paymentChoice === 'MARK_AS_PAID'}
                      icon={CreditCard}
                      title={t('meals.poll.markAsPaid', { defaultValue: 'Mark as paid' })}
                      subtitle={t('meals.poll.markAsPaidHint', {
                        defaultValue: 'Already paid today',
                      })}
                      onSelect={() => {
                        setPaymentTouched(true);
                        setPaymentChoice('MARK_AS_PAID');
                      }}
                    />
                  </Stack>
                  {pricesVisible && totalAmount.sum > 0 ? (
                    <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 1.25 }}>
                      {t('meals.poll.estimatedTotal', {
                        defaultValue: 'Estimated total {{amount}}',
                        amount: formatCurrency(totalAmount.sum, totalAmount.currency),
                      })}
                      {' · '}
                      {totalPlates > 0
                        ? t('meals.poll.platesCount', {
                            defaultValue: '{{count}} plates',
                            count: totalPlates,
                          })
                        : null}
                      {totalPlates > 0 && mealsSelectedCount > 0 ? ' · ' : null}
                      {mealsSelectedCount > 0
                        ? t('meals.poll.mealsSelectedCount', {
                            defaultValue: '{{count}} meals',
                            count: mealsSelectedCount,
                          })
                        : null}
                    </Typography>
                  ) : null}
                  {paymentChoice === 'MARK_AS_PAID' ? (
                    <Box sx={{ mt: 1.25 }}>
                      <UniversalPaymentProofForm
                        value={paymentProof}
                        onChange={setPaymentProof}
                        disabled={submitting}
                        showHint
                      />
                    </Box>
                  ) : null}
                </ContentCard>
                </Box>
              ) : null}

              <Box
                sx={{
                  borderRadius: 2,
                  border: `1px solid #BFDBFE`,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.12)' : '#EFF6FF',
                  boxShadow: 'none',
                  p: 1.1,
                }}
              >
                <Stack direction="row" spacing={0.85} sx={{ alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.22)' : '#DBEAFE',
                      color: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Info size={13} />
                  </Box>
                  <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textSecondary }}>
                    {t('meals.poll.changeUntilClose', {
                      defaultValue:
                        'You can change your response until the poll closes. Once submitted, it cannot be changed.',
                    })}
                  </Typography>
                </Stack>
              </Box>

              {remaining && openPolls.length > 0 ? (
                <ContentCard>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mb: 0.35 }}>
                    <Clock3 size={14} color={colors.primaryDark} />
                    <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textSecondary }}>
                      {t('meals.poll.pollClosesIn', { defaultValue: 'Poll closes in' })}
                    </Typography>
                  </Stack>
                  <Typography sx={{ ...DASHBOARD_UX.largeNumber, color: colors.primaryDark }}>
                    {remaining}
                  </Typography>
                  {deadlineLabel ? (
                    <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted, mt: 0.25 }}>
                      {deadlineLabel}
                    </Typography>
                  ) : null}
                </ContentCard>
              ) : null}
            </Stack>
          </Box>
        )}
      </Stack>

      {polls.length > 0 ? (
        <StickyFooterClearance height={{ xs: 148, sm: 96, md: 80 }} />
      ) : null}
      {footer}
    </Box>
  );
}
