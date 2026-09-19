import {
  Avatar,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import {
  Building2,
  Calendar,
  Check,
  Download,
  Eye,
  EyeOff,
  FlaskConical,
  Link2,
  Phone,
  Search,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { adminApi } from '@/modules/admin/api/adminApi';
import {
  formatAdminAssociatedSpaces,
  formatAdminOnboardingStatus,
  formatAdminUserName,
  formatAdminUserRole,
} from '@/modules/admin/utils/adminLabels';
import { ROUTES, adminRegisteredUserDetailPath } from '@/routes/paths';
import { getErrorMessage } from '@/shared/api/errors';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import type {
  AdminActiveSpace,
  AdminRegisteredUser,
  AdminRegisteredUsersSummary,
  AdminUserOnboardingStatus,
  AdminUserSelectedRole,
} from '@/shared/types/admin';
import type { MembershipRole, SpaceType } from '@/shared/types/space';

const PAGE_SIZE = 8;
const MOBILE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SPACE_ROLES: MembershipRole[] = ['OWNER', 'MANAGER', 'TENANT', 'CUSTOMER', 'STAFF'];
const SPACE_TYPES: SpaceType[] = ['PG', 'MESS', 'HOSTEL', 'CO_LIVING', 'RENTAL'];

type SortDir = 'asc' | 'desc';
type DeleteTarget = { kind: 'one' | 'bulk'; ids: string[] };

type CreateForm = {
  fullName: string;
  mobileNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  spaceRole: MembershipRole | '';
  spaceId: string;
  spaceName: string;
  spaceType: SpaceType | '';
};

type CreateFormErrors = Partial<Record<keyof CreateForm, string>>;

const EMPTY_CREATE_FORM: CreateForm = {
  fullName: '',
  mobileNumber: '',
  email: '',
  password: '',
  confirmPassword: '',
  spaceRole: '',
  spaceId: '',
  spaceName: '',
  spaceType: 'PG',
};

function initials(name?: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed || trimmed.toLowerCase() === 'user') return 'U';
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'U';
}

function formatRegistered(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  };
}

function roleChipSx(role: string): { bgcolor: string; color: string } {
  if (role === 'OWNER') return { bgcolor: '#FFEDD5', color: '#C2410C' };
  if (role === 'MEMBER') return { bgcolor: '#F3E8FF', color: '#7C3AED' };
  if (role === 'OWNER_AND_MEMBER') return { bgcolor: '#DBEAFE', color: '#1D4ED8' };
  return { bgcolor: '#F1F5F9', color: '#64748B' };
}

function exportCsv(rows: AdminRegisteredUser[]) {
  const header = [
    'ID',
    'Name',
    'Email',
    'Phone',
    'Verified',
    'Role',
    'Onboarding',
    'Registered At',
    'Spaces',
    'Test User',
  ];
  const lines = rows.map((row) =>
    [
      row.id,
      formatAdminUserName(row.fullName),
      row.email || '',
      row.mobileNumber,
      row.mobileVerified ? 'Yes' : 'No',
      row.selectedRole,
      row.onboardingStatus,
      row.registeredAt,
      formatAdminAssociatedSpaces(row.spaces),
      row.testUser ? 'Yes' : 'No',
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(','),
  );
  const blob = new Blob([[header.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `acomi-registered-users-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminRegisteredUsersPage() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState<AdminRegisteredUser[]>([]);
  const [summary, setSummary] = useState<AdminRegisteredUsersSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE_FORM);
  const [createErrors, setCreateErrors] = useState<CreateFormErrors>({});
  const [creating, setCreating] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showCreateConfirmPassword, setShowCreateConfirmPassword] = useState(false);
  const [activeSpaces, setActiveSpaces] = useState<AdminActiveSpace[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [role, setRole] = useState<AdminUserSelectedRole | ''>('');
  const [onboarding, setOnboarding] = useState<AdminUserOnboardingStatus | ''>('');
  const [spaceAssociation, setSpaceAssociation] = useState<'' | 'WITH_SPACE' | 'WITHOUT_SPACE'>('');
  const [verified, setVerified] = useState<boolean | null>(null);
  const [registeredFrom, setRegisteredFrom] = useState('');
  const [registeredTo, setRegisteredTo] = useState('');
  const [activeStat, setActiveStat] = useState<'total' | 'verified' | 'new' | 'spaces' | null>(null);

  const filterKey = `${debouncedQ}|${role}|${onboarding}|${spaceAssociation}|${verified}|${registeredFrom}|${registeredTo}`;
  const [activeFilterKey, setActiveFilterKey] = useState(filterKey);
  if (activeFilterKey !== filterKey) {
    setActiveFilterKey(filterKey);
    setPage(0);
    setSelected(new Set());
  }

  const requestKey = `${page}|${filterKey}|${sortDir}`;
  const [activeRequestKey, setActiveRequestKey] = useState(requestKey);
  if (activeRequestKey !== requestKey) {
    setActiveRequestKey(requestKey);
    setLoading(true);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadSummary = useCallback(() => {
    void adminApi.getRegisteredUsersSummary().then(setSummary).catch(() => setSummary(null));
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    let active = true;
    void adminApi
      .listRegisteredUsers({
        q: debouncedQ || undefined,
        role: role || undefined,
        onboarding: onboarding || undefined,
        spaceAssociation: spaceAssociation || undefined,
        verified: verified === null ? undefined : verified,
        from: registeredFrom || undefined,
        to: registeredTo || undefined,
        page,
        size: PAGE_SIZE,
      })
      .then((result) => {
        if (!active) return;
        const content = [...result.content];
        content.sort((a, b) => {
          const diff = new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
          return sortDir === 'asc' ? diff : -diff;
        });
        setUsers(content);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
      })
      .catch((err) => {
        if (!active) return;
        setUsers([]);
        setTotalPages(0);
        setTotalElements(0);
        enqueueSnackbar(getErrorMessage(err, t('admin.users.loadFailed')), { variant: 'error' });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    debouncedQ,
    enqueueSnackbar,
    onboarding,
    page,
    registeredFrom,
    registeredTo,
    role,
    sortDir,
    spaceAssociation,
    t,
    verified,
  ]);

  const stats = useMemo(
    () => [
      {
        key: 'total',
        label: t('admin.users.stats.total'),
        value: summary?.totalUsers ?? 0,
        delta: summary?.totalUsersDeltaPercent,
        hint: t('admin.users.stats.vsLast30'),
        icon: Users,
        bg: '#DCFCE7',
        fg: '#16A34A',
      },
      {
        key: 'verified',
        label: t('admin.users.stats.verified'),
        value: summary?.verifiedUsers ?? 0,
        delta: summary?.verifiedUsersDeltaPercent,
        hint: t('admin.users.stats.vsLast30'),
        icon: Phone,
        bg: '#CCFBF1',
        fg: '#0F766E',
      },
      {
        key: 'new',
        label: t('admin.users.stats.new30'),
        value: summary?.newUsersLast30Days ?? 0,
        delta: summary?.newUsersDeltaPercent,
        hint: t('admin.users.stats.vsPrev30'),
        icon: UserPlus,
        bg: '#F3E8FF',
        fg: '#7C3AED',
      },
      {
        key: 'spaces',
        label: t('admin.users.stats.withSpace'),
        value: summary?.withSpaceAssociation ?? 0,
        delta: summary?.withSpaceDeltaPercent,
        hint: t('admin.users.stats.withSpaceHint'),
        icon: Building2,
        bg: '#DBEAFE',
        fg: '#2563EB',
      },
    ],
    [summary, t],
  );

  const allSelected = users.length > 0 && users.every((user) => selected.has(user.id));
  const selectedCount = selected.size;
  const showingFrom = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min((page + 1) * PAGE_SIZE, totalElements);

  function clearFilters() {
    setSearchInput('');
    setDebouncedQ('');
    setRole('');
    setOnboarding('');
    setSpaceAssociation('');
    setVerified(null);
    setRegisteredFrom('');
    setRegisteredTo('');
    setActiveStat(null);
  }

  function isoDate(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function applyStatFilter(key: 'total' | 'verified' | 'new' | 'spaces') {
    setSearchInput('');
    setDebouncedQ('');
    setRole('');
    setOnboarding('');
    setPage(0);
    setSelected(new Set());

    if (activeStat === key) {
      clearFilters();
      return;
    }

    setActiveStat(key);
    if (key === 'total') {
      setVerified(null);
      setSpaceAssociation('');
      setRegisteredFrom('');
      setRegisteredTo('');
      return;
    }
    if (key === 'verified') {
      setVerified(true);
      setSpaceAssociation('');
      setRegisteredFrom('');
      setRegisteredTo('');
      return;
    }
    if (key === 'new') {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 30);
      setVerified(null);
      setSpaceAssociation('');
      setRegisteredFrom(isoDate(from));
      setRegisteredTo(isoDate(to));
      return;
    }
    setVerified(null);
    setSpaceAssociation('WITH_SPACE');
    setRegisteredFrom('');
    setRegisteredTo('');
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(users.map((u) => u.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.kind === 'one') {
        const id = deleteTarget.ids[0];
        if (!id) return;
        await adminApi.deleteRegisteredUser(id);
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setTotalElements((n) => Math.max(0, n - 1));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        loadSummary();
        enqueueSnackbar(t('admin.users.deleted'), { variant: 'success' });
      } else {
        const ids = deleteTarget.ids;
        const results = await Promise.allSettled(ids.map((id) => adminApi.deleteRegisteredUser(id)));
        const okIds = ids.filter((_, i) => results[i]?.status === 'fulfilled');
        const failed = ids.length - okIds.length;
        if (okIds.length > 0) {
          const removed = new Set(okIds);
          setUsers((prev) => prev.filter((u) => !removed.has(u.id)));
          setTotalElements((n) => Math.max(0, n - okIds.length));
          setSelected(new Set());
          loadSummary();
        }
        if (failed === 0) {
          enqueueSnackbar(t('admin.users.bulkDeleted', { count: okIds.length }), {
            variant: 'success',
          });
        } else if (okIds.length === 0) {
          enqueueSnackbar(t('admin.users.bulkDeleteFailed'), { variant: 'error' });
        } else {
          enqueueSnackbar(
            t('admin.users.bulkDeletePartial', { deleted: okIds.length, failed }),
            { variant: 'warning' },
          );
        }
      }
      setDeleteTarget(null);
    } catch {
      enqueueSnackbar(t('admin.users.deleteFailed'), { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  async function handleExport() {
    try {
      const result = await adminApi.listRegisteredUsers({
        q: debouncedQ || undefined,
        role: role || undefined,
        onboarding: onboarding || undefined,
        spaceAssociation: spaceAssociation || undefined,
        verified: verified === null ? undefined : verified,
        from: registeredFrom || undefined,
        to: registeredTo || undefined,
        page: 0,
        size: 100,
      });
      exportCsv(result.content);
    } catch {
      exportCsv(users);
    }
  }

  function openCreateDialog() {
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateErrors({});
    setShowCreatePassword(false);
    setShowCreateConfirmPassword(false);
    setCreateOpen(true);
    setLoadingSpaces(true);
    void adminApi
      .listActiveSpaces()
      .then((spaces) => setActiveSpaces(spaces))
      .catch((err) => {
        setActiveSpaces([]);
        enqueueSnackbar(getErrorMessage(err, t('admin.users.createTestUserFailed')), {
          variant: 'error',
        });
      })
      .finally(() => setLoadingSpaces(false));
  }

  function closeCreateDialog() {
    if (creating) return;
    setCreateOpen(false);
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateErrors({});
    setShowCreatePassword(false);
    setShowCreateConfirmPassword(false);
  }

  function validateCreateForm(): CreateFormErrors {
    const next: CreateFormErrors = {};
    if (!createForm.fullName.trim()) {
      next.fullName = t('admin.users.createTestUserErrors.fullName');
    }
    if (!MOBILE_RE.test(createForm.mobileNumber.trim())) {
      next.mobileNumber = t('admin.users.createTestUserErrors.mobile');
    }
    const email = createForm.email.trim();
    if (email && !EMAIL_RE.test(email)) {
      next.email = t('admin.users.createTestUserErrors.email');
    }
    if (createForm.password.length < 8 || createForm.password.length > 72) {
      next.password = t('admin.users.createTestUserErrors.password');
    }
    if (!createForm.confirmPassword) {
      next.confirmPassword = t('admin.users.createTestUserErrors.confirmPassword');
    } else if (createForm.password !== createForm.confirmPassword) {
      next.confirmPassword = t('admin.users.createTestUserErrors.passwordMismatch');
    }
    if (!createForm.spaceRole) {
      next.spaceRole = t('admin.users.createTestUserErrors.spaceRole');
    } else if (createForm.spaceRole === 'OWNER') {
      if (!createForm.spaceType) {
        next.spaceType = t('admin.users.createTestUserErrors.spaceType');
      }
    }
    return next;
  }

  async function handleCreateTestUser() {
    const errors = validateCreateForm();
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!createForm.spaceRole) return;

    setCreating(true);
    try {
      const email = createForm.email.trim();
      const isOwner = createForm.spaceRole === 'OWNER';
      const created = await adminApi.createRegisteredUser({
        fullName: createForm.fullName.trim(),
        mobileNumber: createForm.mobileNumber.trim(),
        email: email || undefined,
        password: createForm.password,
        confirmPassword: createForm.confirmPassword,
        spaceRole: createForm.spaceRole,
        spaceId: isOwner ? undefined : createForm.spaceId || undefined,
        spaceName: isOwner && createForm.spaceName.trim() ? createForm.spaceName.trim() : undefined,
        spaceType: isOwner ? (createForm.spaceType as SpaceType) : undefined,
      });
      setUsers((prev) => [created, ...prev.filter((u) => u.id !== created.id)]);
      setTotalElements((n) => n + 1);
      loadSummary();
      enqueueSnackbar(t('admin.users.createTestUserSuccess'), { variant: 'success' });
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE_FORM);
      setCreateErrors({});
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, t('admin.users.createTestUserFailed')), {
        variant: 'error',
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'flex-start' } }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: 26, md: 30 }, letterSpacing: -0.5 }}>
            {t('admin.users.title')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5, maxWidth: 640 }}>
            {t('admin.users.hint')}
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ flexShrink: 0 }}>
          <Button
            variant="outlined"
            startIcon={<Download size={16} />}
            onClick={() => void handleExport()}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderColor: '#22C55E',
              color: '#15803D',
              borderRadius: '10px',
              '&:hover': { borderColor: '#16A34A', bgcolor: '#F0FDF4' },
            }}>
            {t('admin.users.export')}
          </Button>
          <Button
            variant="contained"
            startIcon={<FlaskConical size={16} />}
            onClick={openCreateDialog}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#0F766E',
              borderRadius: '10px',
              '&:hover': { bgcolor: '#0D9488' },
            }}>
            {t('admin.users.createTestUser')}
          </Button>
          <Button
            variant="contained"
            startIcon={<Link2 size={16} />}
            component={RouterLink}
            to={ROUTES.register}
            target="_blank"
            rel="noreferrer"
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#22C55E',
              borderRadius: '10px',
              '&:hover': { bgcolor: '#16A34A' },
            }}>
            {t('admin.users.invite')}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {stats.map((stat) => {
          const positive = (stat.delta ?? 0) > 0;
          const negative = (stat.delta ?? 0) < 0;
          const selected = activeStat === stat.key;
          return (
            <Grid key={stat.key} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                role="button"
                tabIndex={0}
                onClick={() => applyStatFilter(stat.key as 'total' | 'verified' | 'new' | 'spaces')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    applyStatFilter(stat.key as 'total' | 'verified' | 'new' | 'spaces');
                  }
                }}
                sx={{
                  borderRadius: '14px',
                  border: '1px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                  boxShadow: selected
                    ? '0 0 0 2px rgb(15 118 110 / 0.2)'
                    : '0 1px 2px rgb(15 23 42 / 0.04), 0 4px 12px rgb(15 23 42 / 0.04)',
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        bgcolor: stat.bg,
                        color: stat.fg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                      <stat.icon size={18} />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                        {stat.label}
                      </Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: 26, lineHeight: 1.1, my: 0.5 }}>
                        {stat.value}
                      </Typography>
                      {typeof stat.delta === 'number' ? (
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: positive ? '#16A34A' : negative ? '#DC2626' : 'text.secondary',
                          }}>
                          {positive ? '↑' : negative ? '↓' : '→'} {positive ? '+' : ''}
                          {Math.abs(stat.delta).toFixed(0)}% {stat.hint}
                        </Typography>
                      ) : (
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{stat.hint}</Typography>
                      )}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Card
        elevation={0}
        sx={{
          mb: 2,
          borderRadius: '14px',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 2px rgb(15 23 42 / 0.04)',
        }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={1.25}
            sx={{ alignItems: { xs: 'stretch', lg: 'center' } }}>
            <TextField
              size="small"
              fullWidth
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setActiveStat(null);
              }}
              placeholder={t('admin.users.searchPlaceholder')}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color="#94A3B8" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                displayEmpty
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as AdminUserSelectedRole | '');
                  setActiveStat(null);
                }}
                sx={{ borderRadius: '10px' }}>
                <MenuItem value="">{t('admin.users.filters.allRoles')}</MenuItem>
                <MenuItem value="OWNER">{t('admin.labels.owner')}</MenuItem>
                <MenuItem value="MEMBER">{t('admin.labels.member')}</MenuItem>
                <MenuItem value="OWNER_AND_MEMBER">{t('admin.labels.ownerAndMember')}</MenuItem>
                <MenuItem value="NOT_SELECTED">{t('admin.labels.notSelected')}</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <Select
                displayEmpty
                value={onboarding}
                onChange={(e) => {
                  setOnboarding(e.target.value as AdminUserOnboardingStatus | '');
                  setActiveStat(null);
                }}
                sx={{ borderRadius: '10px' }}>
                <MenuItem value="">{t('admin.users.filters.allOnboarding')}</MenuItem>
                <MenuItem value="COMPLETE">{t('admin.labels.complete')}</MenuItem>
                <MenuItem value="INCOMPLETE">{t('admin.labels.incomplete')}</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <Select
                displayEmpty
                value={spaceAssociation}
                onChange={(e) => {
                  setSpaceAssociation(e.target.value as '' | 'WITH_SPACE' | 'WITHOUT_SPACE');
                  setActiveStat(null);
                }}
                sx={{ borderRadius: '10px' }}>
                <MenuItem value="">{t('admin.users.filters.allSpace')}</MenuItem>
                <MenuItem value="WITH_SPACE">{t('admin.users.filters.withSpace')}</MenuItem>
                <MenuItem value="WITHOUT_SPACE">{t('admin.users.filters.withoutSpace')}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              type="date"
              value={registeredFrom && registeredFrom === registeredTo ? registeredFrom : ''}
              onChange={(e) => {
                const value = e.target.value;
                setRegisteredFrom(value);
                setRegisteredTo(value);
                setActiveStat(null);
              }}
              label={t('admin.users.filters.registeredDate')}
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Calendar size={15} color="#94A3B8" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                minWidth: { xs: '100%', lg: 190 },
                '& .MuiOutlinedInput-root': { borderRadius: '10px' },
              }}
            />
            <Button
              onClick={clearFilters}
              variant="outlined"
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                color: 'text.secondary',
                borderColor: 'divider',
                borderRadius: '10px',
                minWidth: 72,
              }}>
              {t('admin.users.filters.clear')}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {selectedCount > 0 ? (
        <Card
          elevation={0}
          sx={{
            mb: 2,
            borderRadius: '14px',
            border: '1px solid #FECACA',
            bgcolor: '#FEF2F2',
            boxShadow: '0 1px 2px rgb(15 23 42 / 0.04)',
          }}>
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.25}
              sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 700, color: '#991B1B' }}>
                {t('admin.common.selectedCount', { count: selectedCount })}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={() => setSelected(new Set())}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
                  {t('admin.common.clearSelection')}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Trash2 size={16} />}
                  onClick={() => setDeleteTarget({ kind: 'bulk', ids: Array.from(selected) })}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
                  {t('admin.common.bulkDelete', { count: selectedCount })}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ) : null}

      <Card
        elevation={0}
        sx={{
          borderRadius: '14px',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 2px rgb(15 23 42 / 0.04), 0 4px 12px rgb(15 23 42 / 0.04)',
          overflow: 'hidden',
        }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1120 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#FAFBFC' }}>
                <TableCell padding="checkbox">
                  <Checkbox checked={allSelected} onChange={toggleAll} />
                </TableCell>
                <TableCell sx={{ fontWeight: 700, width: 48 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.users.columns.user')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.users.columns.phone')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.users.columns.verified')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.users.columns.role')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.users.columns.onboarding')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  <TableSortLabel
                    active
                    direction={sortDir}
                    onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}>
                    {t('admin.users.columns.registered')}
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.users.columns.space')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.common.testUser')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.users.columns.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11}>
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      {t('common.loading')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11}>
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      {t('admin.users.empty')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user, index) => {
                  const registered = formatRegistered(user.registeredAt);
                  const name = formatAdminUserName(user.fullName);
                  const roleSx = roleChipSx(user.selectedRole);
                  const complete = user.onboardingStatus === 'COMPLETE';
                  return (
                    <TableRow key={user.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected.has(user.id)}
                          onChange={() => toggleOne(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                          {page * PAGE_SIZE + index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: '#DBEAFE',
                              color: '#1D4ED8',
                              fontSize: 12,
                              fontWeight: 800,
                            }}>
                            {initials(user.fullName)}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 14 }} noWrap>
                              {name}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>
                              {user.email || t('admin.labels.emDash')}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13.5 }}>{user.mobileNumber}</Typography>
                      </TableCell>
                      <TableCell>
                        {user.mobileVerified ? (
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              px: 1,
                              py: 0.35,
                              borderRadius: '999px',
                              bgcolor: '#DCFCE7',
                              color: '#15803D',
                              fontSize: 12,
                              fontWeight: 700,
                            }}>
                            <Check size={12} />
                            {t('admin.labels.verified')}
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              display: 'inline-flex',
                              px: 1,
                              py: 0.35,
                              borderRadius: '999px',
                              bgcolor: '#F1F5F9',
                              color: '#64748B',
                              fontSize: 12,
                              fontWeight: 700,
                            }}>
                            {t('admin.labels.notVerified')}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            px: 1.25,
                            py: 0.35,
                            borderRadius: '999px',
                            fontSize: 12,
                            fontWeight: 700,
                            ...roleSx,
                          }}>
                          {formatAdminUserRole(user.selectedRole)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            px: 1.25,
                            py: 0.35,
                            borderRadius: '999px',
                            fontSize: 12,
                            fontWeight: 700,
                            bgcolor: complete ? '#DCFCE7' : '#FEE2E2',
                            color: complete ? '#15803D' : '#B91C1C',
                          }}>
                          {formatAdminOnboardingStatus(user.onboardingStatus)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{registered.date}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                          {registered.time}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary', maxWidth: 180 }} noWrap>
                          {formatAdminAssociatedSpaces(user.spaces)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {user.testUser ? (
                          <Box
                            sx={{
                              display: 'inline-flex',
                              px: 1.25,
                              py: 0.35,
                              borderRadius: '999px',
                              bgcolor: '#EF4444',
                              color: '#FFFFFF',
                              fontSize: 12,
                              fontWeight: 700,
                            }}>
                            {t('admin.common.yes')}
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                            {t('admin.labels.emDash')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                          <Button
                            component={RouterLink}
                            to={adminRegisteredUserDetailPath(user.id)}
                            size="small"
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              color: '#15803D',
                              bgcolor: '#DCFCE7',
                              borderRadius: '8px',
                              px: 1.75,
                              minWidth: 0,
                              '&:hover': { bgcolor: '#BBF7D0' },
                            }}>
                            {t('admin.users.view')}
                          </Button>
                          <Button
                            size="small"
                            onClick={() => setDeleteTarget({ kind: 'one', ids: [user.id] })}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              color: '#B91C1C',
                              bgcolor: '#FEE2E2',
                              borderRadius: '8px',
                              px: 1.5,
                              minWidth: 0,
                              '&:hover': { bgcolor: '#FECACA' },
                            }}>
                            {t('admin.common.delete')}
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{
            px: 2,
            py: 1.75,
            borderTop: '1px solid',
            borderColor: 'divider',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            {t('admin.users.showing', {
              from: showingFrom,
              to: showingTo,
              total: totalElements,
            })}
          </Typography>
          {totalPages > 1 ? (
            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={(_, value) => setPage(value - 1)}
              color="primary"
              shape="rounded"
              sx={{
                '& .Mui-selected': {
                  bgcolor: '#22C55E !important',
                  color: '#FFFFFF',
                },
              }}
            />
          ) : null}
        </Stack>
      </Card>

      <Dialog open={createOpen} onClose={closeCreateDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>{t('admin.users.createTestUserTitle')}</DialogTitle>
        <DialogContent sx={{ overflowY: 'auto', maxHeight: 'min(70vh, 640px)' }}>
          <Typography sx={{ color: 'text.secondary', mb: 2, mt: 0.5 }}>
            {t('admin.users.createTestUserHint')}
          </Typography>
          <Stack spacing={1.75}>
            <TextField
              label={t('admin.users.createTestUserFields.fullName')}
              value={createForm.fullName}
              onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))}
              error={Boolean(createErrors.fullName)}
              helperText={createErrors.fullName}
              fullWidth
              autoFocus
            />
            <TextField
              label={t('admin.users.createTestUserFields.mobile')}
              value={createForm.mobileNumber}
              onChange={(e) =>
                setCreateForm((f) => ({
                  ...f,
                  mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                }))
              }
              error={Boolean(createErrors.mobileNumber)}
              helperText={createErrors.mobileNumber}
              fullWidth
              slotProps={{
                htmlInput: { inputMode: 'numeric', maxLength: 10 },
              }}
            />
            <TextField
              label={t('admin.users.createTestUserFields.email')}
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              error={Boolean(createErrors.email)}
              helperText={createErrors.email}
              fullWidth
            />
            <TextField
              type={showCreatePassword ? 'text' : 'password'}
              label={t('admin.users.createTestUserFields.password')}
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              error={Boolean(createErrors.password)}
              helperText={createErrors.password}
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
                          showCreatePassword ? t('auth.password.hide') : t('auth.password.show')
                        }
                        onClick={() => setShowCreatePassword((v) => !v)}
                        disabled={creating}>
                        {showCreatePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              type={showCreateConfirmPassword ? 'text' : 'password'}
              label={t('admin.users.createTestUserFields.confirmPassword')}
              value={createForm.confirmPassword}
              onChange={(e) => setCreateForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              error={Boolean(createErrors.confirmPassword)}
              helperText={createErrors.confirmPassword}
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
                          showCreateConfirmPassword
                            ? t('auth.password.hide')
                            : t('auth.password.show')
                        }
                        onClick={() => setShowCreateConfirmPassword((v) => !v)}
                        disabled={creating}>
                        {showCreateConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              select
              label={t('admin.users.createTestUserFields.spaceRole')}
              value={createForm.spaceRole}
              onChange={(e) => {
                const nextRole = e.target.value as MembershipRole | '';
                setCreateForm((f) => ({
                  ...f,
                  spaceRole: nextRole,
                  spaceId: nextRole === 'OWNER' ? '' : f.spaceId,
                  spaceType: nextRole === 'OWNER' ? f.spaceType || 'PG' : f.spaceType,
                }));
              }}
              error={Boolean(createErrors.spaceRole)}
                helperText={
                  createErrors.spaceRole || t('admin.users.createTestUserFields.spaceRoleHint')
                }
                fullWidth>
              <MenuItem value="" disabled>
                {t('admin.users.createTestUserFields.spaceRolePlaceholder')}
              </MenuItem>
              {SPACE_ROLES.map((roleOption) => (
                <MenuItem key={roleOption} value={roleOption}>
                  {t(`admin.users.createTestUserRoles.${roleOption}`)}
                </MenuItem>
              ))}
            </TextField>
            {createForm.spaceRole === 'OWNER' ? (
              <>
                <TextField
                  select
                  label={t('admin.users.createTestUserFields.spaceType')}
                  value={createForm.spaceType}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      spaceType: e.target.value as SpaceType | '',
                    }))
                  }
                  error={Boolean(createErrors.spaceType)}
                  helperText={createErrors.spaceType}
                  fullWidth>
                  {SPACE_TYPES.map((typeOption) => (
                    <MenuItem key={typeOption} value={typeOption}>
                      {t(`admin.users.createTestUserSpaceTypes.${typeOption}`)}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label={t('admin.users.createTestUserFields.spaceName')}
                  value={createForm.spaceName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, spaceName: e.target.value }))}
                  helperText={t('admin.users.createTestUserFields.spaceNameHint')}
                  fullWidth
                />
              </>
            ) : createForm.spaceRole ? (
              <Autocomplete
                options={activeSpaces}
                loading={loadingSpaces}
                disabled={creating}
                value={activeSpaces.find((s) => s.id === createForm.spaceId) ?? null}
                onChange={(_, next) =>
                  setCreateForm((f) => ({ ...f, spaceId: next?.id ?? '' }))
                }
                getOptionLabel={(option) =>
                  `${option.name} (${option.type}) · ${option.ownerName}`
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('admin.users.createTestUserFields.space')}
                    error={Boolean(createErrors.spaceId)}
                    helperText={
                      createErrors.spaceId || t('admin.users.createTestUserFields.spaceOptionalHint')
                    }
                  />
                )}
              />
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeCreateDialog} disabled={creating} sx={{ textTransform: 'none' }}>
            {t('admin.common.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={creating}
            onClick={() => void handleCreateTestUser()}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#0F766E',
              '&:hover': { bgcolor: '#0D9488' },
            }}>
            {creating ? t('admin.common.saving') : t('admin.users.createTestUser')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget != null}
        title={
          deleteTarget?.kind === 'bulk'
            ? t('admin.users.bulkDeleteTitle')
            : t('admin.users.deleteTitle')
        }
        description={
          deleteTarget
            ? deleteTarget.kind === 'bulk'
              ? t('admin.users.bulkDeleteMessage', { count: deleteTarget.ids.length })
              : t('admin.users.deleteMessage', {
                  name:
                    formatAdminUserName(
                      users.find((u) => u.id === deleteTarget.ids[0])?.fullName,
                    ) || deleteTarget.ids[0],
                })
            : undefined
        }
        confirmLabel={t('admin.common.delete')}
        cancelLabel={t('admin.common.cancel')}
        destructive
        confirming={deleting}
        onConfirm={() => void handleDeleteConfirm()}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
