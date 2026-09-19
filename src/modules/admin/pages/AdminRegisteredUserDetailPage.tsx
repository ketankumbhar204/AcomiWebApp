import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Activity,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChefHat,
  Clock3,
  Copy,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  LayoutDashboard,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  StickyNote,
  Trash2,
  User,
  UserPlus,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '@/modules/admin/api/adminApi';
import { AdminTestLeadOption } from '@/modules/admin/components/AdminTestLeadOption';
import {
  formatAdminAssociatedSpaces,
  formatAdminDate,
  formatAdminOnboardingStatus,
  formatAdminUserName,
  formatAdminUserRole,
} from '@/modules/admin/utils/adminLabels';
import { ROUTES } from '@/routes/paths';
import { getErrorMessage } from '@/shared/api/errors';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import type { AdminRegisteredUser } from '@/shared/types/admin';

const MOBILE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type DetailSection =
  | 'overview'
  | 'enquiries'
  | 'properties'
  | 'mess'
  | 'addresses'
  | 'activity';

type EditForm = {
  fullName: string;
  mobileNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type EditFormErrors = Partial<Record<keyof EditForm, string>>;

function displayUserCode(id: string): string {
  const compact = id.replace(/-/g, '').slice(-6).toUpperCase();
  return `#USR-${compact}`;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${date}, ${time}`;
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: 'neutral' | 'successSolid' | 'successSoft' | 'warning' | 'danger';
}) {
  const tones = {
    neutral: { bgcolor: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' },
    successSolid: { bgcolor: '#15803D', color: '#FFFFFF', border: '1px solid #15803D' },
    successSoft: { bgcolor: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0' },
    warning: { bgcolor: '#FFEDD5', color: '#C2410C', border: '1px solid #FED7AA' },
    danger: { bgcolor: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' },
  } as const;
  return (
    <Box
      sx={{
        display: 'inline-flex',
        px: 1.25,
        py: 0.35,
        borderRadius: '999px',
        fontSize: 12,
        fontWeight: 700,
        ...tones[tone],
      }}>
      {label}
    </Box>
  );
}

function InfoTile({
  icon,
  label,
  value,
  badge,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          bgcolor: '#DBEAFE',
          color: '#2563EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
          {label}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.35, flexWrap: 'wrap' }} useFlexGap>
          <Typography sx={{ fontWeight: 700, fontSize: 15, wordBreak: 'break-word' }}>
            {value}
          </Typography>
          {badge}
        </Stack>
      </Box>
    </Stack>
  );
}

export function AdminRegisteredUserDetailPage() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const [user, setUser] = useState<AdminRegisteredUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [section, setSection] = useState<DetailSection>('overview');
  const [activeId, setActiveId] = useState(id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingTestFlag, setSavingTestFlag] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    fullName: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [editErrors, setEditErrors] = useState<EditFormErrors>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);

  if (activeId !== id) {
    setActiveId(id);
    setLoading(true);
    setError(false);
    setUser(null);
    setSection('overview');
  }

  useEffect(() => {
    let cancelled = false;
    void adminApi
      .getRegisteredUser(id)
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const name = formatAdminUserName(user?.fullName);
  const propertySpaces = useMemo(
    () => (user?.spaces ?? []).filter((s) => s.type !== 'MESS'),
    [user],
  );
  const messSpaces = useMemo(
    () => (user?.spaces ?? []).filter((s) => s.type === 'MESS'),
    [user],
  );

  async function copyUserId() {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.id);
      enqueueSnackbar(t('admin.users.detail.idCopied'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('admin.users.detail.idCopyFailed'), { variant: 'error' });
    }
  }

  async function handleTestUserChange(checked: boolean) {
    if (!user) return;
    setSavingTestFlag(true);
    try {
      const updated = await adminApi.setRegisteredUserTestFlag(user.id, checked);
      setUser(updated);
      enqueueSnackbar(t('admin.users.detail.testUserUpdated'), { variant: 'success' });
    } catch {
      enqueueSnackbar(t('admin.users.detail.testUserUpdateFailed'), { variant: 'error' });
    } finally {
      setSavingTestFlag(false);
    }
  }

  function openEditDialog() {
    if (!user) return;
    setEditForm({
      fullName: user.fullName?.trim() || '',
      mobileNumber: user.mobileNumber,
      email: user.email?.trim() || '',
      password: '',
      confirmPassword: '',
    });
    setEditErrors({});
    setShowEditPassword(false);
    setShowEditConfirmPassword(false);
    setEditOpen(true);
  }

  function closeEditDialog() {
    if (savingEdit) return;
    setEditOpen(false);
  }

  function validateEditForm(): EditFormErrors {
    const next: EditFormErrors = {};
    if (!editForm.fullName.trim()) {
      next.fullName = t('admin.users.detail.editErrors.fullName');
    }
    if (!MOBILE_RE.test(editForm.mobileNumber.trim())) {
      next.mobileNumber = t('admin.users.detail.editErrors.mobile');
    }
    const email = editForm.email.trim();
    if (email && !EMAIL_RE.test(email)) {
      next.email = t('admin.users.detail.editErrors.email');
    }
    if (editForm.password || editForm.confirmPassword) {
      if (editForm.password.length < 8 || editForm.password.length > 72) {
        next.password = t('admin.users.detail.editErrors.password');
      }
      if (!editForm.confirmPassword) {
        next.confirmPassword = t('admin.users.detail.editErrors.confirmPassword');
      } else if (editForm.password !== editForm.confirmPassword) {
        next.confirmPassword = t('admin.users.detail.editErrors.passwordMismatch');
      }
    }
    return next;
  }

  async function handleSaveEdit() {
    if (!user) return;
    const errors = validateEditForm();
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingEdit(true);
    try {
      const email = editForm.email.trim();
      const password = editForm.password;
      const updated = await adminApi.updateRegisteredUser(user.id, {
        fullName: editForm.fullName.trim(),
        mobileNumber: editForm.mobileNumber.trim(),
        email: email || undefined,
        ...(password
          ? { password, confirmPassword: editForm.confirmPassword }
          : {}),
      });
      setUser(updated);
      setEditOpen(false);
      enqueueSnackbar(t('admin.users.detail.editSuccess'), { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, t('admin.users.detail.editFailed')), {
        variant: 'error',
      });
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete() {
    if (!user) return;
    setDeleting(true);
    try {
      await adminApi.deleteRegisteredUser(user.id);
      enqueueSnackbar(t('admin.users.deleted'), { variant: 'success' });
      setConfirmDelete(false);
      navigate(ROUTES.adminRegisteredUsers);
    } catch {
      enqueueSnackbar(t('admin.users.deleteFailed'), { variant: 'error' });
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

  if (error || !user) {
    return (
      <Box>
        <Typography sx={{ fontWeight: 700, mb: 1 }}>{t('admin.users.detail.notFound')}</Typography>
        <Button
          component={RouterLink}
          to={ROUTES.adminRegisteredUsers}
          startIcon={<ArrowLeft size={16} />}
          sx={{ textTransform: 'none', fontWeight: 700, color: '#15803D' }}>
          {t('admin.users.detail.back')}
        </Button>
      </Box>
    );
  }

  const navItems: { id: DetailSection; label: string; icon: ReactNode }[] = [
    { id: 'overview', label: t('admin.users.detail.nav.overview'), icon: <User size={16} /> },
    { id: 'enquiries', label: t('admin.users.detail.nav.enquiries'), icon: <FileText size={16} /> },
    { id: 'properties', label: t('admin.users.detail.nav.properties'), icon: <Building2 size={16} /> },
    { id: 'mess', label: t('admin.users.detail.nav.mess'), icon: <ChefHat size={16} /> },
    { id: 'addresses', label: t('admin.users.detail.nav.addresses'), icon: <MapPin size={16} /> },
    { id: 'activity', label: t('admin.users.detail.nav.activity'), icon: <Activity size={16} /> },
  ];

  const emailHref = user.email ? `mailto:${user.email}` : undefined;
  const smsHref = user.mobileNumber ? `sms:+91${user.mobileNumber}` : undefined;

  return (
    <Box>
      <Button
        component={RouterLink}
        to={ROUTES.adminRegisteredUsers}
        startIcon={<ArrowLeft size={16} />}
        sx={{
          textTransform: 'none',
          fontWeight: 700,
          color: '#15803D',
          px: 0,
          mb: 2,
          '&:hover': { bgcolor: 'transparent', color: '#166534' },
        }}>
        {t('admin.users.detail.back')}
      </Button>

      <Grid container spacing={2.5} sx={{ alignItems: 'flex-start' }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{
              bgcolor: '#FFFFFF',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '14px',
              p: 2.25,
              boxShadow: '0 1px 2px rgb(15 23 42 / 0.04), 0 4px 12px rgb(15 23 42 / 0.04)',
            }}>
            <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  bgcolor: '#DBEAFE',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <User size={40} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.3 }}>
                  {name}
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.35 }}>
                  {displayUserCode(user.id)}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                <StatusPill label={formatAdminUserRole(user.selectedRole)} tone="neutral" />
                <StatusPill
                  label={user.mobileVerified ? t('admin.labels.verified') : t('admin.labels.notVerified')}
                  tone={user.mobileVerified ? 'successSolid' : 'neutral'}
                />
                <StatusPill
                  label={
                    user.active === false
                      ? t('admin.users.detail.inactive')
                      : t('admin.users.detail.active')
                  }
                  tone={user.active === false ? 'danger' : 'successSoft'}
                />
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mb: 2.25 }}>
              <Button
                fullWidth
                component={emailHref ? 'a' : 'button'}
                href={emailHref}
                disabled={!emailHref}
                startIcon={<Mail size={15} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: '10px',
                  border: '1px solid #93C5FD',
                  color: '#1D4ED8',
                  bgcolor: '#FFFFFF',
                  '&:hover': { bgcolor: '#EFF6FF', borderColor: '#3B82F6' },
                }}>
                {t('admin.users.detail.sendEmail')}
              </Button>
              <Button
                fullWidth
                component={smsHref ? 'a' : 'button'}
                href={smsHref}
                disabled={!smsHref}
                startIcon={<MessageSquare size={15} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: '10px',
                  bgcolor: '#22C55E',
                  color: '#FFFFFF',
                  '&:hover': { bgcolor: '#16A34A' },
                  '&.Mui-disabled': { bgcolor: '#BBF7D0', color: '#FFFFFF' },
                }}>
                {t('admin.users.detail.sendSms')}
              </Button>
            </Stack>

            <Stack spacing={0.5}>
              {navItems.map((item) => {
                const active = section === item.id;
                return (
                  <Button
                    key={item.id}
                    onClick={() => setSection(item.id)}
                    startIcon={item.icon}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: '10px',
                      px: 1.5,
                      py: 1,
                      color: active ? '#15803D' : 'text.secondary',
                      bgcolor: active ? '#DCFCE7' : 'transparent',
                      '&:hover': {
                        bgcolor: active ? '#BBF7D0' : '#F8FAFC',
                      },
                    }}>
                    {item.label}
                  </Button>
                );
              })}
            </Stack>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Box
            sx={{
              bgcolor: '#FFFFFF',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgb(15 23 42 / 0.04), 0 4px 12px rgb(15 23 42 / 0.04)',
            }}>
            {section === 'overview' ? (
              <>
                <Box sx={{ p: { xs: 2, md: 2.75 } }}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.5}
                    sx={{
                      mb: 2.5,
                      justifyContent: 'space-between',
                      alignItems: { xs: 'stretch', sm: 'flex-start' },
                    }}>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.4 }}>
                        {t('admin.users.detail.title')}
                      </Typography>
                      <Typography sx={{ color: 'text.secondary', mt: 0.35 }}>
                        {t('admin.users.detail.subtitle')}
                      </Typography>
                    </Box>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}>
                      <Button
                        startIcon={<Pencil size={15} />}
                        onClick={openEditDialog}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: '10px',
                          border: '1px solid #93C5FD',
                          color: '#1D4ED8',
                          bgcolor: '#FFFFFF',
                          '&:hover': { bgcolor: '#EFF6FF', borderColor: '#3B82F6' },
                        }}>
                        {t('admin.users.detail.editUser')}
                      </Button>
                      <Button
                        startIcon={<Trash2 size={15} />}
                        onClick={() => setConfirmDelete(true)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: '10px',
                          border: '1px solid #FECACA',
                          color: '#B91C1C',
                          bgcolor: '#FFFFFF',
                          '&:hover': { bgcolor: '#FEF2F2', borderColor: '#F87171' },
                        }}>
                        {t('admin.users.detail.deleteUser')}
                      </Button>
                    </Stack>
                  </Stack>

                  <Box sx={{ mb: 2.5 }}>
                    <AdminTestLeadOption
                      checked={Boolean(user.testUser)}
                      onChange={(checked) => {
                        if (!savingTestFlag) void handleTestUserChange(checked);
                      }}
                      titleKey="admin.testUser.title"
                      descriptionKey="admin.testUser.description"
                    />
                  </Box>

                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InfoTile
                        icon={<Phone size={18} />}
                        label={t('admin.users.detail.mobile')}
                        value={user.mobileNumber}
                        badge={
                          user.mobileVerified ? (
                            <StatusPill label={t('admin.labels.verified')} tone="successSoft" />
                          ) : (
                            <StatusPill label={t('admin.labels.notVerified')} tone="neutral" />
                          )
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InfoTile
                        icon={<Mail size={18} />}
                        label={t('admin.users.detail.email')}
                        value={user.email || t('admin.labels.emDash')}
                        badge={
                          user.email ? undefined : (
                            <StatusPill
                              label={t('admin.users.detail.notProvided')}
                              tone="danger"
                            />
                          )
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InfoTile
                        icon={<Calendar size={18} />}
                        label={t('admin.users.detail.registered')}
                        value={formatAdminDate(user.registeredAt)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InfoTile
                        icon={<ShieldCheck size={18} />}
                        label={t('admin.users.detail.verifiedAt')}
                        value={
                          user.mobileVerifiedAt
                            ? formatAdminDate(user.mobileVerifiedAt)
                            : t('admin.labels.emDash')
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InfoTile
                        icon={<LayoutDashboard size={18} />}
                        label={t('admin.users.detail.systemRole')}
                        value={user.systemRole || 'USER'}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InfoTile
                        icon={<UserPlus size={18} />}
                        label={t('admin.users.detail.onboarding')}
                        value={
                          <StatusPill
                            label={formatAdminOnboardingStatus(user.onboardingStatus)}
                            tone={user.onboardingStatus === 'COMPLETE' ? 'successSoft' : 'warning'}
                          />
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InfoTile
                        icon={<CheckCircle2 size={18} />}
                        label={t('admin.users.detail.profile')}
                        value={
                          <StatusPill
                            label={
                              user.profileCompleted
                                ? t('admin.labels.complete')
                                : t('admin.labels.incomplete')
                            }
                            tone={user.profileCompleted ? 'successSoft' : 'warning'}
                          />
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InfoTile
                        icon={<Building2 size={18} />}
                        label={t('admin.users.detail.spaces')}
                        value={formatAdminAssociatedSpaces(user.spaces)}
                      />
                    </Grid>
                  </Grid>

                  <Box
                    sx={{
                      mt: 3,
                      p: 2,
                      borderRadius: '12px',
                      bgcolor: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      display: 'flex',
                      gap: 1.5,
                      alignItems: { xs: 'stretch', sm: 'center' },
                      flexDirection: { xs: 'column', sm: 'row' },
                    }}>
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start', flex: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '10px',
                          bgcolor: '#DCFCE7',
                          color: '#15803D',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                        <StickyNote size={16} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, color: '#14532D' }}>
                          {t('admin.users.detail.notes')}
                        </Typography>
                        <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mt: 0.25 }}>
                          {t('admin.users.detail.notesEmpty')}
                        </Typography>
                      </Box>
                    </Stack>
                    <Button
                      startIcon={<Plus size={15} />}
                      onClick={() =>
                        enqueueSnackbar(t('admin.users.detail.notesUnavailable'), {
                          variant: 'info',
                        })
                      }
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        borderRadius: '10px',
                        border: '1px solid #86EFAC',
                        color: '#15803D',
                        bgcolor: '#FFFFFF',
                        alignSelf: { xs: 'stretch', sm: 'center' },
                        '&:hover': { bgcolor: '#DCFCE7', borderColor: '#22C55E' },
                      }}>
                      {t('admin.users.detail.addNote')}
                    </Button>
                  </Box>
                </Box>

                <Box
                  sx={{
                    px: { xs: 2, md: 2.75 },
                    py: 1.75,
                    bgcolor: '#F8FAFC',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                        <Clock3 size={15} color="#64748B" style={{ marginTop: 2 }} />
                        <Box>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary' }}>
                            {t('admin.users.detail.created')}
                          </Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                            {formatDateTime(user.registeredAt)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                        <RefreshCw size={15} color="#64748B" style={{ marginTop: 2 }} />
                        <Box>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary' }}>
                            {t('admin.users.detail.lastUpdated')}
                          </Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                            {formatDateTime(user.updatedAt || user.registeredAt)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                        <KeyRound size={15} color="#64748B" style={{ marginTop: 2 }} />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary' }}>
                            {t('admin.users.detail.userId')}
                          </Typography>
                          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                            <Typography
                              sx={{
                                fontSize: 12.5,
                                fontWeight: 600,
                                wordBreak: 'break-all',
                                fontFamily: 'ui-monospace, monospace',
                              }}>
                              {user.id}
                            </Typography>
                            <Tooltip title={t('admin.users.detail.copyId')}>
                              <IconButton size="small" onClick={() => void copyUserId()} sx={{ color: '#2563EB' }}>
                                <Copy size={14} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              </>
            ) : (
              <Box sx={{ p: { xs: 2, md: 2.75 } }}>
                <Typography sx={{ fontWeight: 800, fontSize: 24, letterSpacing: -0.4, mb: 0.5 }}>
                  {navItems.find((n) => n.id === section)?.label}
                </Typography>
                {section === 'properties' ? (
                  propertySpaces.length === 0 ? (
                    <Typography color="text.secondary" sx={{ mt: 2 }}>
                      {t('admin.users.detail.emptyProperties')}
                    </Typography>
                  ) : (
                    <Stack spacing={1} sx={{ mt: 2 }}>
                      {propertySpaces.map((space) => (
                        <Box
                          key={space.id}
                          sx={{
                            p: 1.5,
                            borderRadius: '10px',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}>
                          <Typography sx={{ fontWeight: 700 }}>{space.name}</Typography>
                          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                            {space.type} · {space.membershipRole}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )
                ) : section === 'mess' ? (
                  messSpaces.length === 0 ? (
                    <Typography color="text.secondary" sx={{ mt: 2 }}>
                      {t('admin.users.detail.emptyMess')}
                    </Typography>
                  ) : (
                    <Stack spacing={1} sx={{ mt: 2 }}>
                      {messSpaces.map((space) => (
                        <Box
                          key={space.id}
                          sx={{
                            p: 1.5,
                            borderRadius: '10px',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}>
                          <Typography sx={{ fontWeight: 700 }}>{space.name}</Typography>
                          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                            {space.type} · {space.membershipRole}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )
                ) : (
                  <Typography color="text.secondary" sx={{ mt: 2 }}>
                    {section === 'enquiries'
                      ? t('admin.users.detail.emptyEnquiries')
                      : section === 'addresses'
                        ? t('admin.users.detail.emptyAddresses')
                        : t('admin.users.detail.emptyActivity')}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      <Dialog open={editOpen} onClose={closeEditDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>{t('admin.users.detail.editTitle')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'text.secondary', mb: 2, mt: 0.5 }}>
            {t('admin.users.detail.editHint')}
          </Typography>
          <Stack spacing={1.75}>
            <TextField
              label={t('admin.users.detail.editFields.fullName')}
              value={editForm.fullName}
              onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
              error={Boolean(editErrors.fullName)}
              helperText={editErrors.fullName}
              fullWidth
              autoFocus
            />
            <TextField
              label={t('admin.users.detail.editFields.mobile')}
              value={editForm.mobileNumber}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                }))
              }
              error={Boolean(editErrors.mobileNumber)}
              helperText={editErrors.mobileNumber}
              fullWidth
              slotProps={{
                htmlInput: { inputMode: 'numeric', maxLength: 10 },
              }}
            />
            <TextField
              label={t('admin.users.detail.editFields.email')}
              value={editForm.email}
              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              error={Boolean(editErrors.email)}
              helperText={editErrors.email}
              fullWidth
            />
            <TextField
              type={showEditPassword ? 'text' : 'password'}
              label={t('admin.users.detail.editFields.password')}
              value={editForm.password}
              onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
              error={Boolean(editErrors.password)}
              helperText={editErrors.password || t('admin.users.detail.editFields.passwordHint')}
              fullWidth
              autoComplete="new-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        edge="end"
                        aria-label={
                          showEditPassword ? t('auth.password.hide') : t('auth.password.show')
                        }
                        onClick={() => setShowEditPassword((v) => !v)}
                        disabled={savingEdit}>
                        {showEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              type={showEditConfirmPassword ? 'text' : 'password'}
              label={t('admin.users.detail.editFields.confirmPassword')}
              value={editForm.confirmPassword}
              onChange={(e) => setEditForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              error={Boolean(editErrors.confirmPassword)}
              helperText={editErrors.confirmPassword}
              fullWidth
              autoComplete="new-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        edge="end"
                        aria-label={
                          showEditConfirmPassword
                            ? t('auth.password.hide')
                            : t('auth.password.show')
                        }
                        onClick={() => setShowEditConfirmPassword((v) => !v)}
                        disabled={savingEdit}>
                        {showEditConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeEditDialog} disabled={savingEdit} sx={{ textTransform: 'none' }}>
            {t('admin.common.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={savingEdit}
            onClick={() => void handleSaveEdit()}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#0F766E',
              '&:hover': { bgcolor: '#0D9488' },
            }}>
            {savingEdit ? t('admin.common.saving') : t('admin.users.detail.saveUser')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        title={t('admin.users.deleteTitle')}
        description={t('admin.users.deleteMessage', { name })}
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
