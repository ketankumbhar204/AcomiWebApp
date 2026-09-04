import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '@/modules/admin/api/adminApi';
import { AdminRegistrationContactEditor } from '@/modules/admin/components/AdminRegistrationContactEditor';
import { formatMessRegistrationSource } from '@/modules/admin/utils/adminLabels';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { ROUTES } from '@/routes/paths';
import type {
  AdminUpdateRegistrationContactRequest,
  MessRegistrationDetail,
} from '@/shared/types/admin';

export function AdminMessDetailPage() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [detail, setDetail] = useState<MessRegistrationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    let active = true;
    void adminApi
      .getMessRegistration(id)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch(() => {
        if (active) setError(t('admin.mess.loadFailed'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, t]);

  async function handleDeleteConfirm() {
    setDeleting(true);
    try {
      await adminApi.deleteMessRegistration(id);
      enqueueSnackbar(t('admin.mess.deleted'), { variant: 'success' });
      navigate(ROUTES.adminMess);
    } catch {
      enqueueSnackbar(t('admin.mess.deleteFailed'), { variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  async function handleSaveContact(payload: AdminUpdateRegistrationContactRequest) {
    setSavingContact(true);
    try {
      const updated = await adminApi.updateMessRegistrationContact(id, payload);
      setDetail(updated);
      setEditingContact(false);
      enqueueSnackbar(t('admin.mess.contactUpdated'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('admin.mess.contactUpdateFailed'), { variant: 'error' });
    } finally {
      setSavingContact(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !detail) {
    return (
      <Box>
        <Typography color="error">{error ?? t('admin.common.notFound')}</Typography>
        <Button component={RouterLink} to={ROUTES.adminMess} sx={{ mt: 2 }}>
          {t('admin.common.backToList')}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {detail.messName}
        </Typography>
        <Chip size="small" label={formatMessRegistrationSource(detail.source)} />
      </Stack>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography><strong>{t('admin.common.reference')}:</strong> {detail.reference}</Typography>
        {editingContact ? (
          <AdminRegistrationContactEditor
            ownerName={detail.ownerName}
            mobileNumber={detail.mobileNumber}
            alternateMobileNumber={detail.alternateMobileNumber}
            saving={savingContact}
            onSave={(payload) => void handleSaveContact(payload)}
            onCancel={() => setEditingContact(false)}
          />
        ) : (
          <>
            <Typography><strong>{t('admin.common.owner')}:</strong> {detail.ownerName}</Typography>
            <Typography><strong>{t('admin.common.mobile')}:</strong> {detail.mobileNumber}</Typography>
            {detail.alternateMobileNumber ? (
              <Typography><strong>{t('admin.common.alternateMobile')}:</strong> {detail.alternateMobileNumber}</Typography>
            ) : null}
            <Box>
              <Button size="small" onClick={() => setEditingContact(true)}>
                {t('admin.common.editContact')}
              </Button>
            </Box>
          </>
        )}
        <Typography><strong>{t('admin.common.status')}:</strong> {detail.status}</Typography>
        <Typography><strong>{t('admin.common.testLead')}:</strong> {detail.testLead ? t('admin.common.yes') : t('admin.common.no')}</Typography>
        <Typography>
          <strong>{t('admin.common.address')}:</strong> {detail.addressLine}, {detail.city}, {detail.state} {detail.pincode}
        </Typography>
        <Typography><strong>{t('admin.mess.monthlyPrice')}:</strong> ₹{detail.monthlyPrice}</Typography>
        <Typography><strong>{t('admin.mess.mealPrice')}:</strong> ₹{detail.mealPrice}</Typography>
        {detail.claimedAt ? (
          <Typography><strong>{t('admin.common.claimed')}:</strong> {new Date(detail.claimedAt).toLocaleString()}</Typography>
        ) : null}
        {detail.description ? (
          <Typography><strong>{t('admin.common.description')}:</strong> {detail.description}</Typography>
        ) : null}
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button component={RouterLink} to={ROUTES.adminMess}>
          {t('admin.common.backToList')}
        </Button>
        <Button color="error" variant="outlined" onClick={() => setDeleteOpen(true)}>
          {t('admin.common.delete')}
        </Button>
      </Stack>
      <ConfirmDialog
        open={deleteOpen}
        title={t('admin.mess.deleteTitle')}
        description={t('admin.mess.deleteMessage', { name: detail.messName })}
        confirmLabel={t('admin.common.delete')}
        cancelLabel={t('admin.common.cancel')}
        destructive
        confirming={deleting}
        onConfirm={() => void handleDeleteConfirm()}
        onClose={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
