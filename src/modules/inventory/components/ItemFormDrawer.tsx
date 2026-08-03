import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type {
  CreateInventoryItemRequest,
  InventoryItem,
  InventoryUnit,
  UpdateInventoryItemRequest,
} from '@/shared/types/inventory';
import type { SpaceType } from '@/shared/types/space';
import {
  useInventoryCategories,
  useInventoryMutations,
  useInventorySuppliers,
} from '../hooks/useInventory';
import { defaultUnitsForSpace } from '../utils/inventoryHelpers';

type ItemFormDrawerProps = {
  open: boolean;
  spaceId: string;
  spaceType?: SpaceType;
  mode: 'create' | 'edit';
  item?: InventoryItem | null;
  onClose: () => void;
  onSaved: (itemId: string) => void;
};

type FormBodyProps = {
  spaceId: string;
  spaceType?: SpaceType;
  mode: 'create' | 'edit';
  item?: InventoryItem | null;
  onClose: () => void;
  onSaved: (itemId: string) => void;
};

function ItemFormBody({
  spaceId,
  spaceType,
  mode,
  item,
  onClose,
  onSaved,
}: FormBodyProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const mutations = useInventoryMutations(spaceId);
  const categories = useInventoryCategories(spaceId, true);
  const suppliers = useInventorySuppliers(spaceId, true);
  const units = useMemo(() => defaultUnitsForSpace(spaceType), [spaceType]);
  const defaultUnit = units[0] ?? 'PIECE';

  const [name, setName] = useState(mode === 'edit' && item ? item.name : '');
  const [categoryId, setCategoryId] = useState(
    mode === 'edit' && item
      ? item.categoryId
      : (categories.categories[0]?.categoryId ?? ''),
  );
  const [unit, setUnit] = useState<InventoryUnit>(
    mode === 'edit' && item ? item.unit : defaultUnit,
  );
  const [openingStock, setOpeningStock] = useState('0');
  const [minimumStock, setMinimumStock] = useState(
    mode === 'edit' && item ? String(item.minimumStock) : '0',
  );
  const [location, setLocation] = useState(
    mode === 'edit' && item ? (item.location ?? '') : '',
  );
  const [supplierId, setSupplierId] = useState(
    mode === 'edit' && item ? (item.supplierId ?? '') : '',
  );
  const [purchasePrice, setPurchasePrice] = useState(
    mode === 'edit' && item && item.purchasePrice != null
      ? String(item.purchasePrice)
      : '',
  );
  const [notes, setNotes] = useState(mode === 'edit' && item ? (item.notes ?? '') : '');

  const handleSubmit = async () => {
    if (!name.trim()) {
      enqueueSnackbar(t('inventory.form.nameRequired'), { variant: 'warning' });
      return;
    }
    const resolvedCategory =
      categoryId || categories.categories[0]?.categoryId || '';
    if (!resolvedCategory) {
      enqueueSnackbar(t('inventory.form.categoryRequired'), { variant: 'warning' });
      return;
    }
    const min = Number(minimumStock);
    if (!Number.isFinite(min) || min < 0) {
      enqueueSnackbar(t('inventory.form.qtyRequired'), { variant: 'warning' });
      return;
    }

    try {
      if (mode === 'create') {
        const opening = Number(openingStock);
        if (!Number.isFinite(opening) || opening < 0) {
          enqueueSnackbar(t('inventory.form.qtyRequired'), { variant: 'warning' });
          return;
        }
        const body: CreateInventoryItemRequest = {
          name: name.trim().slice(0, 150),
          categoryId: resolvedCategory,
          unit,
          openingStock: opening,
          minimumStock: min,
          location: location.trim() || null,
          supplierId: supplierId || null,
          purchasePrice: purchasePrice.trim() ? Number(purchasePrice) : null,
          notes: notes.trim() || null,
        };
        const created = await mutations.createItem.mutateAsync(body);
        enqueueSnackbar(t('inventory.form.createSuccess'), { variant: 'success' });
        onSaved(created.itemId);
        onClose();
      } else if (item) {
        const body: UpdateInventoryItemRequest = {
          name: name.trim().slice(0, 150),
          categoryId: resolvedCategory,
          unit,
          minimumStock: min,
          location: location.trim() || null,
          supplierId: supplierId || null,
          purchasePrice: purchasePrice.trim() ? Number(purchasePrice) : null,
          notes: notes.trim() || null,
        };
        const updated = await mutations.updateItem.mutateAsync({ itemId: item.itemId, body });
        enqueueSnackbar(t('inventory.form.updateSuccess'), { variant: 'success' });
        onSaved(updated.itemId);
        onClose();
      }
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 2 }}>
        {mode === 'create' ? t('inventory.form.createTitle') : t('inventory.form.editTitle')}
      </Typography>
      <Stack spacing={1.5} sx={{ flex: 1, overflow: 'auto', pb: 10 }}>
        <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary }}>
          {t('inventory.form.sectionBasics')}
        </Typography>
        <TextField
          size="small"
          label={t('inventory.form.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('inventory.form.namePlaceholder')}
          slotProps={{ htmlInput: { maxLength: 150 } }}
          fullWidth
          required
        />
        <FormControl size="small" fullWidth required>
          <InputLabel>{t('inventory.form.category')}</InputLabel>
          <Select
            label={t('inventory.form.category')}
            value={categoryId || categories.categories[0]?.categoryId || ''}
            onChange={(e) => setCategoryId(String(e.target.value))}
          >
            {categories.categories.map((c) => (
              <MenuItem key={c.categoryId} value={c.categoryId}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>{t('inventory.form.unit')}</InputLabel>
          <Select
            label={t('inventory.form.unit')}
            value={unit}
            onChange={(e) => setUnit(e.target.value as InventoryUnit)}
          >
            {units.map((u) => (
              <MenuItem key={u} value={u}>
                {u}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary, pt: 1 }}>
          {t('inventory.form.sectionStock')}
        </Typography>
        {mode === 'create' ? (
          <TextField
            size="small"
            type="number"
            label={t('inventory.form.openingStock')}
            value={openingStock}
            onChange={(e) => setOpeningStock(e.target.value)}
            placeholder={t('inventory.form.openingStockPlaceholder')}
            fullWidth
          />
        ) : null}
        <TextField
          size="small"
          type="number"
          label={t('inventory.form.minimumStock')}
          value={minimumStock}
          onChange={(e) => setMinimumStock(e.target.value)}
          placeholder={t('inventory.form.minimumStockPlaceholder')}
          fullWidth
        />
        <TextField
          size="small"
          label={t('inventory.form.location')}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t('inventory.form.locationPlaceholder')}
          slotProps={{ htmlInput: { maxLength: 150 } }}
          fullWidth
        />

        <Typography sx={{ ...DASHBOARD_UX.metricLabel, color: s.textSecondary, pt: 1 }}>
          {t('inventory.form.sectionPurchase')}
        </Typography>
        <FormControl size="small" fullWidth>
          <InputLabel>{t('inventory.form.supplier')}</InputLabel>
          <Select
            label={t('inventory.form.supplier')}
            value={supplierId}
            onChange={(e) => setSupplierId(String(e.target.value))}
          >
            <MenuItem value="">{t('inventory.form.noSupplier')}</MenuItem>
            {suppliers.suppliers.map((s) => (
              <MenuItem key={s.supplierId} value={s.supplierId}>
                {s.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          type="number"
          label={t('inventory.form.purchasePrice')}
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          placeholder={t('inventory.form.purchasePricePlaceholder')}
          fullWidth
        />
        <TextField
          size="small"
          label={t('inventory.form.notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('inventory.form.notesPlaceholder')}
          multiline
          minRows={2}
          fullWidth
        />
      </Stack>
      <StickyFooter>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={dashOutlinedButtonSx}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={mutations.createItem.isPending || mutations.updateItem.isPending}
            sx={dashContainedButtonSx}
          >
            {t('common.save')}
          </Button>
        </Stack>
      </StickyFooter>
    </Box>
  );
}

export function ItemFormDrawer({
  open,
  spaceId,
  spaceType,
  mode,
  item,
  onClose,
  onSaved,
}: ItemFormDrawerProps) {
  const formKey = `${mode}-${item?.itemId ?? 'new'}-${open ? 'open' : 'closed'}`;
  return (
    <AppDrawer open={open} onClose={onClose} width={480}>
      {open ? (
        <ItemFormBody
          key={formKey}
          spaceId={spaceId}
          spaceType={spaceType}
          mode={mode}
          item={item}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </AppDrawer>
  );
}
