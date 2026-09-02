import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { adminApi } from '@/modules/admin/api/adminApi';
import { formatAdminDate } from '@/modules/admin/utils/adminLabels';
import { ROUTES } from '@/routes/paths';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import type { SavedAddress } from '@/shared/types/admin';

function isValidPincode(value: string): boolean {
  return /^[1-9]\d{5}$/.test(value);
}

function isValidMapUrl(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

export function AdminSavedAddressesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<SavedAddress | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedAddress | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    mapUrl: '',
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async (term: string) => {
    try {
      const page = await adminApi.listSavedAddresses({
        search: term || undefined,
        size: 50,
        page: 0,
      });
      setAddresses(page.content);
      setError(null);
    } catch {
      setError('Unable to load saved addresses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void adminApi
      .listSavedAddresses({
        search: debounced || undefined,
        size: 50,
        page: 0,
      })
      .then((page) => {
        if (!cancelled) {
          setAddresses(page.content);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load saved addresses. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  function openEdit(address: SavedAddress) {
    setEditTarget(address);
    setForm({
      addressLine: address.addressLine,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      mapUrl: address.mapUrl ?? '',
    });
  }

  async function handleSave() {
    if (!editTarget) return;
    if (!form.addressLine.trim() || !form.city.trim() || !form.state.trim()) {
      enqueueSnackbar('Address, city, and state are required.', { variant: 'error' });
      return;
    }
    if (!isValidPincode(form.pincode.trim())) {
      enqueueSnackbar('Enter a valid 6-digit pincode.', { variant: 'error' });
      return;
    }
    if (form.mapUrl.trim() && !isValidMapUrl(form.mapUrl)) {
      enqueueSnackbar('Map link must start with http:// or https://', { variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      await adminApi.updateSavedAddress(editTarget.id, {
        addressLine: form.addressLine.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        mapUrl: form.mapUrl.trim() || undefined,
      });
      enqueueSnackbar('Saved address updated.', { variant: 'success' });
      setEditTarget(null);
      await load(debounced);
    } catch {
      enqueueSnackbar('Could not update saved address.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteSavedAddress(deleteTarget.id);
      setAddresses((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      enqueueSnackbar('Saved address removed.', { variant: 'success' });
      setDeleteTarget(null);
    } catch {
      enqueueSnackbar('Could not remove saved address.', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Saved addresses
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Recently used locations for property and mess leads. Multiple properties can share one address.
      </Typography>
      <TextField
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search address, city, state, or pincode"
        fullWidth
        size="small"
        sx={{ mb: 2, maxWidth: 480 }}
      />
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : addresses.length === 0 ? (
        <Typography color="text.secondary">No saved addresses yet. Create a property lead with an address to start the list.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {addresses.map((address) => (
            <Box
              key={address.id}
              sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, minWidth: 0 }}
            >
              <Typography sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
                {address.addressLine}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {address.city}, {address.state} - {address.pincode}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Used {address.usageCount} {address.usageCount === 1 ? 'time' : 'times'} · Last used{' '}
                {formatAdminDate(address.lastUsedAt ?? address.createdAt)}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button size="small" onClick={() => openEdit(address)}>
                  Edit
                </Button>
                <Button size="small" color="error" onClick={() => setDeleteTarget(address)}>
                  Remove
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
      <Button component={RouterLink} to={ROUTES.adminDashboard} sx={{ mt: 3 }}>
        Back to dashboard
      </Button>

      <Dialog open={editTarget != null} onClose={() => setEditTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit saved address</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Address"
            value={form.addressLine}
            onChange={(e) => setForm((prev) => ({ ...prev, addressLine: e.target.value }))}
            fullWidth
            size="small"
            sx={{ mt: 1 }}
          />
          <TextField
            label="City"
            value={form.city}
            onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            fullWidth
            size="small"
          />
          <TextField
            label="State"
            value={form.state}
            onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
            fullWidth
            size="small"
          />
          <TextField
            label="Pincode"
            value={form.pincode}
            onChange={(e) => setForm((prev) => ({ ...prev, pincode: e.target.value }))}
            fullWidth
            size="small"
            slotProps={{ htmlInput: { maxLength: 6, inputMode: 'numeric' } }}
          />
          <TextField
            label="Google Maps link"
            value={form.mapUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, mapUrl: e.target.value }))}
            fullWidth
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget != null}
        title="Remove this saved address?"
        description={
          deleteTarget
            ? `${deleteTarget.addressLine}, ${deleteTarget.city}. Existing property leads keep their address.`
            : undefined
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
        confirming={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
