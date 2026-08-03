import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Egg,
  Layers,
  LayoutGrid,
  Leaf,
  List,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Settings2,
  Trash2,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { ContentCard } from '@/shared/components/ContentCard';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { Pagination } from '@/shared/components/Pagination';
import { StatusChip } from '@/shared/components/StatusChip';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { spaceMealsPath } from '@/routes/paths';
import type {
  FoodCategoryResponse,
  FoodItemResponse,
  FoodType,
  MealComboResponse,
} from '@/shared/types/meals';
import { CategoryFormDialog } from '../components/CategoryFormDialog';
import { ConfigureLibraryExtrasDrawer } from '../components/ConfigureLibraryExtrasDrawer';
import { CreateComboPlannerDialog } from '../components/CreateComboPlannerDialog';
import { FoodItemFormDrawer } from '../components/FoodItemFormDrawer';
import { MealComboFormDrawer } from '../components/MealComboFormDrawer';
import {
  useFoodCategories,
  useFoodItems,
  useMealCombos,
  useMealMutations,
} from '../hooks/useMeals';
import {
  mealPricingContextFromSpaceType,
  requiresMealPrices,
} from '../utils/mealPricingPolicy';

type LibraryTab = 'items' | 'combos' | 'extras';
type ViewMode = 'table' | 'cards';

const PAGE_SIZE = 10;

const FOOD_TYPES: FoodType[] = ['VEG', 'NON_VEG', 'EGG'];

const filterControlSx = {
  minWidth: 140,
  '& .MuiInputBase-root': {
    minHeight: DASHBOARD_UX.buttonHeight,
    height: DASHBOARD_UX.buttonHeight,
    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
    ...DASHBOARD_UX.body,
  },
} as const;

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
    case 'NON_VEG':
      return UtensilsCrossed;
    default:
      return UtensilsCrossed;
  }
}

function truncateItemNames(names: string[], max = 3): { visible: string[]; more: number } {
  const visible = names.slice(0, max);
  return { visible, more: Math.max(0, names.length - max) };
}

function ComboRowActions({
  onEdit,
  onDeactivate,
}: {
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  return (
    <>
      <IconButton
        size="small"
        aria-label={t('membership.workspace.columns.actions', { defaultValue: 'Actions' })}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={(event: MouseEvent<HTMLElement>) => {
          event.stopPropagation();
          setAnchor(event.currentTarget);
        }}
        sx={{
          width: DASHBOARD_UX.buttonHeight,
          height: DASHBOARD_UX.buttonHeight,
          borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
        }}
      >
        <MoreVertical size={14} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        onClick={(event) => event.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onEdit();
          }}
        >
          <ListItemIcon>
            <Pencil size={14} />
          </ListItemIcon>
          <ListItemText>{t('meals.library.editCombo')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onDeactivate();
          }}
        >
          <ListItemIcon>
            <Trash2 size={14} />
          </ListItemIcon>
          <ListItemText>{t('meals.library.removeCombo')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

function ItemRowActions({
  canEdit,
  onEdit,
  onRemoveExtra,
  onDeactivate,
  showRemoveExtra,
}: {
  canEdit: boolean;
  onEdit: () => void;
  onRemoveExtra?: () => void;
  onDeactivate: () => void;
  showRemoveExtra?: boolean;
}) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  return (
    <>
      <IconButton
        size="small"
        aria-label={t('membership.workspace.columns.actions', { defaultValue: 'Actions' })}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={(event: MouseEvent<HTMLElement>) => {
          event.stopPropagation();
          setAnchor(event.currentTarget);
        }}
        sx={{
          width: DASHBOARD_UX.buttonHeight,
          height: DASHBOARD_UX.buttonHeight,
          borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
        }}
      >
        <MoreVertical size={14} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        onClick={(event) => event.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {canEdit ? (
          <MenuItem
            onClick={() => {
              setAnchor(null);
              onEdit();
            }}
          >
            <ListItemIcon>
              <Pencil size={14} />
            </ListItemIcon>
            <ListItemText>{t('meals.library.editItem')}</ListItemText>
          </MenuItem>
        ) : null}
        {showRemoveExtra && onRemoveExtra ? (
          <MenuItem
            onClick={() => {
              setAnchor(null);
              onRemoveExtra();
            }}
          >
            <ListItemIcon>
              <Trash2 size={14} />
            </ListItemIcon>
            <ListItemText>{t('meals.library.removeExtra')}</ListItemText>
          </MenuItem>
        ) : null}
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onDeactivate();
          }}
        >
          <ListItemIcon>
            <Trash2 size={14} />
          </ListItemIcon>
          <ListItemText>{t('meals.library.removeItem')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

function NameCell({
  name,
  accent,
  Icon,
}: {
  name: string;
  accent: string;
  Icon: LucideIcon;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, py: 0.5 }}>
      <IconBadge accent={accent}>
        <Icon />
      </IconBadge>
      <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }} noWrap>
        {name}
      </Typography>
    </Box>
  );
}

function LibraryCard({
  title,
  accent,
  Icon,
  meta,
  chips,
  footer,
  actions,
}: {
  title: string;
  accent: string;
  Icon: LucideIcon;
  meta?: string;
  chips?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
}) {
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  return (
    <Box
      sx={{
        p: `${DASHBOARD_UX.metricPadding}px`,
        borderRadius: `${DASHBOARD_UX.radius}px`,
        border: `1px solid ${s.border}`,
        bgcolor: s.surface,
        boxShadow: s.shadow,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        transition: DASHBOARD_UX.transition,
        '&:hover': { boxShadow: s.shadowHover, transform: 'translateY(-1px)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minWidth: 0 }}>
        <IconBadge accent={accent}>
          <Icon />
        </IconBadge>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary }}
            noWrap
          >
            {title}
          </Typography>
          {meta ? (
            <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }} noWrap>
              {meta}
            </Typography>
          ) : null}
        </Box>
        {actions}
      </Box>
      {chips ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{chips}</Box>
      ) : null}
      {footer}
    </Box>
  );
}

export function MenuLibraryPage() {
  const { t } = useTranslation();
  const { spaceId = '' } = useParams<{ spaceId: string }>();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const permissions = useSpacePermissions(spaceId);
  const showExtras = requiresMealPrices(
    mealPricingContextFromSpaceType(permissions.space?.spaceType),
  );
  const enableItemQuantities = showExtras;
  const canManage = permissions.canManageMeals === true;
  const canView = permissions.canViewMeals === true || canManage;

  const [tab, setTab] = useState<LibraryTab>('items');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [foodTypeFilter, setFoodTypeFilter] = useState<'' | FoodType>('');
  const [page, setPage] = useState(0);

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [itemFormMode, setItemFormMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<FoodItemResponse | null>(null);

  const [comboFormOpen, setComboFormOpen] = useState(false);
  const [createComboOpen, setCreateComboOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<MealComboResponse | null>(null);
  const [deactivateComboId, setDeactivateComboId] = useState<string | null>(null);

  const [deactivateItem, setDeactivateItem] = useState<FoodItemResponse | null>(null);
  const [removeExtraItem, setRemoveExtraItem] = useState<FoodItemResponse | null>(null);
  const [deactivateCategory, setDeactivateCategory] = useState<FoodCategoryResponse | null>(
    null,
  );
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [configureExtrasOpen, setConfigureExtrasOpen] = useState(false);

  const categories = useFoodCategories(spaceId, canView);
  const items = useFoodItems(spaceId, undefined, canView);
  const combos = useMealCombos(spaceId, canView);
  const mutations = useMealMutations(spaceId);

  useEffect(() => {
    document.title = `${t('meals.library.title')} · ${t('common.appName')}`;
  }, [t]);

  useEffect(() => {
    setPage(0);
  }, [tab, search, categoryId, foodTypeFilter, viewMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('meals-library-search')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items.items.filter((i) => i.isActive);
    if (categoryId) {
      list = list.filter((i) => i.categoryId === categoryId);
    }
    if (tab === 'extras') {
      list = list.filter((i) => i.isExtra);
    }
    if (foodTypeFilter) {
      list = list.filter((i) => i.foodType === foodTypeFilter);
    }
    if (q) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.categoryName ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [categoryId, foodTypeFilter, items.items, search, tab]);

  const filteredCombos = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = combos.combos.filter((c) => c.isActive);
    if (q) {
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    return list;
  }, [combos.combos, search]);

  const itemRows = useMemo(
    () => filteredItems.map((i) => ({ ...i, id: i.itemId })),
    [filteredItems],
  );
  const comboRows = useMemo(
    () => filteredCombos.map((c) => ({ ...c, id: c.comboId })),
    [filteredCombos],
  );

  const activeRows = tab === 'combos' ? comboRows : itemRows;
  const pageCount = Math.max(1, Math.ceil(activeRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pagedRows = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return activeRows.slice(start, start + PAGE_SIZE);
  }, [activeRows, safePage]);

  const itemColumns: DataTableColumn<FoodItemResponse & { id: string }>[] = [
    {
      id: 'name',
      header: t('meals.library.itemName'),
      accessor: (row) => (
        <NameCell
          name={row.name}
          accent={itemAccent(row.foodType)}
          Icon={itemIcon(row.foodType)}
        />
      ),
      primary: true,
    },
    {
      id: 'category',
      header: t('meals.library.category'),
      accessor: (row) =>
        row.categoryName ? (
          <StatusChip label={row.categoryName} tone="info" />
        ) : (
          '—'
        ),
    },
    {
      id: 'type',
      header: t('meals.foodType.label'),
      accessor: (row) =>
        row.foodType ? (
          <StatusChip
            label={t(`meals.foodType.${row.foodType}`)}
            tone={row.foodType === 'VEG' ? 'success' : row.foodType === 'EGG' ? 'warning' : 'neutral'}
          />
        ) : (
          '—'
        ),
    },
    {
      id: 'extra',
      header: t('meals.library.extra'),
      accessor: (row) =>
        row.isExtra ? <StatusChip label={t('meals.library.extra')} tone="neutral" /> : '—',
    },
    ...(canManage
      ? ([
          {
            id: 'actions',
            header: t('common.actions', { defaultValue: 'Actions' }),
            width: 56,
            align: 'right' as const,
            accessor: (row: FoodItemResponse & { id: string }) => (
              <ItemRowActions
                canEdit={row.isCustom}
                showRemoveExtra={tab === 'extras'}
                onEdit={() => {
                  setEditingItem(row);
                  setItemFormMode('edit');
                  setItemFormOpen(true);
                }}
                onRemoveExtra={() => setRemoveExtraItem(row)}
                onDeactivate={() => setDeactivateItem(row)}
              />
            ),
          },
        ] as DataTableColumn<FoodItemResponse & { id: string }>[])
      : []),
  ];

  const comboColumns: DataTableColumn<MealComboResponse & { id: string }>[] = [
    {
      id: 'name',
      header: t('meals.library.comboName'),
      accessor: (row) => (
        <NameCell name={row.name} accent="#7C3AED" Icon={Layers} />
      ),
      primary: true,
    },
    {
      id: 'items',
      header: t('meals.library.items'),
      accessor: (row) => {
        const names = row.items?.map((i) => i.name) ?? [];
        if (names.length === 0) return '—';
        const { visible, more } = truncateItemNames(names, 3);
        return (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }} noWrap>
            {visible.join(', ')}
            {more > 0 ? ` · +${more} ${t('meals.library.more', { defaultValue: 'more' })}` : ''}
          </Typography>
        );
      },
      primary: true,
    },
    {
      id: 'price',
      header: t('meals.library.price'),
      align: 'right',
      accessor: (row) => (
        <Typography
          sx={{
            ...DASHBOARD_UX.link,
            color: s.textPrimary,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {row.price != null ? `₹${row.price}` : '—'}
        </Typography>
      ),
    },
    ...(canManage
      ? ([
          {
            id: 'actions',
            header: t('common.actions', { defaultValue: 'Actions' }),
            width: 56,
            align: 'right' as const,
            accessor: (row: MealComboResponse & { id: string }) => (
              <ComboRowActions
                onEdit={() => {
                  setEditingCombo(row);
                  setComboFormOpen(true);
                }}
                onDeactivate={() => setDeactivateComboId(row.comboId)}
              />
            ),
          },
        ] as DataTableColumn<MealComboResponse & { id: string }>[])
      : []),
  ];

  const openCreate = () => {
    if (tab === 'combos') {
      setCreateComboOpen(true);
      return;
    }
    setEditingItem(null);
    setItemFormMode('create');
    setItemFormOpen(true);
  };

  const reloadAll = () => {
    void items.reload();
    void combos.reload();
    void categories.reload();
  };

  const categoryFilter =
    tab !== 'combos' ? (
      <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={filterControlSx}>
          <InputLabel id="library-category">{t('meals.library.category')}</InputLabel>
          <Select
            labelId="library-category"
            label={t('meals.library.category')}
            value={categoryId}
            onChange={(e) => setCategoryId(String(e.target.value))}
          >
            <MenuItem value="">{t('meals.library.allCategories')}</MenuItem>
            {categories.categories.map((c) => (
              <MenuItem key={c.categoryId} value={c.categoryId}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {canManage && categoryId ? (
          <Button
            size="small"
            color="error"
            startIcon={<Trash2 size={14} />}
            onClick={() => {
              const cat = categories.categories.find((c) => c.categoryId === categoryId);
              if (cat) setDeactivateCategory(cat);
            }}
            sx={dashOutlinedButtonSx}
          >
            {t('meals.library.removeCategory')}
          </Button>
        ) : null}
      </Stack>
    ) : null;

  const foodTypeFilterControl =
    tab !== 'combos' ? (
      <FormControl size="small" sx={filterControlSx}>
        <InputLabel id="library-food-type">{t('meals.foodType.label')}</InputLabel>
        <Select
          labelId="library-food-type"
          label={t('meals.foodType.label')}
          value={foodTypeFilter}
          onChange={(e) => setFoodTypeFilter(e.target.value as '' | FoodType)}
        >
          <MenuItem value="">{t('meals.library.allFoodTypes', { defaultValue: 'All types' })}</MenuItem>
          {FOOD_TYPES.map((ft) => (
            <MenuItem key={ft} value={ft}>
              {t(`meals.foodType.${ft}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    ) : null;

  const toolbarActions = (
    <Button
      size="small"
      startIcon={<RefreshCw size={14} />}
      onClick={reloadAll}
      sx={dashOutlinedButtonSx}
    >
      {t('common.refresh')}
    </Button>
  );

  const viewToggle = (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={viewMode}
      onChange={(_, v: ViewMode | null) => v && setViewMode(v)}
      aria-label={t('meals.library.table')}
      sx={{
        bgcolor: s.surface,
        '& .MuiToggleButton-root': {
          border: `1px solid ${s.border}`,
          borderRadius: `${DASHBOARD_UX.buttonRadius}px !important`,
          width: DASHBOARD_UX.buttonHeight,
          height: DASHBOARD_UX.buttonHeight,
          p: 0,
          color: s.textMuted,
          '&.Mui-selected': {
            bgcolor: `${colors.primaryDark}14`,
            color: colors.primaryDark,
            borderColor: `${colors.primaryDark}55`,
          },
        },
      }}
    >
      <ToggleButton value="table" aria-label={t('meals.library.table')}>
        <List size={14} />
      </ToggleButton>
      <ToggleButton value="cards" aria-label={t('meals.library.cards')}>
        <LayoutGrid size={14} />
      </ToggleButton>
    </ToggleButtonGroup>
  );

  if (!canView) {
    return (
      <PageContainer>
        <EmptyState title={t('common.errors.forbidden')} />
      </PageContainer>
    );
  }

  const emptyAction = canManage ? (
    <Button
      variant="contained"
      startIcon={<Plus size={14} />}
      onClick={openCreate}
      sx={{
        ...dashContainedButtonSx,
        minHeight: DASHBOARD_UX.buttonHeight,
        height: DASHBOARD_UX.buttonHeight,
        bgcolor: colors.primaryDark,
        '&:hover': { bgcolor: colors.primaryHover },
      }}
    >
      {t('common.add')}
    </Button>
  ) : undefined;

  const renderItemCards = () => {
    const rows = pagedRows as Array<FoodItemResponse & { id: string }>;
    if (rows.length === 0) {
      return (
        <ContentCard>
          <EmptyState
            icon={<UtensilsCrossed size={28} color={s.textMuted} />}
            title={t('meals.library.emptyItems')}
            action={emptyAction}
          />
        </ContentCard>
      );
    }
    return (
      <>
        <Box
          sx={{
            display: 'grid',
            gap: `${DASHBOARD_UX.cardGap}px`,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {rows.map((row) => (
            <LibraryCard
              key={row.id}
              title={row.name}
              accent={itemAccent(row.foodType)}
              Icon={itemIcon(row.foodType)}
              meta={row.categoryName ?? undefined}
              actions={
                canManage ? (
                  <ItemRowActions
                    canEdit={row.isCustom}
                    showRemoveExtra={tab === 'extras'}
                    onEdit={() => {
                      setEditingItem(row);
                      setItemFormMode('edit');
                      setItemFormOpen(true);
                    }}
                    onRemoveExtra={() => setRemoveExtraItem(row)}
                    onDeactivate={() => setDeactivateItem(row)}
                  />
                ) : undefined
              }
              chips={
                <>
                  {row.categoryName ? (
                    <StatusChip label={row.categoryName} tone="info" />
                  ) : null}
                  {row.foodType ? (
                    <StatusChip
                      label={t(`meals.foodType.${row.foodType}`)}
                      tone={
                        row.foodType === 'VEG'
                          ? 'success'
                          : row.foodType === 'EGG'
                            ? 'warning'
                            : 'neutral'
                      }
                    />
                  ) : null}
                  {row.isExtra ? (
                    <StatusChip label={t('meals.library.extra')} tone="neutral" />
                  ) : null}
                  {row.isCustom ? (
                    <StatusChip label={t('meals.library.custom')} tone="info" />
                  ) : (
                    <StatusChip label={t('meals.library.globalCatalog')} tone="neutral" />
                  )}
                </>
              }
              footer={
                row.defaultPrice != null ? (
                  <Typography sx={{ ...DASHBOARD_UX.link, color: s.textPrimary, mt: 'auto' }}>
                    {`₹${row.defaultPrice}`}
                  </Typography>
                ) : null
              }
            />
          ))}
        </Box>
        {activeRows.length > PAGE_SIZE ? (
          <Pagination
            page={safePage}
            pageSize={PAGE_SIZE}
            totalItems={activeRows.length}
            onPageChange={setPage}
            zeroBased
          />
        ) : null}
      </>
    );
  };

  const renderComboCards = () => {
    const rows = pagedRows as Array<MealComboResponse & { id: string }>;
    if (rows.length === 0) {
      return (
        <ContentCard>
          <EmptyState
            icon={<Layers size={28} color={s.textMuted} />}
            title={t('meals.library.emptyCombos')}
            action={emptyAction}
          />
        </ContentCard>
      );
    }
    return (
      <>
        <Box
          sx={{
            display: 'grid',
            gap: `${DASHBOARD_UX.cardGap}px`,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {rows.map((row) => {
            const names = row.items?.map((i) => i.name) ?? [];
            const { visible, more } = truncateItemNames(names, 3);
            return (
              <LibraryCard
                key={row.id}
                title={row.name}
                accent="#7C3AED"
                Icon={Layers}
                meta={row.price != null ? `₹${row.price}` : undefined}
                actions={
                  canManage ? (
                    <ComboRowActions
                      onEdit={() => {
                        setEditingCombo(row);
                        setComboFormOpen(true);
                      }}
                      onDeactivate={() => setDeactivateComboId(row.comboId)}
                    />
                  ) : undefined
                }
                footer={
                  <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                    {names.length === 0
                      ? '—'
                      : `${visible.join(', ')}${more > 0 ? ` · +${more}` : ''}`}
                  </Typography>
                }
              />
            );
          })}
        </Box>
        {activeRows.length > PAGE_SIZE ? (
          <Pagination
            page={safePage}
            pageSize={PAGE_SIZE}
            totalItems={activeRows.length}
            onPageChange={setPage}
            zeroBased
          />
        ) : null}
      </>
    );
  };

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('meals.library.title')}
          description={t('meals.library.subtitle')}
          breadcrumbs={[
            { label: t('navigation.meals'), to: spaceMealsPath(spaceId) },
            { label: t('meals.library.title') },
          ]}
          actions={
            <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              {viewToggle}
              <IconButton
                size="small"
                aria-label={t('common.refresh')}
                onClick={reloadAll}
                sx={{
                  width: DASHBOARD_UX.buttonHeight,
                  height: DASHBOARD_UX.buttonHeight,
                  border: `1px solid ${s.border}`,
                  borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                }}
              >
                <RefreshCw size={14} />
              </IconButton>
              {canManage && tab !== 'combos' ? (
                <Button
                  size="small"
                  startIcon={<Plus size={14} />}
                  onClick={() => setCategoryFormOpen(true)}
                  sx={dashOutlinedButtonSx}
                >
                  {t('meals.library.addCategory')}
                </Button>
              ) : null}
              {canManage && showExtras && tab === 'extras' ? (
                <Button
                  size="small"
                  startIcon={<Settings2 size={14} />}
                  onClick={() => setConfigureExtrasOpen(true)}
                  sx={dashOutlinedButtonSx}
                >
                  {t('meals.library.configureExtrasManageCta')}
                </Button>
              ) : null}
              {canManage ? (
                <Button
                  variant="contained"
                  startIcon={<Plus size={14} />}
                  onClick={openCreate}
                  sx={{
                    ...dashContainedButtonSx,
                    minHeight: DASHBOARD_UX.buttonHeight,
                    height: DASHBOARD_UX.buttonHeight,
                    bgcolor: colors.primaryDark,
                    '&:hover': { bgcolor: colors.primaryHover },
                  }}
                >
                  {t('common.add')}
                </Button>
              ) : null}
            </Stack>
          }
        />

        <Tabs
          value={tab}
          onChange={(_, v: LibraryTab) => {
            setTab(v);
            setSearch('');
            setFoodTypeFilter('');
          }}
          aria-label={t('meals.library.title')}
          sx={{
            minHeight: DASHBOARD_UX.buttonHeight,
            borderBottom: `1px solid ${s.border}`,
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
          <Tab value="items" label={t('meals.library.items')} />
          <Tab value="combos" label={t('meals.library.combos')} />
          {showExtras ? <Tab value="extras" label={t('meals.library.extras')} /> : null}
        </Tabs>

        {viewMode === 'table' ? (
          tab === 'combos' ? (
            <DataTable
              columns={comboColumns}
              rows={pagedRows as Array<MealComboResponse & { id: string }>}
              loading={combos.loading}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder={t('meals.library.searchCombos', {
                defaultValue: 'Search combos...',
              })}
              searchInputId="meals-library-search"
              page={safePage}
              pageSize={PAGE_SIZE}
              totalItems={comboRows.length}
              onPageChange={setPage}
              emptyTitle={t('meals.library.emptyCombos')}
              emptyDescription={t('meals.library.subtitle')}
              toolbarActions={
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  {toolbarActions}
                </Stack>
              }
            />
          ) : (
            <DataTable
              columns={itemColumns}
              rows={pagedRows as Array<FoodItemResponse & { id: string }>}
              loading={items.loading}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder={t('meals.library.search')}
              searchInputId="meals-library-search"
              toolbarFilters={
                <>
                  {categoryFilter}
                  {foodTypeFilterControl}
                </>
              }
              page={safePage}
              pageSize={PAGE_SIZE}
              totalItems={itemRows.length}
              onPageChange={setPage}
              emptyTitle={
                tab === 'extras'
                  ? t('meals.library.emptyExtras', {
                      defaultValue: 'No extras configured yet.',
                    })
                  : t('meals.library.emptyItems')
              }
              emptyDescription={
                tab === 'extras'
                  ? t('meals.library.extrasTabHint')
                  : t('meals.library.subtitle')
              }
              toolbarActions={
                tab === 'extras' && canManage ? (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Button
                      size="small"
                      startIcon={<Settings2 size={14} />}
                      onClick={() => setConfigureExtrasOpen(true)}
                      sx={dashOutlinedButtonSx}
                    >
                      {t('meals.library.configureExtrasCta')}
                    </Button>
                    {toolbarActions}
                  </Stack>
                ) : (
                  toolbarActions
                )
              }
            />
          )
        ) : (
          <Stack spacing={`${DASHBOARD_UX.cardGap}px`}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <TextField
                id="meals-library-search"
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  tab === 'combos'
                    ? t('meals.library.searchCombos', { defaultValue: 'Search combos...' })
                    : t('meals.library.search')
                }
                sx={{
                  flex: '1 1 220px',
                  maxWidth: 360,
                  '& .MuiOutlinedInput-root': {
                    minHeight: DASHBOARD_UX.buttonHeight,
                    height: DASHBOARD_UX.buttonHeight,
                    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                    bgcolor: s.surface,
                    ...DASHBOARD_UX.body,
                  },
                }}
              />
              {categoryFilter}
              {foodTypeFilterControl}
              {toolbarActions}
            </Box>
            {tab === 'combos' ? renderComboCards() : renderItemCards()}
          </Stack>
        )}
      </Stack>

      <FoodItemFormDrawer
        open={itemFormOpen}
        mode={itemFormMode}
        spaceId={spaceId}
        item={editingItem}
        categories={categories.categories}
        defaultCategoryId={categoryId}
        createAsExtra={tab === 'extras'}
        onClose={() => {
          setItemFormOpen(false);
          setEditingItem(null);
        }}
      />

      <CreateComboPlannerDialog
        open={createComboOpen}
        spaceId={spaceId}
        variant="library"
        enableItemQuantities={enableItemQuantities}
        items={items.items}
        categories={categories.categories}
        existingOptions={[]}
        existingComboNames={combos.combos.map((c) => c.name)}
        onClose={() => setCreateComboOpen(false)}
        onCreatedCatalog={reloadAll}
        onSave={async () => {
          reloadAll();
          setCreateComboOpen(false);
        }}
      />

      <MealComboFormDrawer
        open={comboFormOpen}
        mode="edit"
        combo={editingCombo}
        spaceId={spaceId}
        enableItemQuantities={enableItemQuantities}
        items={items.items}
        categories={categories.categories}
        onClose={() => {
          setComboFormOpen(false);
          setEditingCombo(null);
        }}
      />

      <CategoryFormDialog
        open={categoryFormOpen}
        spaceId={spaceId}
        onClose={() => setCategoryFormOpen(false)}
        onCreated={(id) => setCategoryId(id)}
      />

      <ConfigureLibraryExtrasDrawer
        open={configureExtrasOpen}
        spaceId={spaceId}
        items={items.items}
        categories={categories.categories}
        onClose={() => setConfigureExtrasOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(deactivateComboId)}
        title={t('meals.library.deactivateCombo')}
        description={t('meals.library.deactivateComboConfirm')}
        confirmLabel={t('meals.library.deactivate')}
        cancelLabel={t('common.cancel')}
        destructive
        confirming={mutations.deactivateMealCombo.isPending}
        onConfirm={() => {
          if (!deactivateComboId) {
            return;
          }
          void mutations.deactivateMealCombo
            .mutateAsync(deactivateComboId)
            .then(() => {
              enqueueSnackbar(t('meals.library.comboDeactivateSuccess'), { variant: 'success' });
              setDeactivateComboId(null);
            })
            .catch(() => {
              enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
            });
        }}
        onClose={() => setDeactivateComboId(null)}
      />

      <ConfirmDialog
        open={Boolean(deactivateItem)}
        title={t('meals.library.removeItem')}
        description={
          deactivateItem?.isCustom
            ? t('meals.library.deactivateItemConfirmSpace')
            : t('meals.library.deactivateItemConfirm')
        }
        confirmLabel={t('meals.library.removeItem')}
        cancelLabel={t('common.cancel')}
        destructive
        confirming={mutations.deactivateFoodItem.isPending}
        onConfirm={() => {
          if (!deactivateItem) return;
          void mutations.deactivateFoodItem
            .mutateAsync(deactivateItem.itemId)
            .then(() => {
              enqueueSnackbar(t('meals.library.itemDeactivateSuccess'), { variant: 'success' });
              setDeactivateItem(null);
            })
            .catch(() => {
              enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
            });
        }}
        onClose={() => setDeactivateItem(null)}
      />

      <ConfirmDialog
        open={Boolean(removeExtraItem)}
        title={t('meals.library.removeExtra')}
        description={t('meals.library.removeExtraConfirm')}
        confirmLabel={t('meals.library.removeExtra')}
        cancelLabel={t('common.cancel')}
        destructive
        confirming={mutations.updateFoodItemExtra.isPending}
        onConfirm={() => {
          if (!removeExtraItem) return;
          void mutations.updateFoodItemExtra
            .mutateAsync({
              itemId: removeExtraItem.itemId,
              body: { isExtra: false },
            })
            .then(() => {
              enqueueSnackbar(t('meals.library.extraRemoveSuccess'), { variant: 'success' });
              setRemoveExtraItem(null);
            })
            .catch(() => {
              enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
            });
        }}
        onClose={() => setRemoveExtraItem(null)}
      />

      <ConfirmDialog
        open={Boolean(deactivateCategory)}
        title={deactivateCategory?.name ?? t('meals.library.removeCategory')}
        description={
          deactivateCategory?.scope === 'GLOBAL'
            ? t('meals.library.deactivateCategoryConfirmGlobal')
            : t('meals.library.deactivateCategoryConfirmSpace')
        }
        confirmLabel={t('meals.library.removeCategory')}
        cancelLabel={t('common.cancel')}
        destructive
        confirming={mutations.deactivateFoodCategory.isPending}
        onConfirm={() => {
          if (!deactivateCategory) return;
          void mutations.deactivateFoodCategory
            .mutateAsync(deactivateCategory.categoryId)
            .then(() => {
              enqueueSnackbar(t('meals.library.categoryDeactivateSuccess'), {
                variant: 'success',
              });
              if (categoryId === deactivateCategory.categoryId) {
                setCategoryId('');
              }
              setDeactivateCategory(null);
            })
            .catch(() => {
              enqueueSnackbar(t('common.errors.generic'), { variant: 'error' });
            });
        }}
        onClose={() => setDeactivateCategory(null)}
      />
    </PageContainer>
  );
}
