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
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { StickyFooter } from '@/shared/components/StickyFooter';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { InventoryItem, InventoryTxnType } from '@/shared/types/inventory';
import { useInventoryMutations } from '../hooks/useInventory';
import { availableStock, formatStockQty } from '../utils/inventoryHelpers';

type MoveKind = Extract<InventoryTxnType, 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT'>;

type StockMoveDrawerProps = {
  open: boolean;
  spaceId: string;
  item: InventoryItem | null;
  initialType?: MoveKind;
  onClose: () => void;
};

const MOVE_TYPES: MoveKind[] = ['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT'];

function StockMoveBody({
  spaceId,
  item,
  initialType,
  onClose,
}: {
  spaceId: string;
  item: InventoryItem | null;
  initialType: MoveKind;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const mutations = useInventoryMutations(spaceId);
  const [type, setType] = useState<MoveKind>(initialType);
  const [quantity, setQuantity] = useState('');
  const [absoluteStock, setAbsoluteStock] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    if (!item) {
      return;
    }
    const qty = Number(quantity);
    if (type !== 'ADJUSTMENT' && (!Number.isFinite(qty) || qty <= 0)) {
      enqueueSnackbar(t('inventory.form.qtyRequired'), { variant: 'warning' });
      return;
    }
    if (type === 'ADJUSTMENT') {
      const abs = Number(absoluteStock);
      if (!Number.isFinite(abs) || abs < 0) {
        enqueueSnackbar(t('inventory.form.qtyRequired'), { variant: 'warning' });
        return;
      }
    }

    try {
      await mutations.stockMove.mutateAsync({
        itemId: item.itemId,
        body: {
          type,
          quantity: type === 'ADJUSTMENT' ? 0 : qty,
          setAbsoluteStock: type === 'ADJUSTMENT' ? Number(absoluteStock) : undefined,
          reason: reason.trim() || undefined,
        },
      });
      enqueueSnackbar(t('inventory.details.moveSuccess'), { variant: 'success' });
      onClose();
    } catch {
      enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
    }
  };

  const actionKey =
    type === 'STOCK_OUT' ? 'stockOut' : type === 'ADJUSTMENT' ? 'adjust' : 'stockIn';

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}>
        {t(`inventory.actions.${actionKey}`)}
      </Typography>
      {item ? (
        <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mb: 2 }}>
          {item.name} · {formatStockQty(availableStock(item), item.unit)}{' '}
          {t('inventory.details.available').toLowerCase()}
        </Typography>
      ) : null}
      <Stack spacing={1.5} sx={{ flex: 1 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>{t('inventory.form.moveType')}</InputLabel>
          <Select
            label={t('inventory.form.moveType')}
            value={type}
            onChange={(e) => setType(e.target.value as MoveKind)}
          >
            {MOVE_TYPES.map((m) => (
              <MenuItem key={m} value={m}>
                {t(`inventory.txn.${m}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {type === 'ADJUSTMENT' ? (
          <TextField
            size="small"
            type="number"
            label={t('inventory.form.setStock')}
            value={absoluteStock}
            onChange={(e) => setAbsoluteStock(e.target.value)}
            placeholder={t('inventory.form.setStockPlaceholder')}
            fullWidth
            required
          />
        ) : (
          <TextField
            size="small"
            type="number"
            label={t('inventory.form.quantity')}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={t('inventory.form.quantityPlaceholder')}
            fullWidth
            required
          />
        )}
        <TextField
          size="small"
          label={t('inventory.form.reason')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('inventory.form.reasonPlaceholder')}
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
            disabled={mutations.stockMove.isPending || !item}
            sx={dashContainedButtonSx}
          >
            {t('common.save')}
          </Button>
        </Stack>
      </StickyFooter>
    </Box>
  );
}

export function StockMoveDrawer({
  open,
  spaceId,
  item,
  initialType = 'STOCK_IN',
  onClose,
}: StockMoveDrawerProps) {
  return (
    <AppDrawer open={open} onClose={onClose} width={420}>
      {open ? (
        <StockMoveBody
          key={`${item?.itemId ?? 'none'}-${initialType}`}
          spaceId={spaceId}
          item={item}
          initialType={initialType}
          onClose={onClose}
        />
      ) : null}
    </AppDrawer>
  );
}
