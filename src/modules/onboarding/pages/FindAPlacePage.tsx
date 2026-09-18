import {
  Box,
  Button,
  Drawer,
  FormControl,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Building2, MapPin, Search, SlidersHorizontal, UtensilsCrossed } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  ActiveDiscoverFilterChips,
  DiscoverFiltersPanel,
  EMPTY_DISCOVER_FILTERS,
  PLACE_SPACE_TYPES,
  type DiscoverCategory,
  type DiscoverFilterState,
} from '@/modules/onboarding/components/DiscoverFiltersPanel';
import { DiscoverSpaceCard } from '@/modules/onboarding/components/DiscoverSpaceCard';
import { DiscoverSpaceDetailDrawer } from '@/modules/onboarding/components/DiscoverSpaceDetailDrawer';
import { getErrorMessage } from '@/shared/api/errors';
import { spaceDiscoverApi } from '@/shared/api/spaceDiscoverApi';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { colors } from '@/shared/theme/colors';
import type { DiscoverSpaceCardResponse, SpaceType } from '@/shared/types/space';

const PAGE_SIZE = 12;
const FETCH_SIZE = 50;

const EMPTY_FILTERS: DiscoverFilterState = EMPTY_DISCOVER_FILTERS;

function localityFromAddress(address?: string | null): string | null {
  const trimmed = address?.trim();
  if (!trimmed) return null;
  const first = trimmed.split(',')[0]?.trim();
  return first || trimmed;
}

function DiscoverCardSkeleton() {
  return (
    <Box
      sx={{
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
        bgcolor: colors.surface,
      }}
    >
      <Skeleton variant="rectangular" height={180} />
      <Stack spacing={1} sx={{ p: 1.75 }}>
        <Skeleton variant="text" width="70%" height={26} />
        <Skeleton variant="text" width="55%" />
        <Skeleton variant="rounded" height={22} width="70%" />
      </Stack>
    </Box>
  );
}

/**
 * Public site split: /places (stay) vs /meals (mess), with discovery API data.
 */
export function FindAPlacePage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isNarrow = useMediaQuery(theme.breakpoints.down('lg'));
  const [category, setCategory] = useState<DiscoverCategory>('places');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filters, setFilters] = useState<DiscoverFilterState>(EMPTY_FILTERS);
  const [sort, setSort] = useState<'recommended' | 'newest'>('recommended');
  const [page, setPage] = useState(1);
  const [detailSpaceId, setDetailSpaceId] = useState<string | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [autoEnquire, setAutoEnquire] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const autoEnquireConsumed = useRef(false);

  useEffect(() => {
    document.title = `${t('navigation.findAPlace')} · ${t('common.appName')}`;
  }, [t]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search.trim()), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setFilters(EMPTY_FILTERS);
  }, [category]);

  useEffect(() => {
    setPage(1);
  }, [debounced, filters, sort]);

  const enquireTab = searchParams.get('tab');
  const enquireName = searchParams.get('name')?.trim() ?? '';
  const enquireSpaceId = searchParams.get('space')?.trim() ?? '';
  const shouldEnquire = searchParams.get('enquire') === '1';

  useEffect(() => {
    if (enquireTab === 'mess' || enquireTab === 'places') {
      setCategory(enquireTab);
    }
    if (enquireName) {
      setSearch(enquireName);
    }
  }, [enquireName, enquireTab]);

  const apiType: SpaceType | undefined =
    category === 'mess'
      ? 'MESS'
      : filters.types.length === 1
        ? filters.types[0]
        : undefined;

  const discoverQuery = useQuery({
    queryKey: ['spaces-discover', category, debounced, apiType, sort],
    queryFn: () =>
      spaceDiscoverApi.discoverSpaces({
        search: debounced || undefined,
        type: apiType,
        page: 0,
        size: FETCH_SIZE,
        sort: 'newest',
      }),
  });

  const rawContent = useMemo(() => {
    const content = discoverQuery.data?.content ?? [];
    if (category === 'mess') {
      return content.filter((space) => space.type === 'MESS');
    }
    // Places tab never mixes mess listings (same as public /places).
    return content.filter((space) => PLACE_SPACE_TYPES.includes(space.type));
  }, [category, discoverQuery.data?.content]);

  useEffect(() => {
    if (!shouldEnquire || autoEnquireConsumed.current || discoverQuery.isLoading) {
      return;
    }
    const match =
      (enquireSpaceId
        ? rawContent.find((space) => space.spaceId === enquireSpaceId)
        : undefined) ??
      (enquireName
        ? rawContent.find(
            (space) => space.name.trim().toLowerCase() === enquireName.toLowerCase(),
          ) ??
          rawContent.find((space) =>
            space.name.toLowerCase().includes(enquireName.toLowerCase()),
          )
        : undefined);
    if (!match) {
      return;
    }
    autoEnquireConsumed.current = true;
    setDetailSpaceId(match.spaceId);
    setAutoEnquire(true);
    const next = new URLSearchParams(searchParams);
    next.delete('enquire');
    setSearchParams(next, { replace: true });
  }, [
    discoverQuery.isLoading,
    enquireName,
    enquireSpaceId,
    rawContent,
    searchParams,
    setSearchParams,
    shouldEnquire,
  ]);

  const localities = useMemo(() => {
    const set = new Set<string>();
    for (const space of rawContent) {
      const locality = localityFromAddress(space.address);
      if (locality) set.add(locality);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [rawContent]);

  const amenityOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const space of rawContent) {
      const codes = space.amenityCodes ?? [];
      const labels = space.amenityLabels ?? [];
      codes.forEach((code, index) => {
        if (code && !map.has(code)) {
          map.set(code, labels[index] || code);
        }
      });
    }
    return [...map.entries()]
      .map(([code, label]) => ({ code, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [rawContent]);

  const filtered = useMemo(() => {
    return rawContent.filter((space) => {
      if (category === 'places' && filters.types.length > 0 && !filters.types.includes(space.type)) {
        return false;
      }
      if (filters.localities.length > 0) {
        const address = (space.address ?? '').toLowerCase();
        const matchesLocality = filters.localities.some((locality) =>
          address.includes(locality.toLowerCase()),
        );
        if (!matchesLocality) {
          return false;
        }
      }
      if (filters.amenities.length > 0) {
        const codes = new Set(space.amenityCodes ?? []);
        if (!filters.amenities.every((code) => codes.has(code))) {
          return false;
        }
      }
      return true;
    });
  }, [category, filters, rawContent]);

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const shown = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const pageBg = isDark ? 'transparent' : '#F4F7F8';
  const textPrimary = isDark ? theme.palette.text.primary : colors.textPrimary;
  const textSecondary = isDark ? theme.palette.text.secondary : colors.textSecondary;

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const eyebrow =
    category === 'mess' ? t('spaces.findPlace.tabs.messEyebrow') : t('spaces.findPlace.eyebrow');
  const title =
    category === 'mess' ? t('spaces.findPlace.tabs.messTitle') : t('spaces.findPlace.heroTitle');
  const subtitle =
    category === 'mess'
      ? t('spaces.findPlace.tabs.messSubtitle')
      : t('spaces.findPlace.heroSubtitle');
  const searchPlaceholder =
    category === 'mess'
      ? t('spaces.findPlace.tabs.messSearchPlaceholder')
      : t('spaces.findPlace.searchPlaceholder');

  const filtersPanel = (
    <DiscoverFiltersPanel
      category={category}
      value={filters}
      localities={localities}
      amenityOptions={amenityOptions}
      onChange={setFilters}
      onClear={clearFilters}
    />
  );

  return (
    <Box sx={{ flex: 1, bgcolor: pageBg, py: { xs: 2.5, sm: 3 } }}>
      <Box sx={{ width: '100%', px: { xs: 1.5, sm: 2 } }}>
        <Tabs
          value={category}
          onChange={(_, next: DiscoverCategory) => setCategory(next)}
          sx={{
            minHeight: 44,
            mb: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              minHeight: 44,
              fontSize: '0.95rem',
            },
            '& .Mui-selected': { color: `${colors.primary} !important` },
            '& .MuiTabs-indicator': { bgcolor: colors.primary, height: 3, borderRadius: 2 },
          }}
        >
          <Tab
            value="places"
            icon={<Building2 size={16} />}
            iconPosition="start"
            label={t('spaces.findPlace.tabs.places')}
          />
          <Tab
            value="mess"
            icon={<UtensilsCrossed size={16} />}
            iconPosition="start"
            label={t('spaces.findPlace.tabs.mess')}
          />
        </Tabs>

        <Typography
          sx={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: colors.primary,
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </Typography>
        <Typography
          component="h1"
          sx={{
            mt: 1,
            fontSize: { xs: '1.85rem', sm: '2.2rem' },
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: textPrimary,
            lineHeight: 1.15,
          }}
        >
          {title}
        </Typography>
        <Typography sx={{ mt: 1, fontSize: { xs: '0.875rem', sm: '0.9375rem' }, color: textSecondary }}>
          {subtitle}
        </Typography>

        <Box
          sx={{
            mt: 2.5,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '240px minmax(0, 1fr)' },
            gap: 2,
            alignItems: 'start',
          }}
        >
          <Box
            component="aside"
            sx={{
              display: { xs: 'none', lg: 'block' },
              minHeight: 'calc(100dvh - 8rem)',
              borderRadius: '16px',
              border: '1px solid #8fd4b0',
              bgcolor: '#d6f3e4',
              p: 2,
            }}
          >
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: textPrimary, mb: 2 }}>
              {t('spaces.findPlace.filters.title')}
            </Typography>
            {filtersPanel}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { sm: 'center' },
                gap: 1,
                p: 1,
                borderRadius: '16px',
                border: `1px solid ${isDark ? theme.palette.divider : 'rgba(15,23,42,0.06)'}`,
                bgcolor: colors.surface,
                boxShadow: isDark ? 'none' : '0 1px 3px rgba(15,23,42,0.06)',
              }}
            >
              <TextField
                fullWidth
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                slotProps={{
                  htmlInput: { 'aria-label': t('spaces.findPlace.searchLabel') },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={16} color={colors.muted} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'transparent',
                    borderRadius: '12px',
                    minHeight: 44,
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: 'transparent' },
                    '&.Mui-focused fieldset': { borderColor: colors.primary },
                  },
                }}
              />
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', px: { sm: 0.5 }, flexShrink: 0 }}
              >
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.5,
                    py: 1.25,
                    borderRadius: '12px',
                    bgcolor: colors.mintSubtle,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: textPrimary,
                  }}
                >
                  <MapPin size={16} color={colors.primary} />
                  {t('spaces.findPlace.cityPune')}
                </Box>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <Select
                    value={sort}
                    onChange={(event) =>
                      setSort(event.target.value as 'recommended' | 'newest')
                    }
                    aria-label={t('spaces.findPlace.sortLabel')}
                    sx={{ borderRadius: '12px', fontSize: '0.8125rem', bgcolor: 'transparent' }}
                  >
                    <MenuItem value="recommended">{t('spaces.findPlace.sort.recommended')}</MenuItem>
                    <MenuItem value="newest">{t('spaces.findPlace.sort.newest')}</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            <Stack
              direction="row"
              sx={{
                mt: 2,
                mb: 1,
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Typography sx={{ fontSize: '0.875rem', color: textSecondary }}>
                {!discoverQuery.isLoading && !discoverQuery.isError
                  ? category === 'mess'
                    ? t('spaces.findPlace.tabs.messResultCount', { count: totalElements })
                    : t('spaces.findPlace.resultCount', { count: totalElements })
                  : ' '}
              </Typography>
              <Button
                variant="text"
                startIcon={<SlidersHorizontal size={16} />}
                onClick={() => setFilterSheetOpen(true)}
                sx={{
                  display: { xs: 'inline-flex', lg: 'none' },
                  textTransform: 'none',
                  fontWeight: 600,
                  color: textPrimary,
                }}
              >
                {t('spaces.findPlace.filters.title')}
              </Button>
            </Stack>

            <Box sx={{ mb: 1.5 }}>
              <ActiveDiscoverFilterChips
                category={category}
                value={filters}
                amenityOptions={amenityOptions}
                onChange={setFilters}
                onClearAll={clearFilters}
              />
            </Box>

            {discoverQuery.isLoading ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    md: 'repeat(3, minmax(0, 1fr))',
                    xl: 'repeat(4, minmax(0, 1fr))',
                  },
                  gap: 2,
                }}
              >
                {Array.from({ length: isNarrow ? 3 : 8 }).map((_, index) => (
                  <DiscoverCardSkeleton key={index} />
                ))}
              </Box>
            ) : null}

            {discoverQuery.isError ? (
              <ErrorState
                message={getErrorMessage(discoverQuery.error, t('spaces.findPlace.errorLoad'))}
                onRetry={() => void discoverQuery.refetch()}
              />
            ) : null}

            {!discoverQuery.isLoading && !discoverQuery.isError && shown.length === 0 ? (
              <EmptyState
                icon={
                  category === 'mess' ? (
                    <UtensilsCrossed size={28} color={colors.textSecondary} />
                  ) : (
                    <Building2 size={28} color={colors.textSecondary} />
                  )
                }
                title={
                  category === 'mess'
                    ? t('spaces.findPlace.tabs.messEmptyTitle')
                    : t('spaces.findPlace.emptyTitle')
                }
                description={
                  category === 'mess'
                    ? t('spaces.findPlace.tabs.messEmptyDescription')
                    : t('spaces.findPlace.emptyDescription')
                }
              />
            ) : null}

            {!discoverQuery.isLoading && !discoverQuery.isError && shown.length > 0 ? (
              <>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, minmax(0, 1fr))',
                      md: 'repeat(3, minmax(0, 1fr))',
                      xl: 'repeat(4, minmax(0, 1fr))',
                    },
                    gap: 2,
                  }}
                >
                  {shown.map((space: DiscoverSpaceCardResponse) => (
                    <DiscoverSpaceCard
                      key={space.spaceId}
                      space={space}
                      onViewDetails={setDetailSpaceId}
                    />
                  ))}
                </Box>

                {totalPages > 1 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
                    <Pagination
                      count={totalPages}
                      page={pageSafe}
                      onChange={(_, next) => setPage(next)}
                      color="primary"
                      shape="rounded"
                      aria-label={t('spaces.findPlace.paginationAria')}
                    />
                  </Box>
                ) : null}
              </>
            ) : null}
          </Box>
        </Box>
      </Box>

      <Drawer
        anchor="bottom"
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        slotProps={{
          paper: {
            sx: {
              maxHeight: '85dvh',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              p: 2.5,
              bgcolor: '#d6f3e4',
            },
          },
        }}
      >
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontWeight: 700 }}>{t('spaces.findPlace.filters.title')}</Typography>
          <Button onClick={() => setFilterSheetOpen(false)} sx={{ textTransform: 'none' }}>
            {t('spaces.findPlace.close')}
          </Button>
        </Stack>
        {filtersPanel}
      </Drawer>

      <DiscoverSpaceDetailDrawer
        spaceId={detailSpaceId}
        open={Boolean(detailSpaceId)}
        autoEnquire={autoEnquire}
        onClose={() => {
          setAutoEnquire(false);
          setDetailSpaceId(null);
        }}
      />
    </Box>
  );
}
