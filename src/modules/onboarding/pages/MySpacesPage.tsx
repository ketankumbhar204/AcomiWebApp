import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import {
  AlertTriangle,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Filter,
  LayoutGrid,
  List,
  Mail,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import {
  SPACE_CARD_COMPACT_WIDTH,
  SpaceCardCompact,
} from '@/modules/onboarding/components/SpaceCardCompact';
import { useGlobalDashboard } from '@/modules/global/hooks/useGlobalDashboard';
import { useConsumerSpacesAttention } from '@/modules/global/hooks/useConsumerSpacesAttention';
import { isConsumerMembershipRole } from '@/modules/onboarding/utils/profileCompletion';
import { mySpacesApi } from '@/shared/api/mySpacesApi';
import { ContentCard } from '@/shared/components/ContentCard';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingState } from '@/shared/components/LoadingState';
import { PageContainer } from '@/shared/components/PageContainer';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { MySpaceResponse } from '@/shared/types/space';
import {
  ROUTES,
  spaceDashboardPath,
  spaceDetailsPath,
  spaceEditPath,
} from '@/routes/paths';
import { useAuthSession } from '@/shared/hooks/useAuthSession';
import { useSpaceStore } from '@/store/spaceStore';

const PAGE_SIZE = 9;
const KPI_HEIGHT = 108;

type SpaceFilter = 'all' | 'attention' | 'owner' | 'member';
type SpaceSort = 'nameAsc' | 'nameDesc' | 'type' | 'role' | 'attention';
type ViewMode = 'grid' | 'list';

function formatRelativeTime(iso: string | undefined, fallback: string): string {
  if (!iso) return fallback;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return fallback;
  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (abs < 60) return rtf.format(diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
  const diffDay = Math.round(diffHr / 24);
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');
  return new Date(iso).toLocaleDateString();
}

const primaryOutlinedSx = {
  ...dashOutlinedButtonSx,
  color: colors.primaryDark,
  borderColor: colors.primaryDark,
  '&:hover': {
    borderColor: colors.primaryDark,
    bgcolor: `${colors.primaryDark}0F`,
  },
} as const;

const toolbarBtnSx = {
  ...dashOutlinedButtonSx,
  color: colors.textPrimary,
  borderColor: colors.border,
  flexShrink: 0,
  '&:hover': {
    borderColor: colors.border,
    bgcolor: `${colors.primaryDark}0A`,
  },
} as const;

export function MySpacesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthSession();
  const switchSpace = useSpaceStore((state) => state.switchSpace);
  const loadMySpaces = useSpaceStore((state) => state.loadMySpaces);
  const storeSpaces = useSpaceStore((state) => state.mySpaces);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<SpaceFilter>('all');
  const [sort, setSort] = useState<SpaceSort>('nameAsc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [sortAnchor, setSortAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    document.title = `${t('navigation.mySpaces')} · ${t('common.appName')}`;
  }, [t]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search.trim()), 250);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced, filter, sort]);

  const spacesQuery = useQuery({
    queryKey: ['my-spaces', debounced],
    queryFn: () =>
      debounced ? mySpacesApi.searchMySpaces(debounced) : mySpacesApi.getMySpaces(),
  });

  const spaces = useMemo(() => spacesQuery.data ?? [], [spacesQuery.data]);

  const hasOperatorSpace = useMemo(
    () =>
      (storeSpaces.length > 0 ? storeSpaces : spaces).some(
        (space) => space.membershipRole === 'OWNER' || space.membershipRole === 'MANAGER',
      ),
    [spaces, storeSpaces],
  );

  const hasConsumerSpace = useMemo(
    () =>
      (storeSpaces.length > 0 ? storeSpaces : spaces).some((space) =>
        isConsumerMembershipRole(space.membershipRole),
      ),
    [spaces, storeSpaces],
  );

  const isSearching = Boolean(debounced);
  const showGlobalOverview = !isSearching && (spaces.length > 0 || storeSpaces.length > 0);
  const globalDashboard = useGlobalDashboard(showGlobalOverview);
  const consumerAttention = useConsumerSpacesAttention(
    storeSpaces.length > 0 ? storeSpaces : spaces,
    hasConsumerSpace && !isSearching,
  );

  const pendingBySpace = useMemo(() => {
    const map = new Map<string, number>();
    for (const summary of globalDashboard.data?.spaceSummaries ?? []) {
      map.set(summary.spaceId, summary.pendingActionCount);
    }
    return map;
  }, [globalDashboard.data?.spaceSummaries]);

  const pendingFor = (space: MySpaceResponse) =>
    isConsumerMembershipRole(space.membershipRole)
      ? (consumerAttention.bySpaceId[space.spaceId]?.totalCount ?? 0)
      : (pendingBySpace.get(space.spaceId) ?? 0);

  const filteredSpaces = useMemo(() => {
    const list = spaces.filter((space) => {
      if (filter === 'all') return true;
      if (filter === 'owner') {
        return space.membershipRole === 'OWNER' || space.membershipRole === 'MANAGER';
      }
      if (filter === 'member') {
        return isConsumerMembershipRole(space.membershipRole) || space.membershipRole === 'STAFF';
      }
      if (filter === 'attention') {
        return pendingFor(space) > 0;
      }
      return true;
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'nameDesc':
          return b.spaceName.localeCompare(a.spaceName);
        case 'type':
          return a.spaceType.localeCompare(b.spaceType) || a.spaceName.localeCompare(b.spaceName);
        case 'role':
          return (
            a.membershipRole.localeCompare(b.membershipRole) ||
            a.spaceName.localeCompare(b.spaceName)
          );
        case 'attention':
          return pendingFor(b) - pendingFor(a) || a.spaceName.localeCompare(b.spaceName);
        case 'nameAsc':
        default:
          return a.spaceName.localeCompare(b.spaceName);
      }
    });
    return sorted;
  }, [consumerAttention.bySpaceId, filter, pendingBySpace, sort, spaces]);

  const openSpace = async (spaceId: string) => {
    await switchSpace(spaceId);
    await loadMySpaces();
    navigate(spaceDashboardPath(spaceId));
  };

  const setAsDefault = async (spaceId: string) => {
    const ok = await switchSpace(spaceId);
    await loadMySpaces();
    enqueueSnackbar(
      ok ? t('spaces.mySpaces.setDefaultSuccess') : t('common.errors.generic'),
      { variant: ok ? 'success' : 'error' },
    );
  };

  const attentionSpaces = globalDashboard.data?.attentionRequired?.length ?? 0;
  const attentionCount = globalDashboard.data?.totalAttentionCount ?? 0;
  const latestActivity = globalDashboard.data?.recentActivity?.[0];

  const pageCount = Math.max(1, Math.ceil(filteredSpaces.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredSpaces.slice(start, start + PAGE_SIZE);
  }, [filteredSpaces, safePage]);
  const showingFrom = filteredSpaces.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(safePage * PAGE_SIZE, filteredSpaces.length);

  const filterLabel =
    filter === 'all'
      ? t('spaces.mySpaces.filterAll')
      : filter === 'attention'
        ? t('spaces.mySpaces.filterAttention')
        : filter === 'owner'
          ? t('spaces.mySpaces.filterOwner')
          : t('spaces.mySpaces.filterMember');

  const sortLabel =
    sort === 'nameAsc'
      ? t('spaces.mySpaces.sortNameAsc')
      : sort === 'nameDesc'
        ? t('spaces.mySpaces.sortNameDesc')
        : sort === 'type'
          ? t('spaces.mySpaces.sortType')
          : sort === 'role'
            ? t('spaces.mySpaces.sortRole')
            : t('spaces.mySpaces.sortAttention');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('spaces.mySpaces.greetingMorning');
    if (hour < 17) return t('spaces.mySpaces.greetingAfternoon');
    return t('spaces.mySpaces.greetingEvening');
  }, [t]);

  const greetingName =
    user?.fullName?.trim() ||
    (hasOperatorSpace ? t('spaces.roles.OWNER') : user?.mobileNumber?.trim() || '');

  const heroSubtitle = greetingName
    ? `${t('spaces.mySpaces.greetingWithName', { greeting, name: greetingName })} ${t('spaces.mySpaces.subheading')}`
    : t('spaces.mySpaces.heroSubtitle');

  const kpiSx = {
    height: KPI_HEIGHT,
    maxHeight: 'none',
    minHeight: KPI_HEIGHT,
    flex: '1 1 280px',
    width: '100%',
    p: `${DASHBOARD_UX.metricPadding}px`,
    borderRadius: `${DASHBOARD_UX.radius}px`,
    border: `1px solid ${s.border}`,
    boxShadow: s.shadow,
    outline: 'none',
    cursor: 'pointer',
    transition: 'box-shadow 160ms ease, transform 160ms ease',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: `${DASHBOARD_UX.metricGap}px`,
    boxSizing: 'border-box' as const,
    '&:hover': { boxShadow: s.shadowHover, transform: 'translateY(-1px)' },
    '&:focus-visible': { boxShadow: `0 0 0 2px ${colors.primaryDark}` },
  };

  const isEmptyCatalog = !debounced && filter === 'all' && spaces.length === 0;

  return (
    <PageContainer gap={0}>
        <Stack
          spacing={`${DASHBOARD_UX.sectionGap}px`}
          sx={{ width: '100%', maxWidth: DASHBOARD_UX.contentMaxWidth, mx: 'auto' }}
        >
          {/* Hero */}
          <Box
            sx={{
              display: 'flex',
              alignItems: { xs: 'stretch', md: 'flex-start' },
              justifyContent: 'space-between',
              gap: 1.5,
              flexDirection: { xs: 'column', md: 'row' },
            }}
          >
            <Box sx={{ minWidth: 0, maxWidth: 640 }}>
              <Typography component="h1" sx={{ ...DASHBOARD_UX.pageTitle, color: s.textPrimary }}>
                {t('navigation.mySpaces')}
              </Typography>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 0.35 }}>
                {heroSubtitle}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', flexShrink: 0 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Plus size={14} />}
                onClick={() => navigate(ROUTES.createSpace)}
                sx={{
                  ...dashContainedButtonSx,
                  minHeight: DASHBOARD_UX.buttonHeight,
                  height: DASHBOARD_UX.buttonHeight,
                  bgcolor: colors.primaryDark,
                  '&:hover': { bgcolor: colors.primaryHover },
                }}
              >
                {t('spaces.mySpaces.addSpace')}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Mail size={14} />}
                onClick={() => navigate(ROUTES.acceptInvitations)}
                sx={primaryOutlinedSx}
              >
                {t('navigation.acceptInvitations')}
              </Button>
            </Stack>
          </Box>

          {/* Compact KPI strip — Dashboard payment-card height, card-width capped */}
          {showGlobalOverview ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: `${DASHBOARD_UX.cardGap}px`,
                alignItems: 'stretch',
              }}
            >
              {attentionCount <= 0 ? (
                <Box
                  sx={{
                    ...kpiSx,
                    cursor: 'default',
                    bgcolor: s.surface,
                    '&:hover': { boxShadow: s.shadow, transform: 'none' },
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
                    <IconBadge accent={colors.success}>
                      <CheckCircle2 />
                    </IconBadge>
                    <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                      {t('spaces.globalDashboard.attentionOk')}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(ROUTES.globalAttention)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(ROUTES.globalAttention);
                    }
                  }}
                  aria-label={t('spaces.globalDashboard.attentionA11y', {
                    spaces: attentionSpaces,
                    count: attentionCount,
                  })}
                  sx={{
                    ...kpiSx,
                    border: `1px solid ${s.pendingBorder}`,
                    bgcolor: s.pendingTint,
                    '&:focus-visible': { boxShadow: `0 0 0 2px ${colors.warning}` },
                  }}
                >
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                    <IconBadge accent={colors.warning}>
                      <AlertTriangle />
                    </IconBadge>
                    <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, flex: 1 }}>
                      {t('spaces.globalDashboard.needsAttention')}
                    </Typography>
                    <ChevronRight size={14} color={s.textMuted} aria-hidden />
                  </Stack>
                  <Stack direction="row" spacing={2} sx={{ mt: 'auto', flexWrap: 'wrap' }}>
                    <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                      <Box
                        component="span"
                        sx={{ ...DASHBOARD_UX.counterValue, color: s.textPrimary, mr: 0.5 }}
                      >
                        {attentionSpaces}
                      </Box>
                      {t('spaces.globalDashboard.spacesLabel', { count: attentionSpaces })}
                    </Typography>
                    <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                      <Box
                        component="span"
                        sx={{ ...DASHBOARD_UX.counterValue, color: s.textPrimary, mr: 0.5 }}
                      >
                        {attentionCount}
                      </Box>
                      {t('spaces.globalDashboard.pendingActionsShort', {
                        count: attentionCount,
                      })}
                    </Typography>
                  </Stack>
                </Box>
              )}

              <Box
                role="button"
                tabIndex={0}
                onClick={() => navigate(ROUTES.globalActivity)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(ROUTES.globalActivity);
                  }
                }}
                aria-label={t('spaces.globalDashboard.activityTitle')}
                sx={{
                  ...kpiSx,
                  bgcolor: theme.palette.mode === 'dark' ? s.elevated : `${colors.primaryDark}0A`,
                }}
              >
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                  <IconBadge accent={colors.primaryDark}>
                    <Clock3 />
                  </IconBadge>
                  <Typography sx={{ ...DASHBOARD_UX.cardTitle, color: s.textPrimary, flex: 1 }}>
                    {t('spaces.globalDashboard.activityTitle')}
                  </Typography>
                  <ChevronRight size={14} color={s.textMuted} aria-hidden />
                </Stack>
                <Typography
                  sx={{ ...DASHBOARD_UX.body, color: s.textSecondary, mt: 'auto' }}
                  noWrap
                >
                  {latestActivity
                    ? (() => {
                        const relative = formatRelativeTime(latestActivity.createdAt, '');
                        return relative
                          ? `${latestActivity.title} - ${relative}`
                          : latestActivity.title;
                      })()
                    : t('spaces.globalDashboard.activityEmptyTitle')}
                </Typography>
              </Box>
            </Box>
          ) : null}

          {/* Dashboard-style filter bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <TextField
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('spaces.mySpaces.searchPlaceholder')}
              sx={{
                flex: '1 1 240px',
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  minHeight: DASHBOARD_UX.buttonHeight,
                  height: DASHBOARD_UX.buttonHeight,
                  borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                  bgcolor: s.surface,
                  ...DASHBOARD_UX.inputText,
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={DASHBOARD_UX.iconSize} color={s.textMuted} />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        aria-label="Clear search"
                        onClick={() => setSearch('')}
                      >
                        <X size={DASHBOARD_UX.iconSize} />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                },
              }}
            />

            <Button
              variant="outlined"
              startIcon={<Filter size={14} />}
              endIcon={<ChevronDown size={14} />}
              onClick={(event) => setFilterAnchor(event.currentTarget)}
              aria-haspopup="menu"
              aria-expanded={Boolean(filterAnchor)}
              sx={toolbarBtnSx}
            >
              {filterLabel}
            </Button>
            <Menu
              anchorEl={filterAnchor}
              open={Boolean(filterAnchor)}
              onClose={() => setFilterAnchor(null)}
            >
              {(
                [
                  ['all', t('spaces.mySpaces.filterAll')],
                  ['attention', t('spaces.mySpaces.filterAttention')],
                  ['owner', t('spaces.mySpaces.filterOwner')],
                  ['member', t('spaces.mySpaces.filterMember')],
                ] as const
              ).map(([value, label]) => (
                <MenuItem
                  key={value}
                  selected={filter === value}
                  onClick={() => {
                    setFilter(value);
                    setFilterAnchor(null);
                  }}
                >
                  {label}
                </MenuItem>
              ))}
            </Menu>

            <Button
              variant="outlined"
              startIcon={<ArrowUpDown size={14} />}
              endIcon={<ChevronDown size={14} />}
              onClick={(event) => setSortAnchor(event.currentTarget)}
              aria-haspopup="menu"
              aria-expanded={Boolean(sortAnchor)}
              aria-label={t('spaces.mySpaces.sortAria')}
              sx={toolbarBtnSx}
            >
              {sortLabel}
            </Button>
            <Menu
              anchorEl={sortAnchor}
              open={Boolean(sortAnchor)}
              onClose={() => setSortAnchor(null)}
            >
              {(
                [
                  ['nameAsc', t('spaces.mySpaces.sortNameAsc')],
                  ['nameDesc', t('spaces.mySpaces.sortNameDesc')],
                  ['type', t('spaces.mySpaces.sortType')],
                  ['role', t('spaces.mySpaces.sortRole')],
                  ['attention', t('spaces.mySpaces.sortAttention')],
                ] as const
              ).map(([value, label]) => (
                <MenuItem
                  key={value}
                  selected={sort === value}
                  onClick={() => {
                    setSort(value);
                    setSortAnchor(null);
                  }}
                >
                  {label}
                </MenuItem>
              ))}
            </Menu>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={viewMode}
              onChange={(_, next: ViewMode | null) => {
                if (next) setViewMode(next);
              }}
              aria-label={t('spaces.mySpaces.viewModeAria')}
              sx={{
                bgcolor: s.surface,
                ml: { sm: 'auto' },
                '& .MuiToggleButton-root': {
                  border: `1px solid ${s.border}`,
                  borderRadius: `${DASHBOARD_UX.buttonRadius}px !important`,
                  width: DASHBOARD_UX.buttonHeight,
                  height: DASHBOARD_UX.buttonHeight,
                  p: 0,
                  color: s.textMuted,
                  '&.Mui-selected': {
                    bgcolor: `${colors.primary} !important`,
                    color: '#fff',
                    borderColor: colors.primary,
                  },
                },
              }}
            >
              <ToggleButton value="grid" aria-label={t('spaces.mySpaces.viewGrid')}>
                <LayoutGrid size={14} />
              </ToggleButton>
              <ToggleButton value="list" aria-label={t('spaces.mySpaces.viewList')}>
                <List size={14} />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {spacesQuery.isLoading ? (
            <LoadingState label={t('spaces.mySpaces.loading')} />
          ) : filteredSpaces.length === 0 ? (
            <ContentCard>
              <EmptyState
                icon={<Building2 size={28} color={s.textMuted} />}
                title={
                  isEmptyCatalog
                    ? t('spaces.mySpaces.emptyTitle')
                    : t('spaces.mySpaces.searchEmptyTitle')
                }
                description={
                  isEmptyCatalog
                    ? t('spaces.mySpaces.emptyDescription')
                    : t('spaces.mySpaces.searchEmptyDescription')
                }
                action={
                  isEmptyCatalog ? (
                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      sx={{ flexWrap: 'wrap', justifyContent: 'center' }}
                    >
                      <Button
                        variant="contained"
                        onClick={() => navigate(ROUTES.createSpace)}
                        sx={{
                          ...dashContainedButtonSx,
                          minHeight: DASHBOARD_UX.buttonHeight,
                          height: DASHBOARD_UX.buttonHeight,
                          bgcolor: colors.primaryDark,
                          '&:hover': { bgcolor: colors.primaryHover },
                        }}
                      >
                        {t('spaces.mySpaces.createFab')}
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => navigate(ROUTES.acceptInvitations)}
                        sx={primaryOutlinedSx}
                      >
                        {t('spaces.mySpaces.viewInvitations')}
                      </Button>
                    </Stack>
                  ) : null
                }
              />
            </ContentCard>
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gap: `${DASHBOARD_UX.cardGap}px`,
                  justifyContent: 'start',
                  alignItems: 'stretch',
                  gridTemplateColumns:
                    viewMode === 'list'
                      ? '1fr'
                      : {
                          xs: '1fr',
                          sm: `repeat(2, minmax(${SPACE_CARD_COMPACT_WIDTH.min}px, ${SPACE_CARD_COMPACT_WIDTH.max}px))`,
                          lg: `repeat(3, minmax(${SPACE_CARD_COMPACT_WIDTH.min}px, ${SPACE_CARD_COMPACT_WIDTH.max}px))`,
                          xl: `repeat(4, minmax(${SPACE_CARD_COMPACT_WIDTH.min}px, ${SPACE_CARD_COMPACT_WIDTH.max}px))`,
                        },
                }}
              >
                {pageSlice.map((space) => {
                  const pending = pendingFor(space);
                  const capacityTotal = Math.max(pending, 10);
                  return (
                    <SpaceCardCompact
                      key={space.spaceId}
                      space={space}
                      layout={viewMode}
                      capacityUsed={pending}
                      capacityTotal={capacityTotal}
                      onOpenDashboard={() => void openSpace(space.spaceId)}
                      onOpenDetails={() => navigate(spaceDetailsPath(space.spaceId))}
                      onSetDefault={() => void setAsDefault(space.spaceId)}
                      onEdit={() => navigate(spaceEditPath(space.spaceId))}
                    />
                  );
                })}
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }}>
                  {t('spaces.mySpaces.paginationShowing', {
                    from: showingFrom,
                    to: showingTo,
                    total: filteredSpaces.length,
                  })}
                </Typography>
                {filteredSpaces.length > PAGE_SIZE ? (
                  <Pagination
                    count={pageCount}
                    page={safePage}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                    shape="rounded"
                    size="small"
                    siblingCount={1}
                    boundaryCount={1}
                    aria-label={t('spaces.mySpaces.paginationAria')}
                    sx={{
                      '& .MuiPaginationItem-root': {
                        ...DASHBOARD_UX.button,
                        minWidth: 32,
                        height: 32,
                        borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                      },
                      '& .Mui-selected': {
                        bgcolor: `${colors.primaryDark} !important`,
                        color: '#fff',
                      },
                    }}
                  />
                ) : null}
              </Box>
            </>
          )}
        </Stack>
      </PageContainer>
  );
}
