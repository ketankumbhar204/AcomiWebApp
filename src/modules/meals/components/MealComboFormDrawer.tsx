import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { Egg, Leaf, Minus, Plus, Search, Trash2, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type {
  FoodCategoryResponse,
  FoodItemResponse,
  FoodType,
  MealComboResponse,
} from '@/shared/types/meals';
import { useMealMutations } from '../hooks/useMeals';
import {
  buildItemQuantitiesPayload,
  normalizeComboItemQuantity,
  syncItemQuantities,
} from '../utils/comboIncludes';
import { parsePriceInput, validatePriceInput } from '../utils/comboPrice';
import { InlineCreateCategoryRow, InlineCreateItemRow } from './CategoryFormDialog';

function itemAccent(foodType?: FoodType | null): string {
  switch (foodType) {
    case 'VEG':
      return colors.success;
    case 'EGG':
      return '#D97706';
    case 'NON_VEG':
      return '#DC2626';
    default:
      return colors.primaryDark;
  }
}

function itemIcon(foodType?: FoodType | null): LucideIcon {
  switch (foodType) {
    case 'VEG':
      return Leaf;
    case 'EGG':
      return Egg;
    default:
      return UtensilsCrossed;
  }
}

type MealComboFormDrawerProps = {
  open: boolean;
  mode: 'create' | 'edit';
  combo: MealComboResponse | null;
  spaceId: string;
  enableItemQuantities: boolean;
  items: FoodItemResponse[];
  categories: FoodCategoryResponse[];
  onClose: () => void;
};

/**
 * Full combo create/edit drawer — parity with mobile MealComboFormScreen.
 * Fields: name, description, optional price (INR), item multi-select, Mess quantities.
 */
export function MealComboFormDrawer({
  open,
  mode,
  combo,
  spaceId,
  enableItemQuantities,
  items,
  categories,
  onClose,
}: MealComboFormDrawerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const mutations = useMealMutations(spaceId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceText, setPriceText] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [categoryFilter, setCategoryFilter] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!open) {
      return;
    }
    if (isEdit && combo) {
      setName(combo.name);
      setDescription(combo.description ?? '');
      setPriceText(combo.price != null && combo.price > 0 ? String(combo.price) : '');
      const ids = combo.items?.map((item) => item.itemId) ?? [];
      setSelectedItemIds(ids);
      const qty: Record<string, number> = {};
      for (const item of combo.items ?? []) {
        qty[item.itemId] =
          item.quantity != null && item.quantity >= 1 ? item.quantity : 1;
      }
      setItemQuantities(qty);
    } else {
      setName('');
      setDescription('');
      setPriceText('');
      setSelectedItemIds([]);
      setItemQuantities({});
    }
    setCategoryFilter('');
    setItemSearch('');
    setNameError(null);
    setItemsError(null);
    setPriceError(null);
  }, [combo, isEdit, open]);

  const activeItems = useMemo(
    () => items.filter((item) => item.isActive),
    [items],
  );

  const pickerItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    return activeItems.filter((item) => {
      if (categoryFilter && item.categoryId !== categoryFilter) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        item.name.toLowerCase().includes(q) ||
        (item.categoryName ?? '').toLowerCase().includes(q)
      );
    });
  }, [activeItems, categoryFilter, itemSearch]);

  const selectedItems = useMemo(
    () =>
      selectedItemIds
        .map((id) => activeItems.find((item) => item.itemId === id))
        .filter((item): item is FoodItemResponse => item != null),
    [activeItems, selectedItemIds],
  );

  const toggleItem = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId];
      setItemQuantities((qty) => syncItemQuantities(qty, next));
      return next;
    });
    setItemsError(null);
  };

  const setQuantity = (itemId: string, quantity: number) => {
    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: normalizeComboItemQuantity(quantity),
    }));
  };

  const handleSubmit = async () => {
    let valid = true;
    if (!name.trim()) {
      setNameError(t('meals.library.comboNameRequired'));
      valid = false;
    } else {
      setNameError(null);
    }
    if (selectedItemIds.length === 0) {
      setItemsError(t('meals.library.comboItemsRequired'));
      valid = false;
    } else {
      setItemsError(null);
    }
    const priceValidation = validatePriceInput(priceText);
    if (priceValidation) {
      setPriceError(
        priceValidation === 'nonPositive'
          ? t('meals.pricing.priceMustBePositive')
          : t('meals.pricing.priceInvalid'),
      );
      valid = false;
    } else {
      setPriceError(null);
    }
    if (!valid) {
      return;
    }

    const body = {
      name: name.trim(),
      description: description.trim() || null,
      itemIds: selectedItemIds,
      ...(enableItemQuantities
        ? { itemQuantities: buildItemQuantitiesPayload(selectedItemIds, itemQuantities) }
        : {}),
      price: parsePriceInput(priceText),
      currencyCode: 'INR' as const,
    };

    setSubmitting(true);
    try {
      if (isEdit && combo) {
        await mutations.updateMealCombo.mutateAsync({ comboId: combo.comboId, body });
        enqueueSnackbar(t('meals.library.comboUpdateSuccess'), { variant: 'success' });
      } else {
        await mutations.createMealCombo.mutateAsync(body);
        enqueueSnackbar(t('meals.library.comboCreateSuccess'), { variant: 'success' });
      }
      onClose();
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppDrawer open={open} onClose={onClose} width={480}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box
          sx={{
            p: `${DASHBOARD_UX.cardPadding}px`,
            borderBottom: `1px solid ${s.border}`,
          }}
        >
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
            {isEdit ? t('meals.library.editCombo') : t('meals.library.createCombo')}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.35 }}>
            {t('meals.library.addComboHint')}
          </Typography>
        </Box>

        <Box sx={{ p: `${DASHBOARD_UX.cardPadding}px`, flex: 1, overflow: 'auto' }}>
          <Stack spacing={2}>
            <TextField
              label={t('meals.library.comboNameLabel')}
              placeholder={t('meals.library.comboNamePlaceholder')}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(null);
              }}
              error={Boolean(nameError)}
              helperText={nameError}
              fullWidth
              size="small"
              required
            />

            <TextField
              label={t('meals.library.comboDescriptionLabel')}
              placeholder={t('meals.library.comboDescriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              size="small"
              multiline
              minRows={2}
            />

            <TextField
              label={t('meals.pricing.priceOptionalLabel')}
              placeholder={t('meals.pricing.pricePlaceholder')}
              value={priceText}
              onChange={(e) => {
                setPriceText(e.target.value);
                setPriceError(null);
              }}
              error={Boolean(priceError)}
              helperText={priceError}
              fullWidth
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography sx={{ ...DASHBOARD_UX.body, fontWeight: 600 }}>₹</Typography>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Box>
              <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary, mb: 0.75 }}>
                {t('meals.library.comboItemsLabel')}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted, mb: 1 }}>
                {t('meals.library.comboItemsHint')}
              </Typography>

              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 1 }}>
                <FormControl size="small" sx={{ minWidth: 140, flex: '1 1 140px' }}>
                  <InputLabel id="combo-item-category">
                    {t('meals.library.category')}
                  </InputLabel>
                  <Select
                    labelId="combo-item-category"
                    label={t('meals.library.category')}
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(String(e.target.value))}
                  >
                    <MenuItem value="">{t('meals.library.allCategories')}</MenuItem>
                    {categories.map((c) => (
                      <MenuItem key={c.categoryId} value={c.categoryId}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder={t('meals.library.searchItems')}
                  sx={{
                    flex: '1 1 160px',
                    '& .MuiOutlinedInput-root': {
                      minHeight: DASHBOARD_UX.buttonHeight,
                      height: DASHBOARD_UX.buttonHeight,
                    },
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search size={14} color={s.textMuted} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 1 }}>
                <InlineCreateCategoryRow
                  spaceId={spaceId}
                  onCreated={(id) => setCategoryFilter(id)}
                />
                <InlineCreateItemRow
                  spaceId={spaceId}
                  categories={categories}
                  defaultCategoryId={categoryFilter || undefined}
                  onCreated={(itemId) => {
                    setSelectedItemIds((prev) => {
                      if (prev.includes(itemId)) return prev;
                      const next = [...prev, itemId];
                      setItemQuantities((qty) => syncItemQuantities(qty, next));
                      return next;
                    });
                    setItemsError(null);
                  }}
                />
              </Stack>

              <Box
                sx={{
                  maxHeight: 220,
                  overflow: 'auto',
                  border: `1px solid ${itemsError ? colors.danger : s.border}`,
                  borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                  bgcolor: s.elevated,
                }}
              >
                {pickerItems.length === 0 ? (
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted, p: 1.5 }}>
                    {t('meals.library.emptyItems')}
                  </Typography>
                ) : (
                  pickerItems.map((item) => (
                    <FormControlLabel
                      key={item.itemId}
                      control={
                        <Checkbox
                          size="small"
                          checked={selectedItemIds.includes(item.itemId)}
                          onChange={() => toggleItem(item.itemId)}
                        />
                      }
                      label={
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }} noWrap>
                            {item.name}
                          </Typography>
                          {item.categoryName ? (
                            <Typography
                              sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}
                              noWrap
                            >
                              {item.categoryName}
                            </Typography>
                          ) : null}
                        </Box>
                      }
                      sx={{
                        m: 0,
                        px: 1,
                        py: 0.5,
                        width: '100%',
                        borderBottom: `1px solid ${s.border}`,
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    />
                  ))
                )}
              </Box>
              {itemsError ? (
                <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: colors.danger, mt: 0.5 }}>
                  {itemsError}
                </Typography>
              ) : (
                <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted, mt: 0.5 }}>
                  {t('meals.library.selectedCount', { count: selectedItemIds.length })}
                </Typography>
              )}
            </Box>

            {selectedItems.length > 0 ? (
              <Box>
                <Typography
                  sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary, mb: 0.75 }}
                >
                  {enableItemQuantities
                    ? t('meals.combo.itemQuantitiesTitle')
                    : t('meals.library.comboItemsLabel')}
                </Typography>
                <Stack spacing={0.75}>
                  {selectedItems.map((item) => {
                    const qty = normalizeComboItemQuantity(itemQuantities[item.itemId]);
                    const Icon = itemIcon(item.foodType);
                    return (
                      <Box
                        key={item.itemId}
                        sx={{
                          px: 1,
                          py: 0.75,
                          borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                          border: `1px solid ${s.border}`,
                          bgcolor: s.surface,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          minWidth: 0,
                        }}
                      >
                        <IconBadge accent={itemAccent(item.foodType)}>
                          <Icon />
                        </IconBadge>
                        <Typography
                          sx={{
                            ...DASHBOARD_UX.body,
                            fontWeight: 600,
                            color: s.textPrimary,
                            flex: 1,
                            minWidth: 0,
                          }}
                          noWrap
                        >
                          {item.name}
                        </Typography>

                        {enableItemQuantities ? (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{ alignItems: 'center', flexShrink: 0 }}
                          >
                            <IconButton
                              size="small"
                              aria-label={t('meals.combo.decreaseQuantity', {
                                name: item.name,
                                defaultValue: `Decrease ${item.name}`,
                              })}
                              disabled={qty <= 1}
                              onClick={() => setQuantity(item.itemId, qty - 1)}
                              sx={{
                                width: 28,
                                height: 28,
                                border: `1px solid ${s.border}`,
                                borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                                color: s.textPrimary,
                                '&:hover': {
                                  bgcolor: s.elevated,
                                  borderColor: `${colors.primaryDark}55`,
                                },
                                '&.Mui-disabled': { opacity: 0.4 },
                              }}
                            >
                              <Minus size={12} />
                            </IconButton>
                            <Typography
                              sx={{
                                ...DASHBOARD_UX.body,
                                fontWeight: 600,
                                minWidth: 20,
                                textAlign: 'center',
                                color: s.textPrimary,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {qty}
                            </Typography>
                            <IconButton
                              size="small"
                              aria-label={t('meals.combo.increaseQuantity', {
                                name: item.name,
                                defaultValue: `Increase ${item.name}`,
                              })}
                              onClick={() => setQuantity(item.itemId, qty + 1)}
                              sx={{
                                width: 28,
                                height: 28,
                                border: `1px solid ${s.border}`,
                                borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                                color: s.textPrimary,
                                '&:hover': {
                                  bgcolor: s.elevated,
                                  borderColor: `${colors.primaryDark}55`,
                                },
                              }}
                            >
                              <Plus size={12} />
                            </IconButton>
                          </Stack>
                        ) : null}

                        <Button
                          size="small"
                          aria-label={t('meals.library.removeItem')}
                          onClick={() => toggleItem(item.itemId)}
                          startIcon={<Trash2 size={14} />}
                          sx={{
                            ...dashOutlinedButtonSx,
                            minHeight: 28,
                            height: 28,
                            px: 1,
                            flexShrink: 0,
                            color: s.textMuted,
                            borderColor: 'transparent',
                            bgcolor: 'transparent',
                            '& .MuiButton-startIcon': { mr: 0.5 },
                            '&:hover': {
                              color: colors.danger,
                              bgcolor: `${colors.danger}14`,
                              borderColor: `${colors.danger}33`,
                            },
                          }}
                        >
                          {t('common.remove', { defaultValue: 'Remove' })}
                        </Button>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            ) : null}
          </Stack>
        </Box>

        <StickyFooter>
          <Button onClick={onClose} disabled={submitting} sx={dashOutlinedButtonSx}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            sx={{
              ...dashContainedButtonSx,
              minHeight: DASHBOARD_UX.buttonHeight,
              height: DASHBOARD_UX.buttonHeight,
              bgcolor: colors.primaryDark,
              '&:hover': { bgcolor: colors.primaryHover },
            }}
          >
            {t('common.save')}
          </Button>
        </StickyFooter>
      </Box>
    </AppDrawer>
  );
}
