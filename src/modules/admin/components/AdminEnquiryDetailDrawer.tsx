import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Info,
  List,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { AdminEnquiryStatusChip } from '@/modules/admin/components/AdminEnquiryStatusChip';
import { discoverDefaultImageUrl } from '@/modules/onboarding/utils/discoverDefaultImages';
import { adminEnquiryApi } from '@/shared/api/enquiryApi';
import { getErrorMessage } from '@/shared/api/errors';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { adminListPath } from '@/modules/admin/utils/adminListFilters';
import { formatIndianMobileWithCountryCode } from '@/shared/utils/indianMobile';
import type { AdminSpaceEnquiryDetail } from '@/shared/types/enquiry';

type Props = {
  enquiryId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: (detail: AdminSpaceEnquiryDetail) => void;
  onDeleted?: (enquiryId: string) => void;
};

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function AdminEnquiryDetailDrawer({
  enquiryId,
  open,
  onClose,
  onUpdated,
  onDeleted,
}: Props) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [detail, setDetail] = useState<AdminSpaceEnquiryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [activeEnquiryId, setActiveEnquiryId] = useState(enquiryId);
  const [wasOpen, setWasOpen] = useState(open);
  if (activeEnquiryId !== enquiryId) {
    setActiveEnquiryId(enquiryId);
    if (enquiryId) setLoading(true);
  }
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) {
      setDetail(null);
      setReason('');
    } else if (enquiryId) {
      setLoading(true);
    }
  }

  useEffect(() => {
    if (!open || !enquiryId) return;
    let active = true;
    void adminEnquiryApi
      .get(enquiryId)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch(() => {
        if (active) setDetail(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [enquiryId, open]);

  async function share() {
    if (!enquiryId) return;
    setBusy(true);
    try {
      const updated = await adminEnquiryApi.share(enquiryId);
      setDetail(updated);
      onUpdated?.(updated);
      enqueueSnackbar(t('admin.enquiries.shareSuccess'), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, t('admin.enquiries.shareFailed')), { variant: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!enquiryId) return;
    setBusy(true);
    try {
      const updated = await adminEnquiryApi.reject(enquiryId, reason.trim() || undefined);
      setDetail(updated);
      onUpdated?.(updated);
      enqueueSnackbar(t('admin.enquiries.rejectSuccess'), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, t('admin.enquiries.rejectFailed')), { variant: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function expire() {
    if (!enquiryId) return;
    if (!window.confirm(t('admin.enquiries.expireConfirm'))) return;
    setBusy(true);
    try {
      const updated = await adminEnquiryApi.expire(enquiryId);
      setDetail(updated);
      onUpdated?.(updated);
      enqueueSnackbar(t('admin.enquiries.expireSuccess'), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, t('admin.enquiries.expireFailed')), { variant: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!enquiryId) return;
    setDeleting(true);
    try {
      await adminEnquiryApi.delete(enquiryId);
      enqueueSnackbar(t('admin.enquiries.deleted'), { variant: 'success' });
      setConfirmDelete(false);
      onDeleted?.(enquiryId);
      onClose();
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, t('admin.enquiries.deleteFailed')), { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  const pending = detail?.status === 'PENDING';
  const canExpire = detail?.status === 'PENDING' || detail?.status === 'SHARED';
  const imageUrl = discoverDefaultImageUrl(detail?.spaceType ?? undefined);
  const propertyPath =
    detail?.spaceType === 'MESS'
      ? adminListPath('mess', { tab: 'active' })
      : adminListPath('properties', { tab: 'active' });
  const initial = (detail?.requesterName?.trim()?.[0] ?? 'U').toUpperCase();
  const mailto = detail?.requesterEmail
    ? `mailto:${encodeURIComponent(detail.requesterEmail)}?subject=${encodeURIComponent(
        `ACOMI enquiry — ${detail.spaceName}`,
      )}`
    : undefined;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 440, md: 480 },
            bgcolor: '#FFFFFF',
          },
        },
      }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack
          direction="row"
          sx={{
            px: 2,
            py: 1.5,
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}>
          <Button
            onClick={onClose}
            startIcon={<ArrowLeft size={16} />}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
            {t('admin.enquiries.backToList')}
          </Button>
          <IconButton onClick={onClose} size="small" aria-label={t('common.close')}>
            <X size={18} />
          </IconButton>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : !detail ? (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">{t('admin.enquiries.empty')}</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 2.5 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.75 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 22, flex: 1 }}>
                  {t('admin.enquiries.detailTitle')}
                </Typography>
                <AdminEnquiryStatusChip status={detail.status} />
                {detail.status === 'SHARED' ? <Share2 size={16} color="#16A34A" /> : null}
              </Stack>
              {detail.status === 'SHARED' ? (
                <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 2 }}>
                  {detail.automaticallyShared
                    ? t('admin.enquiries.automaticallySharedOwner')
                    : t('admin.enquiries.sharedByAdmin')}
                </Typography>
              ) : (
                <Box sx={{ mb: 2 }} />
              )}

              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  mb: 2.5,
                }}>
                <Box
                  component="img"
                  src={imageUrl}
                  alt=""
                  sx={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                />
                <Box sx={{ p: 1.75 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 16 }}>{detail.spaceName}</Typography>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.5 }}>
                    <MapPin size={13} color="#94A3B8" />
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                      {detail.locationLabel || detail.spaceAddress || t('admin.labels.emDash')}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                    {detail.spaceType ? (
                      <Chip size="small" label={detail.spaceType.replace('_', ' ')} sx={{ fontWeight: 600 }} />
                    ) : null}
                    {detail.capacityLabel ? (
                      <Chip
                        size="small"
                        label={detail.capacityLabel}
                        sx={{ fontWeight: 600, bgcolor: '#F0FDF4', color: '#15803D' }}
                      />
                    ) : null}
                  </Stack>
                  <Button
                    component={RouterLink}
                    to={propertyPath}
                    sx={{
                      mt: 1.25,
                      px: 0,
                      textTransform: 'none',
                      fontWeight: 700,
                      color: '#16A34A',
                    }}>
                    {t('admin.enquiries.viewProperty')}
                  </Button>
                </Box>
              </Box>

              <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 1.25 }}>
                {t('admin.enquiries.requesterInfo')}
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', mb: 2 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '999px',
                    bgcolor: '#DBEAFE',
                    color: '#1D4ED8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}>
                  {initial}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.75 }}>
                    <Typography sx={{ fontWeight: 700 }}>{detail.requesterName}</Typography>
                    <Chip
                      size="small"
                      label={
                        detail.requesterType === 'OWNER'
                          ? t('admin.labels.owner')
                          : t('admin.labels.member')
                      }
                      sx={{ height: 22, bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 700 }}
                    />
                  </Stack>
                  <Stack spacing={0.75}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Mail size={14} color="#94A3B8" />
                      <Typography sx={{ fontSize: 13 }}>{detail.requesterEmail || '—'}</Typography>
                    </Stack>
                    {detail.requesterMobile ? (
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Phone size={14} color="#94A3B8" />
                        <Typography sx={{ fontSize: 13 }}>
                          {formatIndianMobileWithCountryCode(detail.requesterMobile)}
                        </Typography>
                      </Stack>
                    ) : null}
                    {detail.ownerContact?.mobileNumber &&
                    detail.ownerContact.mobileNumber !== detail.requesterMobile ? (
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Phone size={14} color="#94A3B8" />
                        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                          {t('admin.enquiries.ownerMobileShort')}:{' '}
                          {formatIndianMobileWithCountryCode(detail.ownerContact.mobileNumber)}
                        </Typography>
                      </Stack>
                    ) : null}
                  </Stack>
                </Box>
              </Stack>

              <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 1.25 }}>
                {t('admin.enquiries.requestDetails')}
              </Typography>
              <Stack spacing={1.25} sx={{ mb: 2 }}>
                <DetailLine
                  icon={<CalendarDays size={14} />}
                  label={t('admin.enquiries.columns.requested')}
                  value={formatDateTime(detail.requestedAt)}
                />
                <DetailLine
                  icon={<CalendarDays size={14} />}
                  label={t('admin.enquiries.expires')}
                  value={formatDateTime(detail.expiresAt)}
                />
                <DetailLine
                  icon={<List size={14} />}
                  label={t('admin.enquiries.columns.type')}
                  value={
                    detail.requesterType === 'OWNER'
                      ? t('admin.labels.owner')
                      : t('admin.labels.member')
                  }
                />
                <DetailLine
                  icon={<MessageCircle size={14} />}
                  label={t('admin.enquiries.message')}
                  value={
                    detail.rejectionReason?.trim()
                      ? detail.rejectionReason
                      : t('admin.enquiries.defaultMessage')
                  }
                />
              </Stack>

              <Box
                sx={{
                  bgcolor: '#F0FDF4',
                  borderRadius: '12px',
                  p: 1.5,
                  display: 'flex',
                  gap: 1,
                  alignItems: 'flex-start',
                }}>
                <Info size={16} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12.5, color: '#166534', lineHeight: 1.45 }}>
                  {t('admin.enquiries.infoBanner')}
                </Typography>
              </Box>

              {pending ? (
                <Box sx={{ mt: 2.5 }}>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1.25 }}>
                    {t('admin.enquiries.shareFallbackHint')}
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('admin.enquiries.rejectReason')}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    multiline
                    minRows={2}
                    sx={{ mb: 1.5 }}
                  />
                  <Stack direction="row" spacing={1}>
                    <Button
                      disabled={busy}
                      variant="contained"
                      onClick={() => void share()}
                      sx={{
                        flex: 1,
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: '#22C55E',
                        '&:hover': { bgcolor: '#16A34A' },
                      }}>
                      {t('admin.enquiries.share')}
                    </Button>
                    <Button
                      disabled={busy}
                      variant="outlined"
                      color="warning"
                      onClick={() => void reject()}
                      sx={{ flex: 1, textTransform: 'none', fontWeight: 700 }}>
                      {t('admin.enquiries.reject')}
                    </Button>
                  </Stack>
                </Box>
              ) : null}
            </Box>

            <Divider />
            <Stack spacing={1.25} sx={{ p: 2 }}>
              <Button
                component="a"
                href={mailto}
                disabled={!mailto}
                variant="outlined"
                startIcon={<MessageCircle size={16} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderColor: '#22C55E',
                  color: '#15803D',
                  borderRadius: '10px',
                  py: 1.1,
                  '&:hover': { borderColor: '#16A34A', bgcolor: '#F0FDF4' },
                }}>
                {t('admin.enquiries.sendMessage')}
              </Button>
              {canExpire ? (
                <Button
                  disabled={busy || deleting}
                  variant="outlined"
                  startIcon={<Clock3 size={16} />}
                  onClick={() => void expire()}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderColor: '#F97316',
                    color: '#C2410C',
                    borderRadius: '10px',
                    py: 1.1,
                    '&:hover': { borderColor: '#EA580C', bgcolor: '#FFF7ED' },
                  }}>
                  {t('admin.enquiries.expire')}
                </Button>
              ) : null}
              <Button
                disabled={busy || deleting}
                variant="outlined"
                color="error"
                startIcon={<Trash2 size={16} />}
                onClick={() => setConfirmDelete(true)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: '10px',
                  py: 1.1,
                }}>
                {t('admin.common.delete')}
              </Button>
            </Stack>
          </>
        )}
      </Box>

      <ConfirmDialog
        open={confirmDelete}
        title={t('admin.enquiries.deleteTitle')}
        description={
          enquiryId ? t('admin.enquiries.deleteMessage', { id: enquiryId }) : undefined
        }
        confirmLabel={t('admin.common.delete')}
        cancelLabel={t('admin.common.cancel')}
        destructive
        confirming={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setConfirmDelete(false)}
      />
    </Drawer>
  );
}

function DetailLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
      <Box sx={{ color: 'text.secondary', mt: 0.25 }}>{icon}</Box>
      <Box>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{value}</Typography>
      </Box>
    </Stack>
  );
}
