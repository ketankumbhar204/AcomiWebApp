import {
  Avatar,
  Box,
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Plus,
  RefreshCw,
  TriangleAlert,
  UserPlus,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { StatusChip } from '@/shared/components/StatusChip';
import { ErrorState } from '@/shared/components/ErrorState';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx } from '@/shared/theme/dashButtonSx';
import { spaceComplaintsPath } from '@/routes/paths';
import type {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintResponse,
  ComplaintStatus,
  ListComplaintsParams,
} from '@/shared/types/complaints';
import { ComplaintInspector } from '../components/ComplaintInspector';
import { RaiseComplaintDrawer } from '../components/RaiseComplaintDrawer';
import { useComplaintsList } from '../hooks/useComplaints';
import {
  canManageComplaints,
  canRaiseComplaint,
  categoriesForSpaceType,
  categoryLabelKey,
  complaintAvatarAccent,
  complaintInitials,
  complaintPriorityTone,
  complaintStatusTone,
  formatComplaintDate,
  priorityLabelKey,
  statusLabelKey,
} from '../utils/complaintHelpers';

const PAGE_SIZE = 25;
const STATUSES: ComplaintStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'CANCELLED',
];
const PRIORITIES: ComplaintPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const filterControlSx = {
  minWidth: 128,
  flexShrink: 0,
  '& .MuiInputBase-root': {
    minHeight: DASHBOARD_UX.buttonHeight,
    height: DASHBOARD_UX.buttonHeight,
    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
    ...DASHBOARD_UX.body,
  },
} as const;

export function ComplaintsWorkspacePage() {
  const { spaceId = '', complaintId: routeComplaintId } = useParams<{
    spaceId: string;
    complaintId?: string;
  }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const isLgDown = useMediaQuery(theme.breakpoints.down('lg'));
  const s = dashSurfaces(theme.palette.mode);
  const permissions = useSpacePermissions(spaceId);
  const canManage = canManageComplaints(permissions.membershipRole);
  const mayRaise = canRaiseComplaint(
    permissions.membershipRole,
    permissions.canRaiseComplaint,
  );

  const statusFilter = (searchParams.get('status') as ComplaintStatus | null) || '';
  const priorityFilter = (searchParams.get('priority') as ComplaintPriority | null) || '';
  const categoryFilter = (searchParams.get('category') as ComplaintCategory | null) || '';
  const mineOnly = searchParams.get('mine') === 'true';

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [raiseOpen, setRaiseOpen] = useState(false);

  const listParams: ListComplaintsParams = {
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    category: categoryFilter || undefined,
    mine: canManage ? (mineOnly ? true : undefined) : true,
  };

  const list = useComplaintsList(spaceId, listParams, true);
  const selectedComplaintId = routeComplaintId ?? null;
  const inspectorOpen = Boolean(routeComplaintId);

  useEffect(() => {
    document.title = `${t('navigation.complaints')} · ${t('common.appName')}`;
  }, [t]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('complaints-search')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const categories = useMemo(
    () => categoriesForSpaceType(permissions.space?.spaceType),
    [permissions.space?.spaceType],
  );

  const setFilter = (key: string, value: string) => {
    setPage(0);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (value) {
        p.set(key, value);
      } else {
        p.delete(key);
      }
      return p;
    });
  };

  const selectComplaint = (id: string) => {
    navigate(
      spaceComplaintsPath(spaceId, id, {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        category: categoryFilter || undefined,
        mine: mineOnly || undefined,
      }),
      { replace: true },
    );
  };

  const closeInspector = () => {
    navigate(
      spaceComplaintsPath(spaceId, undefined, {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        category: categoryFilter || undefined,
        mine: mineOnly || undefined,
      }),
      { replace: true },
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return list.complaints;
    }
    return list.complaints.filter((c) => {
      const hay = [
        c.title,
        c.description,
        c.createdByMemberName,
        c.assignedToName,
        c.category,
        c.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [list.complaints, search]);

  const urgentCount = useMemo(
    () =>
      list.complaints.filter((c) => c.priority === 'URGENT' || c.priority === 'HIGH').length,
    [list.complaints],
  );

  const pageRows = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE).map((c) => ({ ...c, id: c.complaintId }));
  }, [filtered, page]);

  const columns: DataTableColumn<ComplaintResponse & { id: string }>[] = useMemo(
    () => [
      {
        id: 'title',
        header: t('complaints.fields.title'),
        primary: true,
        accessor: (row) => {
          const accent = complaintAvatarAccent(row.complaintId);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, py: 0.25 }}>
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  ...DASHBOARD_UX.badge,
                  bgcolor: `${accent}1A`,
                  color: accent,
                  flexShrink: 0,
                }}
              >
                {(row.title?.trim()?.[0] ?? '?').toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{ ...DASHBOARD_UX.link, color: s.textPrimary }}
                  noWrap
                >
                  {row.title}
                </Typography>
                {row.description ? (
                  <Typography
                    sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }}
                    noWrap
                  >
                    {row.description}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          );
        },
      },
      {
        id: 'category',
        header: t('complaints.fields.category'),
        accessor: (row) => (
          <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }} noWrap>
            {t(categoryLabelKey(row.category))}
          </Typography>
        ),
      },
      {
        id: 'priority',
        header: t('complaints.fields.priority'),
        accessor: (row) => (
          <StatusChip
            label={t(priorityLabelKey(row.priority))}
            tone={complaintPriorityTone(row.priority)}
          />
        ),
      },
      {
        id: 'status',
        header: t('complaints.table.status'),
        accessor: (row) => (
          <StatusChip
            label={t(statusLabelKey(row.status))}
            tone={complaintStatusTone(row.status)}
          />
        ),
      },
      {
        id: 'reporter',
        header: t('complaints.fields.reporter'),
        accessor: (row) => {
          const name = row.createdByMemberName;
          if (!name) {
            return (
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }}>—</Typography>
            );
          }
          const accent = complaintAvatarAccent(name);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
              <Avatar
                sx={{
                  width: 22,
                  height: 22,
                  ...DASHBOARD_UX.badge,
                  bgcolor: `${accent}1A`,
                  color: accent,
                  flexShrink: 0,
                }}
              >
                {complaintInitials(name)}
              </Avatar>
              <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }} noWrap>
                {name}
              </Typography>
            </Box>
          );
        },
      },
      {
        id: 'assignee',
        header: t('complaints.fields.assigned'),
        accessor: (row) => {
          if (!row.assignedToName) {
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: s.textMuted }}>
                <UserPlus size={14} />
                <Typography sx={{ ...DASHBOARD_UX.body, color: s.textMuted }} noWrap>
                  {t('complaints.unassigned')}
                </Typography>
              </Box>
            );
          }
          return (
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textPrimary }} noWrap>
              {row.assignedToName}
            </Typography>
          );
        },
      },
      {
        id: 'dates',
        header: t('complaints.table.createdUpdated', {
          defaultValue: 'Created / Updated',
        }),
        accessor: (row) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ ...DASHBOARD_UX.body, color: s.textSecondary }} noWrap>
              {formatComplaintDate(row.createdAt)}
            </Typography>
            <Typography sx={{ ...DASHBOARD_UX.smallCaption, color: s.textMuted }} noWrap>
              {formatComplaintDate(row.updatedAt)}
            </Typography>
          </Box>
        ),
      },
      {
        id: 'actions',
        header: '',
        width: 40,
        align: 'right',
        accessor: () => <ChevronRight size={16} color={s.textMuted} aria-hidden />,
      },
    ],
    [s.textMuted, s.textPrimary, s.textSecondary, t],
  );

  const toolbarFilters = (
    <>
      <FormControl size="small" sx={filterControlSx}>
        <InputLabel id="complaints-status">{t('complaints.table.status')}</InputLabel>
        <Select
          labelId="complaints-status"
          label={t('complaints.table.status')}
          value={statusFilter}
          onChange={(e) => setFilter('status', String(e.target.value))}
        >
          <MenuItem value="">{t('complaints.filters.all')}</MenuItem>
          {STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {t(statusLabelKey(status))}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={filterControlSx}>
        <InputLabel id="complaints-priority">{t('complaints.fields.priority')}</InputLabel>
        <Select
          labelId="complaints-priority"
          label={t('complaints.fields.priority')}
          value={priorityFilter}
          onChange={(e) => setFilter('priority', String(e.target.value))}
        >
          <MenuItem value="">{t('complaints.filters.all')}</MenuItem>
          {PRIORITIES.map((priority) => (
            <MenuItem key={priority} value={priority}>
              {t(priorityLabelKey(priority))}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ ...filterControlSx, minWidth: 140 }}>
        <InputLabel id="complaints-category">{t('complaints.fields.category')}</InputLabel>
        <Select
          labelId="complaints-category"
          label={t('complaints.fields.category')}
          value={categoryFilter}
          onChange={(e) => setFilter('category', String(e.target.value))}
        >
          <MenuItem value="">{t('complaints.filters.all')}</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category} value={category}>
              {t(categoryLabelKey(category))}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {canManage ? (
        <FormControl size="small" sx={filterControlSx}>
          <InputLabel id="complaints-scope">{t('complaints.filters.scope')}</InputLabel>
          <Select
            labelId="complaints-scope"
            label={t('complaints.filters.scope')}
            value={mineOnly ? 'mine' : 'all'}
            onChange={(e) => setFilter('mine', e.target.value === 'mine' ? 'true' : '')}
          >
            <MenuItem value="all">{t('complaints.filters.allTickets')}</MenuItem>
            <MenuItem value="mine">{t('complaints.filters.mine')}</MenuItem>
          </Select>
        </FormControl>
      ) : null}
    </>
  );

  const inspector = (
    <ComplaintInspector
      spaceId={spaceId}
      complaintId={selectedComplaintId}
      canManage={canManage}
      onClose={closeInspector}
      framed={!isLgDown}
    />
  );

  if (list.error && !list.data) {
    return (
      <PageContainer>
        <ErrorState
          title={t('common.errors.generic')}
          message={t('complaints.errors.load')}
          onRetry={() => void list.reload()}
          retryLabel={t('common.retry')}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('navigation.complaints')}
          description={t('complaints.workspace.subtitle')}
          breadcrumbs={[
            { label: permissions.space?.spaceName ?? t('navigation.space') },
            { label: t('navigation.complaints') },
          ]}
          actions={
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
              <IconButton
                aria-label={t('common.refresh')}
                onClick={() => void list.reload()}
                size="small"
                sx={{
                  width: DASHBOARD_UX.buttonHeight,
                  height: DASHBOARD_UX.buttonHeight,
                  border: `1px solid ${s.border}`,
                  borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
                  bgcolor: s.surface,
                }}
              >
                <RefreshCw size={14} />
              </IconButton>
              {mayRaise ? (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Plus size={16} />}
                  onClick={() => setRaiseOpen(true)}
                  sx={{
                    ...dashContainedButtonSx,
                    bgcolor: colors.primaryDark,
                    '&:hover': { bgcolor: colors.primaryHover },
                  }}
                >
                  {t('complaints.raise')}
                </Button>
              ) : null}
            </Stack>
          }
        />

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              dense
              tone="warning"
              label={t('complaints.kpi.open')}
              value={String(list.openCount)}
              onClick={() => setFilter('status', 'OPEN')}
              icon={
                <IconBadge tone="warning">
                  <CircleDot />
                </IconBadge>
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              dense
              tone="info"
              label={t('complaints.kpi.inProgress')}
              value={String(list.inProgressCount)}
              onClick={() => setFilter('status', 'IN_PROGRESS')}
              icon={
                <IconBadge tone="info">
                  <Clock3 />
                </IconBadge>
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              dense
              tone="success"
              label={t('complaints.kpi.resolved')}
              value={String(list.resolvedCount)}
              onClick={() => setFilter('status', 'RESOLVED')}
              icon={
                <IconBadge tone="success">
                  <CheckCircle2 />
                </IconBadge>
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              dense
              tone="danger"
              label={t('complaints.kpi.highPriority')}
              value={String(urgentCount)}
              hint={t('complaints.kpi.total', { count: list.totalCount })}
              icon={
                <IconBadge tone="danger">
                  <TriangleAlert />
                </IconBadge>
              }
            />
          </Grid>
        </Grid>

        <Box
          sx={{
            display: 'grid',
            gap: `${DASHBOARD_UX.cardGap}px`,
            gridTemplateColumns: isLgDown
              ? '1fr'
              : 'minmax(0, 1.85fr) minmax(300px, 0.95fr)',
            alignItems: 'start',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <DataTable
              columns={columns}
              rows={pageRows}
              loading={list.loading}
              searchValue={search}
              onSearchChange={(value) => {
                setSearch(value);
                setPage(0);
              }}
              searchPlaceholder={t('complaints.search.placeholder')}
              searchInputId="complaints-search"
              toolbarFilters={toolbarFilters}
              emptyTitle={t('complaints.empty.title')}
              emptyDescription={t('complaints.empty.description')}
              selectedIds={selectedComplaintId ? [selectedComplaintId] : []}
              onRowClick={(row) => selectComplaint(row.complaintId)}
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={filtered.length}
              onPageChange={setPage}
            />
          </Box>

          {!isLgDown ? (
            <Box
              sx={{
                position: 'sticky',
                top: 12,
                alignSelf: 'start',
                height: 'calc(100vh - 112px)',
                maxHeight: 'calc(100vh - 112px)',
                minHeight: 360,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {inspector}
            </Box>
          ) : null}
        </Box>
      </Stack>

      <AppDrawer open={inspectorOpen && isLgDown} onClose={closeInspector} width={400}>
        <ComplaintInspector
          spaceId={spaceId}
          complaintId={selectedComplaintId}
          canManage={canManage}
          onClose={closeInspector}
          framed={false}
        />
      </AppDrawer>

      <RaiseComplaintDrawer
        open={raiseOpen}
        spaceId={spaceId}
        spaceType={permissions.space?.spaceType}
        onClose={() => setRaiseOpen(false)}
        onCreated={(id) => selectComplaint(id)}
      />
    </PageContainer>
  );
}
