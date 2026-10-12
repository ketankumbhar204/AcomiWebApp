import { Box, Link, TextField, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { locationsApi } from '@/shared/api/locationsApi';
import {
  AUTOCOMPLETE_DEBOUNCE_MS,
  AUTOCOMPLETE_MIN_LENGTH,
  addressCaptureIssue,
  captureFromSuggestion,
  suggestionDetail,
  suggestionKey,
  suggestionTitle,
  withAddressQuery,
  type AddressCapture,
  type AddressCaptureIssue,
  type LocationAutocompleteSuggestion,
} from '@/modules/onboarding/utils/locationAutocomplete';

type AddressLocationFieldsProps = {
  value: AddressCapture;
  onChange: (value: AddressCapture) => void;
  required?: boolean;
  requireBuilding?: boolean;
  showBuildingName?: boolean;
  allowManual?: boolean;
  pincodeRequired?: boolean;
  disabled?: boolean;
  error?: string | null;
  sx?: SxProps<Theme>;
};

function issueMessage(issue: AddressCaptureIssue, fallback: string | null | undefined): string | null {
  if (fallback) return fallback;
  if (issue === 'building') return 'Enter the apartment or building name.';
  if (issue === 'selection') return 'Select a location from the suggestions.';
  if (issue === 'pincode') return 'Enter a valid 6-digit pincode.';
  return null;
}

export function AddressLocationFields({
  value,
  onChange,
  required = false,
  requireBuilding = false,
  showBuildingName = true,
  allowManual = false,
  pincodeRequired = false,
  disabled = false,
  error,
  sx,
}: AddressLocationFieldsProps) {
  const { t } = useTranslation();
  const listId = useId();
  const [suggestions, setSuggestions] = useState<LocationAutocompleteSuggestion[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const issue = addressCaptureIssue(value, { required, requireBuilding, pincodeRequired, allowManual });
  const message = issueMessage(issue, error);

  useEffect(() => {
    if (disabled || value.selected) {
      setSuggestions([]);
      setOpen(false);
      setStatus('idle');
      return;
    }
    const text = value.query.trim();
    if (text.length < AUTOCOMPLETE_MIN_LENGTH) {
      setSuggestions([]);
      setOpen(false);
      setStatus('idle');
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setStatus('loading');
      setOpen(true);
      locationsApi
        .autocompleteAddress(text)
        .then((rows) => {
          if (controller.signal.aborted) return;
          const next = rows.filter((row) => captureFromSuggestion(value, row));
          setSuggestions(next);
          setActive(0);
          setStatus(next.length ? 'ready' : 'empty');
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setSuggestions([]);
          setStatus('error');
        });
    }, AUTOCOMPLETE_DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [disabled, value]);

  function selectSuggestion(suggestion: LocationAutocompleteSuggestion) {
    const next = captureFromSuggestion(value, suggestion);
    if (!next) return;
    onChange(next);
    setOpen(false);
  }

  const summary = [value.locality, value.city, value.state].filter(Boolean).join(', ');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, gridColumn: { md: '1 / -1' }, ...sx }}>
      {showBuildingName ? (
        <TextField
          label={t('locationCapture.buildingName', { defaultValue: 'Apartment / Building name' })}
          value={value.buildingName}
          disabled={disabled}
          required={requireBuilding}
          placeholder={t('locationCapture.buildingPlaceholder', {
            defaultValue: 'e.g. Sunrise Residency',
          })}
          onChange={(event) => onChange({ ...value, buildingName: event.target.value })}
          fullWidth
          size="small"
          error={issue === 'building'}
          helperText={issue === 'building' ? message : undefined}
        />
      ) : null}
      <TextField
        label={t('locationCapture.searchLabel', { defaultValue: 'Search location' })}
        value={value.query}
        disabled={disabled}
        required={required}
        placeholder={t('locationCapture.searchPlaceholder', {
          defaultValue: 'Search building, road, area, locality or landmark',
        })}
        onChange={(event) => onChange(withAddressQuery(value, event.target.value))}
        onKeyDown={(event) => {
          if (!open || status !== 'ready' || suggestions.length === 0) {
            if (event.key === 'Escape') setOpen(false);
            return;
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((current) => (current + 1) % suggestions.length);
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((current) => (current - 1 + suggestions.length) % suggestions.length);
          } else if (event.key === 'Enter') {
            event.preventDefault();
            const suggestion = suggestions[active];
            if (suggestion) selectSuggestion(suggestion);
          } else if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
          }
        }}
        slotProps={{
          htmlInput: {
            role: 'combobox',
            'aria-expanded': open,
            'aria-controls': listId,
            'aria-autocomplete': 'list',
            autoComplete: 'off',
          },
        }}
        fullWidth
        size="small"
        error={issue === 'selection' || issue === 'pincode'}
        helperText={issue === 'selection' || issue === 'pincode' ? message : undefined}
      />
      {open ? (
        <Box
          id={listId}
          role="listbox"
          sx={{
            maxHeight: 224,
            overflowY: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          {status === 'loading' ? (
            <Typography sx={{ px: 1.5, py: 1.25, fontSize: 13 }}>
              {t('locationCapture.searching', { defaultValue: 'Searching locations...' })}
            </Typography>
          ) : null}
          {status === 'empty' ? (
            <Typography sx={{ px: 1.5, py: 1.25, fontSize: 13 }}>
              {t('locationCapture.empty', {
                defaultValue: 'No locations found. Try a road, area, locality or city.',
              })}
            </Typography>
          ) : null}
          {status === 'error' ? (
            <Typography color="error" sx={{ px: 1.5, py: 1.25, fontSize: 13 }}>
              {t('locationCapture.failed', { defaultValue: 'Unable to search locations. Please try again.' })}
            </Typography>
          ) : null}
          {status === 'ready'
            ? suggestions.map((suggestion, index) => (
                <Box
                  key={suggestionKey(suggestion, index)}
                  component="button"
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => selectSuggestion(suggestion)}
                  sx={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    border: 0,
                    px: 1.5,
                    py: 1,
                    cursor: 'pointer',
                    bgcolor: index === active ? 'action.hover' : 'transparent',
                  }}
                >
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{suggestionTitle(suggestion)}</Typography>
                  {suggestionDetail(suggestion) ? (
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                      {suggestionDetail(suggestion)}
                    </Typography>
                  ) : null}
                </Box>
              ))
            : null}
        </Box>
      ) : null}
      {value.selected ? (
        <Box sx={{ border: '1px solid', borderColor: 'success.light', borderRadius: 2, px: 1.5, py: 1.25 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'success.main' }}>
            {t('locationCapture.selected', { defaultValue: 'Location selected' })}
          </Typography>
          {value.buildingName.trim() ? (
            <Typography sx={{ mt: 0.5, fontSize: 14, fontWeight: 700 }}>{value.buildingName.trim()}</Typography>
          ) : null}
          <Typography sx={{ mt: 0.5, fontSize: 13 }}>{value.address}</Typography>
          {summary ? (
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              {[summary, value.pincode].filter(Boolean).join(' - ')}
            </Typography>
          ) : null}
          {value.latitude != null && value.longitude != null ? (
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              {t('locationCapture.coordinates', {
                defaultValue: 'Latitude: {{lat}} · Longitude: {{lng}}',
                lat: value.latitude,
                lng: value.longitude,
              })}
            </Typography>
          ) : null}
          {value.mapUrl ? (
            <Link href={value.mapUrl} target="_blank" rel="noopener noreferrer" sx={{ fontSize: 13 }}>
              {t('locationCapture.openMaps', { defaultValue: 'Open in Google Maps' })}
            </Link>
          ) : null}
          {disabled ? null : (
            <Box
              component="button"
              type="button"
              onClick={() => onChange(withAddressQuery({ ...value, query: '' }, ''))}
              sx={{ display: 'block', mt: 0.5, p: 0, border: 0, bgcolor: 'transparent', color: 'primary.main', fontWeight: 700, cursor: 'pointer' }}
            >
              {t('locationCapture.change', { defaultValue: 'Change location' })}
            </Box>
          )}
        </Box>
      ) : null}
      {value.selected && pincodeRequired && !value.pincode ? (
        <TextField
          label={t('locationCapture.pincode', { defaultValue: 'Pincode' })}
          value={value.pincode}
          disabled={disabled}
          required
          placeholder="411045"
          onChange={(event) =>
            onChange({ ...value, pincode: event.target.value.replace(/\D/g, '').slice(0, 6) })
          }
          fullWidth
          size="small"
          error={issue === 'pincode'}
          helperText={issue === 'pincode' ? message : undefined}
          slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }}
        />
      ) : null}
    </Box>
  );
}
