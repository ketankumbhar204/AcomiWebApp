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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setError(t('admin.addresses.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
        if (!cancelled) setError(t('admin.addresses.loadFailed'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, t]);

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
      enqueueSnackbar(t('admin.addresses.requiredFields'), { variant: 'error' });
      return;
    }
    if (!isValidPincode(form.pincode.trim())) {
      enqueueSnackbar(t('admin.addresses.invalidPincode'), { variant: 'error' });
      return;
    }
    if (form.mapUrl.trim() && !isValidMapUrl(form.mapUrl)) {
      enqueueSnackbar(t('admin.addresses.invalidMapUrl'), { variant: 'error' });
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
      enqueueSnackbar(t('admin.addresses.updated'), { variant: 'success' });
      setEditTarget(null);
      await load(debounced);
    } catch {
      enqueueSnackbar(t('admin.addresses.updateFailed'), { variant: 'error' });
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
      enqueueSnackbar(t('admin.addresses.removed'), { variant: 'success' });
      setDeleteTarget(null);
    } catch {
      enqueueSnackbar(t('admin.addresses.removeFailed'), { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        {t('admin.addresses.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('admin.addresses.hint')}
      </Typography>
      <TextField
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('admin.addresses.searchPlaceholder')}
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
        <Typography color="text.secondary">{t('admin.addresses.empty')}</Typography>
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
                {t('admin.addresses.usedLine', {
                  used: t(
                    address.usageCount === 1 ? 'admin.addresses.usedOnce' : 'admin.addresses.usedMany',
                    { count: address.usageCount },
                  ),
                  date: formatAdminDate(address.lastUsedAt ?? address.createdAt),
                })}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button size="small" onClick={() => openEdit(address)}>
                  {t('admin.common.edit')}
                </Button>
                <Button size="small" color="error" onClick={() => setDeleteTarget(address)}>
                  {t('admin.common.remove')}
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
      <Button component={RouterLink} to={ROUTES.adminDashboard} sx={{ mt: 3 }}>
        {t('admin.addresses.backToDashboard')}
      </Button>

      <Dialog open={editTarget != null} onClose={() => setEditTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t('admin.addresses.editTitle')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label={t('admin.common.address')}
            value={form.addressLine}
            onChange={(e) => setForm((prev) => ({ ...prev, addressLine: e.target.value }))}
            fullWidth
            size="small"
            sx={{ mt: 1 }}
          />
          <TextField
            label={t('admin.common.city')}
            value={form.city}
            onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            fullWidth
            size="small"
          />
          <TextField
            label={t('admin.common.state')}
            value={form.state}
            onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
            fullWidth
            size="small"
          />
          <TextField
            label={t('admin.common.pincode')}
            value={form.pincode}
            onChange={(e) => setForm((prev) => ({ ...prev, pincode: e.target.value }))}
            fullWidth
            size="small"
            slotProps={{ htmlInput: { maxLength: 6, inputMode: 'numeric' } }}
          />
          <TextField
            label={t('admin.common.mapLink')}
            value={form.mapUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, mapUrl: e.target.value }))}
            fullWidth
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)} disabled={saving}>
            {t('admin.common.cancel')}
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? t('admin.common.saving') : t('admin.common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget != null}
        title={t('admin.addresses.removeTitle')}
        description={
          deleteTarget
            ? t('admin.addresses.removeMessage', {
                address: deleteTarget.addressLine,
                city: deleteTarget.city,
              })
            : undefined
        }
        confirmLabel={t('admin.common.remove')}
        cancelLabel={t('admin.common.cancel')}
        destructive
        confirming={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
