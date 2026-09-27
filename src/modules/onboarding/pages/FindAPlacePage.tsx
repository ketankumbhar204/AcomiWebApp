import {
  Box,
  Button,
  Drawer,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
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
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { Building2, MapPin, Search, SlidersHorizontal, UtensilsCrossed, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  ActiveDiscoverFilterChips,
  DiscoverFiltersPanel,
} from '@/modules/onboarding/components/DiscoverFiltersPanel';
import {
  EMPTY_DISCOVER_FILTERS,
  PLACE_SPACE_TYPES,
  type DiscoverCategory,
  type DiscoverFilterState,
} from '@/modules/onboarding/utils/discoverFilterModel';
import { DiscoverInfiniteSentinel } from '@/modules/onboarding/components/DiscoverInfiniteSentinel';
import { DiscoverSpaceCard } from '@/modules/onboarding/components/DiscoverSpaceCard';
import { DiscoverSpaceDetailDrawer } from '@/modules/onboarding/components/DiscoverSpaceDetailDrawer';
import { EnquireDialog } from '@/modules/onboarding/components/EnquireDialog';
import { LocationSelectModal } from '@/modules/onboarding/components/LocationSelectModal';
import {
  buildDiscoverUrlParams,
  formatDiscoverLocationLabel,
  matchLocationRecord,
  parseDiscoverUrlState,
  shouldPromptDiscoverLocation,
  toSelectedDiscoverLocation,
  type SelectedDiscoverLocation,
} from '@/modules/onboarding/utils/discoverLocation';
import { DISCOVER_PAGE_SIZE, discoverFilterKey } from '@/shared/api/discoverQuery';
import { locationsApi } from '@/shared/api/locationsApi';
import { spaceDiscoverApi } from '@/shared/api/spaceDiscoverApi';
import { getErrorMessage } from '@/shared/api/errors';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { colors } from '@/shared/theme/colors';
import type { PagedResponse } from '@/shared/types/api';
import type { DiscoverSpaceCardResponse, SpaceType } from '@/shared/types/space';

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

function mergeUnique(
  current: DiscoverSpaceCardResponse[],
  incoming: DiscoverSpaceCardResponse[],
): DiscoverSpaceCardResponse[] {
  const seen = new Set(current.map((item) => item.spaceId));
  const next = [...current];
  for (const item of incoming) {
    if (seen.has(item.spaceId)) continue;
    seen.add(item.spaceId);
    next.push(item);
  }
  return next;
}

/**
 * Authenticated Find a place — same location popup, location APIs,
 * server-side discover filters, and infinite scroll as the public /places and /meals pages.
 */
export function FindAPlacePage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isNarrow = useMediaQuery(theme.breakpoints.down('lg'));
  const [searchParams, setSearchParams] = useSearchParams();
  const parsed = useMemo(() => parseDiscoverUrlState(searchParams), [searchParams]);

  const [category, setCategory] = useState<DiscoverCategory>(parsed.category);
  const [search, setSearch] = useState(parsed.query);
  const [debounced, setDebounced] = useState(parsed.query);
  const [selectedLocation, setSelectedLocation] = useState<SelectedDiscoverLocation | null>(
    parsed.selectedLocation,
  );
  const [filters, setFilters] = useState<DiscoverFilterState>(EMPTY_DISCOVER_FILTERS);
  const [sort, setSort] = useState<'recommended' | 'newest'>('recommended');
  const [detailSpaceId, setDetailSpaceId] = useState<string | null>(() =>
    searchParams.get('enquire') === '1' ? searchParams.get('space')?.trim() || null : null,
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [autoEnquire, setAutoEnquire] = useState(
    () => searchParams.get('enquire') === '1' && Boolean(searchParams.get('space')?.trim()),
  );
  const [enquireSpace, setEnquireSpace] = useState<DiscoverSpaceCardResponse | null>(null);
  const [routeReady, setRouteReady] = useState(false);
  const enquireUrlConsumed = useRef(searchParams.get('enquire') !== '1');
  const locationPromptedFor = useRef<DiscoverCategory | null>(null);
  const skipCategoryReset = useRef(true);
  const appliedUrlKey = useRef<string | null>(null);

  const enquireName = searchParams.get('name')?.trim() ?? '';
  const enquireSpaceId = searchParams.get('space')?.trim() ?? '';
  const shouldEnquire = searchParams.get('enquire') === '1';

  useEffect(() => {
    document.title = `${t('navigation.findAPlace')} · ${t('common.appName')}`;
  }, [t]);

  useEffect(() => {
    const key = searchParams.toString();
    if (appliedUrlKey.current === key) {
      setRouteReady(true);
      return;
    }
    appliedUrlKey.current = key;
    const next = parseDiscoverUrlState(searchParams);
    setCategory((current) => {
      if (current !== next.category) {
        skipCategoryReset.current = true;
      }
      return next.category;
    });
    setSelectedLocation(next.selectedLocation);
    if (next.query) {
      setSearch(next.query);
    } else if (enquireName) {
      setSearch(enquireName);
    }
    setRouteReady(true);
  }, [enquireName, searchParams]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search.trim()), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    if (skipCategoryReset.current) {
      skipCategoryReset.current = false;
      return;
    }
    setFilters(EMPTY_DISCOVER_FILTERS);
    setSearch('');
    setDebounced('');
  }, [category]);

  const writeUrl = useCallback(
    (nextLocation: SelectedDiscoverLocation | null, nextQuery: string, nextCategory: DiscoverCategory) => {
      const next = buildDiscoverUrlParams({
        category: nextCategory,
        selectedLocation: nextLocation,
        query: nextQuery,
        extras: searchParams,
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    if (!routeReady) {
      return;
    }
    const current = buildDiscoverUrlParams({
      category,
      selectedLocation,
      query: debounced,
      extras: searchParams,
    }).toString();
    if (current !== searchParams.toString()) {
      setSearchParams(
        buildDiscoverUrlParams({
          category,
          selectedLocation,
          query: debounced,
          extras: searchParams,
        }),
        { replace: true },
      );
    }
  }, [category, debounced, routeReady, searchParams, selectedLocation, setSearchParams]);

  useEffect(() => {
    if (
      !shouldPromptDiscoverLocation({
        routeReady,
        hasLocation: Boolean(selectedLocation?.location),
        category,
        promptedFor: locationPromptedFor.current,
        skip: shouldEnquire,
      })
    ) {
      if (selectedLocation?.location || shouldEnquire) {
        locationPromptedFor.current = category;
      }
      return;
    }
    locationPromptedFor.current = category;
    setLocationOpen(true);
  }, [category, routeReady, selectedLocation?.location, shouldEnquire]);

  useEffect(() => {
    if (!selectedLocation?.location || selectedLocation.district) {
      return;
    }
    let active = true;
    const lookup = selectedLocation.pincode || selectedLocation.location;
    locationsApi
      .search(lookup, {
        state: selectedLocation.state,
        district: selectedLocation.district,
        taluk: selectedLocation.cityTaluka,
      })
      .then((results) => {
        if (!active) {
          return;
        }
        const match = matchLocationRecord(results, selectedLocation);
        if (!match?.district) {
          return;
        }
        setSelectedLocation((current) => {
          if (!current || current.district) {
            return current;
          }
          return toSelectedDiscoverLocation({
            ...match,
            location: current.location,
            pincode: current.pincode || match.pincode,
          });
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [selectedLocation]);

  const isMess = category === 'mess';
  const placeTypes =
    !isMess && filters.types.length === 0
      ? PLACE_SPACE_TYPES
      : !isMess && filters.types.length > 1
        ? filters.types
        : undefined;
  const apiType: SpaceType | undefined = isMess
    ? 'MESS'
    : filters.types.length === 1
      ? filters.types[0]
      : undefined;

  const discoverParams = useMemo(
    () => ({
      search: debounced || undefined,
      location: selectedLocation?.location || undefined,
      type: apiType,
      types: placeTypes,
      minRent: isMess ? null : filters.minPrice,
      maxRent: isMess ? null : filters.maxPrice,
      amenities: isMess || filters.amenities.length === 0 ? undefined : filters.amenities,
      size: DISCOVER_PAGE_SIZE,
      sort: 'newest' as const,
    }),
    [
      apiType,
      debounced,
      filters.amenities,
      filters.maxPrice,
      filters.minPrice,
      isMess,
      placeTypes,
      selectedLocation?.location,
    ],
  );
  const filterKey = discoverFilterKey(discoverParams);

  const discoverQuery = useInfiniteQuery<
    PagedResponse<DiscoverSpaceCardResponse>,
    Error,
    InfiniteData<PagedResponse<DiscoverSpaceCardResponse>>,
    readonly unknown[],
    number
  >({
    queryKey: ['spaces-discover', filterKey],
    queryFn: ({ pageParam }) =>
      spaceDiscoverApi.discoverSpaces({
        ...discoverParams,
        page: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.page + 1),
  });

  const rawContent = useMemo(() => {
    const content = discoverQuery.data?.pages.flatMap((page) => page.content) ?? [];
    if (category === 'mess') {
      return content.filter((space) => space.type === 'MESS');
    }
    return content.filter((space) => PLACE_SPACE_TYPES.includes(space.type));
  }, [category, discoverQuery.data?.pages]);

  const listings = useMemo(() => mergeUnique([], rawContent), [rawContent]);
  const totalElements = discoverQuery.data?.pages.at(-1)?.totalElements ?? listings.length;
  const hasMore = Boolean(discoverQuery.hasNextPage);
  const loadingMore = discoverQuery.isFetchingNextPage;
  const loadMoreError = discoverQuery.isFetchNextPageError;
  const loadMore = useCallback(() => {
    void discoverQuery.fetchNextPage();
  }, [discoverQuery]);
  const reloadDiscover = useCallback(() => {
    void discoverQuery.refetch();
  }, [discoverQuery]);

  const nameMatchedId = useMemo(() => {
    if (!shouldEnquire || enquireSpaceId || !enquireName) {
      return null;
    }
    return (
      listings.find((space) => space.name.trim().toLowerCase() === enquireName.toLowerCase())?.spaceId ??
      listings.find((space) => space.name.toLowerCase().includes(enquireName.toLowerCase()))?.spaceId ??
      null
    );
  }, [enquireName, enquireSpaceId, listings, shouldEnquire]);

  const activeDetailId = detailSpaceId ?? (shouldEnquire ? enquireSpaceId || nameMatchedId : null);
  const activeAutoEnquire = autoEnquire || Boolean(shouldEnquire && activeDetailId);

  useEffect(() => {
    if (!shouldEnquire || enquireUrlConsumed.current || !activeDetailId) {
      return;
    }
    enquireUrlConsumed.current = true;
    const next = new URLSearchParams(searchParams);
    next.delete('enquire');
    setSearchParams(next, { replace: true });
  }, [activeDetailId, searchParams, setSearchParams, shouldEnquire]);

  const amenityOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const space of listings) {
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
  }, [listings]);

  const pageBg = isDark ? 'transparent' : '#F4F7F8';
  const textPrimary = isDark ? theme.palette.text.primary : colors.textPrimary;
  const textSecondary = isDark ? theme.palette.text.secondary : colors.textSecondary;
  const locationLabel = selectedLocation
    ? formatDiscoverLocationLabel(selectedLocation)
    : t('spaces.findPlace.selectLocation');

  const clearFilters = () => setFilters(EMPTY_DISCOVER_FILTERS);
  const isFiltering = Boolean(debounced) || Boolean(selectedLocation?.location) ||
    filters.types.length > 0 ||
    filters.amenities.length > 0 ||
    filters.minPrice != null ||
    filters.maxPrice != null;

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

  const emptyTitle = selectedLocation
    ? isMess
      ? t('spaces.findPlace.tabs.messLocationEmptyTitle', { location: selectedLocation.location })
      : t('spaces.findPlace.locationEmptyTitle', { location: selectedLocation.location })
    : isFiltering
      ? t('spaces.findPlace.searchEmptyTitle')
      : isMess
        ? t('spaces.findPlace.tabs.messEmptyTitle')
        : t('spaces.findPlace.emptyTitle');
  const emptyDescription = selectedLocation
    ? isMess
      ? t('spaces.findPlace.tabs.messLocationEmptyDescription')
      : t('spaces.findPlace.locationEmptyDescription')
    : isFiltering
      ? t('spaces.findPlace.searchEmptyDescription')
      : isMess
        ? t('spaces.findPlace.tabs.messEmptyDescription')
        : t('spaces.findPlace.emptyDescription');

  const filtersPanel = (
    <DiscoverFiltersPanel
      category={category}
      value={filters}
      amenityOptions={amenityOptions}
      onChange={setFilters}
      onClear={clearFilters}
    />
  );

  const handleCategoryChange = (_: unknown, next: DiscoverCategory) => {
    setCategory(next);
  };

  const handleLocationConfirm = (record: Parameters<typeof toSelectedDiscoverLocation>[0]) => {
    const next = toSelectedDiscoverLocation(record);
    setSelectedLocation(next);
    setLocationOpen(false);
    writeUrl(next, search, category);
  };

  const handleLocationClear = () => {
    setSelectedLocation(null);
    writeUrl(null, search, category);
  };

  return (
    <Box sx={{ flex: 1, bgcolor: pageBg, py: { xs: 2.5, sm: 3 } }}>
      <Box sx={{ width: '100%', px: { xs: 1.5, sm: 2 } }}>
        <Tabs
          value={category}
          onChange={handleCategoryChange}
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
                <Button
                  onClick={() => setLocationOpen(true)}
                  startIcon={<MapPin size={16} color={colors.primary} />}
                  aria-label={locationLabel}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    color: textPrimary,
                    bgcolor: colors.mintSubtle,
                    borderRadius: '12px',
                    px: 1.5,
                    py: 1,
                    minHeight: 44,
                    maxWidth: { xs: '100%', sm: 220 },
                  }}
                >
                  <Typography noWrap sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                    {locationLabel}
                  </Typography>
                </Button>
                {selectedLocation ? (
                  <IconButton
                    onClick={handleLocationClear}
                    aria-label={t('spaces.findPlace.clearLocation')}
                    sx={{
                      width: 40,
                      height: 40,
                      border: `1px solid ${colors.border}`,
                      bgcolor: colors.surface,
                    }}
                  >
                    <X size={16} />
                  </IconButton>
                ) : null}
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
                {discoverQuery.isPending
                  ? t('spaces.findPlace.loading')
                  : !discoverQuery.isError
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

            {discoverQuery.isPending ? (
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
                onRetry={reloadDiscover}
              />
            ) : null}

            {!discoverQuery.isPending && !discoverQuery.isError && listings.length === 0 ? (
              <EmptyState
                icon={
                  category === 'mess' ? (
                    <UtensilsCrossed size={28} color={colors.textSecondary} />
                  ) : (
                    <Building2 size={28} color={colors.textSecondary} />
                  )
                }
                title={emptyTitle}
                description={emptyDescription}
              />
            ) : null}

            {!discoverQuery.isPending && !discoverQuery.isError && listings.length > 0 ? (
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
                  {listings.map((space: DiscoverSpaceCardResponse) => (
                    <DiscoverSpaceCard
                      key={space.spaceId}
                      space={space}
                      onViewDetails={setDetailSpaceId}
                      onEnquire={setEnquireSpace}
                    />
                  ))}
                </Box>
                {loadingMore ? (
                  <Typography sx={{ mt: 3, textAlign: 'center', color: textSecondary, fontSize: '0.875rem' }}>
                    {t('spaces.findPlace.loadingMore')}
                  </Typography>
                ) : null}
                {loadMoreError ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Button
                      onClick={loadMore}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      {t('spaces.findPlace.retry')}
                    </Button>
                  </Box>
                ) : null}
                <DiscoverInfiniteSentinel
                  onVisible={() => {
                    if (hasMore && !loadingMore && !loadMoreError) {
                      loadMore();
                    }
                  }}
                  disabled={!hasMore || loadingMore || loadMoreError || discoverQuery.isPending}
                />
              </>
            ) : null}
          </Box>
        </Box>
      </Box>

      <LocationSelectModal
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        onConfirm={handleLocationConfirm}
        rankingContext={
          selectedLocation
            ? {
                state: selectedLocation.state,
                district: selectedLocation.district,
                taluk: selectedLocation.cityTaluka,
              }
            : undefined
        }
      />

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
        spaceId={activeDetailId}
        open={Boolean(activeDetailId)}
        autoEnquire={activeAutoEnquire}
        onClose={() => {
          setAutoEnquire(false);
          setDetailSpaceId(null);
        }}
      />
      {enquireSpace ? (
        <EnquireDialog
          open
          spaceId={enquireSpace.spaceId}
          spaceName={enquireSpace.name}
          ownedByCurrentUser={Boolean(enquireSpace.ownedByCurrentUser)}
          onClose={() => setEnquireSpace(null)}
        />
      ) : null}
    </Box>
  );
}
