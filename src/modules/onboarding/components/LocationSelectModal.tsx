import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { MapPin, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { locationsApi, type LocationRecord } from '@/shared/api/locationsApi';
import { colors } from '@/shared/theme/colors';
import {
  formatDiscoverLocationContext,
  locationRecordKey,
} from '@/modules/onboarding/utils/discoverLocation';

const SEARCH_DEBOUNCE_MS = 300;

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
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchResults, setSearchResults] = useState<LocationRecord[]>([]);
  const [fetchedQuery, setFetchedQuery] = useState('');
  const [searchError, setSearchError] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch.length < 2) {
      return;
    }
    let active = true;
    locationsApi
      .search(debouncedSearch, {
        state: rankingContext?.state,
        district: rankingContext?.district,
        taluk: rankingContext?.taluk,
      })
      .then((next) => {
        if (!active) {
          return;
        }
        setSearchResults(next);
        setSearchError(false);
        setFetchedQuery(debouncedSearch);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setSearchError(true);
        setFetchedQuery(debouncedSearch);
      });
    return () => {
      active = false;
    };
  }, [
    debouncedSearch,
    rankingContext?.district,
    rankingContext?.state,
    rankingContext?.taluk,
  ]);

  const showResults = debouncedSearch.length >= 2;
  const visibleState: LoadState = !showResults
    ? 'idle'
    : fetchedQuery !== debouncedSearch
      ? 'loading'
      : searchError
        ? 'error'
        : 'idle';
  const visibleResults = showResults && fetchedQuery === debouncedSearch ? searchResults : [];

  return (
    <>
      <DialogTitle id="location-select-title" sx={{ pr: 6, fontWeight: 700 }}>
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
        <Typography
          id="location-select-description"
          sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}
        >
          {t('spaces.findPlace.locationBrowseHint')}
        </Typography>
        <TextField
          id="location-search"
          fullWidth
          value={search}
          onChange={(event) => setSearch(event.target.value)}
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
            },
          }}
          sx={{
            mt: 0.5,
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              minHeight: 44,
            },
          }}
        />

        {showResults ? (
          <Box
            sx={{
              mt: 1.5,
              maxHeight: 320,
              overflow: 'auto',
              borderRadius: '16px',
              border: `1px solid ${colors.border}`,
            }}
          >
            {visibleState === 'loading' ? (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 2, py: 1.5 }}>
                <CircularProgress size={16} />
                <Typography sx={{ fontSize: '0.8125rem', color: colors.muted }}>
                  {t('spaces.findPlace.locationSearching')}
                </Typography>
              </Stack>
            ) : null}
            {visibleState === 'error' ? (
              <Typography sx={{ px: 2, py: 1.5, fontSize: '0.8125rem', color: 'error.main' }}>
                {t('spaces.findPlace.locationSearchFailed')}
              </Typography>
            ) : null}
            {visibleState === 'idle' && visibleResults.length === 0 ? (
              <Typography sx={{ px: 2, py: 1.5, fontSize: '0.8125rem', color: colors.muted }}>
                {t('spaces.findPlace.locationNoResults')}
              </Typography>
            ) : null}
            {visibleState === 'idle' && visibleResults.length > 0 ? (
              <List disablePadding>
                {visibleResults.map((record) => (
                  <ListItemButton
                    key={locationRecordKey(record)}
                    onClick={() => onConfirm(record)}
                    sx={{ alignItems: 'flex-start', py: 1.25 }}
                  >
                    <Box sx={{ mr: 1.25, mt: 0.35, color: colors.primary }}>
                      <MapPin size={16} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: colors.textPrimary }}>
                        {record.location}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary }}>
                        {formatDiscoverLocationContext(record)}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: colors.muted }}>
                        {record.pincode}
                      </Typography>
                    </Box>
                  </ListItemButton>
                ))}
              </List>
            ) : null}
          </Box>
        ) : null}
      </DialogContent>
    </>
  );
}
