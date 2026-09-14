import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  CheckCircle2,
  FileText,
  Home,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Upload,
  User,
  Users,
} from 'lucide-react';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { adminApi } from '@/modules/admin/api/adminApi';
import {
  formatPropertyRegistrationSource,
} from '@/modules/admin/utils/adminLabels';
import { type AdminListTab } from '@/modules/admin/utils/adminListFilters';
import { discoverDefaultImageUrl } from '@/modules/onboarding/utils/discoverDefaultImages';
import {
  adminAddPropertyPath,
  adminBulkPropertyPath,
  adminPropertyDetailPath,
} from '@/routes/paths';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import type {
  AdminActiveSpace,
  AdminPropertyRegistrationsSummary,
  PropertyRegistrationListItem,
  RegistrationSource,
  RegistrationStatus,
} from '@/shared/types/admin';

const PAGE_SIZE = 5;

type LeadScope = 'open' | 'my' | 'claimed' | 'unclaimed' | 'website' | 'admin';
type DeleteTarget =
  | { kind: 'lead'; item: PropertyRegistrationListItem }
  | { kind: 'space'; item: AdminActiveSpace }
  | { kind: 'bulk-leads'; ids: string[] }
  | { kind: 'bulk-spaces'; ids: string[] };

function formatCreated(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  };
}

function statusDotColor(status: RegistrationStatus | 'ACTIVE'): string {
  if (status === 'ACTIVE' || status === 'CONVERTED' || status === 'CONTACTED') return '#22C55E';
  if (status === 'REJECTED' || status === 'DUPLICATE') return '#EF4444';
  return '#F59E0B';
}

function sourceChipSx(source: RegistrationSource | null | undefined): { bgcolor: string; color: string } {
  if (source === 'ADMIN') return { bgcolor: '#F1F5F9', color: '#475569' };
  return { bgcolor: '#EDE9FE', color: '#6D28D9' };
}

function leadScopeFromParams(searchParams: URLSearchParams): LeadScope {
  const scope = searchParams.get('scope');
  if (
    scope === 'open' ||
    scope === 'my' ||
    scope === 'claimed' ||
    scope === 'unclaimed' ||
    scope === 'website' ||
    scope === 'admin'
  ) {
    return scope;
  }
  const source = searchParams.get('source');
  if (source === 'PUBLIC_WEBSITE') return 'website';
  if (source === 'ADMIN') return 'admin';
  return 'open';
}

export function AdminPropertyListPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();

  const tab: AdminListTab = searchParams.get('tab') === 'active' ? 'active' : 'leads';
  const leadScope = leadScopeFromParams(searchParams);

  const [summary, setSummary] = useState<AdminPropertyRegistrationsSummary | null>(null);
  const [leads, setLeads] = useState<PropertyRegistrationListItem[]>([]);
  const [activeAll, setActiveAll] = useState<AdminActiveSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [sourceFilter, setSourceFilter] = useState<RegistrationSource | ''>('');
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | ''>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filterKey = `${tab}|${leadScope}|${debouncedQ}|${sourceFilter}|${statusFilter}`;
  const [activeFilterKey, setActiveFilterKey] = useState(filterKey);
  if (activeFilterKey !== filterKey) {
    setActiveFilterKey(filterKey);
    setPage(0);
    setSelected(new Set());
  }

  const requestKey = `${filterKey}|${page}`;
  const [activeRequestKey, setActiveRequestKey] = useState(requestKey);
  if (activeRequestKey !== requestKey) {
    setActiveRequestKey(requestKey);
    setLoading(true);
  }

  useEffect(() => {
    void adminApi.getPropertyRegistrationsSummary().then(setSummary).catch(() => setSummary(null));
  }, []);

  const listParams = useMemo(() => {
    const params: {
      q?: string;
      source?: RegistrationSource;
      status?: RegistrationStatus;
      leadsOnly?: boolean;
      claimed?: boolean;
    } = {
      q: debouncedQ || undefined,
      status: statusFilter || undefined,
      leadsOnly: true,
    };
    switch (leadScope) {
      case 'my':
        params.source = 'ADMIN';
        params.claimed = true;
        break;
      case 'claimed':
        params.claimed = true;
        break;
      case 'unclaimed':
        params.claimed = false;
        break;
      case 'website':
        params.source = 'PUBLIC_WEBSITE';
        break;
      case 'admin':
        params.source = 'ADMIN';
        break;
      case 'open':
      default:
        if (sourceFilter) params.source = sourceFilter;
        break;
    }
    return params;
  }, [debouncedQ, leadScope, sourceFilter, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        try {
          await adminApi.publishOpenAdminPropertyLeads();
        } catch {
          // best-effort
        }
        if (tab === 'leads') {
          const result = await adminApi.listPropertyRegistrations({
            ...listParams,
            page,
            size: PAGE_SIZE,
          });
          if (!cancelled) {
            setLeads(result.content);
            setTotalPages(result.totalPages);
            setTotalElements(result.totalElements);
          }
        } else {
          const spaces = await adminApi.listActiveSpaces();
          if (!cancelled) {
            const filtered = spaces
              .filter((s) => s.type !== 'MESS')
              .filter((s) => {
                if (!debouncedQ) return true;
                const q = debouncedQ.toLowerCase();
                return (
                  s.name.toLowerCase().includes(q) ||
                  s.ownerName.toLowerCase().includes(q) ||
                  (s.address || '').toLowerCase().includes(q) ||
                  (s.contactNumber || '').includes(q) ||
                  s.ownerMobile.includes(q)
                );
              })
              .filter((s) => !sourceFilter || s.source === sourceFilter);
            setActiveAll(filtered);
            setTotalElements(filtered.length);
            setTotalPages(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, listParams, page, sourceFilter, tab]);

  const activePage = useMemo(() => {
    const start = page * PAGE_SIZE;
    return activeAll.slice(start, start + PAGE_SIZE);
  }, [activeAll, page]);

  const stats = useMemo(
    () => [
      {
        key: 'total',
        label: t('admin.property.stats.total'),
        value: summary?.totalProperties ?? 0,
        delta: summary?.totalPropertiesDeltaPercent,
        icon: Home,
        bg: '#F3E8FF',
        fg: '#7C3AED',
      },
      {
        key: 'leads',
        label: t('admin.property.stats.leads'),
        value: summary?.leads ?? 0,
        delta: summary?.leadsDeltaPercent,
        icon: FileText,
        bg: '#FFEDD5',
        fg: '#EA580C',
      },
      {
        key: 'active',
        label: t('admin.property.stats.active'),
        value: summary?.activeProperties ?? 0,
        delta: summary?.activePropertiesDeltaPercent,
        icon: CheckCircle2,
        bg: '#DCFCE7',
        fg: '#16A34A',
      },
      {
        key: 'owners',
        label: t('admin.property.stats.registeredByOwners'),
        value: summary?.registeredByOwners ?? 0,
        delta: summary?.registeredByOwnersDeltaPercent,
        icon: Users,
        bg: '#DBEAFE',
        fg: '#2563EB',
      },
    ],
    [summary, t],
  );

  const scopes: { id: LeadScope; label: string }[] = [
    { id: 'open', label: t('admin.property.scopes.open') },
    { id: 'my', label: t('admin.property.scopes.my') },
    { id: 'claimed', label: t('admin.property.scopes.claimed') },
    { id: 'unclaimed', label: t('admin.property.scopes.unclaimed') },
    { id: 'website', label: t('admin.property.scopes.website') },
    { id: 'admin', label: t('admin.property.scopes.admin') },
  ];

  function setTab(next: AdminListTab) {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    if (next === 'active') {
      params.delete('source');
      params.delete('scope');
    }
    setSelected(new Set());
    setSearchParams(params, { replace: true });
  }

  function setScope(scope: LeadScope) {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'leads');
    params.set('scope', scope);
    if (scope === 'website') params.set('source', 'PUBLIC_WEBSITE');
    else if (scope === 'admin') params.set('source', 'ADMIN');
    else params.delete('source');
    setSearchParams(params, { replace: true });
  }

  const rowIds = tab === 'leads' ? leads.map((l) => l.id) : activePage.map((s) => s.id);
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selected.has(id));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(rowIds));
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
      if (deleteTarget.kind === 'lead') {
        await adminApi.deletePropertyRegistration(deleteTarget.item.id);
        setLeads((prev) => prev.filter((item) => item.id !== deleteTarget.item.id));
        setTotalElements((n) => Math.max(0, n - 1));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(deleteTarget.item.id);
          return next;
        });
        enqueueSnackbar(t('admin.property.deleted'), { variant: 'success' });
        void adminApi.getPropertyRegistrationsSummary().then(setSummary).catch(() => undefined);
      } else if (deleteTarget.kind === 'space') {
        await adminApi.deleteActiveSpace(deleteTarget.item.id);
        setActiveAll((prev) => prev.filter((item) => item.id !== deleteTarget.item.id));
        setTotalElements((n) => Math.max(0, n - 1));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(deleteTarget.item.id);
          return next;
        });
        enqueueSnackbar(t('admin.property.deletedActive'), { variant: 'success' });
        void adminApi.getPropertyRegistrationsSummary().then(setSummary).catch(() => undefined);
      } else if (deleteTarget.kind === 'bulk-leads') {
        const ids = deleteTarget.ids;
        const results = await Promise.allSettled(
          ids.map((id) => adminApi.deletePropertyRegistration(id)),
        );
        const okIds = ids.filter((_, i) => results[i]?.status === 'fulfilled');
        const failed = ids.length - okIds.length;
        if (okIds.length > 0) {
          const removed = new Set(okIds);
          setLeads((prev) => prev.filter((item) => !removed.has(item.id)));
          setTotalElements((n) => Math.max(0, n - okIds.length));
          setSelected(new Set());
          void adminApi.getPropertyRegistrationsSummary().then(setSummary).catch(() => undefined);
        }
        if (failed === 0) {
          enqueueSnackbar(t('admin.property.bulkDeleted', { count: okIds.length }), {
            variant: 'success',
          });
        } else if (okIds.length === 0) {
          enqueueSnackbar(t('admin.property.bulkDeleteFailed'), { variant: 'error' });
        } else {
          enqueueSnackbar(
            t('admin.property.bulkDeletePartial', {
              deleted: okIds.length,
              failed,
            }),
            { variant: 'warning' },
          );
        }
      } else {
        const ids = deleteTarget.ids;
        const results = await Promise.allSettled(ids.map((id) => adminApi.deleteActiveSpace(id)));
        const okIds = ids.filter((_, i) => results[i]?.status === 'fulfilled');
        const failed = ids.length - okIds.length;
        if (okIds.length > 0) {
          const removed = new Set(okIds);
          setActiveAll((prev) => prev.filter((item) => !removed.has(item.id)));
          setTotalElements((n) => Math.max(0, n - okIds.length));
          setSelected(new Set());
          void adminApi.getPropertyRegistrationsSummary().then(setSummary).catch(() => undefined);
        }
        if (failed === 0) {
          enqueueSnackbar(t('admin.property.bulkDeletedActive', { count: okIds.length }), {
            variant: 'success',
          });
        } else if (okIds.length === 0) {
          enqueueSnackbar(t('admin.property.bulkDeleteActiveFailed'), { variant: 'error' });
        } else {
          enqueueSnackbar(
            t('admin.property.bulkDeleteActivePartial', {
              deleted: okIds.length,
              failed,
            }),
            { variant: 'warning' },
          );
        }
      }
      setDeleteTarget(null);
    } catch {
      enqueueSnackbar(
        deleteTarget.kind === 'lead' || deleteTarget.kind === 'bulk-leads'
          ? t('admin.property.deleteFailed')
          : t('admin.property.deleteActiveFailed'),
        { variant: 'error' },
      );
    } finally {
      setDeleting(false);
    }
  }

  const selectedCount = selected.size;

  const showingFrom = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min((page + 1) * PAGE_SIZE, totalElements);
  const pages = tab === 'leads' ? totalPages : Math.max(1, Math.ceil(totalElements / PAGE_SIZE));

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'flex-start' } }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: 26, md: 30 }, letterSpacing: -0.5 }}>
            {t('admin.property.title')}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('admin.property.subtitle')}
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ flexShrink: 0 }}>
          <Button
            component={RouterLink}
            to={adminBulkPropertyPath()}
            variant="outlined"
            startIcon={<Upload size={16} />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderColor: '#22C55E',
              color: '#15803D',
              borderRadius: '10px',
              '&:hover': { borderColor: '#16A34A', bgcolor: '#F0FDF4' },
            }}>
            {t('admin.propertyBulk.bulkUpload')}
          </Button>
          <Button
            component={RouterLink}
            to={adminAddPropertyPath()}
            variant="contained"
            startIcon={<Plus size={16} />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#22C55E',
              borderRadius: '10px',
              '&:hover': { bgcolor: '#16A34A' },
            }}>
            {t('admin.nav.addProperty')}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {stats.map((stat) => {
          const positive = (stat.delta ?? 0) > 0;
          const negative = (stat.delta ?? 0) < 0;
          return (
            <Grid key={stat.key} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: '14px',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: '0 1px 2px rgb(15 23 42 / 0.04), 0 4px 12px rgb(15 23 42 / 0.04)',
                  height: '100%',
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
                          {Math.abs(stat.delta).toFixed(0)}% {t('admin.property.stats.vsLast30')}
                        </Typography>
                      ) : (
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                          {t('admin.property.stats.vsLast30')}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Tabs
        value={tab}
        onChange={(_, next: AdminListTab) => setTab(next)}
        sx={{
          mb: 2,
          minHeight: 40,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 40 },
          '& .Mui-selected': { color: '#15803D !important' },
          '& .MuiTabs-indicator': { bgcolor: '#22C55E', height: 3, borderRadius: 2 },
        }}>
        <Tab value="leads" label={t('admin.filters.leads')} />
        <Tab value="active" label={t('admin.filters.active')} />
      </Tabs>

      {tab === 'leads' ? (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 2 }}>
          {scopes.map((scope) => {
            const activePill = leadScope === scope.id;
            return (
              <Button
                key={scope.id}
                onClick={() => setScope(scope.id)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: '999px',
                  px: 1.75,
                  py: 0.5,
                  border: '1px solid',
                  borderColor: activePill ? '#86EFAC' : 'divider',
                  bgcolor: activePill ? '#DCFCE7' : '#FFFFFF',
                  color: activePill ? '#15803D' : 'text.secondary',
                  '&:hover': {
                    bgcolor: activePill ? '#BBF7D0' : '#F8FAFC',
                    borderColor: activePill ? '#22C55E' : 'divider',
                  },
                }}>
                {scope.label}
              </Button>
            );
          })}
        </Stack>
      ) : null}

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
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.25}
            sx={{ alignItems: { xs: 'stretch', md: 'center' } }}>
            <TextField
              size="small"
              fullWidth
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('admin.property.searchPlaceholder')}
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
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                displayEmpty
                value={sourceFilter}
                disabled={leadScope === 'website' || leadScope === 'admin' || leadScope === 'my'}
                onChange={(e) => setSourceFilter(e.target.value as RegistrationSource | '')}
                sx={{ borderRadius: '10px' }}>
                <MenuItem value="">{t('admin.property.filters.allSources')}</MenuItem>
                <MenuItem value="PUBLIC_WEBSITE">{t('admin.labels.registeredByOwner')}</MenuItem>
                <MenuItem value="ADMIN">{t('admin.labels.addedByAdmin')}</MenuItem>
              </Select>
            </FormControl>
            {tab === 'leads' ? (
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  displayEmpty
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as RegistrationStatus | '')}
                  sx={{ borderRadius: '10px' }}>
                  <MenuItem value="">{t('admin.property.filters.allStatus')}</MenuItem>
                  <MenuItem value="PENDING">PENDING</MenuItem>
                  <MenuItem value="IN_REVIEW">IN_REVIEW</MenuItem>
                  <MenuItem value="CONTACTED">CONTACTED</MenuItem>
                  <MenuItem value="DUPLICATE">DUPLICATE</MenuItem>
                </Select>
              </FormControl>
            ) : null}
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
                  onClick={() =>
                    setDeleteTarget(
                      tab === 'leads'
                        ? { kind: 'bulk-leads', ids: Array.from(selected) }
                        : { kind: 'bulk-spaces', ids: Array.from(selected) },
                    )
                  }
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
          <Table sx={{ minWidth: 1080 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#FAFBFC' }}>
                <TableCell padding="checkbox">
                  <Checkbox checked={allSelected} onChange={toggleAll} />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.property.columns.property')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.property.columns.details')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.common.source')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.common.testLead')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.property.columns.created')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('admin.common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      {t('common.loading')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : tab === 'leads' ? (
                leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                        {t('admin.property.emptyLeads')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((item) => {
                    const created = formatCreated(item.createdAt);
                    const chipSx = sourceChipSx(item.source);
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selected.has(item.id)}
                            onChange={() => toggleOne(item.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                            <Box
                              component="img"
                              src={discoverDefaultImageUrl(item.propertyType)}
                              alt=""
                              sx={{
                                width: 52,
                                height: 52,
                                borderRadius: '10px',
                                objectFit: 'cover',
                                flexShrink: 0,
                              }}
                            />
                            <Box sx={{ minWidth: 0 }}>
                              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: statusDotColor(item.status),
                                    flexShrink: 0,
                                  }}
                                />
                                <Typography sx={{ fontWeight: 700, fontSize: 14 }} noWrap>
                                  {item.propertyName}
                                </Typography>
                              </Stack>
                              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.35 }}>
                                <User size={12} color="#94A3B8" />
                                <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>
                                  {item.ownerName}
                                </Typography>
                              </Stack>
                              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                                <MapPin size={12} color="#94A3B8" />
                                <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>
                                  {item.city}, {item.state}
                                </Typography>
                              </Stack>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{item.propertyType}</Typography>
                          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                            {item.reference}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                            {item.mobileNumber}
                          </Typography>
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
                              ...chipSx,
                            }}>
                            {formatPropertyRegistrationSource(item.source)}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {item.testLead ? (
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
                              {t('admin.common.no')}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{created.date}</Typography>
                          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                            {created.time}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                            <Button
                              component={RouterLink}
                              to={adminPropertyDetailPath(item.id)}
                              size="small"
                              sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                color: '#15803D',
                                bgcolor: '#DCFCE7',
                                borderRadius: '8px',
                                px: 1.5,
                                minWidth: 0,
                                '&:hover': { bgcolor: '#BBF7D0' },
                              }}>
                              {t('admin.property.view')}
                            </Button>
                            <Button
                              size="small"
                              onClick={() => setDeleteTarget({ kind: 'lead', item })}
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
                            <IconButton size="small" sx={{ color: 'text.secondary' }}>
                              <MoreVertical size={16} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )
              ) : activePage.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      {t('admin.property.emptyActive')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                activePage.map((space) => {
                  const created = formatCreated(space.createdAt);
                  const chipSx = sourceChipSx(space.source);
                  const detailPath = space.registrationId
                    ? adminPropertyDetailPath(space.registrationId)
                    : undefined;
                  return (
                    <TableRow key={space.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected.has(space.id)}
                          onChange={() => toggleOne(space.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                          <Box
                            component="img"
                            src={discoverDefaultImageUrl(space.type)}
                            alt=""
                            sx={{
                              width: 52,
                              height: 52,
                              borderRadius: '10px',
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: statusDotColor('ACTIVE'),
                                  flexShrink: 0,
                                }}
                              />
                              <Typography sx={{ fontWeight: 700, fontSize: 14 }} noWrap>
                                {space.name}
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.35 }}>
                              <User size={12} color="#94A3B8" />
                              <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>
                                {space.ownerName}
                              </Typography>
                            </Stack>
                            {space.address ? (
                              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                                <MapPin size={12} color="#94A3B8" />
                                <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>
                                  {space.address}
                                </Typography>
                              </Stack>
                            ) : null}
                          </Box>
                        </Stack>
                      </TableCell>
                        <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{space.type}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                          {space.contactNumber || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {space.source ? (
                          <Box
                            sx={{
                              display: 'inline-flex',
                              px: 1.25,
                              py: 0.35,
                              borderRadius: '999px',
                              fontSize: 12,
                              fontWeight: 700,
                              ...chipSx,
                            }}>
                            {formatPropertyRegistrationSource(space.source)}
                          </Box>
                        ) : (
                          <Typography sx={{ color: 'text.secondary' }}>—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {space.testLead ? (
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
                            {t('admin.common.no')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{created.date}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                          {created.time}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                          {detailPath ? (
                            <Button
                              component={RouterLink}
                              to={detailPath}
                              size="small"
                              sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                color: '#15803D',
                                bgcolor: '#DCFCE7',
                                borderRadius: '8px',
                                px: 1.5,
                                minWidth: 0,
                                '&:hover': { bgcolor: '#BBF7D0' },
                              }}>
                              {t('admin.property.view')}
                            </Button>
                          ) : null}
                          <Button
                            size="small"
                            onClick={() => setDeleteTarget({ kind: 'space', item: space })}
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
                          <IconButton size="small" sx={{ color: 'text.secondary' }}>
                            <MoreVertical size={16} />
                          </IconButton>
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
            {t('admin.property.showing', {
              from: showingFrom,
              to: showingTo,
              total: totalElements,
            })}
          </Typography>
          {pages > 1 ? (
            <Pagination
              count={pages}
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

      <ConfirmDialog
        open={deleteTarget != null}
        title={
          deleteTarget?.kind === 'bulk-spaces'
            ? t('admin.property.bulkDeleteActiveTitle')
            : deleteTarget?.kind === 'bulk-leads'
              ? t('admin.property.bulkDeleteTitle')
              : deleteTarget?.kind === 'space'
                ? t('admin.property.deleteActiveTitle')
                : t('admin.property.deleteTitle')
        }
        description={
          deleteTarget
            ? deleteTarget.kind === 'bulk-spaces'
              ? t('admin.property.bulkDeleteActiveMessage', { count: deleteTarget.ids.length })
              : deleteTarget.kind === 'bulk-leads'
                ? t('admin.property.bulkDeleteMessage', { count: deleteTarget.ids.length })
                : deleteTarget.kind === 'space'
                  ? t('admin.property.deleteActiveMessage', { name: deleteTarget.item.name })
                  : t('admin.property.deleteMessage', { name: deleteTarget.item.propertyName })
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
