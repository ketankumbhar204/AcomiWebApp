import {
  Box,
  Button,
  Divider,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Package,
  PackageMinus,
  PackagePlus,
  Pencil,
  RefreshCcw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { SidePanel } from '@/shared/components/SidePanel';
import { StatusChip } from '@/shared/components/StatusChip';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { colors } from '@/shared/theme/colors';
import type { InventoryCategory, InventorySupplier } from '@/shared/types/inventory';
import {
  useInventoryItem,
  useInventoryTransactions,
} from '../hooks/useInventory';
import {
  availableStock,
  deriveInventoryStockStatus,
  formatInventoryDateTime,
  formatStockQty,
  inventoryStockStatusTone,
  statusLabelKey,
  txnLabelKey,
} from '../utils/inventoryHelpers';

type ItemInspectorProps = {
  spaceId: string;
  itemId: string | null;
  categories: InventoryCategory[];
  suppliers: InventorySupplier[];
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
  onStockIn: () => void;
  onStockOut: () => void;
  onAdjust: () => void;
  framed?: boolean;
};

function DetailGrid({
  items,
}: {
  items: Array<{ label: string; value?: string | number | null }>;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const visible = items.filter((item) => item.value != null && item.value !== '');
  if (visible.length === 0) return null;
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 1.25,
      }}
    >
      {visible.map((item) => (
        <Box key={item.label} sx={{ minWidth: 0 }}>
          <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
            {item.label}
          </Typography>
          <Typography
            sx={{ ...DASHBOARD_UX.link, color: s.textPrimary, mt: 0.15 }}
            noWrap
          >
            {item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

const fullWidthBtnSx = {
  ...DASHBOARD_UX.button,
  minHeight: DASHBOARD_UX.buttonHeight,
  height: DASHBOARD_UX.buttonHeight,
  px: `${DASHBOARD_UX.buttonPx}px`,
  borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
  textTransform: 'none',
  boxShadow: 'none',
  width: '100%',
  justifyContent: 'center',
} as const;

const fullWidthContainedBtnSx = {
  ...fullWidthBtnSx,
  minHeight: 40,
  height: 40,
} as const;

export function ItemInspector({
  spaceId,
  itemId,
  categories,
  suppliers,
  canManage,
  onClose,
  onEdit,
  onStockIn,
  onStockOut,
  onAdjust,
  framed = true,
}: ItemInspectorProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const detail = useInventoryItem(spaceId, itemId ?? undefined, Boolean(itemId));
  const txs = useInventoryTransactions(spaceId, itemId ?? undefined, Boolean(itemId));

  if (!itemId) {
    return (
      <SidePanel title={t('inventory.details.title')} onClose={onClose} framed={framed}>
        <EmptyState
          icon={
            <IconBadge accent={colors.primaryDark}>
              <Package />
            </IconBadge>
          }
          title={t('inventory.inspector.selectTitle')}
          description={t('inventory.inspector.selectBody')}
        />
      </SidePanel>
    );
  }

  if (detail.loading && !detail.item) {
    return (
      <SidePanel title={t('inventory.details.title')} onClose={onClose} framed={framed}>
        <LoadingState />
      </SidePanel>
    );
  }

  const item = detail.item;
  if (!item) {
    return (
      <SidePanel title={t('inventory.details.title')} onClose={onClose} framed={framed}>
        <EmptyState title={t('inventory.details.notFound')} />
      </SidePanel>
    );
  }

  const status = deriveInventoryStockStatus(item);
  const categoryName =
    categories.find((c) => c.categoryId === item.categoryId)?.name ??
    t('inventory.details.uncategorized');
  const supplierName =
    suppliers.find((s) => s.supplierId === item.supplierId)?.name ??
    t('inventory.form.noSupplier');

  return (
    <SidePanel
      title={item.name}
      subtitle={categoryName}
      onClose={onClose}
      framed={framed}
      footer={
        canManage ? (
          <Stack spacing={1}>
            <Button
              variant="contained"
              startIcon={<PackagePlus size={16} />}
              onClick={onStockIn}
              sx={{
                ...fullWidthContainedBtnSx,
                bgcolor: colors.primaryDark,
                '&:hover': { bgcolor: colors.primaryHover },
              }}
            >
              {t('inventory.actions.stockIn')}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<PackageMinus size={16} />}
              onClick={onStockOut}
              sx={{
                ...fullWidthBtnSx,
                borderColor: colors.danger,
                color: colors.danger,
                '&:hover': { borderColor: colors.danger, bgcolor: `${colors.danger}0D` },
              }}
            >
              {t('inventory.actions.stockOut')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshCcw size={16} />}
              onClick={onAdjust}
              sx={{
                ...fullWidthBtnSx,
                borderColor: colors.primaryDark,
                color: colors.primaryDark,
              }}
            >
              {t('inventory.actions.adjust')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Pencil size={16} />}
              onClick={onEdit}
              sx={{
                ...fullWidthBtnSx,
                borderColor: colors.primaryDark,
                color: colors.primaryDark,
              }}
            >
              {t('inventory.actions.editItem')}
            </Button>
          </Stack>
        ) : undefined
      }
    >
      <Stack spacing={`${DASHBOARD_UX.cardGap}px`}>
        <StatusChip
          label={t(statusLabelKey(status))}
          tone={inventoryStockStatusTone(status)}
        />

        <Box>
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 1 }}>
            {t('inventory.details.title')}
          </Typography>
          <DetailGrid
            items={[
              {
                label: t('inventory.details.available'),
                value: formatStockQty(availableStock(item), item.unit),
              },
              {
                label: t('inventory.details.minimum'),
                value: formatStockQty(item.minimumStock, item.unit),
              },
              {
                label: t('inventory.form.location'),
                value: item.location ?? '—',
              },
              {
                label: t('inventory.form.supplier'),
                value: supplierName,
              },
              {
                label: t('inventory.details.avgPrice'),
                value: item.averagePrice != null ? `₹${item.averagePrice}` : null,
              },
            ]}
          />
          {item.notes ? (
            <Box sx={{ mt: 1.25 }}>
              <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                {t('inventory.form.notes')}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.15 }}>
                {item.notes}
              </Typography>
            </Box>
          ) : null}
        </Box>

        <Divider sx={{ borderColor: s.border }} />

        <Box>
          <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, mb: 1 }}>
            {t('inventory.details.activity')}
          </Typography>
          {txs.loading ? (
            <LoadingState />
          ) : txs.transactions.length === 0 ? (
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>
              {t('inventory.empty.activity')}
            </Typography>
          ) : (
            <Stack spacing={1} sx={{ maxHeight: 240, overflow: 'auto' }}>
              {txs.transactions.slice(0, 20).map((tx) => (
                <Box
                  key={tx.transactionId}
                  sx={{
                    display: 'flex',
                    gap: 1,
                    p: 1.25,
                    borderRadius: `${DASHBOARD_UX.tileRadius}px`,
                    border: `1px solid ${s.border}`,
                    bgcolor: s.elevated,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: colors.primaryDark,
                      mt: 0.6,
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}
                    >
                      {t(txnLabelKey(tx.type))} · {formatStockQty(tx.quantity, tx.unit)}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}>
                      {formatInventoryDateTime(tx.createdAt)}
                      {tx.actorName ? ` · ${tx.actorName}` : ''}
                    </Typography>
                    {tx.reason ? (
                      <Typography
                        sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.35 }}
                      >
                        {tx.reason}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </SidePanel>
  );
}
