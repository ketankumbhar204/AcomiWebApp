import {
  Autocomplete,
  Box,
  Button,
  TextField,
  Typography,
} from '@mui/material';
import { MapPin, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/modules/admin/api/adminApi';
import type { SavedAddress } from '@/shared/types/admin';

export type AddressFields = {
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  mapUrl: string;
};

type AdminSavedAddressPickerProps = {
  value: AddressFields;
  onChange: (next: AddressFields) => void;
};

function optionLabel(address: SavedAddress): string {
  return `${address.addressLine}, ${address.city}, ${address.state} - ${address.pincode}`;
}

export function AdminSavedAddressPicker({ value, onChange }: AdminSavedAddressPickerProps) {
  const [input, setInput] = useState('');
  const [debounced, setDebounced] = useState('');
  const [options, setOptions] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SavedAddress | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(input.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    let cancelled = false;
    void adminApi
      .listSavedAddresses({ search: debounced || undefined, size: 10, page: 0 })
      .then((page) => {
        if (!cancelled) {
          setOptions(page.content);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOptions([]);
          setError('Unable to load saved addresses. Please try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const selectedOption = useMemo(
    () => options.find((item) => item.id === selected?.id) ?? selected,
    [options, selected],
  );

  function applyAddress(address: SavedAddress) {
    setSelected(address);
    onChange({
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      mapUrl: address.mapUrl ?? '',
    });
  }

  function startNewAddress() {
    setSelected(null);
    setInput('');
    onChange({ addressLine: '', city: '', state: '', pincode: '', mapUrl: '' });
  }

  return (
    <Box sx={{ gridColumn: { md: '1 / -1' }, minWidth: 0 }}>
      <Autocomplete
        fullWidth
        options={options}
        loading={loading}
        value={selectedOption}
        inputValue={input}
        filterOptions={(items) => items}
        getOptionLabel={(option) => optionLabel(option)}
        isOptionEqualToValue={(option, item) => option.id === item.id}
        noOptionsText={debounced ? 'No saved addresses match that search.' : 'No recently used addresses yet.'}
        onInputChange={(_, next, reason) => {
          if (reason !== 'reset') {
            setInput(next);
          }
        }}
        onChange={(_, next) => {
          if (next) {
            applyAddress(next);
            setInput('');
          }
        }}
        slotProps={{
          listbox: { sx: { maxHeight: '40vh' } },
        }}
        renderOption={(props, option) => {
          const { key: _key, ...rest } = props as typeof props & { key?: string };
          return (
            <Box
              component="li"
              key={option.id}
              {...rest}
              sx={{ alignItems: 'flex-start !important', minWidth: 0 }}
            >
              <MapPin size={16} style={{ marginTop: 4, flexShrink: 0 }} />
              <Box sx={{ ml: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                  {option.addressLine}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                  {option.city}, {option.state} - {option.pincode}
                </Typography>
              </Box>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select saved address"
            placeholder="Search address, city, state, or pincode"
            size="small"
            error={Boolean(error)}
            helperText={error ?? 'Recently used addresses appear first. Fields stay editable after selection.'}
          />
        )}
      />
      <Button
        type="button"
        startIcon={<Plus size={16} />}
        onClick={startNewAddress}
        sx={{ mt: 1, textTransform: 'none' }}
      >
        Add new address
      </Button>
      {selected && value.addressLine ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          Using saved address. You can still edit the fields below.
        </Typography>
      ) : null}
    </Box>
  );
}
