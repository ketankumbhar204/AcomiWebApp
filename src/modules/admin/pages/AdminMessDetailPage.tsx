import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowLeft,
  Calendar,
  ChefHat,
  FileText,
  Info,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '@/modules/admin/api/adminApi';
import { AdminConversionInfoCallouts } from '@/modules/admin/components/AdminConversionInfoCallouts';
import { AdminLeadDetailField } from '@/modules/admin/components/AdminLeadDetailField';
import { AdminRegistrationContactEditor } from '@/modules/admin/components/AdminRegistrationContactEditor';
import { AdminRegistrationConversionPanel } from '@/modules/admin/components/AdminRegistrationConversionPanel';
import { formatMessRegistrationSource } from '@/modules/admin/utils/adminLabels';
import { genderPolicyLabelKey } from '@/modules/onboarding/utils/spacePropertyCategory';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { ContentCard } from '@/shared/components/ContentCard';
import { PageHeader } from '@/shared/components/PageHeader';
import { ROUTES } from '@/routes/paths';
import { colors, spaceTypePalette } from '@/shared/theme/colors';
import { dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import type {
  AdminUpdateRegistrationContactRequest,
  MessRegistrationDetail,
} from '@/shared/types/admin';

function isPlaceholder(value?: string | null): boolean {
  if (!value) return true;
  const v = value.trim();
  return v === '' || v === '—' || v === '-' || v === 'Unknown' || v === 'Untitled mess';
}

function formatAddressLine(detail: MessRegistrationDetail): string {
  const parts = [detail.addressLine, detail.city, detail.state, detail.pincode]
    .map((p) => (p ?? '').trim())
    .filter((p) => p && p !== '—' && p !== '-');
  return parts.length ? parts.join(', ') : '—';
}

function formatLocationShort(detail: MessRegistrationDetail): string {
  const parts = [detail.city, detail.state, detail.pincode]
    .map((p) => (p ?? '').trim())
    .filter((p) => p && p !== '—' && p !== '-');
  return parts.length ? parts.join(', ') : '—';
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function statusChipSx(status: string) {
  if (status === 'CONVERTED') {
    return { bgcolor: colors.successTint, color: colors.success, fontWeight: 700 };
  }
  if (status === 'PENDING') {
    return { bgcolor: colors.warningTint, color: colors.warning, fontWeight: 700 };
  }
  return { bgcolor: colors.section, color: colors.textSecondary, fontWeight: 700 };
}

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

  const reload = useCallback(async () => {
    const data = await adminApi.getMessRegistration(id);
    setDetail(data);
  }, [id]);

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

  const typeTint = spaceTypePalette.MESS.tint;
  const typeAccent = spaceTypePalette.MESS.accent;
  const coords =
    detail.latitude != null && detail.longitude != null
      ? `${detail.latitude}, ${detail.longitude}`
      : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pb: 3 }}>
      <PageHeader
        title={t('admin.mess.detail.heading')}
        description={t('admin.mess.detail.subheading')}
        breadcrumbs={[
          { label: t('admin.nav.dashboard'), to: ROUTES.adminDashboard },
          { label: t('admin.nav.mess'), to: ROUTES.adminMess },
          { label: t('admin.dashboard.stats.messLeads') },
          { label: detail.reference },
        ]}
        actions={
          <>
            <Button
              component={RouterLink}
              to={ROUTES.adminMess}
              startIcon={<ArrowLeft size={16} />}
              sx={{ ...dashOutlinedButtonSx, borderColor: colors.border }}
            >
              {t('admin.common.backToList')}
            </Button>
            {detail.status !== 'CONVERTED' ? (
              <Button
                color="error"
                variant="outlined"
                startIcon={<Trash2 size={16} />}
                onClick={() => setDeleteOpen(true)}
                sx={{ ...dashOutlinedButtonSx, borderColor: colors.danger, color: colors.danger }}
              >
                {t('admin.common.deleteLead')}
              </Button>
            ) : null}
          </>
        }
      />

      <Grid container spacing={2.5} sx={{ alignItems: 'flex-start' }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2}>
            <ContentCard>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 88,
                    height: 72,
                    borderRadius: 2,
                    flexShrink: 0,
                    bgcolor: typeTint,
                    color: typeAccent,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <ChefHat size={28} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.75 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.25 }}>
                      {detail.messName}
                    </Typography>
                    <Chip
                      size="small"
                      label="MESS"
                      sx={{ bgcolor: typeTint, color: typeAccent, fontWeight: 700 }}
                    />
                    <Chip size="small" label={detail.status} sx={statusChipSx(detail.status)} />
                  </Stack>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 0.5 }}>
                    {detail.reference}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.textSecondary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <MapPin size={14} />
                    {formatLocationShort(detail)}
                  </Typography>
                </Box>
              </Stack>
            </ContentCard>

            <ContentCard>
              <Stack
                direction="row"
                sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1 }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Info size={18} color={colors.teal} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {t('admin.mess.detail.basicTitle')}
                  </Typography>
                </Stack>
                <Button
                  size="small"
                  startIcon={<Pencil size={14} />}
                  onClick={() => setEditingContact(true)}
                  sx={{ ...dashOutlinedButtonSx, minHeight: 32, height: 32, px: 1.25 }}
                >
                  {t('admin.common.edit')}
                </Button>
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={1.75}>
                    <AdminLeadDetailField label={t('admin.common.type')} value="MESS" icon={<ChefHat size={12} />} />
                    <AdminLeadDetailField
                      label={t('admin.common.owner')}
                      value={isPlaceholder(detail.ownerName) ? 'Unknown' : detail.ownerName}
                      icon={<User size={12} />}
                    />
                    <AdminLeadDetailField
                      label={t('admin.common.mobile')}
                      value={detail.mobileNumber}
                      icon={<Phone size={12} />}
                    />
                    <AdminLeadDetailField
                      label={t('admin.common.alternateMobile')}
                      value={detail.alternateMobileNumber}
                      icon={<Phone size={12} />}
                    />
                    <AdminLeadDetailField
                      label={t('admin.property.additionalMobile')}
                      value={detail.additionalMobileNumber}
                      icon={<Phone size={12} />}
                    />
                    <AdminLeadDetailField
                      label={t('admin.common.address')}
                      value={formatAddressLine(detail)}
                      icon={<MapPin size={12} />}
                    />
                    <AdminLeadDetailField
                      label={t('admin.property.coordinates')}
                      value={coords}
                      icon={<MapPin size={12} />}
                    />
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={1.75}>
                    <AdminLeadDetailField label={t('admin.common.status')} value={detail.status} />
                    <AdminLeadDetailField
                      label={t('admin.common.testLead')}
                      value={detail.testLead ? t('admin.common.yes') : t('admin.common.no')}
                    />
                    <AdminLeadDetailField
                      label={t('admin.property.gender')}
                      value={
                        detail.genderPolicy
                          ? t(genderPolicyLabelKey(detail.genderPolicy))
                          : detail.genderPolicy
                      }
                    />
                    <AdminLeadDetailField
                      label={t('admin.mess.monthlyPrice')}
                      value={`₹${detail.monthlyPrice ?? 0}`}
                    />
                    <AdminLeadDetailField
                      label={t('admin.mess.mealPrice')}
                      value={`₹${detail.mealPrice ?? 0}`}
                    />
                    <AdminLeadDetailField
                      label={t('admin.property.sharingNotes')}
                      value={detail.sharingNotes}
                    />
                  </Stack>
                </Grid>
              </Grid>
            </ContentCard>

            <ContentCard>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                <FileText size={18} color={colors.teal} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {t('admin.mess.detail.additionalTitle')}
                </Typography>
              </Stack>
              <Stack spacing={1.75}>
                <AdminLeadDetailField label={t('admin.mess.detail.listingName')} value={detail.messName} />
                <AdminLeadDetailField
                  label={t('admin.mess.detail.descriptionNotes')}
                  value={detail.description || detail.reviewNotes}
                />
                <AdminLeadDetailField
                  label={t('admin.mess.detail.createdBy')}
                  value={formatMessRegistrationSource(detail.source)}
                />
                <AdminLeadDetailField
                  label={t('admin.mess.detail.createdAt')}
                  value={formatDateTime(detail.createdAt)}
                  icon={<Calendar size={12} />}
                />
                <AdminLeadDetailField
                  label={t('admin.mess.detail.updatedAt')}
                  value={formatDateTime(detail.updatedAt)}
                  icon={<Calendar size={12} />}
                />
              </Stack>
            </ContentCard>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            <AdminRegistrationConversionPanel
              kind="mess"
              registrationId={id}
              listingName={detail.messName}
              status={detail.status}
              testLead={detail.testLead}
              mobileNumber={detail.mobileNumber}
              linkedOwnerUserId={detail.linkedOwnerUserId}
              linkedOwnerName={detail.linkedOwnerName}
              linkedOwnerMobile={detail.linkedOwnerMobile}
              ownershipStatus={detail.ownershipStatus}
              autoShareEligible={detail.autoShareEligible}
              autoShareReason={detail.autoShareReason}
              convertedSpaceId={detail.convertedSpaceId}
              onLinked={() => void reload()}
              onConverted={() => void reload()}
              onDiscoveryEnabled={() => undefined}
            />
            <AdminConversionInfoCallouts />
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={editingContact} onClose={() => setEditingContact(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {t('admin.common.editContact')}
          <IconButton onClick={() => setEditingContact(false)} size="small">
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <AdminRegistrationContactEditor
            ownerName={detail.ownerName}
            mobileNumber={detail.mobileNumber}
            alternateMobileNumber={detail.alternateMobileNumber}
            saving={savingContact}
            onSave={(payload) => void handleSaveContact(payload)}
            onCancel={() => setEditingContact(false)}
          />
        </DialogContent>
      </Dialog>

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
