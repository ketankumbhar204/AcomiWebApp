import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { adminEnquiryApi } from '@/shared/api/enquiryApi';
import { getErrorMessage } from '@/shared/api/errors';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { ROUTES } from '@/routes/paths';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type { AdminSpaceEnquiryDetail } from '@/shared/types/enquiry';
import { formatIndianMobileWithCountryCode } from '@/shared/utils/indianMobile';
export function AdminEnquiryDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [detail, setDetail] = useState<AdminSpaceEnquiryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    void adminEnquiryApi
      .get(id)
      .then((data) => {
        if (active) {
          setDetail(data);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  async function share() {
    if (!id) return;
    setBusy(true);
    try {
      const updated = await adminEnquiryApi.share(id);
      setDetail(updated);
      enqueueSnackbar(t('admin.enquiries.shareSuccess'), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, t('admin.enquiries.shareFailed')), { variant: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!id) return;
    setBusy(true);
    try {
      const updated = await adminEnquiryApi.reject(id, reason.trim() || undefined);
      setDetail(updated);
      enqueueSnackbar(t('admin.enquiries.rejectSuccess'), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, t('admin.enquiries.rejectFailed')), { variant: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function expire() {
    if (!id) return;
    if (!window.confirm(t('admin.enquiries.expireConfirm'))) {
      return;
    }
    setBusy(true);
    try {
      const updated = await adminEnquiryApi.expire(id);
      setDetail(updated);
      enqueueSnackbar(t('admin.enquiries.expireSuccess'), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, t('admin.enquiries.expireFailed')), { variant: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await adminEnquiryApi.delete(id);
      enqueueSnackbar(t('admin.enquiries.deleted'), { variant: 'success' });
      setConfirmDelete(false);
      navigate(ROUTES.adminEnquiries);
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, t('admin.enquiries.deleteFailed')), { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!detail) {
    return (
      <Box>
        <Button onClick={() => navigate(ROUTES.adminEnquiries)} sx={{ mb: 2, textTransform: 'none' }}>
          {t('common.back')}
        </Button>
        <Typography color="text.secondary">{t('admin.enquiries.empty')}</Typography>
      </Box>
    );
  }

  const pending = detail.status === 'PENDING';
  const canExpire = pending || detail.status === 'SHARED';
  const contact = detail.ownerContact;

  return (
    <Box>
      <Button onClick={() => navigate(ROUTES.adminEnquiries)} sx={{ mb: 2, textTransform: 'none' }}>
        {t('common.back')}
      </Button>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        {t('admin.enquiries.detailTitle')}
      </Typography>
      <Chip size="small" label={t(`admin.enquiries.status.${detail.status}`)} sx={{ mb: detail.status === 'SHARED' ? 1 : 3 }} />
      {detail.status === 'SHARED' ? (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {detail.automaticallyShared
            ? t('admin.enquiries.automaticallyShared')
            : t('admin.enquiries.sharedByAdmin')}
        </Typography>
      ) : null}

      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography>
          <strong>{t('admin.enquiries.columns.listing')}:</strong> {detail.spaceName}
        </Typography>
        <Typography>
          <strong>{t('admin.enquiries.columns.requestedBy')}:</strong> {detail.requesterName} ·{' '}
          {detail.requesterType === 'OWNER' ? t('admin.labels.owner') : t('admin.labels.member')}
        </Typography>
        <Typography>
          <strong>{t('admin.enquiries.email')}:</strong> {detail.requesterEmail}
        </Typography>
        <Typography>
          <strong>{t('admin.enquiries.columns.requested')}:</strong>{' '}
          {new Date(detail.requestedAt).toLocaleString()}
        </Typography>
        <Typography>
          <strong>{t('admin.enquiries.expires')}:</strong> {new Date(detail.expiresAt).toLocaleString()}
        </Typography>
      </Stack>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        {t('admin.enquiries.ownerContact')}
      </Typography>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography>
          <strong>{t('admin.enquiries.ownerName')}:</strong> {contact.ownerName || '—'}
        </Typography>
        <Typography>
          <strong>{t('admin.enquiries.mobile')}:</strong>{' '}
          {contact.mobileNumber ? formatIndianMobileWithCountryCode(contact.mobileNumber) : '—'}
        </Typography>
        <Typography>
          <strong>{t('admin.enquiries.alternateMobile')}:</strong>{' '}
          {contact.alternateMobileNumber
            ? formatIndianMobileWithCountryCode(contact.alternateMobileNumber)
            : '—'}
        </Typography>
        <Typography>
          <strong>{t('admin.enquiries.additionalContact')}:</strong>{' '}
          {contact.additionalMobileNumber
            ? formatIndianMobileWithCountryCode(contact.additionalMobileNumber)
            : '—'}
        </Typography>
        <Typography>
          <strong>{t('admin.enquiries.ownerEmail')}:</strong> {contact.email || '—'}
        </Typography>
      </Stack>

      {pending ? (
        <Stack spacing={2} sx={{ maxWidth: 420 }}>
          <Typography color="text.secondary">{t('admin.enquiries.shareFallbackHint')}</Typography>
          <Button disabled={busy} onClick={() => void share()} sx={dashContainedButtonSx}>
            {t('admin.enquiries.share')}
          </Button>
          <TextField
            label={t('admin.enquiries.rejectReason')}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            multiline
            minRows={2}
          />
          <Button disabled={busy} onClick={() => void reject()} sx={dashOutlinedButtonSx}>
            {t('admin.enquiries.reject')}
          </Button>
        </Stack>
      ) : null}

      {canExpire ? (
        <Stack spacing={2} sx={{ maxWidth: 420, mt: pending ? 3 : 0 }}>
          <Typography color="text.secondary">{t('admin.enquiries.expireHint')}</Typography>
          <Button disabled={busy || deleting} color="warning" variant="outlined" onClick={() => void expire()} sx={dashOutlinedButtonSx}>
            {t('admin.enquiries.expire')}
          </Button>
        </Stack>
      ) : null}

      <Stack spacing={2} sx={{ maxWidth: 420, mt: 3 }}>
        <Button
          disabled={busy || deleting}
          color="error"
          variant="outlined"
          onClick={() => setConfirmDelete(true)}
          sx={dashOutlinedButtonSx}>
          {t('admin.common.delete')}
        </Button>
      </Stack>

      <ConfirmDialog
        open={confirmDelete}
        title={t('admin.enquiries.deleteTitle')}
        description={id ? t('admin.enquiries.deleteMessage', { id }) : undefined}
        confirmLabel={t('admin.common.delete')}
        cancelLabel={t('admin.common.cancel')}
        destructive
        confirming={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setConfirmDelete(false)}
      />
    </Box>
  );
}
