import {
  Avatar,
  Box,
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AlertTriangle,
  ArrowDownCircle,
  BarChart3,
  ChevronRight,
  IndianRupee,
  Package,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { StatusChip } from '@/shared/components/StatusChip';
import { ErrorState } from '@/shared/components/ErrorState';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { formatCurrency } from '@/shared/utils/dashboardFinancial';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { spaceInventoryPath } from '@/routes/paths';
import type {
  InventoryItem,
  InventoryItemListFilter,
  InventoryTransaction,
} from '@/shared/types/inventory';
import { ItemFormDrawer } from '../components/ItemFormDrawer';
import { ItemInspector } from '../components/ItemInspector';
import { StockMoveDrawer } from '../components/StockMoveDrawer';
import {
  useInventoryCategories,
  useInventoryDashboard,
  useInventoryItems,
  useInventoryMutations,
  useInventorySuppliers,
  useInventoryTransactions,
} from '../hooks/useInventory';
import {
  availableStock,
  deriveInventoryStockStatus,
  formatInventoryDateTime,
  formatStockQty,
  getInventoryProfileKind,
  inventoryAvatarAccent,
  inventoryStockStatusTone,
  matchesStockFilter,
  statusLabelKey,
  txnLabelKey,
} from '../utils/inventoryHelpers';

type WorkspaceTab = 'catalog' | 'categories' | 'suppliers' | 'transactions';
type MoveKind = 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';

const PAGE_SIZE = 25;
const STOCK_FILTERS: InventoryItemListFilter[] = [
  'ALL',
  'ATTENTION',
  'LOW',
  'CRITICAL',
  'HEALTHY',
];

const filterControlSx = {
  minWidth: 128,
  '& .MuiInputBase-root': {
    minHeight: DASHBOARD_UX.buttonHeight,
    height: DASHBOARD_UX.buttonHeight,
    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
    ...DASHBOARD_UX.body,
  },
} as const;

export function InventoryWorkspacePage() {
  const { spaceId = '', itemId: routeItemId } = useParams<{
    spaceId: string;
    itemId?: string;
  }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isLgDown = useMediaQuery(theme.breakpoints.down('lg'));
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const permissions = useSpacePermissions(spaceId);
  const canManage = permissions.canManageInventory === true;
  const profileKind = getInventoryProfileKind(permissions.space?.spaceType);

  const tab = (searchParams.get('tab') as WorkspaceTab) || 'catalog';
  const stockFilter = (searchParams.get('stock') as InventoryItemListFilter) || 'ALL';
  const categoryId = searchParams.get('categoryId') || undefined;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveType, setMoveType] = useState<MoveKind>('STOCK_IN');
  const [categoryName, setCategoryName] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');

  const dashboard = useInventoryDashboard(spaceId, true);
  const categories = useInventoryCategories(spaceId, true);
  const suppliers = useInventorySuppliers(spaceId, true);
  const itemsQuery = useInventoryItems(spaceId, undefined, true);
  const transactions = useInventoryTransactions(
    spaceId,
    undefined,
    tab === 'transactions',
  );
  const mutations = useInventoryMutations(spaceId);

  const selectedItemId = routeItemId ?? null;
  const selectedItem =
    itemsQuery.items.find((i) => i.itemId === selectedItemId) ?? null;
  const inspectorOpen = Boolean(routeItemId);

  useEffect(() => {
    document.title = `${t('navigation.inventory')} · ${t('common.appName')}`;
  }, [t]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('inventory-search')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const setTab = (next: WorkspaceTab) => {
    setPage(0);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('tab', next);
      return p;
    });
  };

  const setFilter = (key: string, value: string) => {
    setPage(0);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (value) {
        p.set(key, value);
      } else {
        p.delete(key);
      }
      return p;
    });
  };

  const selectItem = (id: string) => {
    navigate(
      spaceInventoryPath(spaceId, id, {
        tab: 'catalog',
        stock: stockFilter !== 'ALL' ? stockFilter : undefined,
        categoryId,
      }),
      { replace: true },
    );
  };

  const closeInspector = () => {
    navigate(
      spaceInventoryPath(spaceId, undefined, {
        tab,
        stock: stockFilter !== 'ALL' ? stockFilter : undefined,
        categoryId,
      }),
      { replace: true },
    );
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return itemsQuery.items.filter((item) => {
      if (categoryId && item.categoryId !== categoryId) {
        return false;
      }
      if (!matchesStockFilter(item, stockFilter)) {
        return false;
      }
      if (!q) {
        return true;
      }
      const cat =
        categories.categories.find((c) => c.categoryId === item.categoryId)?.name ?? '';
      return `${item.name} ${cat} ${item.location ?? ''}`.toLowerCase().includes(q);
    });
  }, [itemsQuery.items, stockFilter, search, categories.categories, categoryId]);

  const pageRows = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE).map((i) => ({
      ...i,
      id: i.itemId,
    }));
  }, [filteredItems, page]);

  const attentionCount = useMemo(
    () =>
      itemsQuery.items.filter((i) => matchesStockFilter(i, 'ATTENTION')).length,
    [itemsQuery.items],
  );

  const itemColumns: DataTableColumn<InventoryItem & { id: string }>[] = useMemo(
    () => [
      {
        id: 'name',
        header: t('inventory.form.name'),
        primary: true,
        accessor: (row) => {
          const accent = inventoryAvatarAccent(row.itemId);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, py: 0.25 }}>
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  ...DASHBOARD_UX.badge,
                  bgcolor: `${accent}1A`,
                  color: accent,
                  flexShrink: 0,
                }}
              >
                {(row.name?.trim()?.[0] ?? '?').toUpperCase()}
              </Avatar>
              <Typography
                sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}
                noWrap
              >
                {row.name}
              </Typography>
            </Box>
          );
        },
      },
      {
        id: 'category',
        header: t('inventory.form.category'),
        accessor: (row) => (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }} noWrap>
            {categories.categories.find((c) => c.categoryId === row.categoryId)?.name ??
              t('inventory.details.uncategorized')}
          </Typography>
        ),
      },
      {
        id: 'available',
        header: t('inventory.details.available'),
        accessor: (row) => (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
            {formatStockQty(availableStock(row), row.unit)}
          </Typography>
        ),
      },
      {
        id: 'minimum',
        header: t('inventory.details.minimum'),
        accessor: (row) => (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
            {formatStockQty(row.minimumStock, row.unit)}
          </Typography>
        ),
      },
      {
        id: 'status',
        header: t('inventory.table.status'),
        accessor: (row) => {
          const status = deriveInventoryStockStatus(row);
          return (
            <StatusChip
              label={t(statusLabelKey(status))}
              tone={inventoryStockStatusTone(status)}
            />
          );
        },
      },
      {
        id: 'location',
        header: t('inventory.form.location'),
        accessor: (row) => (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }} noWrap>
            {row.location ?? '—'}
          </Typography>
        ),
      },
      {
        id: 'actions',
        header: '',
        width: 40,
        align: 'right',
        accessor: () => <ChevronRight size={16} color={s.textMuted} aria-hidden />,
      },
    ],
    [categories.categories, s.textMuted, s.textPrimary, s.textSecondary, t],
  );

  const txColumns: DataTableColumn<InventoryTransaction & { id: string }>[] = useMemo(
    () => [
      {
        id: 'item',
        header: t('inventory.form.name'),
        accessor: (row) => row.itemName,
        primary: true,
      },
      {
        id: 'type',
        header: t('inventory.form.moveType'),
        accessor: (row) => t(txnLabelKey(row.type)),
      },
      {
        id: 'qty',
        header: t('inventory.form.quantity'),
        accessor: (row) => formatStockQty(row.quantity, row.unit),
      },
      {
        id: 'reason',
        header: t('inventory.form.reason'),
        accessor: (row) => row.reason ?? '—',
      },
      {
        id: 'actor',
        header: t('inventory.table.user'),
        accessor: (row) => row.actorName ?? '—',
      },
      {
        id: 'date',
        header: t('inventory.table.date'),
        accessor: (row) => formatInventoryDateTime(row.createdAt),
      },
    ],
    [t],
  );

  const openMove = (kind: MoveKind) => {
    setMoveType(kind);
    setMoveOpen(true);
  };

  const inspector = (
    <ItemInspector
      spaceId={spaceId}
      itemId={selectedItemId}
      categories={categories.categories}
      suppliers={suppliers.suppliers}
      canManage={canManage}
      onClose={closeInspector}
      framed={!isLgDown}
      onEdit={() => {
        setFormMode('edit');
        setFormOpen(true);
      }}
      onStockIn={() => openMove('STOCK_IN')}
      onStockOut={() => openMove('STOCK_OUT')}
      onAdjust={() => openMove('ADJUSTMENT')}
    />
  );

  const catalogToolbarFilters = (
    <>
      <FormControl size="small" sx={filterControlSx}>
        <InputLabel id="inventory-stock">{t('inventory.table.stock')}</InputLabel>
        <Select
          labelId="inventory-stock"
          label={t('inventory.table.stock')}
          value={stockFilter}
          onChange={(e) =>
            setFilter('stock', e.target.value === 'ALL' ? '' : String(e.target.value))
          }
        >
          {STOCK_FILTERS.map((f) => (
            <MenuItem key={f} value={f}>
              {t(`inventory.filters.${f}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ ...filterControlSx, minWidth: 140 }}>
        <InputLabel id="inventory-category">{t('inventory.form.category')}</InputLabel>
        <Select
          labelId="inventory-category"
          label={t('inventory.form.category')}
          value={categoryId ?? ''}
          onChange={(e) => setFilter('categoryId', String(e.target.value))}
        >
          <MenuItem value="">{t('inventory.filters.ALL')}</MenuItem>
          {categories.categories.map((c) => (
            <MenuItem key={c.categoryId} value={c.categoryId}>
              {c.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );

  if (dashboard.error && !dashboard.dashboard && itemsQuery.error && !itemsQuery.items.length) {
    return (
      <PageContainer>
        <ErrorState
          title={t('common.errors.generic')}
          message={t('inventory.errors.load')}
          onRetry={() => {
            void dashboard.reload();
            void itemsQuery.reload();
          }}
          retryLabel={t('common.retry')}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t(`inventory.profiles.${profileKind.toLowerCase()}.title`)}
          description={t('inventory.workspace.subtitle')}
          breadcrumbs={[
            { label: permissions.space?.spaceName ?? t('navigation.space') },
            { label: t('navigation.inventory') },
          ]}
          actions={
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              sx={{ flexWrap: 'wrap', alignItems: 'center' }}
            >
              <IconButton
                aria-label={t('common.refresh')}
                size="small"
                onClick={() => {
                  void dashboard.reload();
                  void itemsQuery.reload();
                  void categories.reload();
                  void suppliers.reload();
                  void transactions.reload();
                }}
                sx={{
                  width: DASHBOARD_UX.buttonHeight,
                  height: DASHBOARD_UX.buttonHeight,
                  border: `1px solid ${s.border}`,
                  borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                  bgcolor: s.surface,
                }}
              >
                <RefreshCw size={14} />
              </IconButton>
              {canManage && tab === 'catalog' ? (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Plus size={16} />}
                  onClick={() => {
                    setFormMode('create');
                    setFormOpen(true);
                  }}
                  sx={{
                    ...dashContainedButtonSx,
                    bgcolor: colors.primaryDark,
                    '&:hover': { bgcolor: colors.primaryHover },
                  }}
                >
                  {t('inventory.actions.addItem')}
                </Button>
              ) : null}
            </Stack>
          }
        />

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              dense
              tone="info"
              label={t('inventory.kpi.items')}
              value={String(dashboard.dashboard?.totalItems ?? itemsQuery.items.length)}
              icon={
                <IconBadge tone="info">
                  <Package />
                </IconBadge>
              }
              onClick={() => {
                setTab('catalog');
                setFilter('stock', '');
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              dense
              tone="warning"
              label={t('inventory.kpi.low')}
              value={String(dashboard.dashboard?.lowStockCount ?? 0)}
              icon={
                <IconBadge tone="warning">
                  <ArrowDownCircle />
                </IconBadge>
              }
              onClick={() => {
                setTab('catalog');
                setFilter('stock', 'LOW');
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              dense
              tone="danger"
              label={t('inventory.kpi.out')}
              value={String(dashboard.dashboard?.outOfStockCount ?? 0)}
              icon={
                <IconBadge tone="danger">
                  <BarChart3 />
                </IconBadge>
              }
              onClick={() => {
                setTab('catalog');
                setFilter('stock', 'CRITICAL');
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              dense
              tone="purple"
              label={t('inventory.kpi.value')}
              value={formatCurrency(dashboard.dashboard?.inventoryValue, 'INR')}
              hint={t('inventory.kpi.suppliersCount', {
                count: dashboard.dashboard?.supplierCount ?? suppliers.suppliers.length,
              })}
              icon={
                <IconBadge tone="purple">
                  <IndianRupee />
                </IconBadge>
              }
            />
          </Grid>
        </Grid>

        <Box
          sx={{
            display: 'grid',
            gap: `${DASHBOARD_UX.cardGap}px`,
            gridTemplateColumns:
              !isLgDown && tab === 'catalog'
                ? 'minmax(0, 1.85fr) minmax(300px, 0.95fr)'
                : '1fr',
            alignItems: 'end',
          }}
        >
          <Tabs
            value={tab}
            onChange={(_, v: WorkspaceTab) => setTab(v)}
            sx={{
              minHeight: DASHBOARD_UX.buttonHeight,
              borderBottom: `1px solid ${s.border}`,
              minWidth: 0,
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
            <Tab value="catalog" label={t('inventory.items.title')} />
            <Tab value="categories" label={t('inventory.categories.title')} />
            <Tab value="suppliers" label={t('inventory.suppliers.title')} />
            <Tab value="transactions" label={t('inventory.transactions.title')} />
          </Tabs>

          {attentionCount > 0 && tab === 'catalog' && !isLgDown ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.25,
                py: 1,
                mb: 0.5,
                borderRadius: `${DASHBOARD_UX.radius}px`,
                border: `1px solid #F59E0B55`,
                bgcolor: theme.palette.mode === 'dark' ? s.elevated : colors.warningTint,
                boxShadow: s.shadow,
                minWidth: 0,
              }}
            >
              <IconBadge tone="warning">
                <AlertTriangle />
              </IconBadge>
              <Typography
                sx={{
                  ...DASHBOARD_UX.metricLabel,
                  color: s.textPrimary,
                  flex: 1,
                  minWidth: 0,
                }}
                noWrap
              >
                {t('inventory.banner.attention', { count: attentionCount })}
              </Typography>
              <Button
                size="small"
                onClick={() => setFilter('stock', 'ATTENTION')}
                sx={{
                  ...dashOutlinedButtonSx,
                  flexShrink: 0,
                  borderColor: '#F59E0B88',
                  color: '#B45309',
                }}
              >
                {t('inventory.banner.view')}
              </Button>
            </Box>
          ) : null}
        </Box>

        {attentionCount > 0 && tab === 'catalog' && isLgDown ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 1.5,
              py: 1.25,
              borderRadius: `${DASHBOARD_UX.radius}px`,
              border: `1px solid #F59E0B55`,
              bgcolor: theme.palette.mode === 'dark' ? s.elevated : colors.warningTint,
              boxShadow: s.shadow,
            }}
          >
            <IconBadge tone="warning">
              <AlertTriangle />
            </IconBadge>
            <Typography
              sx={{ ...DASHBOARD_UX.metricLabel, color: s.textPrimary, flex: 1 }}
            >
              {t('inventory.banner.attention', { count: attentionCount })}
            </Typography>
            <Button
              size="small"
              onClick={() => setFilter('stock', 'ATTENTION')}
              sx={{
                ...dashOutlinedButtonSx,
                borderColor: '#F59E0B88',
                color: '#B45309',
              }}
            >
              {t('inventory.banner.view')}
            </Button>
          </Box>
        ) : null}

        {tab === 'catalog' ? (
          <Box
            sx={{
              display: 'grid',
              gap: `${DASHBOARD_UX.cardGap}px`,
              gridTemplateColumns: isLgDown
                ? '1fr'
                : 'minmax(0, 1.85fr) minmax(300px, 0.95fr)',
              alignItems: 'start',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <DataTable
                columns={itemColumns}
                rows={pageRows}
                loading={itemsQuery.loading}
                searchValue={search}
                onSearchChange={(value) => {
                  setSearch(value);
                  setPage(0);
                }}
                searchPlaceholder={t('inventory.items.search')}
                searchInputId="inventory-search"
                toolbarFilters={catalogToolbarFilters}
                emptyTitle={t('inventory.empty.itemsTitle')}
                emptyDescription={t('inventory.empty.itemsBody')}
                selectedIds={selectedItemId ? [selectedItemId] : []}
                onRowClick={(row) => selectItem(row.itemId)}
                page={page}
                pageSize={PAGE_SIZE}
                totalItems={filteredItems.length}
                onPageChange={setPage}
              />
            </Box>

            {!isLgDown ? (
              <Box
                sx={{
                  position: 'sticky',
                  top: 12,
                  alignSelf: 'start',
                  height: 'calc(100vh - 112px)',
                  maxHeight: 'calc(100vh - 112px)',
                  minHeight: 360,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {inspector}
              </Box>
            ) : null}
          </Box>
        ) : null}

        {tab === 'categories' ? (
          <Stack spacing={1.5}>
            {canManage ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder={t('inventory.categories.namePlaceholder')}
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  sx={{
                    '& .MuiInputBase-root': {
                      minHeight: DASHBOARD_UX.buttonHeight,
                      borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  disabled={!categoryName.trim() || mutations.createCategory.isPending}
                  onClick={() =>
                    void mutations.createCategory
                      .mutateAsync({ name: categoryName.trim() })
                      .then(() => {
                        setCategoryName('');
                        enqueueSnackbar(t('inventory.categories.created'), {
                          variant: 'success',
                        });
                      })
                      .catch(() =>
                        enqueueSnackbar(t('common.errors.generic'), { variant: 'error' }),
                      )
                  }
                  sx={{
                    ...dashContainedButtonSx,
                    bgcolor: colors.primaryDark,
                    '&:hover': { bgcolor: colors.primaryHover },
                  }}
                >
                  {t('inventory.categories.add')}
                </Button>
              </Stack>
            ) : null}
            <DataTable
              columns={[
                {
                  id: 'name',
                  header: t('inventory.form.name'),
                  accessor: (row) => row.name,
                  primary: true,
                },
                {
                  id: 'items',
                  header: t('inventory.kpi.items'),
                  accessor: (row) =>
                    t('inventory.categories.itemCount', {
                      count: itemsQuery.items.filter((i) => i.categoryId === row.categoryId)
                        .length,
                    }),
                },
                {
                  id: 'system',
                  header: t('inventory.categories.system'),
                  accessor: (row) => (row.isSystem ? t('common.yes') : '—'),
                },
              ]}
              rows={categories.categories.map((c) => ({ ...c, id: c.categoryId }))}
              loading={categories.loading}
              emptyTitle={t('inventory.categories.emptyTitle')}
              emptyDescription={t('inventory.categories.emptyBody')}
            />
          </Stack>
        ) : null}

        {tab === 'suppliers' ? (
          <Stack spacing={1.5}>
            {canManage ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder={t('inventory.suppliers.namePlaceholder')}
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  sx={{
                    '& .MuiInputBase-root': {
                      minHeight: DASHBOARD_UX.buttonHeight,
                      borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                    },
                  }}
                />
                <TextField
                  size="small"
                  sx={{
                    minWidth: 160,
                    '& .MuiInputBase-root': {
                      minHeight: DASHBOARD_UX.buttonHeight,
                      borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                    },
                  }}
                  placeholder={t('inventory.suppliers.phonePlaceholder')}
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                />
                <Button
                  variant="contained"
                  disabled={!supplierName.trim() || mutations.createSupplier.isPending}
                  onClick={() =>
                    void mutations.createSupplier
                      .mutateAsync({
                        name: supplierName.trim(),
                        phone: supplierPhone.trim() || null,
                      })
                      .then(() => {
                        setSupplierName('');
                        setSupplierPhone('');
                        enqueueSnackbar(t('inventory.suppliers.created'), {
                          variant: 'success',
                        });
                      })
                      .catch(() =>
                        enqueueSnackbar(t('common.errors.generic'), { variant: 'error' }),
                      )
                  }
                  sx={{
                    ...dashContainedButtonSx,
                    bgcolor: colors.primaryDark,
                    '&:hover': { bgcolor: colors.primaryHover },
                  }}
                >
                  {t('inventory.suppliers.add')}
                </Button>
              </Stack>
            ) : null}
            <DataTable
              columns={[
                {
                  id: 'name',
                  header: t('inventory.form.name'),
                  accessor: (row) => row.name,
                  primary: true,
                },
                {
                  id: 'phone',
                  header: t('inventory.suppliers.phone'),
                  accessor: (row) => row.phone ?? '—',
                },
                {
                  id: 'address',
                  header: t('inventory.suppliers.address'),
                  accessor: (row) => row.address ?? '—',
                },
              ]}
              rows={suppliers.suppliers.map((sup) => ({ ...sup, id: sup.supplierId }))}
              loading={suppliers.loading}
              emptyTitle={t('inventory.suppliers.emptyTitle')}
              emptyDescription={t('inventory.suppliers.emptyBody')}
            />
          </Stack>
        ) : null}

        {tab === 'transactions' ? (
          <DataTable
            columns={txColumns}
            rows={transactions.transactions.map((tx) => ({
              ...tx,
              id: tx.transactionId,
            }))}
            loading={transactions.loading}
            emptyTitle={t('inventory.transactions.emptyTitle')}
            emptyDescription={t('inventory.transactions.emptyBody')}
          />
        ) : null}
      </Stack>

      <AppDrawer open={inspectorOpen && isLgDown} onClose={closeInspector} width={400}>
        <ItemInspector
          spaceId={spaceId}
          itemId={selectedItemId}
          categories={categories.categories}
          suppliers={suppliers.suppliers}
          canManage={canManage}
          onClose={closeInspector}
          framed={false}
          onEdit={() => {
            setFormMode('edit');
            setFormOpen(true);
          }}
          onStockIn={() => openMove('STOCK_IN')}
          onStockOut={() => openMove('STOCK_OUT')}
          onAdjust={() => openMove('ADJUSTMENT')}
        />
      </AppDrawer>

      <ItemFormDrawer
        open={formOpen}
        spaceId={spaceId}
        spaceType={permissions.space?.spaceType}
        mode={formMode}
        item={formMode === 'edit' ? selectedItem : null}
        onClose={() => setFormOpen(false)}
        onSaved={(id) => selectItem(id)}
      />

      <StockMoveDrawer
        open={moveOpen}
        spaceId={spaceId}
        item={selectedItem}
        initialType={moveType}
        onClose={() => setMoveOpen(false)}
      />
    </PageContainer>
  );
}
