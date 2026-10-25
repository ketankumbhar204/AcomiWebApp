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
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { Building2, ChevronDown, MapPin, Search, SlidersHorizontal, UtensilsCrossed, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
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
import { spaceTypeLabelKey } from '@/modules/onboarding/components/createSpace/createSpaceVisuals';
import { DiscoverSpaceCard } from '@/modules/onboarding/components/DiscoverSpaceCard';
import { DiscoverSpaceDetailDrawer } from '@/modules/onboarding/components/DiscoverSpaceDetailDrawer';
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
import type { ListingSection } from '@/shared/utils/listingInfo';
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
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const parsed = useMemo(() => parseDiscoverUrlState(searchParams), [searchParams]);
  const category: DiscoverCategory = location.pathname.startsWith(ROUTES.findAMeal) ? 'mess' : 'places';
  const [search, setSearch] = useState(parsed.query);
  const [debounced, setDebounced] = useState(parsed.query);
  const [selectedLocation, setSelectedLocation] = useState<SelectedDiscoverLocation | null>(
    parsed.selectedLocation,
  );
  const [filters, setFilters] = useState<DiscoverFilterState>(EMPTY_DISCOVER_FILTERS);
  const [sort, setSort] = useState<'recommended' | 'newest'>('recommended');
  const [detailSpaceId, setDetailSpaceId] = useState<string | null>(() => {
    const space = searchParams.get('space')?.trim() || null;
    if (!space) return null;
    if (searchParams.get('enquire') === '1' || searchParams.get('listing') === '1') return space;
    return null;
  });
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [autoEnquire, setAutoEnquire] = useState(
    () => searchParams.get('enquire') === '1' && Boolean(searchParams.get('space')?.trim()),
  );
  const [focusSection, setFocusSection] = useState<ListingSection | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);
  const [routeReady, setRouteReady] = useState(false);
  const enquireUrlConsumed = useRef(searchParams.get('enquire') !== '1');
  const locationPromptedFor = useRef<DiscoverCategory | null>(null);
  const skipCategoryReset = useRef(true);
  const appliedUrlKey = useRef<string | null>(null);

  const enquireName = searchParams.get('name')?.trim() ?? '';
  const enquireSpaceId = searchParams.get('space')?.trim() ?? '';
  const shouldEnquire = searchParams.get('enquire') === '1';

  useEffect(() => {
    document.title = `${category === 'mess' ? t('navigation.findAMeal', { defaultValue: 'Search for a meal' }) : t('navigation.findAPlace')} · ${t('common.appName')}`;
  }, [category, t]);

  useEffect(() => {
    const key = searchParams.toString();
    if (appliedUrlKey.current === key) {
      setRouteReady(true);
      return;
    }
    if (!location.pathname.startsWith(ROUTES.findAMeal) && searchParams.get('tab') === 'mess') {
      const next = new URLSearchParams(searchParams);
      next.delete('tab');
      navigate({ pathname: ROUTES.findAMeal, search: next.toString() }, { replace: true });
      return;
    }
    appliedUrlKey.current = key;
    const next = parseDiscoverUrlState(searchParams);
    setSelectedLocation(next.selectedLocation);
    if (next.query) {
      setSearch(next.query);
    } else if (enquireName) {
      setSearch(enquireName);
    }
    setRouteReady(true);
  }, [enquireName, location.pathname, navigate, searchParams]);

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
    if (!location.pathname.startsWith(ROUTES.findAMeal) && searchParams.get('tab') === 'mess') {
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
  }, [category, debounced, location.pathname, routeReady, searchParams, selectedLocation, setSearchParams]);

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
  const servicedApartment = !isMess && filters.servicedApartment;
  const placeTypes =
    isMess || filters.types.length === 1
      ? undefined
      : filters.types.length > 1
        ? filters.types
        : servicedApartment
          ? undefined
          : PLACE_SPACE_TYPES;
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
      minRent: filters.minPrice,
      maxRent: filters.maxPrice,
      amenities: isMess || filters.amenities.length === 0 ? undefined : filters.amenities,
      genders: isMess || filters.genders.length === 0 ? undefined : filters.genders,
      sharings: isMess || filters.sharings.length === 0 ? undefined : filters.sharings,
      foods: isMess || filters.foods.length === 0 ? undefined : filters.foods,
      furnishings: isMess || filters.furnishings.length === 0 ? undefined : filters.furnishings,
      contactAvailable: filters.contactAvailable ? true : undefined,
      mealTypes: isMess && filters.mealTypes.length > 0 ? filters.mealTypes : undefined,
      foodTypes: isMess && filters.foodTypes.length > 0 ? filters.foodTypes : undefined,
      servicedApartment: servicedApartment || undefined,
      size: DISCOVER_PAGE_SIZE,
      sort,
    }),
    [
      apiType,
      debounced,
      filters.amenities,
      filters.contactAvailable,
      filters.foodTypes,
      filters.foods,
      filters.furnishings,
      filters.genders,
      filters.maxPrice,
      filters.mealTypes,
      filters.minPrice,
      filters.sharings,
      isMess,
      placeTypes,
      selectedLocation?.location,
      servicedApartment,
      sort,
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

  useEffect(() => {
    if (searchParams.get('listing') !== '1') return;
    const space = searchParams.get('space')?.trim();
    if (!space) return;
    setDetailSpaceId(space);
    setAutoEnquire(false);
    const next = new URLSearchParams(searchParams);
    next.delete('listing');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

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
  const activeFilterCount =
    filters.types.length +
    filters.amenities.length +
    filters.genders.length +
    filters.sharings.length +
    filters.foods.length +
    filters.furnishings.length +
    filters.mealTypes.length +
    filters.foodTypes.length +
    (filters.contactAvailable ? 1 : 0) +
    (filters.servicedApartment ? 1 : 0) +
    (filters.minPrice != null || filters.maxPrice != null ? 1 : 0);
  const isFiltering = Boolean(debounced) || Boolean(selectedLocation?.location) ||
    filters.types.length > 0 ||
    filters.amenities.length > 0 ||
    filters.genders.length > 0 ||
    filters.sharings.length > 0 ||
    filters.foods.length > 0 ||
    filters.furnishings.length > 0 ||
    filters.contactAvailable ||
    filters.servicedApartment ||
    filters.mealTypes.length > 0 ||
    filters.foodTypes.length > 0 ||
    filters.minPrice != null ||
    filters.maxPrice != null;

  const title =
    category === 'mess' ? t('spaces.findPlace.tabs.messTitle') : t('navigation.findAPlace');
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

  const selectCategory = (next: DiscoverCategory) => {
    if (next === category) return;
    navigate({
      pathname: next === 'mess' ? ROUTES.findAMeal : ROUTES.findAPlace,
      search: buildDiscoverUrlParams({
        category: next,
        selectedLocation,
        query: search,
        extras: searchParams,
      }).toString(),
    });
  };

  const selectedPlaceType = filters.types.length === 1 ? filters.types[0] : 'ALL';

  return (
    <>
    <Box sx={{ flex: 1, bgcolor: pageBg, py: { xs: 1.5, sm: 2 } }}>
      <Box sx={{ width: '100%', px: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '1.35rem', sm: '1.5rem' },
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: textPrimary,
              lineHeight: 1.15,
            }}
          >
            {title}
          </Typography>
          <IconButton
            onClick={() => setFilterSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={filterSheetOpen}
            aria-label={t('spaces.findPlace.filterButton')}
            sx={{
              width: 40,
              height: 40,
              border: `1px solid ${isDark ? theme.palette.divider : 'rgba(15,23,42,0.08)'}`,
              bgcolor: colors.surface,
            }}
          >
            <SlidersHorizontal size={18} color={textPrimary} />
            {activeFilterCount > 0 ? (
              <Box
                component="span"
                sx={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: colors.primary,
                }}
              />
            ) : null}
          </IconButton>
        </Box>

        <Box sx={{ mt: 1.25, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box
            role="tablist"
            sx={{
              display: 'flex',
              gap: 1,
              p: 0.5,
              borderRadius: '999px',
              border: `1px solid ${isDark ? theme.palette.divider : 'rgba(15,23,42,0.08)'}`,
              bgcolor: colors.surface,
            }}
          >
            {(
              [
                ['places', t('spaces.findPlace.tabs.places'), Building2],
                ['mess', t('spaces.findPlace.tabs.mess'), UtensilsCrossed],
              ] as const
            ).map(([id, label, Icon]) => {
              const selected = category === id;
              return (
                <Button
                  key={id}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => selectCategory(id)}
                  startIcon={<Icon size={16} />}
                  sx={{
                    flex: 1,
                    minHeight: 40,
                    borderRadius: '999px',
                    textTransform: 'none',
                    fontWeight: 700,
                    color: selected ? '#fff' : textSecondary,
                    bgcolor: selected ? colors.primary : 'transparent',
                    '&:hover': { bgcolor: selected ? colors.primaryHover : colors.mintSubtle },
                  }}
                >
                  {label}
                </Button>
              );
            })}
          </Box>

          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Button
              onClick={() => setLocationOpen(true)}
              aria-haspopup="dialog"
              aria-label={t('spaces.findPlace.selectLocation')}
              sx={{
                flex: 1,
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontWeight: 600,
                color: textPrimary,
                bgcolor: colors.surface,
                border: `1px solid ${isDark ? theme.palette.divider : 'rgba(15,23,42,0.08)'}`,
                borderRadius: '999px',
                px: 1.5,
                minHeight: 44,
                minWidth: 0,
                '&:hover': { bgcolor: colors.mintSubtle },
              }}
            >
              <MapPin size={16} color={colors.primary} />
              <Typography noWrap sx={{ ml: 0.75, fontSize: '14px', fontWeight: 600 }}>
                {locationLabel}
              </Typography>
            </Button>
            {selectedLocation ? (
              <IconButton
                onClick={handleLocationClear}
                aria-label={t('spaces.findPlace.clearLocation')}
                sx={{ width: 40, height: 40, border: `1px solid ${isDark ? theme.palette.divider : 'rgba(15,23,42,0.08)'}` }}
              >
                <X size={16} />
              </IconButton>
            ) : null}
          </Stack>

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
              '& .MuiOutlinedInput-root': {
                bgcolor: colors.surface,
                borderRadius: '999px',
                minHeight: 44,
                fontSize: '14px',
              },
            }}
          />

          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.25, scrollbarWidth: 'thin' }}>
            {isMess
              ? (
                [
                  ['ALL', t('spaces.findPlace.typeAll')],
                  ['BREAKFAST', 'Breakfast'],
                  ['LUNCH', 'Lunch'],
                  ['DINNER', 'Dinner'],
                ] as const
              ).map(([id, label]) => {
                const selected =
                  id === 'ALL'
                    ? filters.mealTypes.length === 0
                    : filters.mealTypes.includes(id);
                return (
                  <Button
                    key={id}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        mealTypes:
                          id === 'ALL'
                            ? []
                            : current.mealTypes.includes(id)
                              ? current.mealTypes.filter((value) => value !== id)
                              : [...current.mealTypes, id],
                      }))
                    }
                    aria-pressed={selected}
                    sx={{
                      flex: '0 0 auto',
                      minHeight: 34,
                      px: 1.5,
                      borderRadius: '999px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '13px',
                      color: selected ? '#fff' : colors.primaryDark,
                      bgcolor: selected ? colors.primary : colors.lightGreen ?? '#E8F8EF',
                      border: `1px solid ${colors.primary}`,
                      '&:hover': { bgcolor: selected ? colors.primaryHover : colors.mintSubtle },
                    }}
                  >
                    {label}
                  </Button>
                );
              })
              : (
                [
                  ['ALL', t('spaces.findPlace.typeAll')] as const,
                  ...PLACE_SPACE_TYPES.map((type) => [type, t(spaceTypeLabelKey(type))] as const),
                ]
              ).map(([id, label]) => {
                const selected = selectedPlaceType === id;
                return (
                  <Button
                    key={id}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        types: id === 'ALL' ? [] : [id as SpaceType],
                      }))
                    }
                    aria-pressed={selected}
                    sx={{
                      flex: '0 0 auto',
                      minHeight: 34,
                      px: 1.5,
                      borderRadius: '999px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '13px',
                      color: selected ? '#fff' : colors.primaryDark,
                      bgcolor: selected ? colors.primary : '#E7F6EE',
                      border: `1px solid ${selected ? colors.primary : 'rgba(15,107,76,0.25)'}`,
                      '&:hover': { bgcolor: selected ? colors.primaryHover : colors.mintSubtle },
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ flex: 1, minWidth: 0, fontSize: '0.875rem', color: textSecondary }}>
              {discoverQuery.isPending
                ? t('spaces.findPlace.loading')
                : discoverQuery.isError
                  ? ' '
                  : !selectedLocation
                    ? category === 'mess'
                      ? t('spaces.findPlace.tabs.messFoundAll', { count: totalElements })
                      : t('spaces.findPlace.foundAll', { count: totalElements })
                    : category === 'mess'
                      ? t('spaces.findPlace.tabs.messResultCount', { count: totalElements })
                      : t('spaces.findPlace.resultCount', { count: totalElements })}
            </Typography>
            <FormControl size="small" sx={{ minWidth: 132, flexShrink: 0 }}>
              <Select
                value={sort}
                onChange={(event) => setSort(event.target.value as 'recommended' | 'newest')}
                aria-label={t('spaces.findPlace.sortLabel')}
                startAdornment={
                  <InputAdornment position="start">
                    <ChevronDown size={14} color={colors.muted} />
                  </InputAdornment>
                }
                sx={{
                  borderRadius: '999px',
                  fontSize: '13px',
                  minHeight: 36,
                  bgcolor: colors.surface,
                }}
              >
                <MenuItem value="recommended">{t('spaces.findPlace.sort.recommended')}</MenuItem>
                <MenuItem value="newest">{t('spaces.findPlace.sort.newest')}</MenuItem>
              </Select>
            </FormControl>
          </Box>

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
                  gap: 1.5,
                  mt: 2,
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 19.25rem), 1fr))',
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
                    gap: 1.5,
                    mt: 2,
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 19.25rem), 1fr))',
                  }}
                >
                  {listings.map((space: DiscoverSpaceCardResponse) => (
                    <DiscoverSpaceCard
                      key={space.spaceId}
                      space={space}
                      onViewDetails={(spaceId, section) => {
                        setFocusSection(section ?? null);
                        setFocusNonce((value) => value + 1);
                        setDetailSpaceId(spaceId);
                      }}
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
        anchor="right"
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: 'min(100%, 22.5rem)',
              maxWidth: '100%',
              bgcolor: colors.surface,
            },
          },
        }}
      >
        <Box sx={{ p: 2.5, overflow: 'auto', height: '100%' }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontWeight: 700 }}>{t('spaces.findPlace.filters.title')}</Typography>
          <Button onClick={() => setFilterSheetOpen(false)} sx={{ textTransform: 'none' }}>
            {t('spaces.findPlace.close')}
          </Button>
        </Stack>
        {filtersPanel}
        </Box>
      </Drawer>

      <DiscoverSpaceDetailDrawer
        spaceId={activeDetailId}
        open={Boolean(activeDetailId)}
        autoEnquire={activeAutoEnquire}
        focusSection={focusSection}
        focusNonce={focusNonce}
        onClose={() => {
          setAutoEnquire(false);
          setDetailSpaceId(null);
          setFocusSection(null);
        }}
      />
    </>
  );
}
