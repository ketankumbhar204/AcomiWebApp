import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Link,
  List,
  ListItemButton,
  TextField,
  Typography,
} from '@mui/material';
import { ChevronDown, Map, MapPin, Search, X } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AUTOCOMPLETE_DEBOUNCE_MS,
  AUTOCOMPLETE_MIN_LENGTH,
  suggestionDetail,
  suggestionKey,
  suggestionTitle,
  suggestionToLocationRecord,
  type LocationAutocompleteSuggestion,
} from '@/modules/onboarding/utils/locationAutocomplete';
import { locationsApi, type LocationRecord } from '@/shared/api/locationsApi';
import { colors } from '@/shared/theme/colors';

type LocationRankingContext = {
  state?: string;
  district?: string;
  taluk?: string;
};

type LocationSelectModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (selected: LocationRecord) => void;
  rankingContext?: LocationRankingContext;
};

type LoadState = 'idle' | 'loading' | 'error';
type PickerMode = 'search' | 'browse';

function recordDetail(record: LocationRecord): string {
  const place = [record.cityTaluka, record.district].filter(Boolean).join(', ');
  return [place, record.pincode].filter(Boolean).join(' • ');
}

function sameState(record: LocationRecord, state: string): boolean {
  return record.state.trim().toLowerCase() === state.trim().toLowerCase();
}

export function LocationSelectModal({
  open,
  onClose,
  onConfirm,
  rankingContext,
}: LocationSelectModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="location-select-title"
      aria-describedby="location-select-description"
    >
      {open ? (
        <LocationSelectBody
          onClose={onClose}
          onConfirm={onConfirm}
          rankingContext={rankingContext}
        />
      ) : null}
    </Dialog>
  );
}

function LocationSelectBody({
  onClose,
  onConfirm,
  rankingContext,
}: Omit<LocationSelectModalProps, 'open'>) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<PickerMode>('search');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [suggestions, setSuggestions] = useState<LocationAutocompleteSuggestion[]>([]);
  const [fetchedQuery, setFetchedQuery] = useState('');
  const [searchError, setSearchError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [searchPick, setSearchPick] = useState<LocationAutocompleteSuggestion | null>(null);

  const [stateName, setStateName] = useState('');
  const [areaPick, setAreaPick] = useState<LocationRecord | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [browseQuery, setBrowseQuery] = useState('');
  const [debouncedBrowse, setDebouncedBrowse] = useState('');
  const [browseHits, setBrowseHits] = useState<LocationRecord[]>([]);
  const [browseFetchedQuery, setBrowseFetchedQuery] = useState('');
  const [browseSearchError, setBrowseSearchError] = useState(false);
  const [browseRetry, setBrowseRetry] = useState(0);
  const [browseLoad, setBrowseLoad] = useState<LoadState>('idle');
  const [stateMenuOpen, setStateMenuOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      AUTOCOMPLETE_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (mode !== 'search' || debouncedSearch.length < AUTOCOMPLETE_MIN_LENGTH) {
      return;
    }
    let active = true;
    locationsApi
      .autocomplete(debouncedSearch, {
        state: rankingContext?.state,
        district: rankingContext?.district,
      })
      .then((next) => {
        if (!active) return;
        setSuggestions(Array.isArray(next) ? next : []);
        setSearchError(false);
        setFetchedQuery(debouncedSearch);
      })
      .catch(() => {
        if (!active) return;
        setSuggestions([]);
        setSearchError(true);
        setFetchedQuery(debouncedSearch);
      });
    return () => {
      active = false;
    };
  }, [
    debouncedSearch,
    mode,
    rankingContext?.district,
    rankingContext?.state,
    retryToken,
  ]);

  const showResults = mode === 'search' && debouncedSearch.length >= AUTOCOMPLETE_MIN_LENGTH && !searchPick;
  const visibleState: LoadState = !showResults
    ? 'idle'
    : fetchedQuery !== debouncedSearch
      ? 'loading'
      : searchError
        ? 'error'
        : 'idle';
  const visibleSuggestions = showResults && fetchedQuery === debouncedSearch ? suggestions : [];

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedBrowse(browseQuery.trim()),
      AUTOCOMPLETE_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [browseQuery]);

  useEffect(() => {
    if (mode !== 'browse' || !stateName || debouncedBrowse.length < AUTOCOMPLETE_MIN_LENGTH) {
      return;
    }
    let active = true;
    locationsApi
      .search(debouncedBrowse, { state: stateName })
      .then((next) => {
        if (!active) return;
        const rows = Array.isArray(next) ? next : [];
        setBrowseHits(rows.filter((record) => sameState(record, stateName) && record.location));
        setBrowseSearchError(false);
        setBrowseFetchedQuery(debouncedBrowse);
      })
      .catch(() => {
        if (!active) return;
        setBrowseHits([]);
        setBrowseSearchError(true);
        setBrowseFetchedQuery(debouncedBrowse);
      });
    return () => {
      active = false;
    };
  }, [browseRetry, debouncedBrowse, mode, stateName]);

  const enterBrowse = () => {
    setMode('browse');
    setSearchPick(null);
    setStateMenuOpen(false);
    if (states.length === 0 && browseLoad !== 'loading') {
      setBrowseLoad('loading');
      locationsApi
        .listStates()
        .then((next) => {
          setStates(next);
          setBrowseLoad('idle');
        })
        .catch(() => setBrowseLoad('error'));
    }
  };

  const enterSearch = () => {
    setMode('search');
    setStateMenuOpen(false);
    setSuggestions([]);
    setFetchedQuery('');
    setSearchPick(null);
  };

  const chooseState = (value: string) => {
    setStateName(value);
    setAreaPick(null);
    setBrowseQuery('');
    setDebouncedBrowse('');
    setBrowseHits([]);
    setBrowseFetchedQuery('');
    setBrowseSearchError(false);
    setStateMenuOpen(false);
  };

  const showBrowseResults =
    mode === 'browse' && Boolean(stateName) && !areaPick && debouncedBrowse.length >= AUTOCOMPLETE_MIN_LENGTH;
  const browseVisibleState: LoadState = !showBrowseResults
    ? 'idle'
    : browseFetchedQuery !== debouncedBrowse
      ? 'loading'
      : browseSearchError
        ? 'error'
        : 'idle';
  const visibleBrowseHits = showBrowseResults && browseFetchedQuery === debouncedBrowse ? browseHits : [];

  const searchRecord = searchPick ? suggestionToLocationRecord(searchPick) : null;
  const canConfirm = mode === 'search' ? Boolean(searchRecord?.location) : Boolean(areaPick?.location);

  const confirm = () => {
    if (mode === 'search' && searchRecord?.location) {
      onConfirm(searchRecord);
      return;
    }
    if (mode === 'browse' && areaPick?.location) {
      onConfirm(areaPick);
    }
  };

  return (
    <>
      <DialogTitle id="location-select-title" sx={{ pr: 6, pb: 0.5, fontWeight: 700 }}>
        {t('spaces.findPlace.chooseLocation')}
        <IconButton
          onClick={onClose}
          aria-label={t('common.close')}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography id="location-select-description" sx={{ mb: 1.5, fontSize: '0.875rem', color: colors.textSecondary }}>
          {t('spaces.findPlace.locationSearchIntro')}
        </Typography>
        <ModeSwitch mode={mode} onSearch={enterSearch} onBrowse={enterBrowse} />

        {mode === 'search' ? (
          <Box role="tabpanel" id="location-panel-search" aria-labelledby="location-tab-search" sx={{ mt: 1.5 }}>
            <TextField
              id="location-search"
              fullWidth
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSearchPick(null);
              }}
              placeholder={t('spaces.findPlace.locationSearchPlaceholder')}
              autoComplete="off"
              autoFocus
              slotProps={{
                htmlInput: { 'aria-label': t('spaces.findPlace.locationSearchLabel') },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color={colors.muted} />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        aria-label={t('spaces.findPlace.locationClearSearch')}
                        onClick={() => {
                          setSearch('');
                          setDebouncedSearch('');
                          setSuggestions([]);
                          setSearchPick(null);
                          setFetchedQuery('');
                        }}
                      >
                        <X size={14} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', minHeight: 44 } }}
            />

            {searchPick ? (
              <SelectedCard
                title={suggestionTitle(searchPick)}
                detail={[suggestionDetail(searchPick), searchPick.pincode].filter(Boolean).join(' • ')}
              />
            ) : null}

            {showResults ? (
              <Box sx={{ mt: 1.5, maxHeight: 280, overflow: 'auto', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                {visibleState === 'loading' ? (
                  <StatusRow>
                    <CircularProgress size={16} />
                    <Typography sx={{ fontSize: '0.8125rem', color: colors.muted }}>
                      {t('spaces.findPlace.locationSearchingLocations')}
                    </Typography>
                  </StatusRow>
                ) : null}
                {visibleState === 'error' ? (
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography sx={{ fontSize: '0.8125rem', color: 'error.main' }}>
                      {t('spaces.findPlace.locationAutocompleteUnavailable')}
                    </Typography>
                    <Link component="button" type="button" onClick={() => setRetryToken((n) => n + 1)} sx={{ mt: 0.5, fontSize: '0.8125rem' }}>
                      {t('spaces.findPlace.locationRetry')}
                    </Link>
                  </Box>
                ) : null}
                {visibleState === 'idle' && visibleSuggestions.length === 0 ? (
                  <Typography sx={{ px: 2, py: 1.5, fontSize: '0.8125rem', color: colors.muted }}>
                    {t('spaces.findPlace.locationAutocompleteEmpty')}
                  </Typography>
                ) : null}
                {visibleState === 'idle' && visibleSuggestions.length > 0 ? (
                  <List disablePadding>
                    {visibleSuggestions.map((suggestion, index) => {
                      const title = suggestionTitle(suggestion);
                      if (!title) return null;
                      const detail = [suggestionDetail(suggestion), suggestion.pincode].filter(Boolean).join(' • ');
                      return (
                        <ListItemButton
                          key={suggestionKey(suggestion, index)}
                          onClick={() => setSearchPick(suggestion)}
                          sx={{ alignItems: 'flex-start', py: 1.25 }}
                        >
                          <Box sx={{ mr: 1.25, mt: 0.35, color: colors.primaryDark }}>
                            <MapPin size={16} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 700 }}>{title}</Typography>
                            {detail ? (
                              <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary }}>{detail}</Typography>
                            ) : null}
                          </Box>
                        </ListItemButton>
                      );
                    })}
                  </List>
                ) : null}
              </Box>
            ) : null}

            <Typography sx={{ mt: 1, fontSize: '0.6875rem', color: colors.muted }}>
              <Link href="https://www.geoapify.com/" target="_blank" rel="noreferrer" underline="hover">
                {t('spaces.findPlace.locationAttributionGeoapify')}
              </Link>
              {' · '}
              <Link href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" underline="hover">
                {t('spaces.findPlace.locationAttributionOsm')}
              </Link>
            </Typography>
          </Box>
        ) : (
          <Box role="tabpanel" id="location-panel-browse" aria-labelledby="location-tab-browse" sx={{ mt: 1.5, display: 'grid', gap: 1.25 }}>
            <CascadeField
              label={t('spaces.findPlace.locationStateLabel')}
              value={stateName}
              placeholder={t('spaces.findPlace.locationSelectState')}
              disabled={false}
              open={stateMenuOpen}
              onToggle={() => setStateMenuOpen((openMenu) => !openMenu)}
              options={states.map((option) => ({ id: option, label: option }))}
              onSelect={chooseState}
              loading={browseLoad === 'loading' && stateMenuOpen && states.length === 0}
            />
            <TextField
              id="location-browse-search"
              fullWidth
              value={browseQuery}
              disabled={!stateName}
              onChange={(event) => {
                setBrowseQuery(event.target.value);
                setAreaPick(null);
              }}
              placeholder={t('spaces.findPlace.locationSearchPlaceholder')}
              autoComplete="off"
              slotProps={{
                htmlInput: { 'aria-label': t('spaces.findPlace.locationSearchLabel') },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color={colors.muted} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', minHeight: 44 } }}
            />
            {areaPick ? <SelectedCard title={areaPick.location} detail={recordDetail(areaPick)} /> : null}
            {showBrowseResults ? (
              <Box sx={{ maxHeight: 280, overflow: 'auto', borderRadius: '16px', border: `1px solid ${colors.border}` }}>
                {browseVisibleState === 'loading' ? (
                  <StatusRow>
                    <CircularProgress size={16} />
                    <Typography sx={{ fontSize: '0.8125rem', color: colors.muted }}>
                      {t('spaces.findPlace.locationSearchingLocations')}
                    </Typography>
                  </StatusRow>
                ) : null}
                {browseVisibleState === 'error' ? (
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography sx={{ fontSize: '0.8125rem', color: colors.danger }}>
                      {t('spaces.findPlace.locationAutocompleteUnavailable')}
                    </Typography>
                    <Link component="button" type="button" onClick={() => setBrowseRetry((current) => current + 1)} sx={{ mt: 1, fontSize: '0.8125rem' }}>
                      {t('spaces.findPlace.locationRetry')}
                    </Link>
                  </Box>
                ) : null}
                {browseVisibleState === 'idle' && visibleBrowseHits.length === 0 ? (
                  <Typography sx={{ px: 2, py: 1.5, fontSize: '0.8125rem', color: colors.muted }}>
                    {t('spaces.findPlace.locationAutocompleteEmpty')}
                  </Typography>
                ) : null}
                {browseVisibleState === 'idle' && visibleBrowseHits.length > 0 ? (
                  <List disablePadding>
                    {visibleBrowseHits.map((record) => (
                      <ListItemButton
                        key={[record.location, record.pincode, record.cityTaluka, record.district].join('|')}
                        onClick={() => setAreaPick(record)}
                        sx={{ alignItems: 'flex-start', py: 1.25 }}
                      >
                        <Box sx={{ mr: 1.25, mt: 0.35, color: colors.primaryDark }}>
                          <MapPin size={16} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 700 }}>{record.location}</Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary }}>{recordDetail(record)}</Typography>
                        </Box>
                      </ListItemButton>
                    ))}
                  </List>
                ) : null}
              </Box>
            ) : null}
            {browseLoad === 'error' ? (
              <Link component="button" type="button" onClick={enterBrowse} sx={{ fontSize: '0.8125rem', justifySelf: 'start' }}>
                {t('spaces.findPlace.locationRetry')}
              </Link>
            ) : null}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, justifyContent: 'space-between' }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: '12px', textTransform: 'none' }}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          disabled={!canConfirm}
          onClick={confirm}
          sx={{ borderRadius: '12px', textTransform: 'none', boxShadow: 'none' }}
        >
          {mode === 'browse'
            ? t('spaces.findPlace.locationApplyAction')
            : t('spaces.findPlace.locationSelectAction')}
        </Button>
      </DialogActions>
    </>
  );
}

function ModeSwitch({
  mode,
  onSearch,
  onBrowse,
}: {
  mode: PickerMode;
  onSearch: () => void;
  onBrowse: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Box role="tablist" aria-label={t('spaces.findPlace.chooseLocation')} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
      <ModeTab
        id="location-tab-search"
        active={mode === 'search'}
        label={t('spaces.findPlace.locationSearchTab')}
        icon={<Search size={16} />}
        onClick={onSearch}
      />
      <ModeTab
        id="location-tab-browse"
        active={mode === 'browse'}
        label={t('spaces.findPlace.locationBrowseTab')}
        icon={<Map size={16} />}
        onClick={onBrowse}
      />
    </Box>
  );
}

function ModeTab({
  id,
  active,
  label,
  icon,
  onClick,
}: {
  id: string;
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <Box
      component="button"
      type="button"
      id={id}
      role="tab"
      aria-selected={active}
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.75,
        minHeight: 42,
        borderRadius: '12px',
        border: `1px solid ${active ? colors.primary : colors.border}`,
        background: active ? colors.mintSubtle : colors.white,
        color: active ? colors.tealDark : colors.textSecondary,
        fontWeight: active ? 700 : 600,
        fontSize: '0.8125rem',
        cursor: 'pointer',
      }}
    >
      {icon}
      {label}
    </Box>
  );
}

function StatusRow({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5 }}>{children}</Box>
  );
}

function SelectedCard({ title, detail }: { title: string; detail: string }) {
  if (!title) return null;
  return (
    <Box sx={{ mt: 1.5, display: 'flex', gap: 1.25, p: 1.5, borderRadius: '16px', background: colors.selected }}>
      <MapPin size={16} color={colors.primaryDark} />
      <Box>
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 700 }}>{title}</Typography>
        {detail ? <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary }}>{detail}</Typography> : null}
      </Box>
    </Box>
  );
}

function CascadeField({
  label,
  value,
  placeholder,
  disabled,
  open,
  onToggle,
  options,
  onSelect,
  loading = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  disabled: boolean;
  open: boolean;
  onToggle: () => void;
  options: { id: string; label: string }[];
  onSelect: (id: string) => void;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setQuery('');
  }
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? options.filter((option) => option.label.toLowerCase().includes(needle))
    : options;

  return (
    <Box>
      <Typography sx={{ mb: 0.5, fontSize: '0.75rem', fontWeight: 700, color: colors.textSecondary }}>{label}</Typography>
      <Box sx={{ position: 'relative' }}>
        <Box
          component="input"
          value={open ? query : value}
          disabled={disabled}
          aria-expanded={open}
          placeholder={open ? t('spaces.findPlace.locationSearchLabel') : placeholder}
          onFocus={() => {
            if (!disabled && !open) onToggle();
          }}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setQuery(event.target.value);
            if (!disabled && !open) onToggle();
          }}
          sx={{
            width: '100%',
            minHeight: 44,
            pl: 1.5,
            pr: 4.5,
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            background: disabled ? colors.section : colors.white,
            color: colors.textPrimary,
            fontSize: '0.875rem',
          }}
        />
        <IconButton
          size="small"
          disabled={disabled}
          aria-label={placeholder}
          onClick={onToggle}
          sx={{ position: 'absolute', top: 6, right: 4 }}
        >
          <ChevronDown size={16} />
        </IconButton>
      </Box>
      {open && !disabled ? (
        <Box sx={{ mt: 0.5, maxHeight: 160, overflow: 'auto', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
          {loading ? (
            <Box sx={{ p: 1.5 }}><CircularProgress size={16} /></Box>
          ) : visible.length === 0 ? (
            <Typography sx={{ px: 2, py: 1.5, fontSize: '0.8125rem', color: colors.muted }}>
              {t('spaces.findPlace.locationAutocompleteEmpty')}
            </Typography>
          ) : (
            <List disablePadding>
              {visible.map((option) => (
                <ListItemButton key={option.id} selected={option.label === value} onClick={() => onSelect(option.id)}>
                  <Typography sx={{ fontSize: '0.875rem' }}>{option.label}</Typography>
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      ) : null}
    </Box>
  );
}
