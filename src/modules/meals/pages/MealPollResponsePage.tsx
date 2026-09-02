import {
  Box,
  Button,
  Collapse,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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
import { PageHeader } from '@/shared/components/PageHeader';
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
import { showMealPrices } from '../utils/mealPricingPolicy';

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

/** Soft header tints so Breakfast / Lunch / Dinner accordions are easy to tell apart. */
const MEAL_HEADER_BG: Record<MealType, string> = {
  BREAKFAST: '#FFF7ED',
  LUNCH: '#EAF7F0',
  DINNER: '#F5F3FF',
};

const MEAL_HEADER_BG_EXPANDED: Record<MealType, string> = {
  BREAKFAST: '#FFEDD5',
  LUNCH: '#DCF5E8',
  DINNER: '#EDE9FE',
};

type QuantitySelections = Partial<Record<MealType, Record<string, number>>>;
type DeliverySelections = Partial<Record<MealType, string>>;

function foodTypeIcon(foodType?: FoodType | null): LucideIcon {
  if (foodType === 'EGG') return Egg;
  if (foodType === 'NON_VEG') return Drumstick;
  return Leaf;
}

function foodTypeLabel(
  foodType: FoodType | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (foodType === 'EGG') return t('meals.foodType.EGG', { defaultValue: 'Egg' });
  if (foodType === 'NON_VEG') return t('meals.foodType.NON_VEG', { defaultValue: 'Non veg' });
  if (foodType === 'VEG') return t('meals.foodType.VEG', { defaultValue: 'Veg' });
  return '';
}

function formatCountdown(
  closeAt: string | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
): string | null {
  if (!closeAt) return null;
  const ms = new Date(closeAt).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) {
    return t('meals.poll.closingSoon', { defaultValue: 'Closing soon' });
  }
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return t('meals.poll.closesInDays', {
      defaultValue: 'Closes in {{count}}d',
      count: days,
    });
  }
  if (hours > 0) {
    return t('meals.poll.closesInHoursMinutes', {
      defaultValue: 'Closes in {{hours}}h {{minutes}}m',
      hours,
      minutes,
    });
  }
  return t('meals.poll.closesInMinutes', {
    defaultValue: 'Closes in {{count}}m',
    count: Math.max(minutes, 1),
  });
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
        px: 1.1,
        py: 0.55,
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
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const unavailable = option.optionType === 'NOT_AVAILABLE';
  const FoodIcon = unavailable ? CircleSlash : foodTypeIcon(option.foodType);
  const typeLabel = unavailable
    ? t('meals.poll.notAvailableShort', { defaultValue: 'Skip' })
    : foodTypeLabel(option.foodType, t);
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
        alignItems: 'center',
        gap: 1,
        width: '100%',
        textAlign: 'left',
        p: 1.1,
        minHeight: 56,
        borderRadius: `${DASHBOARD_UX.tileRadius}px`,
        border: `1px solid ${selected ? colors.primaryDark : disabled ? s.divider : s.border}`,
        bgcolor: selected ? s.selected : disabled ? s.elevated : s.surface,
        boxShadow: selected ? s.shadowHover : 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !selected ? 0.65 : 1,
        transition: DASHBOARD_UX.transition,
        fontFamily: 'inherit',
        color: 'inherit',
        '&:hover': disabled
          ? undefined
          : {
              borderColor: `${colors.primaryDark}66`,
              bgcolor: selected ? s.selected : s.hover,
            },
        '&:focus-visible': {
          outline: `2px solid ${colors.primaryDark}`,
          outlineOffset: 2,
        },
      }}
    >
      {selected ? (
        <CheckCircle2 size={18} color={colors.primaryDark} />
      ) : (
        <Circle size={18} color={s.textMuted} />
      )}
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
          bgcolor: selected ? `${colors.primaryDark}18` : `${s.textMuted}14`,
          color: selected ? colors.primaryDark : s.textMuted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <FoodIcon size={14} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            ...DASHBOARD_UX.link,
            color: disabled && !selected ? s.textMuted : s.textPrimary,
          }}
          noWrap
        >
          {option.label}
        </Typography>
        {typeLabel || priceLabel ? (
          <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }} noWrap>
            {[typeLabel, priceLabel].filter(Boolean).join(' · ')}
          </Typography>
        ) : null}
      </Box>
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
  const [expandedMeal, setExpandedMeal] = useState<MealType | null>(null);
  const [didInitExpand, setDidInitExpand] = useState(false);
  const [hydratedAt, setHydratedAt] = useState(0);
  const paymentSectionRef = useRef<HTMLDivElement | null>(null);

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
    setDidInitExpand(false);
    setPaymentProof(EMPTY_PAYMENT_PROOF);
    setExpandedMeal(null);
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

  // One accordion open at a time — deep-link meal, else Breakfast / first available.
  useEffect(() => {
    if (didInitExpand || polls.length === 0) return;
    const fromQuery =
      focusMealType != null
        ? polls.find((p) => p.mealType === focusMealType)
        : undefined;
    const preferred =
      fromQuery ??
      polls.find((p) => p.mealType === 'BREAKFAST') ??
      polls.find((p) => p.status === 'OPEN') ??
      polls[0];
    setExpandedMeal(preferred?.mealType ?? null);
    setDidInitExpand(true);
  }, [didInitExpand, focusMealType, polls]);

  // When navigating from dashboard meal cards with ?meal=, open that accordion.
  useEffect(() => {
    if (!didInitExpand || !focusMealType || polls.length === 0) return;
    if (polls.some((p) => p.mealType === focusMealType)) {
      setExpandedMeal(focusMealType);
    }
  }, [didInitExpand, focusMealType, polls]);

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

  const mealsWithPlates = useMemo(
    () =>
      openPolls
        .filter((poll) => sumQuantities(quantitySelections[poll.mealType]) > 0)
        .map((poll) => poll.mealType),
    [openPolls, quantitySelections],
  );

  const totalPlates = useMemo(
    () => mealsWithPlates.reduce((sum, mealType) => sum + sumQuantities(quantitySelections[mealType]), 0),
    [mealsWithPlates, quantitySelections],
  );

  const showPayment = multiQuantity
    ? isPayPerMeal &&
      (totalPlates > 0 || Boolean(pollsQuery.pollDay?.myPaymentStatus)) &&
      Boolean(pollsQuery.pollDay)
    : isPayPerMeal && Boolean(pollsQuery.pollDay);

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
      const unit =
        option && option.optionType !== 'NOT_AVAILABLE' && option.price != null
          ? Number(option.price)
          : null;
      const items =
        selected && option
          ? [
              {
                optionId: option.id,
                label: option.label,
                quantity: 1,
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
        plates: selected ? 1 : 0,
        items,
        mealTotal: unit ?? 0,
        currencyCode: option?.currencyCode || 'INR',
      };
    });
  }, [effectiveSelections, multiQuantity, polls, quantitySelections]);

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

  const earliestCloseAt = useMemo(() => {
    const times = openPolls
      .map((p) => p.pollCloseAt)
      .filter((v): v is string => Boolean(v))
      .sort();
    return times[0] ?? null;
  }, [openPolls]);

  const pollStatus = aggregatePollStatus(polls);
  const responseCount = useMemo(
    () => Math.max(0, ...polls.map((p) => p.responseCount ?? 0), 0),
    [polls],
  );
  const countdown = formatCountdown(earliestCloseAt, t);
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

    const paymentNeeded = showPayment && (multiQuantity ? totalPlates > 0 : true);
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
          display: 'grid',
          gap: 1.5,
          alignItems: 'center',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'minmax(0, 1fr) auto auto',
          },
        }}
      >
        <Stack spacing={0.65} sx={{ minWidth: 0 }}>
          <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted }}>
            {t('meals.poll.yourCurrentSelection', { defaultValue: 'Your current selection' })}
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ flexWrap: 'wrap', alignItems: 'stretch' }}
          >
            {mealProgress.map((row) => {
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
                <Box
                  key={row.mealType}
                  sx={{
                    minWidth: 0,
                    maxWidth: 220,
                    px: 1.15,
                    py: 0.85,
                    borderRadius: 2,
                    border: `1px solid ${s.border}`,
                    bgcolor: colors.surface,
                    boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
                  }}
                >
                  <Stack direction="row" spacing={0.55} sx={{ alignItems: 'center', mb: 0.2 }}>
                    <Box sx={{ color: accent, display: 'flex' }}>
                      <MealIcon size={13} />
                    </Box>
                    <Typography
                      sx={{ ...DASHBOARD_UX.badge, color: s.textSecondary, fontWeight: 700 }}
                    >
                      {t(`meals.mealType.${row.mealType}`)}
                    </Typography>
                  </Stack>
                  {ordered.length > 0 ? (
                    <>
                      <Typography
                        sx={{ ...DASHBOARD_UX.smallCaption, color: s.textPrimary, fontWeight: 600 }}
                        noWrap
                        title={itemLine}
                      >
                        {itemLine}
                      </Typography>
                      <Typography sx={{ ...DASHBOARD_UX.badge, color: s.textMuted, mt: 0.15 }}>
                        {t('meals.poll.platesCount', {
                          defaultValue: '{{count}} plates',
                          count: row.plates,
                        })}
                      </Typography>
                    </>
                  ) : (
                    <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                      {row.pending
                        ? t('meals.poll.notSelectedShort', { defaultValue: 'Not selected' })
                        : t('meals.poll.statusClosed', { defaultValue: 'Closed' })}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Stack>
        </Stack>

        <Box sx={{ minWidth: 0, textAlign: { xs: 'left', md: 'right' }, px: { md: 1 } }}>
          <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textMuted }}>
            {t('meals.poll.totalLabel', { defaultValue: 'Total' })}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary, fontWeight: 800 }}>
            {pricesVisible && totalAmount.sum > 0
              ? formatCurrency(totalAmount.sum, totalAmount.currency)
              : multiQuantity
                ? t('meals.poll.platesCount', {
                    defaultValue: '{{count}} plates',
                    count: totalPlates,
                  })
                : '—'}
          </Typography>
          {(totalPlates > 0 || mealsSelectedCount > 0) && pricesVisible && totalAmount.sum > 0 ? (
            <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
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
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{ justifyContent: { xs: 'stretch', md: 'flex-end' } }}
        >
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
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('meals.poll.respondTitle', { defaultValue: 'Respond to meal poll' })}
          description={
            multiQuantity
              ? t('meals.poll.responseHintMess', {
                  defaultValue:
                    'Choose items and set quantities for each meal. Your selections help the kitchen prepare better.',
                })
              : t('meals.poll.respondSubtitle', {
                  defaultValue: 'Choose one option for each meal before the poll closes.',
                })
          }
          breadcrumbs={[
            { label: t('navigation.meals'), to: spaceMealsPath(spaceId) },
            {
              label: t('meals.poll.respondTitle', { defaultValue: 'Respond to meal poll' }),
            },
          ]}
        />

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
              gap: `${DASHBOARD_UX.cardGap}px`,
              width: '100%',
              alignItems: 'start',
              gridTemplateColumns: {
                xs: '1fr',
                lg: 'minmax(0, 1fr) minmax(0, 340px)',
              },
            }}
          >
            <Stack spacing={`${DASHBOARD_UX.cardGap}px`} sx={{ minWidth: 0 }}>
              {polls.map((poll) => {
                const MealIcon = MEAL_ICONS[poll.mealType];
                const accent = MEAL_ACCENTS[poll.mealType];
                const isOpen = poll.status === 'OPEN' && !viewOnly;
                const isExpanded = expandedMeal === poll.mealType;
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
                const captionParts = [
                  t('meals.poll.optionCount', {
                    defaultValue: '{{count}} options',
                    count: optionCount,
                  }),
                ];
                if (multiQuantity && plates > 0) {
                  captionParts.push(
                    t('meals.poll.platesCount', {
                      defaultValue: '{{count}} plates',
                      count: plates,
                    }),
                  );
                }

                return (
                  <ContentCard key={poll.id} padded={false}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() =>
                        setExpandedMeal((prev) => (prev === poll.mealType ? null : poll.mealType))
                      }
                      sx={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: `${DASHBOARD_UX.cardPadding}px`,
                        py: 1.25,
                        border: 'none',
                        borderLeft: `4px solid ${accent}`,
                        borderRadius: isExpanded ? '12px 12px 0 0' : undefined,
                        bgcolor: isExpanded
                          ? MEAL_HEADER_BG_EXPANDED[poll.mealType]
                          : MEAL_HEADER_BG[poll.mealType],
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        textAlign: 'left',
                        transition: DASHBOARD_UX.transition,
                        '&:hover': {
                          bgcolor: MEAL_HEADER_BG_EXPANDED[poll.mealType],
                        },
                      }}
                    >
                      <IconBadge accent={accent}>
                        <MealIcon />
                      </IconBadge>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                          {t(`meals.mealType.${poll.mealType}`)}
                        </Typography>
                        <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                          {captionParts.join(' · ')}
                        </Typography>
                      </Box>
                      <StatusChip
                        label={
                          poll.status === 'OPEN'
                            ? t('meals.poll.statusOpen', { defaultValue: 'Open' })
                            : t('meals.poll.statusClosed', { defaultValue: 'Closed' })
                        }
                        tone={poll.status === 'OPEN' ? 'success' : 'neutral'}
                      />
                      {isExpanded ? (
                        <ChevronUp size={16} color={s.textMuted} />
                      ) : (
                        <ChevronDown size={16} color={s.textMuted} />
                      )}
                    </Box>

                    <Collapse in={isExpanded}>
                      <Box
                        sx={{
                          px: `${DASHBOARD_UX.cardPadding}px`,
                          pb: `${DASHBOARD_UX.cardPadding}px`,
                          borderTop: `1px solid ${s.divider}`,
                          pt: 2,
                        }}
                      >
                        {multiQuantity ? (
                          <Stack spacing={2}>
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
                                  ...DASHBOARD_UX.body,
                                  color: s.textPrimary,
                                  fontWeight: 700,
                                  mb: 1.15,
                                }}
                              >
                                {t('meals.poll.mainItemsSection', {
                                  defaultValue: 'Main items (Choose one or more)',
                                })}
                              </Typography>
                              <Box
                                sx={{
                                  display: 'grid',
                                  gap: 1.25,
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
                                  p: 1.5,
                                  borderRadius: 2,
                                  border: `1px solid ${colors.primaryDark}33`,
                                  bgcolor: colors.successTint,
                                }}
                              >
                                <Stack
                                  direction="row"
                                  spacing={0.75}
                                  sx={{ alignItems: 'center', mb: 1.15 }}
                                >
                                  <Sparkles size={15} color={colors.primaryDark} />
                                  <Typography
                                    sx={{
                                      ...DASHBOARD_UX.body,
                                      color: colors.primaryDark,
                                      fontWeight: 700,
                                      flex: 1,
                                    }}
                                  >
                                    {t('meals.poll.extrasSectionOptional', {
                                      defaultValue: 'Extras (Optional)',
                                    })}
                                  </Typography>
                                  <Info size={14} color={s.textMuted} />
                                </Stack>
                                <Box
                                  sx={{
                                    display: 'grid',
                                    gap: 1.25,
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
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {(poll.options ?? []).map((option) => (
                              <Box
                                key={option.id}
                                sx={{
                                  flex: '1 1 200px',
                                  minWidth: { xs: 0, sm: 0 },
                                  width: { xs: '100%', sm: 'auto' },
                                  maxWidth: { xs: '100%', sm: 280 },
                                }}
                              >
                                <OptionMiniCard
                                  option={option}
                                  selected={selectedId === option.id}
                                  disabled={!isOpen}
                                  showPrice={pricesVisible}
                                  onSelect={() => selectOption(poll.mealType, option.id, isOpen)}
                                />
                              </Box>
                            ))}
                          </Box>
                        )}

                        <Stack
                          direction="row"
                          spacing={0.75}
                          sx={{
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mt: 2,
                            px: 1.35,
                            py: 1.05,
                            borderRadius: 2,
                            bgcolor: plates > 0 || selectedId ? colors.successTint : s.elevated,
                            border: `1px solid ${
                              plates > 0 || selectedId ? `${colors.primary}55` : s.border
                            }`,
                          }}
                        >
                          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                            {plates > 0 || selectedId ? (
                              <CheckCircle2 size={16} color={colors.success} />
                            ) : (
                              <Circle size={16} color={s.textMuted} />
                            )}
                            <Typography
                              sx={{
                                ...DASHBOARD_UX.body,
                                color: plates > 0 || selectedId ? colors.primaryDark : s.textPrimary,
                                fontWeight: 700,
                              }}
                            >
                              {multiQuantity
                                ? plates > 0
                                  ? t('meals.poll.platesCount', {
                                      defaultValue: '{{count}} plates',
                                      count: plates,
                                    })
                                  : t('meals.poll.skipMealHint', {
                                      defaultValue: 'No plates — this meal will be skipped',
                                    })
                                : selectedId
                                  ? t('meals.poll.selectedShort', { defaultValue: 'Selected' })
                                  : t('meals.poll.pendingShort', { defaultValue: 'Pending' })}
                            </Typography>
                          </Stack>
                          {pricesVisible && mealTotal > 0 ? (
                            <Typography
                              sx={{
                                ...DASHBOARD_UX.body,
                                color: colors.primaryDark,
                                fontWeight: 700,
                              }}
                            >
                              {t('meals.poll.mealTotal', {
                                defaultValue: 'Total {{amount}}',
                                amount: formatCurrency(mealTotal, mealCurrency),
                              })}
                            </Typography>
                          ) : null}
                        </Stack>
                      </Box>
                    </Collapse>
                  </ContentCard>
                );
              })}
            </Stack>

            <Stack
              spacing={`${DASHBOARD_UX.cardGap}px`}
              sx={{
                minWidth: 0,
                position: { md: 'sticky' },
                top: { md: `${DASHBOARD_UX.pagePadding}px` },
                alignSelf: 'start',
              }}
            >
              <ContentCard>
                <Stack
                  direction="row"
                  sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}
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
                <Stack spacing={1.1}>
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
                  bgcolor: '#EFF6FF',
                  boxShadow: 'none',
                  p: `${DASHBOARD_UX.cardPadding}px`,
                }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: '#DBEAFE',
                      color: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Info size={14} />
                  </Box>
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                    {t('meals.poll.changeUntilClose', {
                      defaultValue:
                        'You can change your response until the poll closes. Once submitted, it cannot be changed.',
                    })}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Box>
        )}
      </Stack>

      {polls.length > 0 ? (
        <StickyFooterClearance height={{ xs: 220, sm: 170, md: 132 }} />
      ) : null}
      {footer}
    </Box>
  );
}
