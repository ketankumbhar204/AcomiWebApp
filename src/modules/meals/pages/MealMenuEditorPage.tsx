import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ArrowLeft,
  BookOpen,
  Copy,
  Plus,
  Share2,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { ContentCard } from '@/shared/components/ContentCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { SearchToolbar } from '@/shared/components/SearchToolbar';
import { StatusChip, type StatusChipTone } from '@/shared/components/StatusChip';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashFilterControlSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import { ROUTES, spaceMealsLibraryPath, spaceMealsPath, spaceMealsSharePath } from '@/routes/paths';
import type {
  FoodCategoryResponse,
  FoodItemResponse,
  FoodType,
  MealComboResponse,
  MealType,
  MenuHistoryItemResponse,
} from '@/shared/types/meals';
import { mealsApi } from '../api/mealsApi';
import {
  CreateComboPlannerDialog,
  type CreateComboPlannerResult,
} from '../components/CreateComboPlannerDialog';
import { CopyPreviousMenuDialog } from '../components/CopyPreviousMenuDialog';
import { InlineCreateCategoryRow } from '../components/CategoryFormDialog';
import { MealExtrasEnablePanel, toExtraPackage } from '../components/MealExtrasEnablePanel';
import { MenuHistoryPanel } from '../components/MenuHistoryPanel';
import { ProgressiveMealPlanningBar } from '../components/ProgressiveMealPlanningBar';
import {
  hideScrollbarSx,
  MealPlanCompactSelectedCard,
  MealPlanSelectableCard,
  MEAL_PLAN_NOTES_MAX,
} from '../components/mealPlanVisuals';
import {
  useDailyMenus,
  useFoodCategories,
  useFoodItems,
  useMealCombos,
  useMealMutations,
} from '../hooks/useMeals';
import {
  countPlannedEntries,
  formatComboIncludeLine,
  getDraftOptionItemNames,
  mergeSelectionIntoOptions,
  optionKey,
  optionsFromMenu,
  plannedSummaryI18nKey,
  reindexMenuOptions,
  toUpsertOptions,
  type MenuDraftOption,
} from '../utils/dailyMenuDraft';
import { formatMenuDateLabel, isPastMenuDate, MEAL_TYPES } from '../utils/mealDates';
import {
  mealPricingContextFromSpaceType,
  requiresMealPrices,
} from '../utils/mealPricingPolicy';
import { hasComboPrice, parsePriceInput, validatePriceInput } from '../utils/comboPrice';

type LibraryTab = 'history' | 'combos' | 'items';
type ProgressivePhase = 'select' | 'review_extras' | 'ready';

function parseMealType(raw: string | null): MealType | null {
  if (raw && MEAL_TYPES.includes(raw as MealType)) return raw as MealType;
  return null;
}

function menuStatusTone(status?: string | null): StatusChipTone {
  if (status === 'PUBLISHED') return 'success';
  if (status === 'MODIFIED') return 'info';
  return 'warning';
}

function snapshotDraft(options: MenuDraftOption[], notes: string, prices: Record<string, string>) {
  return JSON.stringify({
    options: options.map((o) => ({
      entryType: o.entryType,
      comboId: o.comboId ?? null,
      itemId: o.itemId ?? null,
      itemIds: o.itemIds ?? null,
      label: o.label,
      sortOrder: o.sortOrder,
      price: o.price ?? null,
      isAvailable: o.isAvailable,
      isExtra: o.isExtra === true,
    })),
    notes: notes.trim(),
    prices,
  });
}

/** Small pill filter used by the category rail — local to this page. */
function ChipButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        all: 'unset',
        cursor: 'pointer',
        px: 1.1,
        py: 0.45,
        borderRadius: 99,
        border: `1px solid ${active ? colors.primary : s.border}`,
        bgcolor: active ? `${colors.primary}1A` : s.elevated,
        color: active ? colors.primaryDark : s.textSecondary,
        ...DASHBOARD_UX.badge,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </Box>
  );
}

/**
 * Inline "add item" row with a food type selector — mirrors the mobile
 * Items-tab create flow. `InlineCreateItemRow` (CategoryFormDialog.tsx)
 * always defaults to VEG, so this page creates items directly via
 * `createFoodItem` with an explicit food type and auto-selects the result.
 */
function InlineCreateFoodItemRow({
  spaceId,
  categories,
  defaultCategoryId,
  onCreated,
}: {
  spaceId: string;
  categories: FoodCategoryResponse[];
  defaultCategoryId?: string;
  onCreated: (item: FoodItemResponse) => void;
}) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const mutations = useMealMutations(spaceId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? '');
  const [foodType, setFoodType] = useState<FoodType>('VEG');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && defaultCategoryId) setCategoryId(defaultCategoryId);
  }, [defaultCategoryId, open]);

  if (!open) {
    return (
      <Button size="small" startIcon={<Plus size={14} />} onClick={() => setOpen(true)} sx={dashOutlinedButtonSx}>
        {t('meals.library.chipAddItem')}
      </Button>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
      <TextField
        size="small"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('meals.library.itemNameInlinePlaceholder')}
        sx={{ flex: '1 1 120px' }}
      />
      <TextField
        select
        size="small"
        slotProps={{ select: { native: true } }}
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        sx={{ ...dashFilterControlSx, minWidth: { xs: 0, sm: 140 } }}
      >
        <option value="">{t('meals.library.category')}</option>
        {categories.map((c) => (
          <option key={c.categoryId} value={c.categoryId}>
            {c.name}
          </option>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        slotProps={{ select: { native: true } }}
        value={foodType}
        onChange={(e) => setFoodType(e.target.value as FoodType)}
        sx={{ ...dashFilterControlSx, minWidth: { xs: 0, sm: 110 } }}
      >
        {(['VEG', 'NON_VEG', 'EGG'] as FoodType[]).map((ft) => (
          <option key={ft} value={ft}>
            {t(`meals.foodType.${ft}`)}
          </option>
        ))}
      </TextField>
      <Button size="small" onClick={() => setOpen(false)} sx={dashOutlinedButtonSx}>
        {t('common.cancel')}
      </Button>
      <Button
        size="small"
        variant="contained"
        disabled={busy}
        onClick={() => {
          if (!name.trim() || !categoryId) {
            enqueueSnackbar(t('meals.library.itemRequired'), { variant: 'warning' });
            return;
          }
          setBusy(true);
          void mutations.createFoodItem
            .mutateAsync({ name: name.trim(), categoryId, foodType })
            .then((created) => {
              enqueueSnackbar(t('meals.library.itemCreateSuccess'), { variant: 'success' });
              onCreated(created);
              setOpen(false);
              setName('');
            })
            .catch(() => enqueueSnackbar(t('common.errors.generic'), { variant: 'error' }))
            .finally(() => setBusy(false));
        }}
        sx={dashContainedButtonSx}
      >
        {t('common.save')}
      </Button>
    </Box>
  );
}

export function MealMenuEditorPage() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const [searchParams] = useSearchParams();
  const permissions = useSpacePermissions(spaceId);

  const menuDate = searchParams.get('date') ?? '';
  const mealType = parseMealType(searchParams.get('mealType'));
  const readOnly = Boolean(menuDate && isPastMenuDate(menuDate));
  const canManage = permissions.canManageMeals === true && !readOnly;
  const pricingCtx = mealPricingContextFromSpaceType(permissions.space?.spaceType);
  const needPrices = requiresMealPrices(pricingCtx);
  const isMess = permissions.space?.spaceType === 'MESS';

  const menus = useDailyMenus(spaceId, menuDate, Boolean(spaceId && menuDate && mealType));
  const menu = useMemo(
    () => menus.menus.find((m) => m.mealType === mealType) ?? null,
    [mealType, menus.menus],
  );
  const mutations = useMealMutations(spaceId);
  const combosQuery = useMealCombos(spaceId);
  const itemsQuery = useFoodItems(spaceId);
  const categoriesQuery = useFoodCategories(spaceId);

  const [tab, setTab] = useState<LibraryTab>('history');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [notes, setNotes] = useState('');
  const [options, setOptions] = useState<MenuDraftOption[]>([]);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);
  const [extrasReviewed, setExtrasReviewed] = useState(false);
  const [extrasHighlighted, setExtrasHighlighted] = useState(false);
  const loadHadMealsRef = useRef(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [createComboOpen, setCreateComboOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const baselineRef = useRef('');
  const allowLeaveRef = useRef(false);
  const firstInvalidPriceRef = useRef<Map<string, HTMLInputElement | null>>(new Map());

  useEffect(() => {
    if (!mealType) return;
    document.title = `${t('meals.planning.editSlot', {
      meal: t(`meals.mealType.${mealType}`),
    })} · ${t('common.appName')}`;
  }, [mealType, t]);

  useEffect(() => {
    if (!mealType || menus.loading || hydrated) return;
    const seeded = optionsFromMenu(menu);
    setOptions(seeded);
    setNotes(menu?.notes ?? '');
    const drafts: Record<string, string> = {};
    seeded.forEach((o) => {
      const key = optionKey(o);
      if (o.price != null) drafts[key] = String(o.price);
      else if (o.entryType === 'COMBO' && o.comboId) {
        const combo = combosQuery.combos.find((c) => c.comboId === o.comboId);
        if (combo?.price != null) drafts[key] = String(combo.price);
      }
    });
    setPriceDrafts(drafts);
    baselineRef.current = snapshotDraft(seeded, menu?.notes ?? '', drafts);
    const hadMeals = seeded.some(
      (o) => o.isExtra !== true && (o.entryType === 'COMBO' || o.entryType === 'PACKAGE'),
    );
    loadHadMealsRef.current = hadMeals;
    setExtrasReviewed(hadMeals);
    setHydrated(true);
  }, [combosQuery.combos, hydrated, mealType, menu, menus.loading]);

  const comboById = useMemo(() => {
    const map = new Map<string, MealComboResponse>();
    combosQuery.combos.forEach((c) => map.set(c.comboId, c));
    return map;
  }, [combosQuery.combos]);

  const itemById = useMemo(() => {
    const map = new Map<string, FoodItemResponse>();
    itemsQuery.items.forEach((i) => map.set(i.itemId, i));
    return map;
  }, [itemsQuery.items]);

  const selectedComboIds = useMemo(
    () => new Set(options.filter((o) => o.entryType === 'COMBO' && o.comboId).map((o) => o.comboId!)),
    [options],
  );

  const selectedMainItemIds = useMemo(
    () =>
      new Set(
        options
          .filter((o) => o.entryType === 'PACKAGE' && o.isExtra !== true && o.itemIds?.length === 1)
          .map((o) => o.itemIds![0]!),
      ),
    [options],
  );

  const selectedExtraIds = useMemo(
    () =>
      new Set(
        options
          .filter((o) => o.entryType === 'PACKAGE' && o.isExtra === true && o.itemIds?.length === 1)
          .map((o) => o.itemIds![0]!),
      ),
    [options],
  );

  const q = search.trim().toLowerCase();
  const filteredCombos = combosQuery.combos.filter(
    (c) => c.isActive && (!q || c.name.toLowerCase().includes(q)),
  );
  const filteredItems = itemsQuery.items.filter(
    (i) =>
      i.isActive &&
      (!categoryId || i.categoryId === categoryId) &&
      (!q || i.name.toLowerCase().includes(q)),
  );
  const activeCategories = categoriesQuery.categories.filter((c) => c.isActive !== false);

  const planned = countPlannedEntries(options);
  const plannedKey = plannedSummaryI18nKey(planned);
  const mainOptions = useMemo(() => options.filter((o) => o.isExtra !== true), [options]);
  const extraOptions = useMemo(() => options.filter((o) => o.isExtra === true), [options]);

  const progressiveExtrasEnabled = isMess && needPrices && !readOnly;
  const phase: ProgressivePhase = !progressiveExtrasEnabled
    ? 'ready'
    : mainOptions.length === 0
      ? 'select'
      : extrasReviewed
        ? 'ready'
        : 'review_extras';
  const showActionFooter = canManage && !readOnly;

  useEffect(() => {
    if (!hydrated || !progressiveExtrasEnabled) return;
    if (mainOptions.length === 0) {
      setExtrasReviewed(false);
      loadHadMealsRef.current = false;
      return;
    }
    // Editing an existing draft: don't force the Continue gate (mobile parity).
    if (loadHadMealsRef.current) {
      setExtrasReviewed(true);
    }
  }, [hydrated, mainOptions.length, progressiveExtrasEnabled]);

  const continueToExtras = () => {
    document.getElementById('meal-extras-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    setExtrasHighlighted(true);
    window.setTimeout(() => setExtrasHighlighted(false), 1000);
    // Mark reviewed after scroll settles (mobile continueToSection ~350ms).
    window.setTimeout(() => setExtrasReviewed(true), 350);
  };

  const isDirty = hydrated && snapshotDraft(options, notes, priceDrafts) !== baselineRef.current;

  const goBack = useCallback(() => {
    allowLeaveRef.current = true;
    navigate(spaceMealsPath(spaceId, menuDate || undefined));
  }, [menuDate, navigate, spaceId]);

  const requestLeave = () => {
    if (readOnly || !isDirty) {
      goBack();
      return;
    }
    setLeaveOpen(true);
  };

  const previewShare = () => {
    navigate(spaceMealsSharePath(spaceId, menuDate));
  };

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!allowLeaveRef.current && isDirty && !readOnly) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty, readOnly]);

  const currentCombos = useCallback(
    () =>
      options
        .filter((o) => o.entryType === 'COMBO' && o.comboId)
        .map((o) => ({ comboId: o.comboId!, name: o.label, price: o.price, currencyCode: o.currencyCode })),
    [options],
  );

  const currentSingleItems = useCallback(
    () =>
      options
        .filter((o) => o.entryType === 'PACKAGE' && o.isExtra !== true && o.itemIds?.length === 1)
        .map((o) => {
          const id = o.itemIds![0]!;
          const item = itemById.get(id);
          return {
            itemId: id,
            name: o.label,
            price: o.price ?? item?.defaultPrice ?? null,
            currencyCode: o.currencyCode ?? item?.currencyCode,
            foodType: o.foodType ?? item?.foodType,
          };
        }),
    [itemById, options],
  );

  const currentAdHocPackages = useCallback(
    () =>
      options
        .filter((o) => o.entryType === 'PACKAGE' && o.isExtra !== true && (o.itemIds?.length ?? 0) > 1)
        .map((o) => ({ label: o.label, itemIds: o.itemIds ?? [], price: o.price, currencyCode: o.currencyCode })),
    [options],
  );

  const currentExtras = useCallback(
    () =>
      options
        .filter((o) => o.entryType === 'PACKAGE' && o.isExtra === true && o.itemIds?.length === 1)
        .map((o) => {
          const id = o.itemIds![0]!;
          const item = itemById.get(id);
          return {
            itemId: id,
            name: o.label,
            price: o.price ?? item?.defaultPrice ?? null,
            currencyCode: o.currencyCode ?? item?.currencyCode,
            foodType: o.foodType ?? item?.foodType,
          };
        }),
    [itemById, options],
  );

  const applySelection = useCallback(
    (
      combos = currentCombos(),
      singleItems = currentSingleItems(),
      adHoc = currentAdHocPackages(),
      extras = currentExtras(),
    ) => {
      setOptions((prev) => mergeSelectionIntoOptions(prev, combos, singleItems, adHoc, extras));
    },
    [currentAdHocPackages, currentCombos, currentExtras, currentSingleItems],
  );

  const removeOption = (key: string) => {
    if (!canManage) return;
    setOptions((prev) => reindexMenuOptions(prev.filter((o) => optionKey(o) !== key)));
    setPriceDrafts((d) => {
      const copy = { ...d };
      delete copy[key];
      return copy;
    });
  };

  const clearSelectedMenu = () => {
    if (!canManage) return;
    setOptions((prev) => {
      const remaining = prev.filter((o) => o.isExtra === true);
      return reindexMenuOptions(remaining);
    });
    setPriceDrafts((d) => {
      const next: Record<string, string> = {};
      for (const [key, value] of Object.entries(d)) {
        if (key.startsWith('EXTRA:')) next[key] = value;
      }
      return next;
    });
  };

  const seedPriceDraft = (key: string, price?: number | null) => {
    if (!needPrices) return;
    setPriceDrafts((d) => {
      if (d[key] != null && d[key] !== '') return d;
      return { ...d, [key]: price != null && price > 0 ? String(price) : '' };
    });
  };

  const toggleCombo = (combo: MealComboResponse) => {
    if (!canManage) return;
    const existing = options.find((o) => o.entryType === 'COMBO' && o.comboId === combo.comboId);
    if (existing) {
      removeOption(optionKey(existing));
      return;
    }
    applySelection([
      ...currentCombos(),
      { comboId: combo.comboId, name: combo.name, price: combo.price ?? null, currencyCode: combo.currencyCode },
    ]);
    seedPriceDraft(`COMBO:${combo.comboId}`, combo.price);
  };

  const addItemToSelection = (item: FoodItemResponse) => {
    if (!canManage) return;
    const existing = options.find(
      (o) => o.entryType === 'PACKAGE' && o.isExtra !== true && o.itemIds?.length === 1 && o.itemIds[0] === item.itemId,
    );
    if (existing) return;
    applySelection(
      currentCombos(),
      [
        ...currentSingleItems(),
        {
          itemId: item.itemId,
          name: item.name,
          price: item.defaultPrice ?? null,
          currencyCode: item.currencyCode,
          foodType: item.foodType,
        },
      ],
    );
    seedPriceDraft(`PKG:${item.itemId}`, item.defaultPrice);
  };

  const toggleItem = (item: FoodItemResponse) => {
    if (!canManage) return;
    const existing = options.find(
      (o) => o.entryType === 'PACKAGE' && o.isExtra !== true && o.itemIds?.length === 1 && o.itemIds[0] === item.itemId,
    );
    if (existing) {
      removeOption(optionKey(existing));
      return;
    }
    addItemToSelection(item);
  };

  const toggleHistoryCombo = (item: MenuHistoryItemResponse) => {
    if (!canManage || !item.comboId) return;
    const combo: MealComboResponse = {
      comboId: item.comboId,
      name: item.name,
      isActive: true,
      price: item.price ?? null,
      currencyCode: item.currencyCode ?? 'INR',
      foodType: item.foodType ?? 'VEG',
      items: (item.itemIds ?? []).map((id) => ({
        itemId: id,
        name: '',
        foodType: item.foodType ?? 'VEG',
      })),
    };
    toggleCombo(combo);
  };

  const toggleHistoryItem = (item: MenuHistoryItemResponse) => {
    if (!canManage || !item.itemId) return;
    const foodItem: FoodItemResponse = {
      itemId: item.itemId,
      name: item.name,
      isActive: true,
      isCustom: false,
      scope: 'SPACE',
      foodType: item.foodType ?? 'VEG',
      defaultPrice: item.price ?? null,
      currencyCode: item.currencyCode ?? 'INR',
      categoryId: '',
      categoryName: item.summary ?? undefined,
    };
    toggleItem(foodItem);
  };

  const handleToggleExtra = useCallback(
    (item: FoodItemResponse, enabled: boolean, price?: number | null) => {
      if (!canManage) return;
      if (!enabled) {
        setOptions((prev) =>
          reindexMenuOptions(
            prev.filter(
              (o) =>
                !(
                  o.entryType === 'PACKAGE' &&
                  o.isExtra === true &&
                  o.itemIds?.length === 1 &&
                  o.itemIds[0] === item.itemId
                ),
            ),
          ),
        );
        return;
      }
      const created = toExtraPackage(price != null ? { ...item, defaultPrice: price } : item);
      setOptions((prev) => {
        const mains = prev.filter((o) => o.isExtra !== true);
        const otherExtras = prev.filter(
          (o) =>
            o.isExtra === true &&
            !(o.entryType === 'PACKAGE' && o.itemIds?.length === 1 && o.itemIds[0] === item.itemId),
        );
        return reindexMenuOptions([
          ...mains,
          ...otherExtras,
          {
            entryType: 'PACKAGE' as const,
            label: created.name,
            sortOrder: 0,
            itemIds: [created.itemId],
            isExtra: true,
            isAvailable: true,
            price: created.price ?? null,
            currencyCode: created.currencyCode ?? 'INR',
            foodType: created.foodType ?? undefined,
          },
        ]);
      });
      if (needPrices) {
        setPriceDrafts((d) => {
          const key = `EXTRA:${item.itemId}`;
          if (d[key] != null && d[key] !== '') return d;
          const p = created.price;
          return { ...d, [key]: p != null && p > 0 ? String(p) : '' };
        });
      }
    },
    [canManage, needPrices],
  );

  const handleComboCreated = async (result: CreateComboPlannerResult) => {
    if (result.saveToLibrary && result.comboId) {
      applySelection([
        ...currentCombos(),
        { comboId: result.comboId, name: result.name, price: result.price, currencyCode: 'INR' },
      ]);
      seedPriceDraft(`COMBO:${result.comboId}`, result.price);
      return;
    }
    applySelection(
      currentCombos(),
      currentSingleItems(),
      [
        ...currentAdHocPackages(),
        { label: result.name, itemIds: result.itemIds, price: result.price, currencyCode: 'INR' },
      ],
    );
    seedPriceDraft(`ADHOC:${result.name}`, result.price);
  };

  const refreshCatalog = () => {
    void combosQuery.reload();
    void itemsQuery.reload();
    void categoriesQuery.reload();
  };

  const applyPriceToOptionKey = (key: string, price: number) => {
    setOptions((prev) =>
      reindexMenuOptions(
        prev.map((o) => (optionKey(o) === key ? { ...o, price, currencyCode: 'INR' } : o)),
      ),
    );
  };

  const persistOptionPrice = async (option: MenuDraftOption) => {
    if (!needPrices || !canManage) return;
    const key = optionKey(option);
    const text = priceDrafts[key] ?? '';
    if (!text.trim() || validatePriceInput(text)) return;
    const price = parsePriceInput(text);
    if (price == null) return;
    try {
      if (option.entryType === 'COMBO' && option.comboId) {
        if (comboById.get(option.comboId)?.price !== price) {
          await mealsApi.updateMealComboPrice(spaceId, option.comboId, { price, currencyCode: 'INR' });
          await combosQuery.reload();
        }
      } else if (option.entryType === 'PACKAGE' && option.itemIds?.length === 1) {
        const itemId = option.itemIds[0]!;
        if (itemById.get(itemId)?.defaultPrice !== price) {
          await mealsApi.updateFoodItemDefaultPrice(spaceId, itemId, { price, currencyCode: 'INR' });
          await itemsQuery.reload();
        }
      }
      applyPriceToOptionKey(key, price);
    } catch {
      enqueueSnackbar(t('meals.errors.saveFailed'), { variant: 'error' });
    }
  };

  /** Library-row price blur (mobile ComboPickerCard parity when selected). */
  const persistLibraryComboPrice = async (combo: MealComboResponse) => {
    if (!needPrices || !canManage) return;
    const key = `COMBO:${combo.comboId}`;
    const text = priceDrafts[key] ?? '';
    if (!text.trim() || validatePriceInput(text)) return;
    const price = parsePriceInput(text);
    if (price == null || combo.price === price) {
      if (price != null) applyPriceToOptionKey(key, price);
      return;
    }
    try {
      await mealsApi.updateMealComboPrice(spaceId, combo.comboId, { price, currencyCode: 'INR' });
      await combosQuery.reload();
      applyPriceToOptionKey(key, price);
    } catch {
      enqueueSnackbar(t('meals.errors.saveFailed'), { variant: 'error' });
    }
  };

  const persistLibraryItemPrice = async (item: FoodItemResponse) => {
    if (!needPrices || !canManage) return;
    const key = `PKG:${item.itemId}`;
    const text = priceDrafts[key] ?? '';
    if (!text.trim() || validatePriceInput(text)) return;
    const price = parsePriceInput(text);
    if (price == null || item.defaultPrice === price) {
      if (price != null) applyPriceToOptionKey(key, price);
      return;
    }
    try {
      await mealsApi.updateFoodItemDefaultPrice(spaceId, item.itemId, { price, currencyCode: 'INR' });
      await itemsQuery.reload();
      applyPriceToOptionKey(key, price);
    } catch {
      enqueueSnackbar(t('meals.errors.saveFailed'), { variant: 'error' });
    }
  };

  const validatePrices = (): boolean => {
    if (!needPrices) return true;
    for (const option of options) {
      const key = optionKey(option);
      const text =
        priceDrafts[key] ??
        (option.price != null
          ? String(option.price)
          : option.entryType === 'COMBO' && option.comboId
            ? String(comboById.get(option.comboId)?.price ?? '')
            : '');
      const invalid =
        !text.trim() || Boolean(validatePriceInput(text)) || !hasComboPrice(parsePriceInput(text));
      if (invalid) {
        enqueueSnackbar(t('meals.pricing.fixFieldsBeforeSave'), { variant: 'warning' });
        const el = firstInvalidPriceRef.current.get(key);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus();
        return false;
      }
    }
    return true;
  };

  const buildOptionsForSave = (): MenuDraftOption[] => {
    return options.map((option) => {
      const key = optionKey(option);
      if (option.entryType !== 'PACKAGE') return option;
      const parsed = parsePriceInput(priceDrafts[key] ?? '');
      return {
        ...option,
        price: parsed ?? option.price ?? null,
        currencyCode: option.currencyCode ?? 'INR',
      };
    });
  };

  const syncComboPrices = async () => {
    if (!needPrices || !spaceId) return;
    for (const option of options) {
      if (option.entryType !== 'COMBO' || !option.comboId) continue;
      const key = optionKey(option);
      const parsed = parsePriceInput(priceDrafts[key] ?? '');
      if (parsed == null) continue;
      const current = comboById.get(option.comboId)?.price;
      if (current === parsed) continue;
      await mealsApi.updateMealComboPrice(spaceId, option.comboId, {
        price: parsed,
        currencyCode: 'INR',
      });
    }
  };

  const saving =
    mutations.upsertDailyMenu.isPending ||
    mutations.deleteDailyMenu.isPending ||
    mutations.copyDailyMenu.isPending;

  const persist = async (thenShare: boolean) => {
    if (!mealType || !canManage) return;
    if (mainOptions.length === 0) {
      enqueueSnackbar(t('meals.errors.optionsRequired'), { variant: 'warning' });
      return;
    }
    if (!validatePrices()) return;
    try {
      await syncComboPrices();
      const bodyOptions = toUpsertOptions(buildOptionsForSave());
      await mutations.upsertDailyMenu.mutateAsync({
        menuDate,
        mealType,
        body: {
          options: bodyOptions,
          notes: notes.trim() || null,
        },
      });
      enqueueSnackbar(t('meals.success.saved'), { variant: 'success' });
      baselineRef.current = snapshotDraft(options, notes, priceDrafts);
      if (thenShare) {
        allowLeaveRef.current = true;
        navigate(spaceMealsSharePath(spaceId, menuDate));
        return;
      }
      goBack();
    } catch {
      enqueueSnackbar(t('meals.errors.saveFailed'), { variant: 'error' });
    }
  };

  const clearDraft = async () => {
    if (!mealType || !canManage || menu?.status !== 'DRAFT') return;
    try {
      await mutations.deleteDailyMenu.mutateAsync({ menuDate, mealType });
      enqueueSnackbar(t('meals.success.draftDeleted'), { variant: 'success' });
      goBack();
    } catch {
      enqueueSnackbar(t('meals.errors.saveFailed'), { variant: 'error' });
    }
  };

  if (!spaceId) return <Navigate to={ROUTES.root} replace />;
  if (!menuDate || !mealType) return <Navigate to={spaceMealsPath(spaceId)} replace />;
  if (permissions.canManageMeals !== true) {
    return <Navigate to={spaceMealsPath(spaceId, menuDate)} replace />;
  }

  const dateBadge = formatMenuDateLabel(menuDate, i18n.language);

  const renderInlinePriceField = (args: {
    draftKey: string;
    onBlur: () => void;
    inputRef?: (el: HTMLInputElement | null) => void;
  }) => (
    <TextField
      size="small"
      value={priceDrafts[args.draftKey] ?? ''}
      onChange={(e) => setPriceDrafts((d) => ({ ...d, [args.draftKey]: e.target.value }))}
      onBlur={args.onBlur}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      placeholder={t('meals.pricing.pricePlaceholder', { defaultValue: 'Price' })}
      sx={{ width: 118, flexShrink: 0 }}
      inputRef={args.inputRef}
      slotProps={{
        input: {
          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
        },
      }}
    />
  );

  const renderCatalogPriceLabel = (price?: number | null, currencyCode?: string | null) => {
    if (price == null || !(price > 0)) return null;
    return (
      <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, flexShrink: 0 }}>
        {formatCurrency(price, currencyCode ?? undefined)}
      </Typography>
    );
  };

  const renderSelectedRow = (option: MenuDraftOption) => {
    const key = optionKey(option);
    const includes = getDraftOptionItemNames(option, comboById);
    const foodType =
      option.foodType ??
      (option.entryType === 'COMBO' && option.comboId ? comboById.get(option.comboId)?.foodType : undefined);

    return (
      <MealPlanCompactSelectedCard
        key={key}
        name={option.label}
        foodType={foodType}
        isExtra={option.isExtra === true}
        includes={
          includes.length > 0
            ? includes.join(', ')
            : option.entryType === 'COMBO'
              ? t('meals.library.combos')
              : undefined
        }
        priceSlot={
          needPrices && canManage
            ? renderInlinePriceField({
                draftKey: key,
                onBlur: () => void persistOptionPrice(option),
                inputRef: (el) => {
                  firstInvalidPriceRef.current.set(key, el);
                },
              })
            : needPrices
              ? renderCatalogPriceLabel(option.price, option.currencyCode)
              : null
        }
        onRemove={canManage ? () => removeOption(key) : undefined}
      />
    );
  };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: s.pageBg,
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          zIndex: 2,
          borderBottom: `1px solid ${s.border}`,
          bgcolor: s.surface,
          boxShadow: s.shadow,
          px: { xs: 2, md: 3 },
          py: 1.75,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.75}
          sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <IconButton
              aria-label={t('common.back', { defaultValue: 'Back' })}
              onClick={requestLeave}
              sx={{ border: `1px solid ${s.border}`, borderRadius: `${DASHBOARD_UX.buttonRadius}px` }}
            >
              <ArrowLeft size={18} />
            </IconButton>
            <Box sx={{ minWidth: 0 }}>
              <Breadcrumbs
                items={[
                  { label: t('navigation.meals'), to: spaceMealsPath(spaceId, menuDate) },
                  { label: t('meals.planning.title') },
                  {
                    label: t('meals.planning.editSlot', {
                      meal: t(`meals.mealType.${mealType}`),
                    }),
                  },
                ]}
              />
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 0.75, gap: 1 }}
              >
                <Typography sx={{ ...DASHBOARD_UX.pageTitle, color: s.textPrimary }}>
                  {t('meals.planning.editSlot', { meal: t(`meals.mealType.${mealType}`) })}
                </Typography>
                {hydrated ? (
                  <StatusChip
                    label={t(`meals.status.${menu?.status ?? 'DRAFT'}`)}
                    tone={menuStatusTone(menu?.status)}
                  />
                ) : null}
                <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textSecondary }}>{dateBadge}</Typography>
                <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
                  {planned.total === 0
                    ? t(plannedKey)
                    : `• ${t(plannedKey, { count: planned.total })}`}
                </Typography>
                {planned.total > 0 ? (
                  <Link
                    component="button"
                    type="button"
                    onClick={previewShare}
                    sx={{
                      ...DASHBOARD_UX.link,
                      color: colors.primaryDark,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.4,
                    }}
                  >
                    <Share2 size={13} />
                    {t('meals.planning.previewShare')}
                  </Link>
                ) : null}
              </Stack>
            </Box>
          </Stack>

          {canManage ? (
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Button variant="outlined" onClick={requestLeave} disabled={saving} sx={dashOutlinedButtonSx}>
                {t('common.cancel')}
              </Button>
            </Stack>
          ) : null}
        </Stack>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          px: { xs: 2, md: 3 },
          py: { xs: 1.25, md: 1.5 },
          maxWidth: DASHBOARD_UX.contentMaxWidth,
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          overflow: 'hidden',
          bgcolor: s.pageBg,
        }}
      >
            {readOnly ? (
              <ContentCard>
                <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                  {t('meals.errors.pastDateReadOnly')}
                </Typography>
              </ContentCard>
            ) : null}

            {!hydrated || (menus.loading && !menu) ? (
              <LoadingState minHeight={320} />
            ) : (
              <>
                {canManage && planned.total === 0 ? (
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      flexShrink: 0,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 1.5,
                      py: 0.75,
                      borderRadius: `${DASHBOARD_UX.radius}px`,
                      border: `1px solid ${s.border}`,
                      bgcolor: s.surface,
                    }}
                  >
                    <Typography sx={{ ...DASHBOARD_UX.caption, color: s.textSecondary, minWidth: 0 }} noWrap>
                      {t('meals.planning.copyFrom.hint', {
                        defaultValue: 'Start from a previous day’s menu for this meal.',
                      })}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<Copy size={14} />}
                      variant="outlined"
                      onClick={() => setCopyOpen(true)}
                      sx={{ ...dashOutlinedButtonSx, flexShrink: 0, minHeight: 32, py: 0.25 }}
                    >
                      {t('meals.planning.copyFrom.title', { defaultValue: 'Copy previous menu' })}
                    </Button>
                  </Stack>
                ) : null}

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
                    gridTemplateRows: { xs: 'minmax(0, 1fr) minmax(0, 1fr)', lg: 'minmax(0, 1fr)' },
                    gap: `${DASHBOARD_UX.sectionGap + 6}px`,
                    alignItems: 'stretch',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                  }}
                >
                  {/* Library — History / Combos / Items */}
                  <Box
                    sx={{
                      minHeight: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        flex: 1,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        '& > .MuiPaper-root': {
                          flex: 1,
                          minHeight: 0,
                          display: 'flex',
                          flexDirection: 'column',
                        },
                      }}
                    >
                      <ContentCard padded={false}>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            minHeight: 0,
                            overflow: 'hidden',
                          }}
                        >
                          <Box sx={{ p: `${DASHBOARD_UX.cardPadding + 4}px`, pb: 1, flexShrink: 0 }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                            >
                              <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
                                {t('meals.planning.libraryTitle', { defaultValue: 'Library' })}
                              </Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<BookOpen size={14} />}
                                onClick={() => navigate(spaceMealsLibraryPath(spaceId))}
                                sx={dashOutlinedButtonSx}
                              >
                                {t('meals.library.title', { defaultValue: 'Menu library' })}
                              </Button>
                            </Stack>

                            <Stack
                              direction="row"
                              spacing={1}
                              useFlexGap
                              sx={{
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                mt: 1,
                                gap: 1,
                              }}
                            >
                              <Tabs
                                value={tab}
                                onChange={(_, v: LibraryTab) => setTab(v)}
                                sx={{
                                  minHeight: DASHBOARD_UX.buttonHeight,
                                  '& .MuiTab-root': {
                                    minHeight: DASHBOARD_UX.buttonHeight,
                                    ...DASHBOARD_UX.button,
                                    textTransform: 'none',
                                    color: s.textMuted,
                                  },
                                  '& .Mui-selected': {
                                    color: `${colors.primaryDark} !important`,
                                  },
                                  '& .MuiTabs-indicator': {
                                    bgcolor: colors.primaryDark,
                                    height: 2,
                                  },
                                }}
                              >
                                <Tab value="history" label={t('meals.planning.tabHistory')} />
                                <Tab value="combos" label={t('meals.library.combos')} />
                                <Tab value="items" label={t('meals.library.items')} />
                              </Tabs>
                              {canManage && tab !== 'history' ? (
                                <Button
                                  size="small"
                                  startIcon={<Plus size={14} />}
                                  onClick={() => setCreateComboOpen(true)}
                                  sx={dashOutlinedButtonSx}
                                >
                                  {t('meals.planning.createNewCombo', { defaultValue: '+ Create New Combo' })}
                                </Button>
                              ) : null}
                            </Stack>

                            {tab !== 'history' ? (
                              <Box sx={{ mt: 1.5 }}>
                                <SearchToolbar
                                  value={search}
                                  onChange={setSearch}
                                  placeholder={t('meals.library.search')}
                                />
                              </Box>
                            ) : null}

                            {tab === 'items' ? (
                              <Stack
                                direction="row"
                                spacing={0.75}
                                useFlexGap
                                sx={{ flexWrap: 'wrap', mt: 1.25, alignItems: 'center' }}
                              >
                                <ChipButton
                                  active={!categoryId}
                                  label={t('common.all', { defaultValue: 'All' })}
                                  onClick={() => setCategoryId('')}
                                />
                                {activeCategories.map((c) => (
                                  <ChipButton
                                    key={c.categoryId}
                                    active={categoryId === c.categoryId}
                                    label={c.name}
                                    onClick={() => setCategoryId(c.categoryId)}
                                  />
                                ))}
                                {canManage ? (
                                  <InlineCreateCategoryRow
                                    spaceId={spaceId}
                                    variant="chip"
                                    onCreated={(id) => {
                                      refreshCatalog();
                                      setCategoryId(id);
                                    }}
                                  />
                                ) : null}
                              </Stack>
                            ) : null}
                          </Box>

                          <Box
                            sx={{
                              px: 2,
                              pb: 2,
                              flex: 1,
                              minHeight: 0,
                              overflowY: 'auto',
                              overflowX: 'hidden',
                              ...hideScrollbarSx,
                            }}
                          >
                            {tab === 'history' && mealType ? (
                              <MenuHistoryPanel
                                key={`${spaceId}-${mealType}`}
                                spaceId={spaceId}
                                mealType={mealType}
                                canManage={canManage}
                                needPrices={needPrices}
                                selectedComboIds={selectedComboIds}
                                selectedItemIds={selectedMainItemIds}
                                onToggleCombo={toggleHistoryCombo}
                                onToggleItem={toggleHistoryItem}
                                onBrowseCombos={() => setTab('combos')}
                                onBrowseItems={() => setTab('items')}
                              />
                            ) : combosQuery.loading || itemsQuery.loading ? (
                              <LoadingState />
                            ) : tab === 'combos' ? (
                              filteredCombos.length === 0 ? (
                                <EmptyState
                                  title={t('meals.library.emptyCombos', { defaultValue: 'No combos found' })}
                                  icon={<UtensilsCrossed size={28} />}
                                />
                              ) : (
                                <Stack spacing={1}>
                                  {filteredCombos.map((combo) => {
                                    const selected = selectedComboIds.has(combo.comboId);
                                    return (
                                      <MealPlanSelectableCard
                                        key={combo.comboId}
                                        selected={selected}
                                        disabled={!canManage}
                                        onToggle={() => toggleCombo(combo)}
                                        name={combo.name}
                                        foodType={combo.foodType}
                                        subtitle={
                                          combo.items
                                            ?.map((i) => formatComboIncludeLine(i.name, i.quantity))
                                            .join(', ') || '—'
                                        }
                                        trailing={
                                          needPrices && selected && canManage
                                            ? renderInlinePriceField({
                                                draftKey: `COMBO:${combo.comboId}`,
                                                onBlur: () => void persistLibraryComboPrice(combo),
                                              })
                                            : needPrices
                                              ? renderCatalogPriceLabel(combo.price, combo.currencyCode)
                                              : null
                                        }
                                      />
                                    );
                                  })}
                                </Stack>
                              )
                            ) : filteredItems.length === 0 ? (
                              <EmptyState
                                title={t('meals.library.emptyItems', { defaultValue: 'No items found' })}
                                icon={<UtensilsCrossed size={28} />}
                              />
                            ) : (
                              <Stack spacing={1}>
                                {filteredItems.map((item) => {
                                  const selected = selectedMainItemIds.has(item.itemId);
                                  return (
                                    <MealPlanSelectableCard
                                      key={item.itemId}
                                      selected={selected}
                                      disabled={!canManage}
                                      onToggle={() => toggleItem(item)}
                                      name={item.name}
                                      foodType={item.foodType}
                                      subtitle={item.categoryName || t('meals.library.items')}
                                      trailing={
                                        needPrices && selected && canManage
                                          ? renderInlinePriceField({
                                              draftKey: `PKG:${item.itemId}`,
                                              onBlur: () => void persistLibraryItemPrice(item),
                                            })
                                          : needPrices
                                            ? renderCatalogPriceLabel(item.defaultPrice, item.currencyCode)
                                            : null
                                      }
                                    />
                                  );
                                })}
                              </Stack>
                            )}
                            {tab === 'items' && canManage ? (
                              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 1.5 }}>
                                <InlineCreateFoodItemRow
                                  spaceId={spaceId}
                                  categories={activeCategories}
                                  defaultCategoryId={categoryId}
                                  onCreated={(created) => {
                                    refreshCatalog();
                                    addItemToSelection(created);
                                  }}
                                />
                              </Stack>
                            ) : null}
                          </Box>
                        </Box>
                      </ContentCard>
                    </Box>
                  </Box>

                  {/* Selected menu + extras + notes */}
                  <Box
                    sx={{
                      minHeight: 0,
                      height: '100%',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      ...hideScrollbarSx,
                    }}
                  >
                    <Stack spacing={`${DASHBOARD_UX.sectionGap}px`}>
                      <ContentCard padded={false}>
                        <Box sx={{ p: `${DASHBOARD_UX.cardPadding + 4}px`, pb: 1.5 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
                                {t('meals.planning.selectedMenuTitle', { defaultValue: 'Selected Menu' })}
                              </Typography>
                              <Typography
                                sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted, mt: 0.25 }}
                              >
                                {t('meals.planning.selectedCount', { count: mainOptions.length })}
                              </Typography>
                            </Box>
                            {canManage && mainOptions.length > 0 ? (
                              <Button
                                size="small"
                                variant="text"
                                startIcon={<Trash2 size={14} />}
                                onClick={clearSelectedMenu}
                                sx={{
                                  ...DASHBOARD_UX.button,
                                  flexShrink: 0,
                                  color: colors.danger,
                                  textTransform: 'none',
                                }}
                              >
                                {t('meals.planning.clearAll', { defaultValue: 'Clear all' })}
                              </Button>
                            ) : null}
                          </Stack>
                        </Box>
                        <Box sx={{ px: 2, pb: 2 }}>
                          {mainOptions.length === 0 ? (
                            <EmptyState
                              title={t('meals.planning.emptySelectedTitle', {
                                defaultValue: 'Nothing selected yet',
                              })}
                              description={t('meals.planning.emptySelectedBody', {
                                defaultValue: 'Add from Library to build this meal.',
                              })}
                              icon={<UtensilsCrossed size={28} />}
                            />
                          ) : (
                            <Stack spacing={1}>{mainOptions.map(renderSelectedRow)}</Stack>
                          )}
                        </Box>
                      </ContentCard>

                      {isMess && needPrices ? (
                        <MealExtrasEnablePanel
                          spaceId={spaceId}
                          options={options}
                          comboById={comboById}
                          catalogItems={itemsQuery.items}
                          enabledExtraIds={selectedExtraIds}
                          canManage={canManage}
                          highlighted={extrasHighlighted}
                          onToggleExtra={handleToggleExtra}
                          onCatalogChanged={refreshCatalog}
                          onInteract={() => setExtrasReviewed(true)}
                        />
                      ) : null}

                      {extraOptions.length > 0 && !(isMess && needPrices) ? (
                        <ContentCard>
                          <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary, mb: 1 }}>
                            {t('meals.planning.extrasSectionTitle')}
                          </Typography>
                          <Stack spacing={1}>{extraOptions.map(renderSelectedRow)}</Stack>
                        </ContentCard>
                      ) : null}

                      <ContentCard>
                        <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary, mb: 1 }}>
                          {t('meals.planning.notes')}
                        </Typography>
                        <TextField
                          value={notes}
                          onChange={(e) => setNotes(e.target.value.slice(0, MEAL_PLAN_NOTES_MAX))}
                          placeholder={t('meals.menu.notesPlaceholder')}
                          fullWidth
                          multiline
                          minRows={4}
                          disabled={!canManage}
                          slotProps={{
                            htmlInput: { maxLength: MEAL_PLAN_NOTES_MAX },
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                              bgcolor: s.surface,
                              ...DASHBOARD_UX.inputText,
                            },
                          }}
                        />
                        <Typography
                          sx={{
                            ...DASHBOARD_UX.caption,
                            color: s.textMuted,
                            mt: 0.75,
                            textAlign: 'end',
                          }}
                        >
                          {`${notes.length}/${MEAL_PLAN_NOTES_MAX}`}
                        </Typography>
                      </ContentCard>
                    </Stack>
                  </Box>
                </Box>
              </>
            )}
      </Box>

      {showActionFooter ? (
        <Box sx={{ flexShrink: 0, zIndex: 2 }}>
          <ProgressiveMealPlanningBar
            phase={phase}
            saving={saving}
            saveDisabled={mainOptions.length === 0}
            shareDisabled={mainOptions.length === 0}
            canDeleteDraft={menu?.status === 'DRAFT' && options.length > 0}
            onContinueToExtras={continueToExtras}
            onSaveDraft={() => void persist(false)}
            onShareMeal={() => void persist(true)}
            onDeleteDraft={() => void clearDraft()}
          />
        </Box>
      ) : null}

      {mealType ? (
        <CopyPreviousMenuDialog
          open={copyOpen}
          spaceId={spaceId}
          targetDate={menuDate}
          preferredMealType={mealType}
          onClose={() => setCopyOpen(false)}
          onCopied={goBack}
        />
      ) : null}

      <CreateComboPlannerDialog
        open={createComboOpen}
        spaceId={spaceId}
        variant="planner"
        enableItemQuantities={needPrices}
        items={itemsQuery.items}
        categories={categoriesQuery.categories}
        existingOptions={options}
        existingComboNames={combosQuery.combos.map((c) => c.name)}
        onClose={() => setCreateComboOpen(false)}
        onCreatedCatalog={refreshCatalog}
        onSave={handleComboCreated}
      />

      <Dialog open={leaveOpen} onClose={() => setLeaveOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('meals.menu.unsavedTitle')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, whiteSpace: 'pre-line' }}>
            {t('meals.menu.unsavedMessage')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setLeaveOpen(false)} sx={dashOutlinedButtonSx}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => {
              setLeaveOpen(false);
              void persist(false);
            }}
            sx={dashOutlinedButtonSx}
          >
            {t('meals.actions.saveDraft')}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setLeaveOpen(false);
              void persist(true);
            }}
            sx={dashContainedButtonSx}
          >
            {t('meals.actions.shareMeal')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
