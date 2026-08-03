import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { Minus, Plus, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { FoodCategoryResponse, FoodItemResponse, FoodType } from '@/shared/types/meals';
import { useMealMutations } from '../hooks/useMeals';
import {
  buildItemQuantitiesPayload,
  normalizeComboItemQuantity,
  syncItemQuantities,
} from '../utils/comboIncludes';
import { nextComboName } from '../utils/comboNaming';
import { parsePriceInput, validatePriceInput } from '../utils/comboPrice';
import type { MenuDraftOption } from '../utils/dailyMenuDraft';
import { InlineCreateCategoryRow } from './CategoryFormDialog';

export type CreateComboPlannerResult = {
  name: string;
  itemIds: string[];
  saveToLibrary: boolean;
  price: number | null;
  itemQuantities?: Array<{ itemId: string; quantity: number }>;
  /** When saveToLibrary true, created combo id */
  comboId?: string;
};

type CreateComboPlannerDialogProps = {
  open: boolean;
  spaceId: string;
  enableItemQuantities: boolean;
  items: FoodItemResponse[];
  categories: FoodCategoryResponse[];
  existingOptions: MenuDraftOption[];
  existingComboNames: string[];
  onClose: () => void;
  onCreatedCatalog?: () => void;
  onSave: (result: CreateComboPlannerResult) => Promise<void>;
  /**
   * `planner` — optional save-to-library (ad-hoc package allowed).
   * `library` — always saves to combo library (Menu Library create).
   */
  variant?: 'planner' | 'library';
};

/** Planner create-combo dialog — parity with mobile CreateComboSheet. */
export function CreateComboPlannerDialog({
  open,
  spaceId,
  enableItemQuantities,
  items,
  categories,
  existingOptions,
  existingComboNames,
  onClose,
  onCreatedCatalog,
  onSave,
  variant = 'planner',
}: CreateComboPlannerDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const mutations = useMealMutations(spaceId);
  const libraryOnly = variant === 'library';

  const [name, setName] = useState('');
  const [priceText, setPriceText] = useState('');
  const [priceError, setPriceError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const labels = [...existingOptions.map((o) => o.label), ...existingComboNames];
    setName(nextComboName(labels));
    setPriceText('');
    setPriceError(null);
    setSelectedIds([]);
    setItemQuantities({});
    setSaveToLibrary(true);
    setSearch('');
    setCategoryId('');
  }, [existingComboNames, existingOptions, libraryOnly, open]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (!item.isActive) return false;
      if (categoryId && item.categoryId !== categoryId) return false;
      if (q && !item.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [categoryId, items, search]);

  const selectedItems = useMemo(
    () =>
      selectedIds
        .map((id) => items.find((item) => item.itemId === id))
        .filter((item): item is FoodItemResponse => item != null),
    [items, selectedIds],
  );

  const toggleItem = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId];
      setItemQuantities((qty) => syncItemQuantities(qty, next));
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      enqueueSnackbar(t('meals.library.comboItemsRequired', { defaultValue: 'Select at least one item.' }), {
        variant: 'warning',
      });
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      enqueueSnackbar(t('meals.library.comboNameRequired', { defaultValue: 'Combo name is required.' }), {
        variant: 'warning',
      });
      return;
    }
    if (priceText.trim()) {
      const err = validatePriceInput(priceText);
      if (err) {
        setPriceError(t('meals.pricing.priceMustBePositive'));
        return;
      }
    }
    const price = priceText.trim() ? parsePriceInput(priceText) : null;
    setSaving(true);
    try {
      const quantities =
        enableItemQuantities
          ? buildItemQuantitiesPayload(selectedIds, itemQuantities)
          : undefined;

      if (saveToLibrary || libraryOnly) {
        const created = await mutations.createMealCombo.mutateAsync({
          name: trimmed,
          itemIds: selectedIds,
          price: price ?? undefined,
          currencyCode: price != null ? 'INR' : undefined,
          ...(quantities ? { itemQuantities: quantities } : {}),
        });
        enqueueSnackbar(t('meals.planning.comboSavedToLibrary', { name: trimmed }), {
          variant: 'success',
        });
        onCreatedCatalog?.();
        await onSave({
          name: trimmed,
          itemIds: selectedIds,
          saveToLibrary: true,
          price: created.price ?? price,
          itemQuantities: quantities,
          comboId: created.comboId,
        });
      } else {
        enqueueSnackbar(t('meals.planning.comboAdded', { name: trimmed }), { variant: 'success' });
        await onSave({
          name: trimmed,
          itemIds: selectedIds,
          saveToLibrary: false,
          price,
          itemQuantities: quantities,
        });
      }
      onClose();
    } catch {
      enqueueSnackbar(t('meals.errors.saveFailed'), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ ...DASHBOARD_UX.sectionHeading, color: s.textPrimary }}>
        {t('meals.planning.createComboTitle', { defaultValue: 'Create New Combo' })}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            useFlexGap
            sx={{ alignItems: { sm: 'flex-start' } }}
          >
            <TextField
              size="small"
              label={t('meals.library.comboNameLabel', { defaultValue: 'Combo name' })}
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              sx={{
                flex: '1 1 240px',
                '& .MuiOutlinedInput-root': { borderRadius: `${DASHBOARD_UX.buttonRadius}px` },
              }}
            />
            <TextField
              size="small"
              label={t('meals.pricing.priceOptional', { defaultValue: 'Price (optional)' })}
              value={priceText}
              onChange={(e) => {
                setPriceText(e.target.value);
                setPriceError(null);
              }}
              error={Boolean(priceError)}
              helperText={priceError}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                },
              }}
              sx={{
                width: { xs: '100%', sm: 180 },
                flexShrink: 0,
                '& .MuiOutlinedInput-root': { borderRadius: `${DASHBOARD_UX.buttonRadius}px` },
              }}
            />
          </Stack>
          <FormControlLabel
            control={
              <Switch
                checked={libraryOnly ? true : saveToLibrary}
                disabled={libraryOnly}
                onChange={(e) => setSaveToLibrary(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }}>
                {t('meals.planning.saveToComboLibrary', {
                  defaultValue: 'Save to Combo Library',
                })}
              </Typography>
            }
          />

          {/* Selected items summary — mobile PlanningSelectionSection parity */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: `${DASHBOARD_UX.radius}px`,
              border: `1px solid ${s.border}`,
              bgcolor: s.elevated,
            }}
          >
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
                {t('meals.planning.comboItemsLabel', { defaultValue: 'Combo items' })}
              </Typography>
              {selectedIds.length > 0 ? (
                <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }}>
                  {t('meals.planning.selectedCount', { count: selectedIds.length })}
                </Typography>
              ) : null}
            </Stack>
            {selectedItems.length === 0 ? (
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
                {t('meals.planning.noItemsSelected', {
                  defaultValue: 'No items selected yet. Pick from the list below.',
                })}
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {selectedItems.map((item) => (
                  <Box
                    key={item.itemId}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1,
                      py: 0.4,
                      borderRadius: 99,
                      border: `1px solid ${colors.primary}`,
                      bgcolor: `${colors.primary}14`,
                      color: colors.primaryDark,
                      ...DASHBOARD_UX.badge,
                    }}
                  >
                    {item.name}
                    {enableItemQuantities && (itemQuantities[item.itemId] ?? 1) > 1
                      ? ` ×${itemQuantities[item.itemId]}`
                      : ''}
                    <IconButton
                      size="small"
                      aria-label={t('common.remove', { defaultValue: 'Remove' })}
                      onClick={() => toggleItem(item.itemId)}
                      sx={{ p: 0.15, color: colors.primaryDark }}
                    >
                      <X size={12} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('meals.library.search')}
              sx={{ flex: '1 1 180px' }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color={s.textMuted} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>

          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
            <ChipButton
              active={!categoryId}
              label={t('common.all', { defaultValue: 'All' })}
              onClick={() => setCategoryId('')}
            />
            {categories
              .filter((c) => c.isActive !== false)
              .map((c) => (
                <ChipButton
                  key={c.categoryId}
                  active={categoryId === c.categoryId}
                  label={c.name}
                  onClick={() => setCategoryId(c.categoryId)}
                />
              ))}
            <InlineCreateCategoryRow
              spaceId={spaceId}
              variant="chip"
              onCreated={(id) => {
                onCreatedCatalog?.();
                setCategoryId(id);
              }}
            />
          </Box>

          <InlineCreateItemRowWithFoodType
            spaceId={spaceId}
            categories={categories}
            defaultCategoryId={categoryId}
            onCreated={(itemId) => {
              onCreatedCatalog?.();
              toggleItem(itemId);
            }}
          />

          <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary }}>
            {t('meals.library.items')}
          </Typography>
          <Stack spacing={0.75} sx={{ maxHeight: 240, overflow: 'auto' }}>
            {filteredItems.map((item) => {
              const selected = selectedIds.includes(item.itemId);
              const qty = itemQuantities[item.itemId] ?? 1;
              return (
                <Box
                  key={item.itemId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                    border: `1px solid ${selected ? colors.primary : s.border}`,
                    bgcolor: selected ? `${colors.primary}14` : s.surface,
                  }}
                >
                  <Checkbox
                    checked={selected}
                    onChange={() => toggleItem(item.itemId)}
                    size="small"
                  />
                  <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, flex: 1 }} noWrap>
                    {item.name}
                  </Typography>
                  {enableItemQuantities && selected ? (
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        disabled={qty <= 1}
                        onClick={() =>
                          setItemQuantities((q) => ({
                            ...q,
                            [item.itemId]: normalizeComboItemQuantity(qty - 1),
                          }))
                        }
                      >
                        <Minus size={14} />
                      </IconButton>
                      <Typography sx={{ ...DASHBOARD_UX.body, minWidth: 20, textAlign: 'center' }}>
                        {qty}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setItemQuantities((q) => ({
                            ...q,
                            [item.itemId]: normalizeComboItemQuantity(qty + 1),
                          }))
                        }
                      >
                        <Plus size={14} />
                      </IconButton>
                    </Stack>
                  ) : null}
                </Box>
              );
            })}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={dashOutlinedButtonSx}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          disabled={saving}
          onClick={() => void handleSubmit()}
          sx={dashContainedButtonSx}
        >
          {t('meals.planning.createComboCta', { defaultValue: 'Create combo' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

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
      }}
    >
      {label}
    </Box>
  );
}

/** Inline item create with food type — mobile Items-tab parity. */
function InlineCreateItemRowWithFoodType({
  spaceId,
  categories,
  defaultCategoryId,
  onCreated,
}: {
  spaceId: string;
  categories: FoodCategoryResponse[];
  defaultCategoryId?: string;
  onCreated?: (itemId: string) => void;
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
      <Button size="small" onClick={() => setOpen(true)} sx={dashOutlinedButtonSx}>
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
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        sx={{ minWidth: 140 }}
        slotProps={{ select: { native: true } }}
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
        value={foodType}
        onChange={(e) => setFoodType(e.target.value as FoodType)}
        sx={{ minWidth: 110 }}
        slotProps={{ select: { native: true } }}
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
              onCreated?.(created.itemId);
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
