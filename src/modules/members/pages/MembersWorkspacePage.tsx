import {
  Avatar,
  Box,
  Button,
  Checkbox,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  CalendarPlus,
  Download,
  Mail,
  MailPlus,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { IconBadge } from '@/modules/dashboard/components/IconBadge';
import { DASHBOARD_UX, dashSurfaces } from '@/modules/dashboard/theme/dashboardUx';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { AppDrawer } from '@/shared/components/AppDrawer';
import { DataTable, type DataTableColumn } from '@/shared/components/DataTable';
import { ErrorState } from '@/shared/components/ErrorState';
import { PageContainer } from '@/shared/components/PageContainer';
import { PageHeader } from '@/shared/components/PageHeader';
import { StatCard } from '@/shared/components/StatCard';
import { StatusChip } from '@/shared/components/StatusChip';
import type { MemberResponse, MemberStatus, PendingInvitationResponse } from '@/shared/types/member';
import type { MembershipRole } from '@/shared/types/space';
import { useSpacePermissions } from '@/shared/hooks/useSpacePermissions';
import {
  spaceAddCustomersHubPath,
  spaceImportPeoplePath,
  spaceMemberPath,
  spaceMembersPath,
} from '@/routes/paths';
import { colors } from '@/shared/theme/colors';
import { dashContainedButtonSx, dashOutlinedButtonSx } from '@/shared/theme/dashButtonSx';
import { MemberFormDrawer } from '../components/MemberFormDrawer';
import { InviteMemberDialog } from '../components/InviteMemberDialog';
import { MemberInspector } from '../components/MemberInspector';
import {
  useMemberDetails,
  useMemberMutations,
  useMembers,
  usePendingInvitations,
} from '../hooks/useMembers';
import {
  MEMBER_STATUSES,
  countMemberListFilters,
  defaultMemberListFilters,
  filterAndSortMembers,
  filterPendingInvitations,
  rolesForSpace,
  type MemberListFilterState,
  type MemberSortOption,
} from '../utils/memberListQuery';

type ListTab = 'members' | 'pending';

type MemberRow = MemberResponse & { id: string };
type InviteRow = PendingInvitationResponse & { id: string };

const filterControlSx = {
  minWidth: 120,
  '& .MuiInputBase-root': {
    minHeight: DASHBOARD_UX.buttonHeight,
    height: DASHBOARD_UX.buttonHeight,
    borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
    ...DASHBOARD_UX.body,
  },
  '& .MuiInputLabel-root': {
    ...DASHBOARD_UX.body,
  },
} as const;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function isJoinedThisMonth(iso: string): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function MemberRowActions({
  onView,
  onEdit,
  onInvite,
}: {
  onView: () => void;
  onEdit: () => void;
  onInvite: () => void;
}) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  return (
    <>
      <IconButton
        size="small"
        aria-label={t('membership.workspace.columns.actions')}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={(event: MouseEvent<HTMLElement>) => {
          event.stopPropagation();
          setAnchor(event.currentTarget);
        }}
        sx={{
          width: DASHBOARD_UX.buttonHeight,
          height: DASHBOARD_UX.buttonHeight,
          borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
        }}
      >
        <MoreVertical size={14} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClick={(event) => event.stopPropagation()}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onView();
          }}
        >
          <ListItemText>{t('membership.workspace.viewDetails')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onEdit();
          }}
        >
          <ListItemIcon>
            <Pencil size={14} />
          </ListItemIcon>
          <ListItemText>{t('common.edit')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onInvite();
          }}
        >
          <ListItemIcon>
            <Mail size={14} />
          </ListItemIcon>
          <ListItemText>{t('membership.invite.headerAction')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

function InviteRowActions({ onCancel }: { onCancel: () => void }) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  return (
    <>
      <IconButton
        size="small"
        aria-label={t('membership.workspace.columns.actions')}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={(event: MouseEvent<HTMLElement>) => {
          event.stopPropagation();
          setAnchor(event.currentTarget);
        }}
        sx={{
          width: DASHBOARD_UX.buttonHeight,
          height: DASHBOARD_UX.buttonHeight,
          borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
        }}
      >
        <MoreVertical size={14} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClick={(event) => event.stopPropagation()}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onCancel();
          }}
        >
          <ListItemText>{t('membership.pending.cancel')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export function MembersWorkspacePage() {
  const { t } = useTranslation();
  const { spaceId = '', memberId } = useParams<{ spaceId: string; memberId?: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const s = dashSurfaces(theme.palette.mode);
  const { enqueueSnackbar } = useSnackbar();
  const permissions = useSpacePermissions(spaceId);
  const spaceType = permissions.space?.spaceType;

  const membersQuery = useMembers(spaceId, permissions.canManageMembers);
  const invitationsQuery = usePendingInvitations(spaceId, permissions.canManageMembers);
  const { cancelInvitation } = useMemberMutations(spaceId);
  const selectedDetails = useMemberDetails(spaceId, memberId, Boolean(memberId));

  const [listTab, setListTab] = useState<ListTab>('members');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<MemberListFilterState>(defaultMemberListFilters());
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<MemberResponse | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitePrefill, setInvitePrefill] = useState<{
    mobile?: string;
    role?: MembershipRole;
    name?: string;
  }>({});
  const [cancelInviteId, setCancelInviteId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 25;
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    document.title = `${t('navigation.members')} · ${t('common.appName')}`;
  }, [t]);

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setFormMode('create');
      setEditTarget(null);
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filteredMembers = useMemo(
    () =>
      filterAndSortMembers(membersQuery.members, {
        search,
        filters,
        spaceType,
      }),
    [filters, membersQuery.members, search, spaceType],
  );

  const filteredInvites = useMemo(
    () =>
      filterPendingInvitations(invitationsQuery.invitations, {
        search,
        roles: filters.roles,
        spaceType,
      }),
    [filters.roles, invitationsQuery.invitations, search, spaceType],
  );

  const kpi = useMemo(() => {
    const all = membersQuery.members;
    return {
      total: all.length,
      active: all.filter((m) => m.status === 'ACTIVE').length,
      pending: invitationsQuery.invitations.length,
      joinedThisMonth: all.filter((m) => isJoinedThisMonth(m.createdAt)).length,
    };
  }, [invitationsQuery.invitations.length, membersQuery.members]);

  const pagedMembers = filteredMembers.slice(page * pageSize, page * pageSize + pageSize);
  const memberRows: MemberRow[] = pagedMembers.map((row) => ({ ...row, id: row.memberId }));
  const inviteRows: InviteRow[] = filteredInvites.map((row) => ({
    ...row,
    id: row.invitationId,
  }));

  const activeFilterCount = countMemberListFilters(filters, spaceType);
  const inspectorOpen = Boolean(memberId);

  const openMember = (id: string) => navigate(spaceMemberPath(spaceId, id));

  const memberColumns: DataTableColumn<MemberRow>[] = [
    {
      id: 'avatar',
      header: '',
      width: 48,
      accessor: (row) => (
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: theme.palette.mode === 'dark' ? s.elevated : colors.lightGreen,
            color: colors.primaryDark,
            ...DASHBOARD_UX.badge,
          }}
        >
          {initials(row.fullName)}
        </Avatar>
      ),
    },
    {
      id: 'name',
      header: t('membership.workspace.columns.name'),
      accessor: (row) => (
        <Box sx={{ minWidth: 0, py: 0.5 }}>
          <Typography
            sx={{
              ...DASHBOARD_UX.link,
              color: s.textPrimary,
            }}
            noWrap
          >
            {row.fullName}
          </Typography>
          <Typography sx={{ ...DASHBOARD_UX.metricCaption, color: s.textMuted }} noWrap>
            {row.linkedUser
              ? t('membership.members.onAcomi')
              : t('membership.members.notOnAcomiYet')}
          </Typography>
        </Box>
      ),
      sortable: true,
      primary: true,
    },
    {
      id: 'mobile',
      header: t('membership.workspace.columns.mobile'),
      accessor: (row) => row.mobileNumber,
      primary: true,
    },
    {
      id: 'role',
      header: t('membership.workspace.columns.role'),
      accessor: (row) => <StatusChip label={row.role} tone="info" />,
    },
    {
      id: 'joined',
      header: t('membership.workspace.columns.joined'),
      accessor: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      id: 'status',
      header: t('membership.workspace.columns.status'),
      accessor: (row) => (
        <StatusChip label={row.status} tone={row.status === 'ACTIVE' ? 'success' : 'warning'} />
      ),
    },
    {
      id: 'actions',
      header: t('membership.workspace.columns.actions'),
      width: 56,
      align: 'right',
      accessor: (row) => (
        <MemberRowActions
          onView={() => openMember(row.memberId)}
          onEdit={() => {
            setEditTarget(row);
            setFormMode('edit');
          }}
          onInvite={() => {
            setInvitePrefill({
              mobile: row.mobileNumber,
              role: row.role !== 'OWNER' ? row.role : undefined,
              name: row.fullName,
            });
            setInviteOpen(true);
          }}
        />
      ),
    },
  ];

  const inviteColumns: DataTableColumn<InviteRow>[] = [
    {
      id: 'mobile',
      header: t('membership.workspace.columns.mobile'),
      accessor: (row) => row.mobileNumber,
      primary: true,
    },
    {
      id: 'role',
      header: t('membership.workspace.columns.role'),
      accessor: (row) => <StatusChip label={row.role} tone="info" />,
    },
    {
      id: 'invitedBy',
      header: t('membership.workspace.invitedBy'),
      accessor: (row) => row.invitedBy,
      primary: true,
    },
    {
      id: 'sent',
      header: t('membership.details.created'),
      accessor: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      id: 'actions',
      header: t('membership.workspace.columns.actions'),
      width: 56,
      align: 'right',
      accessor: (row) => (
        <InviteRowActions onCancel={() => setCancelInviteId(row.invitationId)} />
      ),
    },
  ];

  const handleExportPrep = () => {
    enqueueSnackbar(t('membership.workspace.exportReady'), { variant: 'info' });
  };

  const filterBar = (
    <>
      <FormControl size="small" sx={filterControlSx}>
        <InputLabel id="member-role-filter">{t('membership.roles.label')}</InputLabel>
        <Select
          labelId="member-role-filter"
          label={t('membership.roles.label')}
          multiple
          value={filters.roles}
          onChange={(e) => {
            setPage(0);
            setFilters((prev) => ({
              ...prev,
              roles: e.target.value as MembershipRole[],
            }));
          }}
          renderValue={(selected) =>
            selected.length === 0 ? t('membership.workspace.allRoles') : selected.join(', ')
          }
        >
          {rolesForSpace(spaceType).map((role) => (
            <MenuItem key={role} value={role}>
              <Checkbox checked={filters.roles.includes(role)} size="small" />
              {role}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={filterControlSx}>
        <InputLabel id="member-status-filter">
          {t('membership.workspace.columns.status')}
        </InputLabel>
        <Select
          labelId="member-status-filter"
          label={t('membership.workspace.columns.status')}
          multiple
          value={filters.statuses}
          onChange={(e) => {
            setPage(0);
            setFilters((prev) => ({
              ...prev,
              statuses: e.target.value as MemberStatus[],
            }));
          }}
          renderValue={(selected) =>
            selected.length === 0
              ? t('membership.workspace.allStatuses')
              : selected.join(', ')
          }
        >
          {MEMBER_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              <Checkbox checked={filters.statuses.includes(status)} size="small" />
              {status}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ ...filterControlSx, minWidth: 150 }}>
        <InputLabel id="member-sort">{t('membership.workspace.sort')}</InputLabel>
        <Select
          labelId="member-sort"
          label={t('membership.workspace.sort')}
          value={filters.sort}
          onChange={(e) => {
            setPage(0);
            setFilters((prev) => ({
              ...prev,
              sort: e.target.value as MemberSortOption,
            }));
          }}
          renderValue={(value) => {
            const labels: Record<MemberSortOption, string> = {
              name_asc: t('membership.workspace.sortNameAsc'),
              name_desc: t('membership.workspace.sortNameDesc'),
              created_desc: t('membership.workspace.sortNewest'),
              created_asc: t('membership.workspace.sortOldest'),
              role: t('membership.workspace.sortRole'),
            };
            return `${t('membership.workspace.sort')}: ${labels[value as MemberSortOption]}`;
          }}
        >
          <MenuItem value="name_asc">{t('membership.workspace.sortNameAsc')}</MenuItem>
          <MenuItem value="name_desc">{t('membership.workspace.sortNameDesc')}</MenuItem>
          <MenuItem value="created_desc">{t('membership.workspace.sortNewest')}</MenuItem>
          <MenuItem value="created_asc">{t('membership.workspace.sortOldest')}</MenuItem>
          <MenuItem value="role">{t('membership.workspace.sortRole')}</MenuItem>
        </Select>
      </FormControl>

      {activeFilterCount > 0 ? (
        <Button
          size="small"
          onClick={() => {
            setPage(0);
            setFilters(defaultMemberListFilters());
          }}
          sx={dashOutlinedButtonSx}
        >
          {t('membership.workspace.clearFilters')}
        </Button>
      ) : null}
    </>
  );

  const toolbarActions = (
    <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <Button
        size="small"
        startIcon={<RefreshCw size={14} />}
        onClick={() =>
          void (listTab === 'members' ? membersQuery.reload() : invitationsQuery.reload())
        }
        sx={dashOutlinedButtonSx}
      >
        {t('common.refresh')}
      </Button>
      <Tooltip title={t('membership.workspace.export')}>
        <IconButton
          size="small"
          aria-label={t('membership.workspace.export')}
          onClick={handleExportPrep}
          sx={{
            width: DASHBOARD_UX.buttonHeight,
            height: DASHBOARD_UX.buttonHeight,
            borderRadius: `${DASHBOARD_UX.buttonRadius}px`,
            border: `1px solid ${s.border}`,
            color: s.textSecondary,
          }}
        >
          <Download size={14} />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  return (
    <PageContainer gap={0}>
      <Stack spacing={`${DASHBOARD_UX.sectionGap}px`} sx={{ width: '100%' }}>
        <PageHeader
          title={t('navigation.members')}
          description={t('membership.members.listSubtitle')}
          breadcrumbs={[{ label: t('navigation.members'), to: spaceMembersPath(spaceId) }]}
          actions={
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {spaceType === 'MESS' ? (
                <Button
                  variant="outlined"
                  startIcon={<UserPlus size={14} />}
                  onClick={() => navigate(spaceAddCustomersHubPath(spaceId))}
                  sx={dashOutlinedButtonSx}
                >
                  {t('membership.addCustomersHub.navTitle')}
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<Users size={14} />}
                  onClick={() => navigate(spaceImportPeoplePath(spaceId))}
                  sx={dashOutlinedButtonSx}
                >
                  {t('membership.importPeople.title')}
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<MailPlus size={14} />}
                onClick={() => {
                  setInvitePrefill({});
                  setInviteOpen(true);
                }}
                sx={dashOutlinedButtonSx}
              >
                {t('membership.invite.headerAction')}
              </Button>
              <Button
                variant="contained"
                startIcon={<Plus size={14} />}
                onClick={() => {
                  setEditTarget(null);
                  setFormMode('create');
                }}
                sx={{
                  ...dashContainedButtonSx,
                  minHeight: DASHBOARD_UX.buttonHeight,
                  height: DASHBOARD_UX.buttonHeight,
                  bgcolor: colors.primaryDark,
                  '&:hover': { bgcolor: colors.primaryHover },
                }}
              >
                {t('membership.add.fab')}
              </Button>
            </Stack>
          }
        />

        {membersQuery.error ? (
          <ErrorState
            title={t('common.errors.generic')}
            message={
              membersQuery.error instanceof Error
                ? membersQuery.error.message
                : t('common.errors.generic')
            }
            onRetry={() => void membersQuery.reload()}
          />
        ) : null}

        {/* Summary KPIs — Dashboard StatCard dense */}
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              dense
              label={t('membership.kpi.total')}
              value={kpi.total}
              hint={t('membership.kpi.totalHint')}
              icon={
                <IconBadge accent={colors.success}>
                  <Users />
                </IconBadge>
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              dense
              label={t('membership.kpi.active')}
              value={kpi.active}
              hint={t('membership.kpi.activeHint')}
              icon={
                <IconBadge accent="#2563EB">
                  <UserCheck />
                </IconBadge>
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              dense
              label={t('membership.kpi.pending')}
              value={kpi.pending}
              hint={t('membership.kpi.pendingHint')}
              icon={
                <IconBadge accent={colors.warning}>
                  <Mail />
                </IconBadge>
              }
              onClick={() => {
                setListTab('pending');
                setPage(0);
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              dense
              label={t('membership.kpi.joinedThisMonth')}
              value={kpi.joinedThisMonth}
              hint={t('membership.kpi.joinedThisMonthHint')}
              icon={
                <IconBadge accent="#7C3AED">
                  <CalendarPlus />
                </IconBadge>
              }
            />
          </Grid>
        </Grid>

        <Tabs
          value={listTab}
          onChange={(_, value: ListTab) => {
            setListTab(value);
            setPage(0);
          }}
          aria-label={t('membership.tabs.members')}
          sx={{
            minHeight: DASHBOARD_UX.buttonHeight,
            borderBottom: `1px solid ${s.border}`,
            '& .MuiTab-root': {
              minHeight: DASHBOARD_UX.buttonHeight,
              ...DASHBOARD_UX.button,
              textTransform: 'none',
              color: s.textMuted,
            },
            '& .Mui-selected': {
              color: `${colors.primaryDark} !important`,
            },
            '& .MuiTabs-indicator': {
              bgcolor: colors.primaryDark,
              height: 2,
            },
          }}
        >
          <Tab
            value="members"
            label={`${t('membership.tabs.members')} (${filteredMembers.length})`}
          />
          <Tab
            value="pending"
            label={`${t('membership.tabs.pending')} (${filteredInvites.length})`}
          />
        </Tabs>

        {listTab === 'members' ? (
          <DataTable
            columns={memberColumns}
            rows={memberRows}
            loading={membersQuery.loading}
            searchValue={search}
            onSearchChange={(value) => {
              setPage(0);
              setSearch(value);
            }}
            searchPlaceholder={t('list.search.members', {
              defaultValue: 'Search by name or mobile',
            })}
            toolbarFilters={filterBar}
            page={page}
            pageSize={pageSize}
            totalItems={filteredMembers.length}
            onPageChange={setPage}
            onRowClick={(row) => openMember(row.memberId)}
            emptyTitle={t('membership.members.emptyTitle')}
            emptyDescription={t('membership.members.emptyDescription')}
            toolbarActions={toolbarActions}
          />
        ) : (
          <DataTable
            columns={inviteColumns}
            rows={inviteRows}
            loading={invitationsQuery.loading}
            searchValue={search}
            onSearchChange={(value) => {
              setPage(0);
              setSearch(value);
            }}
            searchPlaceholder={t('list.search.members', {
              defaultValue: 'Search by name or mobile',
            })}
            toolbarFilters={
              <FormControl size="small" sx={filterControlSx}>
                <InputLabel id="invite-role-filter">{t('membership.roles.label')}</InputLabel>
                <Select
                  labelId="invite-role-filter"
                  label={t('membership.roles.label')}
                  multiple
                  value={filters.roles}
                  onChange={(e) => {
                    setFilters((prev) => ({
                      ...prev,
                      roles: e.target.value as MembershipRole[],
                    }));
                  }}
                  renderValue={(selected) =>
                    selected.length === 0
                      ? t('membership.workspace.allRoles')
                      : selected.join(', ')
                  }
                >
                  {rolesForSpace(spaceType).map((role) => (
                    <MenuItem key={role} value={role}>
                      <Checkbox checked={filters.roles.includes(role)} size="small" />
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            }
            emptyTitle={t('membership.pending.emptyTitle')}
            emptyDescription={t('membership.pending.emptyDescription')}
            toolbarActions={toolbarActions}
          />
        )}
      </Stack>

      {/* Member detail — drawer only (no empty right panel) */}
      <AppDrawer
        open={inspectorOpen}
        onClose={() => navigate(spaceMembersPath(spaceId))}
        width={420}
      >
        {memberId ? (
          <MemberInspector
            spaceId={spaceId}
            memberId={memberId}
            onClose={() => navigate(spaceMembersPath(spaceId))}
            onEdit={() => {
              setEditTarget(selectedDetails.member ?? null);
              setFormMode('edit');
            }}
            onInvite={() => {
              setInvitePrefill({
                mobile: selectedDetails.member?.mobileNumber,
                role:
                  selectedDetails.member?.role !== 'OWNER'
                    ? selectedDetails.member?.role
                    : undefined,
                name: selectedDetails.member?.fullName,
              });
              setInviteOpen(true);
            }}
          />
        ) : null}
      </AppDrawer>

      <MemberFormDrawer
        open={formMode != null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        spaceId={spaceId}
        spaceType={spaceType}
        member={
          formMode === 'edit' ? (editTarget ?? selectedDetails.member ?? null) : null
        }
        onClose={() => {
          setFormMode(null);
          setEditTarget(null);
        }}
        onInvite={() => {
          setFormMode(null);
          setEditTarget(null);
          setInvitePrefill({});
          setInviteOpen(true);
        }}
      />

      <InviteMemberDialog
        open={inviteOpen}
        spaceId={spaceId}
        spaceType={spaceType}
        initialMobile={invitePrefill.mobile}
        initialRole={invitePrefill.role}
        memberName={invitePrefill.name}
        onClose={() => setInviteOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(cancelInviteId)}
        title={t('membership.cancel.title')}
        description={t('membership.cancel.message')}
        confirmLabel={t('membership.cancel.confirm')}
        cancelLabel={t('common.close')}
        destructive
        confirming={cancelInvitation.isPending}
        onConfirm={() => {
          if (!cancelInviteId) {
            return;
          }
          void cancelInvitation
            .mutateAsync(cancelInviteId)
            .then(() => {
              enqueueSnackbar(t('membership.invite.pending'), { variant: 'info' });
              setCancelInviteId(null);
            })
            .catch((err: unknown) => {
              enqueueSnackbar(err instanceof Error ? err.message : t('common.errors.generic'), {
                variant: 'error',
              });
            });
        }}
        onClose={() => setCancelInviteId(null)}
      />
    </PageContainer>
  );
}
