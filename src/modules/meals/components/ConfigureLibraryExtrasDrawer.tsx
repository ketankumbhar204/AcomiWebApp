import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { FoodCategoryResponse, FoodItemResponse } from '@/shared/types/meals';
import { useMealMutations } from '../hooks/useMeals';
import { hasComboPrice, parsePriceInput, validatePriceInput } from '../utils/comboPrice';

type ConfigureLibraryExtrasDrawerProps = {
  open: boolean;
  spaceId: string;
  items: FoodItemResponse[];
  categories: FoodCategoryResponse[];
  onClose: () => void;
};

type ExtraGroup = {
  categoryId: string;
  categoryName: string;
  items: FoodItemResponse[];
};

function buildDraftExtra(items: FoodItemResponse[]): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  for (const item of items) {
    if (item.isActive) {
      next[item.itemId] = item.isExtra === true;
    }
  }
  return next;
}

function buildDraftPrices(items: FoodItemResponse[]): Record<string, string> {
  const next: Record<string, string> = {};
  for (const item of items) {
    if (item.isActive && hasComboPrice(item.defaultPrice)) {
      next[item.itemId] = String(item.defaultPrice);
    }
  }
  return next;
}

/**
 * Mess Configure Extras — toggle library items as extras and set default prices.
 * Parity with mobile ConfigureLibraryExtrasSheet.
 */
export function ConfigureLibraryExtrasDrawer({
  open,
  spaceId,
  items,
  categories,
  onClose,
}: ConfigureLibraryExtrasDrawerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const mutations = useMealMutations(spaceId);

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [draftExtra, setDraftExtra] = useState<Record<string, boolean>>({});
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [priceErrors, setPriceErrors] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setCategoryId('');
    setDraftExtra(buildDraftExtra(items));
    setDraftPrices(buildDraftPrices(items));
    setPriceErrors({});
  }, [items, open]);

  const activeItems = useMemo(() => items.filter((i) => i.isActive), [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeItems.filter((item) => {
      if (categoryId && item.categoryId !== categoryId) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.categoryName ?? '').toLowerCase().includes(q)
      );
    });
  }, [activeItems, categoryId, search]);

  const groups = useMemo((): ExtraGroup[] => {
    const byCat = new Map<string, ExtraGroup>();
    for (const item of filteredItems) {
      const existing = byCat.get(item.categoryId);
      if (existing) {
        existing.items.push(item);
      } else {
        byCat.set(item.categoryId, {
          categoryId: item.categoryId,
          categoryName:
            item.categoryName ??
            categories.find((c) => c.categoryId === item.categoryId)?.name ??
            t('meals.library.category'),
          items: [item],
        });
      }
    }
    return Array.from(byCat.values()).sort((a, b) =>
      a.categoryName.localeCompare(b.categoryName),
    );
  }, [categories, filteredItems, t]);

  const setExtra = async (item: FoodItemResponse, isExtra: boolean) => {
    setBusyId(item.itemId);
    setDraftExtra((prev) => ({ ...prev, [item.itemId]: isExtra }));
    try {
      await mutations.updateFoodItemExtra.mutateAsync({
        itemId: item.itemId,
        body: { isExtra },
      });
      enqueueSnackbar(t('meals.library.extrasUpdated'), { variant: 'success' });
    } catch {
      setDraftExtra((prev) => ({ ...prev, [item.itemId]: item.isExtra === true }));
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const persistPrice = async (item: FoodItemResponse) => {
    const draft = (draftPrices[item.itemId] ?? '').trim();
    const enabled = draftExtra[item.itemId] === true;
    if (!draft) {
      if (enabled) {
        setPriceErrors((prev) => ({
          ...prev,
          [item.itemId]: t('meals.pricing.priceRequired', {
            defaultValue: 'Price is required for extras.',
          }),
        }));
      }
      return;
    }
    const validation = validatePriceInput(draft);
    if (validation) {
      setPriceErrors((prev) => ({
        ...prev,
        [item.itemId]:
          validation === 'nonPositive'
            ? t('meals.pricing.priceMustBePositive')
            : t('meals.pricing.priceInvalid'),
      }));
      return;
    }
    const price = parsePriceInput(draft);
    if (price == null) return;
    if (hasComboPrice(item.defaultPrice) && Number(item.defaultPrice) === price) {
      setPriceErrors((prev) => {
        const next = { ...prev };
        delete next[item.itemId];
        return next;
      });
      return;
    }
    setBusyId(item.itemId);
    try {
      await mutations.updateFoodItemDefaultPrice.mutateAsync({
        itemId: item.itemId,
        body: { price, currencyCode: 'INR' },
      });
      setPriceErrors((prev) => {
        const next = { ...prev };
        delete next[item.itemId];
        return next;
      });
      enqueueSnackbar(t('meals.library.createSuccess'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const bulkSet = async (enable: boolean) => {
    const targets = filteredItems.filter((item) => (item.isExtra === true) !== enable);
    if (targets.length === 0) return;
    setBulkBusy(true);
    try {
      for (const item of targets) {
        setDraftExtra((prev) => ({ ...prev, [item.itemId]: enable }));
        await mutations.updateFoodItemExtra.mutateAsync({
          itemId: item.itemId,
          body: { isExtra: enable },
        });
      }
      enqueueSnackbar(t('meals.library.extrasUpdated'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
      setDraftExtra(buildDraftExtra(items));
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <AppDrawer open={open} onClose={onClose} width={520}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box
          sx={{
            p: `${DASHBOARD_UX.cardPadding}px`,
            borderBottom: `1px solid ${s.border}`,
          }}
        >
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
            {t('meals.library.configureExtrasTitle')}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.35 }}>
            {t('meals.library.configureExtrasHint')}
          </Typography>
        </Box>

        <Box sx={{ p: `${DASHBOARD_UX.cardPadding}px`, flex: 1, overflow: 'auto' }}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <TextField
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('meals.library.searchExtrasPlaceholder')}
                sx={{ flex: '1 1 160px' }}
              />
              <FormControl size="small" sx={{ minWidth: 140, flex: '1 1 140px' }}>
                <InputLabel>{t('meals.library.category')}</InputLabel>
                <Select
                  label={t('meals.library.category')}
                  value={categoryId}
                  onChange={(e) => setCategoryId(String(e.target.value))}
                >
                  <MenuItem value="">{t('meals.library.categoryFilterAll')}</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.categoryId} value={c.categoryId}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              <Button
                size="small"
                disabled={bulkBusy}
                onClick={() => void bulkSet(true)}
                sx={dashOutlinedButtonSx}
              >
                {t('meals.library.enableAllExtras')}
              </Button>
              <Button
                size="small"
                disabled={bulkBusy}
                onClick={() => void bulkSet(false)}
                sx={dashOutlinedButtonSx}
              >
                {t('meals.library.disableAllExtras')}
              </Button>
            </Stack>

            {groups.length === 0 ? (
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted, py: 2 }}>
                {t('meals.library.searchExtrasEmpty')}
              </Typography>
            ) : (
              groups.map((group) => (
                <Box key={group.categoryId}>
                  <Typography
                    sx={{
                      ...DASHBOARD_UX.metricLabel,
                      color: s.textSecondary,
                      mb: 0.75,
                      mt: 0.5,
                    }}
                  >
                    {group.categoryName}
                  </Typography>
                  <Stack spacing={1}>
                    {group.items.map((item) => {
                      const enabled = draftExtra[item.itemId] === true;
                      const busy = busyId === item.itemId || bulkBusy;
                      return (
                        <Box
                          key={item.itemId}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                            p: 1,
                            borderRadius: `${DASHBOARD_UX.radius}px`,
                            border: `1px solid ${s.border}`,
                            bgcolor: s.surface,
                          }}
                        >
                          <Box sx={{ flex: '1 1 140px', minWidth: 0 }}>
                            <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }} noWrap>
                              {item.name}
                            </Typography>
                          </Box>
                          <Switch
                            size="small"
                            checked={enabled}
                            disabled={busy}
                            onChange={(_, checked) => void setExtra(item, checked)}
                            inputProps={{
                              'aria-label': t('meals.library.toggleExtraA11y', {
                                name: item.name,
                              }),
                            }}
                          />
                          <TextField
                            size="small"
                            disabled={busy || !enabled}
                            value={draftPrices[item.itemId] ?? ''}
                            onChange={(e) =>
                              setDraftPrices((prev) => ({
                                ...prev,
                                [item.itemId]: e.target.value,
                              }))
                            }
                            onBlur={() => void persistPrice(item)}
                            error={Boolean(priceErrors[item.itemId])}
                            helperText={priceErrors[item.itemId]}
                            placeholder={t('meals.pricing.pricePlaceholder')}
                            sx={{ width: 120 }}
                            slotProps={{
                              input: {
                                startAdornment: (
                                  <InputAdornment position="start">₹</InputAdornment>
                                ),
                              },
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              ))
            )}
          </Stack>
        </Box>

        <StickyFooter>
          <Button
            variant="contained"
            onClick={onClose}
            sx={{
              ...dashContainedButtonSx,
              minHeight: DASHBOARD_UX.buttonHeight,
              height: DASHBOARD_UX.buttonHeight,
              bgcolor: colors.primaryDark,
              '&:hover': { bgcolor: colors.primaryHover },
            }}
          >
            {t('common.close')}
          </Button>
        </StickyFooter>
      </Box>
    </AppDrawer>
  );
}
