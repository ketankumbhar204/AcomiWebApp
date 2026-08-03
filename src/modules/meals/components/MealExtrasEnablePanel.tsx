import {
  Box,
  Button,
  Checkbox,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ContentCard } from '@/shared/components/ContentCard';
import { colors } from '@/shared/theme/colors';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import { spaceMealsLibraryPath } from '@/routes/paths';
import type { FoodItemResponse, MealComboResponse } from '@/shared/types/meals';
import { mealsApi } from '../api/mealsApi';
import { useMealMutations } from '../hooks/useMeals';
import type { MenuDraftOption } from '../utils/dailyMenuDraft';
import {
  buildMealExtraSuggestionBuckets,
  collectMealExtraCategorySeedIds,
  collectSelectedMealItemIds,
  toExtraPackage,
} from '../utils/mealExtrasSuggestions';
import { parsePriceInput, validatePriceInput } from '../utils/comboPrice';

type MealExtrasEnablePanelProps = {
  spaceId: string;
  options: MenuDraftOption[];
  comboById: Map<string, MealComboResponse>;
  catalogItems: FoodItemResponse[];
  enabledExtraIds: Set<string>;
  canManage: boolean;
  highlighted?: boolean;
  onToggleExtra: (item: FoodItemResponse, enabled: boolean, price?: number | null) => void;
  onCatalogChanged: () => void;
  onInteract: () => void;
};

/** MESS extras section — parity with mobile MealExtrasEnableSection. */
export function MealExtrasEnablePanel({
  spaceId,
  options,
  comboById,
  catalogItems,
  enabledExtraIds,
  canManage,
  highlighted = false,
  onToggleExtra,
  onCatalogChanged,
  onInteract,
}: MealExtrasEnablePanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const mutations = useMealMutations(spaceId);

  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseSearch, setBrowseSearch] = useState('');
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [addingAll, setAddingAll] = useState(false);
  /** User manually turned these off — do not auto-select again until they re-check. */
  const optedOutRef = useRef<Set<string>>(new Set());

  const hasMealSelection = options.some((o) => o.isExtra !== true);
  const mealItemIds = useMemo(
    () => collectSelectedMealItemIds(options, comboById),
    [comboById, options],
  );
  const categorySeeds = useMemo(
    () => collectMealExtraCategorySeedIds(options, comboById),
    [comboById, options],
  );
  const buckets = useMemo(
    () => buildMealExtraSuggestionBuckets(catalogItems, mealItemIds, categorySeeds),
    [catalogItems, categorySeeds, mealItemIds],
  );

  const libraryExtraCount = catalogItems.filter((i) => i.isActive && i.isExtra).length;

  const browseList = useMemo(() => {
    const q = browseSearch.trim().toLowerCase();
    return [...buckets.relevant, ...buckets.related, ...buckets.other].filter((item) => {
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.categoryName ?? '').toLowerCase().includes(q)
      );
    });
  }, [browseSearch, buckets.other, buckets.related, buckets.relevant]);

  /** In-meal library extras are selected by default (user can still turn off). */
  const autoAttemptedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!canManage || !hasMealSelection) return;
    for (const item of buckets.relevant) {
      if (enabledExtraIds.has(item.itemId)) {
        autoAttemptedRef.current.add(item.itemId);
        continue;
      }
      if (optedOutRef.current.has(item.itemId)) continue;
      if (autoAttemptedRef.current.has(item.itemId)) continue;
      autoAttemptedRef.current.add(item.itemId);
      onToggleExtra(item, true, item.defaultPrice ?? null);
    }
  }, [buckets.relevant, canManage, enabledExtraIds, hasMealSelection, onToggleExtra]);

  useEffect(() => {
    for (const id of [...optedOutRef.current]) {
      if (!mealItemIds.has(id)) optedOutRef.current.delete(id);
    }
    for (const id of [...autoAttemptedRef.current]) {
      if (!mealItemIds.has(id)) autoAttemptedRef.current.delete(id);
    }
  }, [mealItemIds]);

  const persistPrice = async (item: FoodItemResponse, text: string) => {
    onInteract();
    if (!text.trim()) return;
    if (validatePriceInput(text)) {
      enqueueSnackbar(t('meals.pricing.priceMustBePositive'), { variant: 'warning' });
      return;
    }
    const price = parsePriceInput(text);
    if (price == null) return;
    try {
      await mealsApi.updateFoodItemDefaultPrice(spaceId, item.itemId, {
        price,
        currencyCode: 'INR',
      });
      onCatalogChanged();
      if (enabledExtraIds.has(item.itemId)) {
        onToggleExtra(item, true, price);
      }
    } catch {
      enqueueSnackbar(t('meals.errors.actionFailed', { defaultValue: 'Action failed.' }), {
        variant: 'error',
      });
    }
  };

  const enableLibraryExtra = async (item: FoodItemResponse) => {
    optedOutRef.current.delete(item.itemId);
    onInteract();
    const draft = priceDrafts[item.itemId];
    let price = item.defaultPrice ?? null;
    if (draft?.trim()) {
      const parsed = parsePriceInput(draft);
      if (parsed != null) {
        price = parsed;
        await persistPrice(item, draft);
      }
    }
    onToggleExtra(item, true, price);
  };

  const disableExtra = (item: FoodItemResponse) => {
    optedOutRef.current.add(item.itemId);
    onInteract();
    onToggleExtra(item, false);
  };

  const addMissingAsExtra = async (item: FoodItemResponse) => {
    optedOutRef.current.delete(item.itemId);
    onInteract();
    try {
      const draft = priceDrafts[item.itemId];
      let price = item.defaultPrice ?? null;
      if (draft?.trim()) {
        const parsed = parsePriceInput(draft);
        if (parsed != null) price = parsed;
      }
      await mutations.updateFoodItemExtra.mutateAsync({
        itemId: item.itemId,
        body: { isExtra: true },
      });
      if (price != null && price > 0) {
        await mealsApi.updateFoodItemDefaultPrice(spaceId, item.itemId, {
          price,
          currencyCode: 'INR',
        });
      }
      onCatalogChanged();
      onToggleExtra({ ...item, isExtra: true, defaultPrice: price }, true, price);
      enqueueSnackbar(t('meals.planning.extraAddedToLibrary', { defaultValue: 'Added as extra.' }), {
        variant: 'success',
      });
    } catch {
      enqueueSnackbar(t('meals.errors.actionFailed', { defaultValue: 'Action failed.' }), {
        variant: 'error',
      });
    }
  };

  const addAllMissing = async () => {
    if (buckets.missing.length === 0 || addingAll) return;
    setAddingAll(true);
    onInteract();
    try {
      for (const item of buckets.missing) {
        optedOutRef.current.delete(item.itemId);
        await mutations.updateFoodItemExtra.mutateAsync({
          itemId: item.itemId,
          body: { isExtra: true },
        });
        const draft = priceDrafts[item.itemId];
        const parsed = draft?.trim() ? parsePriceInput(draft) : null;
        const price = parsed ?? item.defaultPrice ?? null;
        if (price != null && price > 0) {
          await mealsApi.updateFoodItemDefaultPrice(spaceId, item.itemId, {
            price,
            currencyCode: 'INR',
          });
        }
        onToggleExtra({ ...item, isExtra: true, defaultPrice: price }, true, price);
      }
      onCatalogChanged();
      enqueueSnackbar(
        t('meals.planning.extrasAddedToLibraryCount', { count: buckets.missing.length }),
        { variant: 'success' },
      );
    } catch {
      enqueueSnackbar(t('meals.errors.actionFailed', { defaultValue: 'Action failed.' }), {
        variant: 'error',
      });
    } finally {
      setAddingAll(false);
    }
  };

  const renderRow = (item: FoodItemResponse, mode: 'library' | 'missing') => {
    const enabled = enabledExtraIds.has(item.itemId);
    const priceText =
      priceDrafts[item.itemId] ??
      (item.defaultPrice != null ? String(item.defaultPrice) : '');

    return (
      <Box
        key={`${mode}-${item.itemId}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1.1,
          borderRadius: `${DASHBOARD_UX.tileRadius}px`,
          border: `1px solid ${enabled ? colors.primary : s.border}`,
          bgcolor: enabled ? `${colors.primary}0F` : s.surface,
        }}
      >
        <Checkbox
          checked={enabled}
          disabled={!canManage}
          onChange={(_, checked) => {
            if (mode === 'missing' && checked) {
              void addMissingAsExtra(item);
              return;
            }
            if (checked) void enableLibraryExtra(item);
            else disableExtra(item);
          }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }} noWrap>
            {item.name}
          </Typography>
          {item.categoryName ? (
            <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }} noWrap>
              {item.categoryName}
            </Typography>
          ) : null}
        </Box>
        {canManage ? (
          <TextField
            size="small"
            value={priceText}
            onChange={(e) =>
              setPriceDrafts((d) => ({ ...d, [item.itemId]: e.target.value }))
            }
            onBlur={() => void persistPrice(item, priceText)}
            placeholder="₹"
            sx={{ width: 110 }}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              },
            }}
          />
        ) : item.defaultPrice != null ? (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
            {formatCurrency(item.defaultPrice, item.currencyCode)}
          </Typography>
        ) : null}
      </Box>
    );
  };

  return (
    <Box
      sx={
        highlighted
          ? {
              borderRadius: `${DASHBOARD_UX.radius}px`,
              border: '1px solid #F59E0B',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.12)' : colors.warningTint,
              overflow: 'hidden',
            }
          : undefined
      }
    >
      <ContentCard padded={false}>
      <Box id="meal-extras-section" sx={{ p: `${DASHBOARD_UX.cardPadding + 4}px`, pb: 1.5 }}>
        <Typography sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
          {t('meals.planning.extrasSectionTitle')}
        </Typography>
        <Typography sx={{ ...DASHBOARD_UX.sectionSubtitle, color: s.textMuted, mt: 0.25 }}>
          {t('meals.planning.extrasSectionHint')}
        </Typography>
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>
        {!hasMealSelection ? (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
            {t('meals.planning.extrasSelectMealFirst')}
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {buckets.relevant.length > 0 ? (
              <Stack spacing={0.75}>
                <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary }}>
                  {t('meals.planning.extrasFromMealTitle', { count: buckets.relevant.length })}
                </Typography>
                {buckets.relevant.map((item) => renderRow(item, 'library'))}
              </Stack>
            ) : null}

            {buckets.missing.length > 0 ? (
              <Stack spacing={0.75}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary }}>
                    {t('meals.planning.extrasMissingTitle', { count: buckets.missing.length })}
                  </Typography>
                  {buckets.missing.length > 1 && canManage ? (
                    <Button
                      size="small"
                      disabled={addingAll}
                      onClick={() => void addAllMissing()}
                      sx={dashOutlinedButtonSx}
                    >
                      {t('meals.planning.extrasAddAllMissing')}
                    </Button>
                  ) : null}
                </Stack>
                <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}>
                  {t('meals.planning.extrasMissingHint')}
                </Typography>
                {buckets.missing.map((item) => renderRow(item, 'missing'))}
              </Stack>
            ) : null}

            {buckets.related.length > 0 ? (
              <Stack spacing={0.75}>
                <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary }}>
                  {t('meals.planning.extrasRelatedTitle', { count: buckets.related.length })}
                </Typography>
                {buckets.related.map((item) => renderRow(item, 'library'))}
              </Stack>
            ) : null}

            {libraryExtraCount > 0 ? (
              <Box>
                <Link
                  component="button"
                  type="button"
                  underline="hover"
                  onClick={() => setBrowseOpen((o) => !o)}
                  sx={{ ...DASHBOARD_UX.link, color: colors.primaryDark }}
                >
                  {browseOpen
                    ? t('meals.planning.extrasBrowseHide', { count: libraryExtraCount })
                    : t('meals.planning.extrasBrowseShow', { count: libraryExtraCount })}
                </Link>
                {browseOpen ? (
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <TextField
                      size="small"
                      value={browseSearch}
                      onChange={(e) => setBrowseSearch(e.target.value)}
                      placeholder={t('meals.planning.extrasBrowseSearch')}
                    />
                    {browseList.map((item) => renderRow(item, 'library'))}
                  </Stack>
                ) : null}
              </Box>
            ) : null}

            {canManage ? (
              <Link
                component="button"
                type="button"
                underline="hover"
                onClick={() => {
                  onInteract();
                  navigate(spaceMealsLibraryPath(spaceId));
                }}
                sx={{ ...DASHBOARD_UX.link, color: colors.primaryDark, alignSelf: 'flex-start' }}
              >
                {t('meals.planning.manageExtrasCta')}
              </Link>
            ) : null}

            {enabledExtraIds.size > 0 ? (
              <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}>
                {t('meals.planning.extrasEnabledCount', { count: enabledExtraIds.size })}
              </Typography>
            ) : null}
          </Stack>
        )}
      </Box>
    </ContentCard>
    </Box>
  );
}

export { toExtraPackage };
